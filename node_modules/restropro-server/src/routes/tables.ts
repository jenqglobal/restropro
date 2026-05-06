import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all tables
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        orders: {
          where: { status: { not: 'completed' } },
          include: {
            items: { include: { menuItem: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    });

    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tables' });
  }
});

// Get table by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findFirst({
      where: { id, tenantId: req.user.tenantId },
      include: {
        orders: {
          where: { status: { not: 'completed' } },
          include: {
            items: { include: { menuItem: true } },
            customer: true,
            user: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get table' });
  }
});

// Create table
router.post('/', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { number, capacity, section, positionX, positionY } = req.body;

    const table = await prisma.table.create({
      data: {
        tenantId: req.user.tenantId,
        number,
        capacity,
        section,
        positionX: positionX || 0,
        positionY: positionY || 0,
      },
    });

    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// Update table
router.put('/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity, status, section, positionX, positionY } = req.body;

    const table = await prisma.table.update({
      where: { id },
      data: { number, capacity, status, section, positionX, positionY },
    });

    // Emit socket event for table update
    const io = req.app.get('io');
    io.to(`tenant:${req.user.tenantId}`).emit('table-updated', table);

    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table' });
  }
});

// Update table status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const table = await prisma.table.update({
      where: { id },
      data: { status },
    });

    const io = req.app.get('io');
    io.to(`tenant:${req.user.tenantId}`).emit('table-updated', table);

    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table status' });
  }
});

// Delete table
router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.table.delete({ where: { id } });

    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

export default router;