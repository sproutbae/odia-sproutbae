// routes/dashboard.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import dayjs from 'dayjs';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// GET dashboard summary
router.get('/', async (req, res) => {
  try {
    const today = dayjs().startOf('day').toDate();
    const monthStart = dayjs().startOf('month').toDate();
    const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

    const [
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalReceivables,
      overdueInvoices,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentInvoices,
      topCustomers,
      monthlyChart,
    ] = await Promise.all([
      // All-time revenue (paid)
      prisma.invoice.aggregate({
        where: { status: 'PAID' }, _sum: { grandTotal: true },
      }),

      // This month revenue
      prisma.invoice.aggregate({
        where: { status: 'PAID', invoiceDate: { gte: monthStart } },
        _sum: { grandTotal: true },
      }),

      // Last month revenue
      prisma.invoice.aggregate({
        where: { status: 'PAID', invoiceDate: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { grandTotal: true },
      }),

      // Total receivables (balance due)
      prisma.invoice.aggregate({
        where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
        _sum: { balanceDue: true },
      }),

      // Overdue invoices
      prisma.invoice.count({
        where: { status: 'OVERDUE' },
      }),

      // Customer count
      prisma.customer.count({ where: { isActive: true } }),

      // Product count
      prisma.product.count({ where: { isActive: true } }),

      // Low stock
      prisma.$queryRaw`
        SELECT COUNT(*) FROM "Product" 
        WHERE "stockQty" <= "minStockQty" AND "isActive" = true
      `,

      // Recent invoices
      prisma.invoice.findMany({
        take: 5, orderBy: { invoiceDate: 'desc' },
        include: { customer: { select: { name: true } } },
      }),

      // Top customers by revenue
      prisma.invoice.groupBy({
        by: ['customerId'],
        where: { status: 'PAID', invoiceDate: { gte: monthStart } },
        _sum: { grandTotal: true },
        orderBy: { _sum: { grandTotal: 'desc' } },
        take: 5,
      }),

      // Last 6 months chart data
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("invoiceDate", 'Mon YYYY') as month,
          SUM("grandTotal") as revenue,
          COUNT(*) as count
        FROM "Invoice"
        WHERE "invoiceDate" >= NOW() - INTERVAL '6 months'
          AND "status" = 'PAID'
        GROUP BY TO_CHAR("invoiceDate", 'Mon YYYY'), DATE_TRUNC('month', "invoiceDate")
        ORDER BY DATE_TRUNC('month', "invoiceDate")
      `,
    ]);

    res.json({
      revenue: {
        total: totalRevenue._sum.grandTotal || 0,
        thisMonth: monthRevenue._sum.grandTotal || 0,
        lastMonth: lastMonthRevenue._sum.grandTotal || 0,
      },
      receivables: totalReceivables._sum.balanceDue || 0,
      overdueCount: overdueInvoices,
      customers: totalCustomers,
      products: totalProducts,
      lowStockCount: Number(lowStockProducts[0]?.count || 0),
      recentInvoices,
      topCustomers,
      monthlyChart,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
