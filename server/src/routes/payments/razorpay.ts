import { Router } from 'express';
import { prisma } from '../../index.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

router.post('/razorpay/create', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, orderId, customerName, customerEmail, customerPhone } = req.body;
    
    const settings = await prisma.settings.findUnique({
      where: { tenantId: req.user.tenantId },
    });
    
    const paymentSettings = settings?.paymentSettings as any;
    if (!paymentSettings?.razorpay?.keyId) {
      return res.status(400).json({ error: 'Razorpay not configured' });
    }
    
    // In production, use Razorpay SDK:
    // const razorpay = require('razorpay')({
    //   key_id: paymentSettings.razorpay.keyId,
    //   key_secret: paymentSettings.razorpay.keySecret,
    // });
    // const order = await razorpay.orders.create({
    //   amount: Math.round(amount * 100),
    //   currency: currency || 'INR',
    //   receipt: orderId,
    // });
    
    // For demo, return mock order
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    
    res.json({
      orderId: mockOrderId,
      amount,
      currency: currency || 'INR',
      keyId: paymentSettings.razorpay.keyId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Razorpay payment' });
  }
});

router.get('/razorpay/verify', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.query;
    // In production, verify with Razorpay API
    res.json({ verified: true, transactionId });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;