// routes/payments.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// POST record payment against invoice
router.post('/', async (req, res) => {
  try {
    const { invoiceId, amount, mode, reference, notes, paymentDate } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (amount > invoice.balanceDue) return res.status(400).json({ error: 'Amount exceeds balance due' });

    const newAmountPaid = invoice.amountPaid + amount;
    const newBalance = invoice.grandTotal - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId, customerId: invoice.customerId,
          amount, mode, reference, notes,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          receivedById: req.user.id,
        },
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newAmountPaid, balanceDue: newBalance, status: newStatus },
      }),
    ]);

    res.status(201).json(payment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET payments for an invoice
router.get('/invoice/:invoiceId', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { invoiceId: req.params.invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET payment summary by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { customerId: req.params.customerId },
      orderBy: { paymentDate: 'desc' },
    });
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
