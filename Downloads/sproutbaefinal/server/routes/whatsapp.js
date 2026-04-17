// server/routes/whatsapp.js
// WhatsApp invoice sharing via Twilio WhatsApp API
// Free tier: Twilio sandbox supports WhatsApp for testing

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// POST /api/whatsapp/send-invoice
router.post('/send-invoice', async (req, res) => {
  try {
    const { invoiceId, phone } = req.body;

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(400).json({
        error: 'Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM to .env'
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Format Indian number: 9876543210 → +919876543210
    const toPhone = phone || invoice.customer?.phone;
    const formatted = toPhone.replace(/\D/g, '');
    const waPhone = formatted.startsWith('91') ? '+' + formatted : '+91' + formatted;

    // Dynamically import Twilio (only if configured)
    const { default: twilio } = await import('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const invoiceUrl = `${process.env.APP_URL}/invoices/${invoiceId}`;

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'}`,
      to: `whatsapp:${waPhone}`,
      body: `🌱 *SproutBae Invoice*\n\nDear ${invoice.customer?.name},\n\nYour invoice *${invoice.invoiceNo}* for *₹${invoice.grandTotal.toLocaleString('en-IN')}* has been generated.\n\nDue Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'On receipt'}\nBalance Due: ₹${invoice.balanceDue.toLocaleString('en-IN')}\n\nView Invoice: ${invoiceUrl}\n\nThank you for your business! 🙏\n_SproutBae Wholesale_`,
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status },
    });

    res.json({ success: true, messageSid: message.sid, sentTo: waPhone });
  } catch (err) {
    console.error('WhatsApp error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/payment-reminder
router.post('/payment-reminder', async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!process.env.TWILIO_ACCOUNT_SID) {
      return res.status(400).json({ error: 'Twilio not configured' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.balanceDue <= 0) return res.status(400).json({ error: 'Invoice already paid' });

    const toPhone = invoice.customer?.phone;
    if (!toPhone) return res.status(400).json({ error: 'Customer has no phone number' });

    const formatted = toPhone.replace(/\D/g, '');
    const waPhone = formatted.startsWith('91') ? '+' + formatted : '+91' + formatted;

    const { default: twilio } = await import('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const daysOverdue = invoice.dueDate
      ? Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'}`,
      to: `whatsapp:${waPhone}`,
      body: `🌱 *Payment Reminder — SproutBae*\n\nDear ${invoice.customer?.name},\n\nThis is a friendly reminder for payment of invoice *${invoice.invoiceNo}*.\n\n💰 Amount Due: *₹${invoice.balanceDue.toLocaleString('en-IN')}*\n${daysOverdue > 0 ? `⚠️ Overdue by ${daysOverdue} days\n` : ''}📅 Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'On receipt'}\n\nPayment can be made via:\n🏦 Bank Transfer / UPI\n\nKindly clear the payment at the earliest. For any queries, please contact us.\n\nThank you 🙏\n_SproutBae Wholesale_`,
    });

    res.json({ success: true, messageSid: message.sid, sentTo: waPhone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
