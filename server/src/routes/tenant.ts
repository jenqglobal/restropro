import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get current tenant
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            tables: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tenant' });
  }
});

// Update tenant settings
router.put('/settings', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, phone, address, logo, currency, taxRate } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { name, phone, address, logo },
    });

    if (currency || taxRate) {
      await prisma.settings.upsert({
        where: { tenantId: req.user.tenantId },
        update: { currency, taxRate },
        create: { tenantId: req.user.tenantId, currency, taxRate },
      });
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

export default router;