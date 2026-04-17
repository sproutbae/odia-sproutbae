// routes/invoices.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// ── GST Calculator ────────────────────────────────────────────
const calcGST = (items, gstType, discountAmt = 0) => {
  let subtotal = 0;
  const processedItems = items.map(item => {
    const taxableAmt = (item.qty * item.rate) - (item.discount || 0);
    const gst = (taxableAmt * item.gstRate) / 100;
    const cgst = gstType === 'CGST_SGST' ? gst / 2 : 0;
    const sgst = gstType === 'CGST_SGST' ? gst / 2 : 0;
    const igst = gstType === 'IGST' ? gst : 0;
    subtotal += taxableAmt;
    return { ...item, taxableAmt, cgst, sgst, igst, totalAmt: taxableAmt + gst };
  });

  const totalTax = processedItems.reduce((s, i) => s + i.cgst + s + i.sgst + i.igst, 0);
  const cgst = gstType === 'CGST_SGST' ? totalTax / 2 : 0;
  const sgst = gstType === 'CGST_SGST' ? totalTax / 2 : 0;
  const igst = gstType === 'IGST' ? totalTax : 0;

  return {
    items: processedItems,
    subtotal,
    discount: discountAmt,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal: subtotal - discountAmt + totalTax,
  };
};

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const { status, customerId, from, to, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (from || to) where.invoiceDate = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where, skip: (page - 1) * limit, take: Number(limit),
        orderBy: { invoiceDate: 'desc' },
        include: { customer: { select: { name: true, phone: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page: Number(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { product: { select: { name: true, sku: true } } } },
        payments: true,
        createdBy: { select: { name: true } },
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create invoice
router.post('/', async (req, res) => {
  try {
    const { customerId, items, gstType, discount = 0, discountType, dueDate, type, notes, terms, placeOfSupply } = req.body;

    // Get next invoice number
    const settings = await prisma.businessSettings.findFirst();
    const invoiceNo = `${settings?.invoicePrefix || 'INV'}-${String(settings?.nextInvoiceNo || 1).padStart(4, '0')}`;

    const { items: processedItems, subtotal, cgst, sgst, igst, totalTax, grandTotal } = calcGST(items, gstType, discount);

    const invoice = await prisma.$transaction(async (tx) => {
      // Update invoice counter
      await tx.businessSettings.updateMany({ data: { nextInvoiceNo: { increment: 1 } } });

      const inv = await tx.invoice.create({
        data: {
          invoiceNo, customerId, type: type || 'TAX_INVOICE', gstType,
          placeOfSupply, dueDate: dueDate ? new Date(dueDate) : null,
          discount, discountType: discountType || 'AMOUNT',
          subtotal, cgst, sgst, igst, totalTax, grandTotal,
          balanceDue: grandTotal, notes, terms,
          createdById: req.user.id,
          items: {
            create: processedItems.map(i => ({
              productId: i.productId || null,
              description: i.description,
              hsnCode: i.hsnCode || '',
              qty: i.qty, unit: i.unit || 'PCS', rate: i.rate,
              discount: i.discount || 0, gstRate: i.gstRate,
              taxableAmt: i.taxableAmt, cgst: i.cgst, sgst: i.sgst,
              igst: i.igst, totalAmt: i.totalAmt,
            })),
          },
        },
        include: { items: true, customer: true },
      });

      // Deduct stock for each product
      for (const item of processedItems.filter(i => i.productId)) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        const newQty = prod.stockQty - item.qty;
        await tx.product.update({ where: { id: item.productId }, data: { stockQty: newQty } });
        await tx.stockMovement.create({
          data: { productId: item.productId, type: 'SALE_OUT', qty: item.qty, balanceQty: newQty, reference: invoiceNo },
        });
      }

      return inv;
    });

    res.status(201).json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id }, data: { status: req.body.status },
    });
    res.json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE (cancel) invoice
router.delete('/:id', async (req, res) => {
  try {
    await prisma.invoice.update({
      where: { id: req.params.id }, data: { status: 'CANCELLED' },
    });
    res.json({ message: 'Invoice cancelled' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
