// server/routes/vendors.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const where = { isActive: true };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { gstin: { contains: search } },
    ];

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where, skip: (page - 1) * limit, take: Number(limit),
        orderBy: { name: 'asc' },
        include: { _count: { select: { purchaseOrders: true } } },
      }),
      prisma.vendor.count({ where }),
    ]);

    res.json({ vendors, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single vendor with purchase summary
router.get('/:id', async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrders: {
          orderBy: { orderDate: 'desc' },
          take: 10,
        },
      },
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const totalPurchased = vendor.purchaseOrders.reduce((s, p) => s + p.grandTotal, 0);
    const totalPaid = vendor.purchaseOrders.reduce((s, p) => s + p.amountPaid, 0);

    res.json({ ...vendor, totalPurchased, totalPaid, outstanding: totalPurchased - totalPaid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create vendor
router.post('/', async (req, res) => {
  try {
    const vendor = await prisma.vendor.create({ data: req.body });
    res.status(201).json(vendor);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update vendor
router.put('/:id', async (req, res) => {
  try {
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id }, data: req.body,
    });
    res.json(vendor);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vendor.update({
      where: { id: req.params.id }, data: { isActive: false },
    });
    res.json({ message: 'Vendor deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
