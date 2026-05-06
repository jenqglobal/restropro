import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all inventory items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { name: 'asc' },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

// Get low stock alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.$queryRaw`
      SELECT * FROM InventoryItem
      WHERE tenantId = ${req.user.tenantId}
      AND currentStock <= minStock
    `;

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Create inventory item
router.post('/', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, unit, currentStock, minStock, costPerUnit, category } = req.body;

    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        unit,
        currentStock: currentStock || 0,
        minStock: minStock || 10,
        costPerUnit: costPerUnit || 0,
        category,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, currentStock, minStock, costPerUnit, category } = req.body;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { name, unit, currentStock, minStock, costPerUnit, category },
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Add stock (purchase)
router.post('/:id/stock', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, costPerUnit } = req.body;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        currentStock: { increment: quantity },
        costPerUnit: costPerUnit || undefined,
      },
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add stock' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.inventoryItem.delete({ where: { id } });

    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Get recipes for a menu item
router.get('/recipes/:menuItemId', authenticateToken, async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const recipes = await prisma.recipe.findMany({
      where: { menuItemId, tenantId: req.user.tenantId },
      include: { inventoryItem: true },
    });

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recipes' });
  }
});

// Create recipe (ingredient mapping)
router.post('/recipes', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { menuItemId, inventoryItemId, quantity } = req.body;

    const recipe = await prisma.recipe.create({
      data: {
        tenantId: req.user.tenantId,
        menuItemId,
        inventoryItemId,
        quantity,
      },
    });

    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

export default router;