// server/routes/purchaseOrders.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// ── PO Number generator ───────────────────────────────────────
async function getNextPONumber() {
  const settings = await prisma.businessSettings.findFirst();
  const prefix = settings?.invoicePrefix || 'SB';
  const count = await prisma.purchaseOrder.count();
  return `${prefix}-PO-${String(count + 1).padStart(4, '0')}`;
}

// ── Calc totals ───────────────────────────────────────────────
function calcItems(items) {
  return items.map(item => {
    const taxableAmt = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    const gst = taxableAmt * ((item.gstRate || 18) / 100);
    // Default PO = intra-state CGST+SGST
    return {
      ...item,
      taxableAmt,
      cgst: gst / 2,
      sgst: gst / 2,
      igst: 0,
      totalAmt: taxableAmt + gst,
    };
  });
}

// GET all POs
router.get('/', async (req, res) => {
  try {
    const { status, vendorId, page = 1, limit = 25 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where, skip: (page - 1) * limit, take: Number(limit),
        orderBy: { orderDate: 'desc' },
        include: { vendor: { select: { name: true } } },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({ orders, total, page: Number(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single PO
router.get('/:id', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        items: { include: { product: { select: { name: true, sku: true, unit: true } } } },
        createdBy: { select: { name: true } },
      },
    });
    if (!po) return res.status(404).json({ error: 'PO not found' });
    res.json(po);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create PO
router.post('/', async (req, res) => {
  try {
    const { vendorId, items, expectedDate, notes } = req.body;
    if (!vendorId || !items?.length) return res.status(400).json({ error: 'Vendor and items required' });

    const poNumber = await getNextPONumber();
    const processedItems = calcItems(items);

    const subtotal = processedItems.reduce((s, i) => s + i.taxableAmt, 0);
    const totalTax = processedItems.reduce((s, i) => s + i.cgst + i.sgst, 0);
    const grandTotal = subtotal + totalTax;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber, vendorId, createdById: req.user.id,
        status: 'DRAFT',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal, totalTax, grandTotal, balanceDue: grandTotal,
        notes,
        items: {
          create: processedItems.map(i => ({
            productId: i.productId || null,
            description: i.description,
            hsnCode: i.hsnCode || '',
            qty: i.qty, receivedQty: 0,
            unit: i.unit || 'PCS', rate: i.rate,
            gstRate: i.gstRate || 18,
            taxableAmt: i.taxableAmt,
            cgst: i.cgst, sgst: i.sgst, igst: 0,
            totalAmt: i.totalAmt,
          })),
        },
      },
      include: { items: true, vendor: true },
    });

    res.status(201).json(po);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH update PO status
router.patch('/:id/status', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id }, data: { status: req.body.status },
    });
    res.json(po);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — Receive stock against PO (full or partial)
router.post('/:id/receive', async (req, res) => {
  try {
    const { receivedItems, receivedDate } = req.body;
    // receivedItems: [{ itemId, receivedQty }]

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!po) return res.status(404).json({ error: 'PO not found' });

    let allReceived = true;
    let anyReceived = false;

    await prisma.$transaction(async (tx) => {
      for (const recv of receivedItems) {
        const item = po.items.find(i => i.id === recv.itemId);
        if (!item) continue;

        const newReceivedQty = item.receivedQty + parseFloat(recv.receivedQty);
        if (newReceivedQty < item.qty) allReceived = false;
        if (recv.receivedQty > 0) anyReceived = true;

        // Update received qty on item
        await tx.purchaseItem.update({
          where: { id: recv.itemId },
          data: { receivedQty: newReceivedQty },
        });

        // Add stock if product linked
        if (item.productId && recv.receivedQty > 0) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          const newQty = product.stockQty + parseFloat(recv.receivedQty);
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: newQty },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              purchaseOrderId: po.id,
              type: 'PURCHASE_IN',
              qty: parseFloat(recv.receivedQty),
              balanceQty: newQty,
              reference: po.poNumber,
              notes: `Received against ${po.poNumber}`,
            },
          });
        }
      }

      // Update PO status
      const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : po.status;
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: newStatus,
          receivedDate: allReceived ? (receivedDate ? new Date(receivedDate) : new Date()) : null,
        },
      });
    });

    const updated = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: { select: { name: true } } } }, vendor: true },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — Record payment against PO
router.post('/:id/payment', async (req, res) => {
  try {
    const { amount, mode, reference, notes } = req.body;
    const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!po) return res.status(404).json({ error: 'PO not found' });
    if (amount > po.balanceDue) return res.status(400).json({ error: 'Amount exceeds balance due' });

    const newPaid = po.amountPaid + parseFloat(amount);
    const newBalance = po.grandTotal - newPaid;

    const updated = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { amountPaid: newPaid, balanceDue: newBalance },
    });

    res.json({ message: 'Payment recorded', po: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
