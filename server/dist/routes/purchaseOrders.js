import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
const router = Router();
// Get all purchase orders
router.get('/purchase-orders', authenticateToken, async (req, res) => {
    try {
        const orders = await prisma.purchaseOrder.findMany({
            where: { tenantId: req.user.tenantId },
            include: {
                items: { include: { inventoryItem: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get purchase orders' });
    }
});
// Create purchase order
router.post('/purchase-orders', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
    try {
        const { items } = req.body;
        // Generate PO number
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await prisma.purchaseOrder.count({
            where: { tenantId: req.user.tenantId }
        });
        const orderNumber = `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
        const po = await prisma.purchaseOrder.create({
            data: {
                tenantId: req.user.tenantId,
                orderNumber,
                status: 'pending',
                items: {
                    create: items.map((item) => ({
                        inventoryItemId: item.inventoryItemId,
                        quantity: item.quantity,
                        status: 'pending',
                    })),
                },
            },
            include: { items: { include: { inventoryItem: true } } },
        });
        res.status(201).json(po);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create purchase order' });
    }
});
// Update purchase order status
router.patch('/purchase-orders/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const po = await prisma.purchaseOrder.update({
            where: { id },
            data: { status },
            include: { items: { include: { inventoryItem: true } } },
        });
        // If completed, add stock to inventory
        if (status === 'completed') {
            for (const item of po.items) {
                await prisma.inventoryItem.update({
                    where: { id: item.inventoryItemId },
                    data: { currentStock: { increment: item.quantity } },
                });
            }
        }
        res.json(po);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update purchase order' });
    }
});
export default router;
//# sourceMappingURL=purchaseOrders.js.map