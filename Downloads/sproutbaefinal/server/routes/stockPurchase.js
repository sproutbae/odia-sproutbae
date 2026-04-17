// server/routes/stockPurchase.js
// Quick stock purchase entry — faster than full PO flow
// For small/informal purchases (cash purchases, walk-in vendors)
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// POST — Quick stock purchase (adds stock + optional vendor entry)
router.post('/', async (req, res) => {
  try {
    const {
      items,         // [{ productId, qty, rate, notes }]
      vendorId,      // optional
      vendorName,    // if no vendorId, just a name for reference
      billNumber,    // vendor's bill/challan number
      billDate,
      paymentMode,
      notes,
    } = req.body;

    if (!items?.length) return res.status(400).json({ error: 'Items required' });

    const reference = billNumber || `CASH-${Date.now()}`;
    const results = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (!item.productId || !item.qty) continue;

        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        const newQty = product.stockQty + parseFloat(item.qty);

        // Update product cost price if provided
        const updateData = { stockQty: newQty };
        if (item.rate && parseFloat(item.rate) > 0) {
          updateData.costPrice = parseFloat(item.rate);
        }

        await tx.product.update({ where: { id: item.productId }, data: updateData });

        const movement = await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE_IN',
            qty: parseFloat(item.qty),
            balanceQty: newQty,
            reference,
            notes: notes || `Stock purchase from ${vendorName || 'vendor'} | Bill: ${billNumber || 'N/A'}`,
          },
        });

        results.push({
          product: product.name,
          qty: item.qty,
          newBalance: newQty,
          movementId: movement.id,
        });
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'STOCK_PURCHASE_RECORDED',
        entity: 'StockMovement',
        details: `${items.length} items stocked from ${vendorName || vendorId || 'vendor'} | Ref: ${reference}`,
      },
    }).catch(() => {}); // non-blocking

    res.status(201).json({
      message: `Stock updated for ${results.length} products`,
      reference,
      results,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET stock movement history
router.get('/history', async (req, res) => {
  try {
    const { productId, type, from, to, page = 1, limit = 50 } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (from || to) where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where, skip: (page - 1) * limit, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, sku: true, unit: true } } },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({ movements, total, page: Number(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET current stock snapshot
router.get('/snapshot', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, sku: true, unit: true,
        stockQty: true, minStockQty: true, costPrice: true, salePrice: true,
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    const totalStockValue = products.reduce((s, p) => s + (p.stockQty * p.costPrice), 0);
    const totalSaleValue = products.reduce((s, p) => s + (p.stockQty * p.salePrice), 0);
    const lowStock = products.filter(p => p.stockQty <= p.minStockQty);
    const outOfStock = products.filter(p => p.stockQty <= 0);

    res.json({
      products,
      summary: {
        totalProducts: products.length,
        totalStockValue,
        totalSaleValue,
        potentialProfit: totalSaleValue - totalStockValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
      },
      lowStock,
      outOfStock,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
