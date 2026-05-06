import { Router } from 'express';
import { prisma } from '../../index.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

router.post('/stripe/create', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, orderId, customerEmail } = req.body;
    
    const settings = await prisma.settings.findUnique({
      where: { tenantId: req.user.tenantId },
    });
    
    const paymentSettings = settings?.paymentSettings as any;
    if (!paymentSettings?.stripe?.secretKey) {
      return res.status(400).json({ error: 'Stripe not configured' });
    }
    
    // In production, you would use stripe library:
    // const stripe = require('stripe')(paymentSettings.stripe.secretKey);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100),
    //   currency: currency || 'inr',
    //   metadata: { orderId, tenantId: req.user.tenantId },
    // });
    
    // For demo, return mock response
    const mockClientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`;
    
    res.json({
      clientSecret: mockClientSecret,
      amount,
      currency: currency || 'INR',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Stripe payment' });
  }
});

router.get('/stripe/verify', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.query;
    // In production, verify with Stripe API
    res.json({ verified: true, transactionId });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;