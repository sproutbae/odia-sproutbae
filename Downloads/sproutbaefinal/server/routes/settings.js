// routes/settings.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// GET settings
router.get('/', async (_req, res) => {
  try {
    let settings = await prisma.businessSettings.findFirst();
    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: { name: 'SproutBae', invoicePrefix: 'INV', nextInvoiceNo: 1 },
      });
    }
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update settings (admin only)
router.put('/', adminOnly, async (req, res) => {
  try {
    const existing = await prisma.businessSettings.findFirst();
    const settings = existing
      ? await prisma.businessSettings.update({ where: { id: existing.id }, data: req.body })
      : await prisma.businessSettings.create({ data: req.body });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
