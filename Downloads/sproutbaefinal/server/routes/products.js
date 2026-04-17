// routes/products.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// GET all products
router.get('/', async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    const where = { isActive: true };

    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { hsnCode: { contains: search } },
    ];
    if (category) where.category = category;
    if (lowStock === 'true') where.stockQty = { lte: prisma.product.fields.minStockQty };

    const products = await prisma.product.findMany({
      where, orderBy: { name: 'asc' },
    });

    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT * FROM "Product" 
      WHERE "stockQty" <= "minStockQty" AND "isActive" = true
      ORDER BY "stockQty" ASC
    `;
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id }, data: req.body,
    });
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST stock adjustment
router.post('/:id/stock-adjust', async (req, res) => {
  try {
    const { qty, type, notes } = req.body; // type: PURCHASE_IN | ADJUSTMENT | RETURN_IN
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });

    const newQty = type === 'SALE_OUT' 
      ? product.stockQty - qty 
      : product.stockQty + qty;

    await prisma.$transaction([
      prisma.product.update({ where: { id: req.params.id }, data: { stockQty: newQty } }),
      prisma.stockMovement.create({
        data: { productId: req.params.id, type, qty, balanceQty: newQty, notes },
      }),
    ]);

    res.json({ message: 'Stock updated', newQty });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
