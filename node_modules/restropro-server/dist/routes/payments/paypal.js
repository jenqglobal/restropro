import { Router } from 'express';
import { prisma } from '../../index.js';
import { authenticateToken } from '../../middleware/auth.js';
const router = Router();
router.post('/paypal/create', authenticateToken, async (req, res) => {
    try {
        const { amount, currency, orderId, customerEmail } = req.body;
        const settings = await prisma.settings.findUnique({
            where: { tenantId: req.user.tenantId },
        });
        const paymentSettings = settings?.paymentSettings;
        if (!paymentSettings?.paypal?.clientId) {
            return res.status(400).json({ error: 'PayPal not configured' });
        }
        // In production, use PayPal SDK:
        // const paypal = require('@paypal/checkout-server-sdk');
        // const environment = new paypal.core.SandboxEnvironment(
        //   paymentSettings.paypal.clientId,
        //   paymentSettings.paypal.clientSecret
        // );
        // const client = new paypal.core.PayPalHttpClient(environment);
        // const request = new paypal.orders.OrdersCreateRequest();
        // request.requestBody({
        //   intent: 'CAPTURE',
        //   purchase_units: [{ amount: { currency_code: currency || 'USD', value: amount.toString() } }],
        // });
        // const order = await client.execute(request);
        // For demo, return mock approval URL
        const mockOrderId = `PP-${Date.now()}`;
        const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${mockOrderId}`;
        res.json({
            orderId: mockOrderId,
            approvalUrl,
            amount,
            currency: currency || 'USD',
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create PayPal payment' });
    }
});
router.get('/paypal/verify', authenticateToken, async (req, res) => {
    try {
        const { transactionId } = req.query;
        // In production, verify with PayPal API
        res.json({ verified: true, transactionId });
    }
    catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});
export default router;
//# sourceMappingURL=paypal.js.map