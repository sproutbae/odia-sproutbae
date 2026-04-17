// server/routes/pdf.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// GET /api/invoices/:id/pdf  — stream PDF to browser
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
        payments: true,
        createdBy: { select: { name: true } },
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Get business settings
    const settings = await prisma.businessSettings.findFirst();

    const pdfBuffer = await generateInvoicePDF(invoice, settings);

    const filename = `${invoice.invoiceNo}-${invoice.customer?.name?.replace(/\s+/g, '_') || 'invoice'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'PDF generation failed: ' + err.message });
  }
});

// GET /api/invoices/:id/pdf/view  — view in browser (not download)
router.get('/:id/pdf/view', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { product: { select: { name: true, sku: true } } } },
        payments: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const settings = await prisma.businessSettings.findFirst();
    const pdfBuffer = await generateInvoicePDF(invoice, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.end(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'PDF generation failed: ' + err.message });
  }
});

export default router;
