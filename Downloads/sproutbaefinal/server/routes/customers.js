// routes/customers.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// GET all customers
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where, skip: (page - 1) * limit, take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ customers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single customer with ledger summary
router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        invoices: { orderBy: { invoiceDate: 'desc' }, take: 10 },
        payments: { orderBy: { paymentDate: 'desc' }, take: 10 },
      },
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Calculate outstanding
    const totalBilled = customer.invoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalPaid = customer.invoices.reduce((s, i) => s + i.amountPaid, 0);

    res.json({ ...customer, totalBilled, totalPaid, outstanding: totalBilled - totalPaid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.status(201).json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id }, data: req.body,
    });
    res.json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    await prisma.customer.update({
      where: { id: req.params.id }, data: { isActive: false },
    });
    res.json({ message: 'Customer deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
