import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get payment settings
router.get('/payment', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { tenantId: req.user.tenantId },
    });
    const paymentSettings = settings?.paymentSettings ? JSON.parse(settings.paymentSettings) : { enabledGateway: 'none' };
    res.json(paymentSettings);
  } catch (error) {
    res.json({ enabledGateway: 'none' });
  }
});

// Update payment settings
router.put('/payment', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const paymentSettings = req.body;
    const settings = await prisma.settings.upsert({
      where: { tenantId: req.user.tenantId },
      update: { paymentSettings: JSON.stringify(paymentSettings) },
      create: { tenantId: req.user.tenantId, paymentSettings: JSON.stringify(paymentSettings) },
    });
    res.json(paymentSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

export default router;