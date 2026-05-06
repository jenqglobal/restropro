import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get expenses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// Create expense
router.post('/', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    
    const expense = await prisma.expense.create({
      data: {
        tenantId: req.user.tenantId,
        category,
        amount,
        description,
        date: new Date(date),
      },
    });
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;