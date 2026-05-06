import { Router } from 'express';
import { prisma } from '../../index.js';
import { authenticateToken } from '../../middleware/auth.js';
const router = Router();
router.post('/payu/create', authenticateToken, async (req, res) => {
    try {
        const { amount, currency, orderId, customerName, customerEmail, customerPhone } = req.body;
        const settings = await prisma.settings.findUnique({
            where: { tenantId: req.user.tenantId },
        });
        const paymentSettings = settings?.paymentSettings;
        if (!paymentSettings?.payu?.merchantKey) {
            return res.status(400).json({ error: 'PayU not configured' });
        }
        // PayU India specific (also works for EU/LATAM)
        const { merchantKey, salt, mode } = paymentSettings.payu;
        const baseUrl = mode === 'live' ? 'https://secure.payu.in' : 'https://test.payu.in';
        // Generate hash
        const txnid = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const hashString = `${merchantKey}|${txnid}|${amount}|${orderId}|${customerName || ''}|${customerEmail || ''}||||||||||${salt}`;
        // const hash = crypto.createHash('sha512').update(hashString).digest('hex');
        // For demo, return mock payment URL
        const paymentUrl = `${baseUrl}/_payment`;
        res.json({
            txnid,
            amount,
            currency: currency || 'INR',
            paymentUrl,
            merchantKey,
            customerName,
            customerEmail,
            customerPhone,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create PayU payment' });
    }
});
router.get('/payu/verify', authenticateToken, async (req, res) => {
    try {
        const { transactionId } = req.query;
        // In production, verify with PayU API
        res.json({ verified: true, transactionId });
    }
    catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});
export default router;
//# sourceMappingURL=payu.js.map