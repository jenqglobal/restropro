import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
// Get all customers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { tenantId: req.user.tenantId };
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } },
            ];
        }
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.customer.count({ where }),
        ]);
        res.json({ customers, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get customers' });
    }
});
// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.findFirst({
            where: { id, tenantId: req.user.tenantId },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: { items: { include: { menuItem: true } } },
                },
            },
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get customer' });
    }
});
// Create customer
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const customer = await prisma.customer.create({
            data: {
                tenantId: req.user.tenantId,
                name,
                email,
                phone,
            },
        });
        res.status(201).json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});
// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;
        const customer = await prisma.customer.update({
            where: { id },
            data: { name, email, phone },
        });
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
});
// Add loyalty points
router.post('/:id/points', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { points } = req.body;
        const customer = await prisma.customer.update({
            where: { id },
            data: { loyaltyPoints: { increment: points } },
        });
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add points' });
    }
});
// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.customer.delete({ where: { id } });
        res.json({ message: 'Customer deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});
export default router;
//# sourceMappingURL=customers.js.map