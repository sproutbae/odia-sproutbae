// server/routes/gst.js
// GSTR-1 and GSTR-3B data export (JSON + CSV formats)
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// ── Helper: build GSTR-1 data ──────────────────────────────────
async function buildGSTR1(from, to) {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['SENT', 'PAID', 'PARTIAL'] },
      type: 'TAX_INVOICE',
      invoiceDate: { gte: new Date(from), lte: new Date(to) },
    },
    include: {
      customer: true,
      items: true,
    },
    orderBy: { invoiceDate: 'asc' },
  });

  // B2B — invoices to GSTIN registered customers
  const b2b = invoices
    .filter(inv => inv.customer?.gstin)
    .map(inv => ({
      gstin: inv.customer.gstin,
      customerName: inv.customer.name,
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate.toISOString().slice(0, 10),
      invoiceValue: inv.grandTotal,
      placeOfSupply: inv.placeOfSupply || inv.customer?.state || '',
      reverseCharge: 'N',
      invoiceType: 'Regular',
      ecomGSTIN: '',
      rate: inv.items[0]?.gstRate || 18,
      taxableValue: inv.subtotal,
      igst: inv.igst,
      cgst: inv.cgst,
      sgst: inv.sgst,
      cess: 0,
    }));

  // B2C — invoices to unregistered customers
  const b2cGroups = {};
  invoices
    .filter(inv => !inv.customer?.gstin)
    .forEach(inv => {
      const key = `${inv.placeOfSupply || 'Maharashtra'}_${inv.items[0]?.gstRate || 18}`;
      if (!b2cGroups[key]) {
        b2cGroups[key] = {
          placeOfSupply: inv.placeOfSupply || inv.customer?.state || 'Maharashtra',
          rate: inv.items[0]?.gstRate || 18,
          taxableValue: 0,
          igst: 0,
          cgst: 0,
          sgst: 0,
        };
      }
      b2cGroups[key].taxableValue += inv.subtotal;
      b2cGroups[key].igst += inv.igst;
      b2cGroups[key].cgst += inv.cgst;
      b2cGroups[key].sgst += inv.sgst;
    });

  // HSN Summary
  const hsnMap = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      const k = `${item.hsnCode || '0000'}_${item.gstRate}`;
      if (!hsnMap[k]) hsnMap[k] = { hsnCode: item.hsnCode || '', gstRate: item.gstRate, qty: 0, taxableValue: 0, igst: 0, cgst: 0, sgst: 0 };
      hsnMap[k].qty += item.qty;
      hsnMap[k].taxableValue += item.taxableAmt;
      hsnMap[k].igst += item.igst;
      hsnMap[k].cgst += item.cgst;
      hsnMap[k].sgst += item.sgst;
    });
  });

  const summary = {
    totalInvoices: invoices.length,
    totalTaxableValue: invoices.reduce((s, i) => s + i.subtotal, 0),
    totalIGST: invoices.reduce((s, i) => s + i.igst, 0),
    totalCGST: invoices.reduce((s, i) => s + i.cgst, 0),
    totalSGST: invoices.reduce((s, i) => s + i.sgst, 0),
    totalGST: invoices.reduce((s, i) => s + i.totalTax, 0),
    grandTotal: invoices.reduce((s, i) => s + i.grandTotal, 0),
  };

  return { b2b, b2c: Object.values(b2cGroups), hsnSummary: Object.values(hsnMap), summary };
}

// ── GSTR-1 JSON ────────────────────────────────────────────────
router.get('/gstr1', async (req, res) => {
  try {
    const { from, to, format = 'json' } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to dates required (YYYY-MM-DD)' });

    const data = await buildGSTR1(from, to);

    if (format === 'csv') {
      // CSV export for B2B
      const headers = ['GSTIN,Customer Name,Invoice No,Invoice Date,Invoice Value,Place of Supply,Taxable Value,IGST,CGST,SGST'];
      const rows = data.b2b.map(r =>
        `"${r.gstin}","${r.customerName}","${r.invoiceNo}","${r.invoiceDate}",${r.invoiceValue},"${r.placeOfSupply}",${r.taxableValue},${r.igst},${r.cgst},${r.sgst}`
      );
      const csv = [...headers, ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="GSTR1_B2B_${from}_to_${to}.csv"`);
      return res.send(csv);
    }

    res.json({ period: { from, to }, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GSTR-3B Summary ────────────────────────────────────────────
router.get('/gstr3b', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to dates required' });

    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PAID', 'PARTIAL'] },
        invoiceDate: { gte: new Date(from), lte: new Date(to) },
      },
    });

    // 3.1 — Outward taxable supplies
    const outward = {
      igst: invoices.filter(i => i.gstType === 'IGST').reduce((s, i) => s + i.igst, 0),
      cgst: invoices.filter(i => i.gstType === 'CGST_SGST').reduce((s, i) => s + i.cgst, 0),
      sgst: invoices.filter(i => i.gstType === 'CGST_SGST').reduce((s, i) => s + i.sgst, 0),
      taxableValue: invoices.reduce((s, i) => s + i.subtotal, 0),
      totalTax: invoices.reduce((s, i) => s + i.totalTax, 0),
    };

    const report = {
      period: { from, to },
      '3_1_outwardSupplies': outward,
      '3_2_interStateSupplies': {
        igst: outward.igst,
        taxableValue: invoices.filter(i => i.gstType === 'IGST').reduce((s, i) => s + i.subtotal, 0),
      },
      '6_1_taxPayable': {
        igst: outward.igst,
        cgst: outward.cgst,
        sgst: outward.sgst,
        total: outward.totalTax,
      },
      summary: {
        totalInvoices: invoices.length,
        grossSales: invoices.reduce((s, i) => s + i.grandTotal, 0),
        netTaxable: outward.taxableValue,
        totalGSTPayable: outward.totalTax,
      },
    };

    res.json(report);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
