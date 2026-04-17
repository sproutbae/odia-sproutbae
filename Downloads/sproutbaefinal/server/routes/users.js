// server/routes/users.js
// Multi-user management — Admin only
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// GET all users (admin only)
router.get('/', adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create user directly (admin only)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'STAFF' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        details: `Created user ${email} with role ${role || 'STAFF'}`,
      },
    });

    res.status(201).json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update user role (admin only)
router.put('/:id/role', adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'ACCOUNTANT', 'STAFF'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id, action: 'USER_ROLE_UPDATED',
        entity: 'User', entityId: user.id,
        details: `Role changed to ${role}`,
      },
    });

    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT reset user password (admin only)
router.put('/:id/reset-password', adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashed },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE deactivate user (admin only) — we just delete for simplicity
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT change own password
router.put('/me/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET activity log (admin/accountant)
router.get('/activity', async (req, res) => {
  try {
    if (!['ADMIN', 'ACCOUNTANT'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    // Attach user names manually
    const userIds = [...new Set(logs.map(l => l.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
    const enriched = logs.map(l => ({ ...l, userName: userMap[l.userId] || 'Unknown' }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
