import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { menuItems: true } },
      },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Create category
router.post('/categories', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;

    const category = await prisma.category.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        description,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/categories/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name, description, sortOrder, isActive },
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({ where: { id } });

    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get all menu items
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { tenantId: req.user.tenantId },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get menu items' });
  }
});

// Get menu items by category
router.get('/items/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;

    const items = await prisma.menuItem.findMany({
      where: { tenantId: req.user.tenantId, categoryId, isAvailable: true },
      orderBy: { name: 'asc' },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get menu items' });
  }
});

// Create menu item
router.post('/items', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { categoryId, name, description, price, image, isAvailable, hasVariants, variants } = req.body;

    const item = await prisma.menuItem.create({
      data: {
        tenantId: req.user.tenantId,
        categoryId,
        name,
        description,
        price,
        image,
        isAvailable,
        hasVariants,
        variants: hasVariants ? JSON.stringify(variants) : null,
      },
      include: { category: true },
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// Update menu item
router.put('/items/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, image, isAvailable, hasVariants, variants } = req.body;

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description,
        price,
        image,
        isAvailable,
        hasVariants,
        variants: hasVariants ? JSON.stringify(variants) : null,
      },
      include: { category: true },
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Toggle item availability
router.patch('/items/:id/availability', authenticateToken, requireRole('owner', 'manager', 'cashier'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Delete menu item
router.delete('/items/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.menuItem.delete({ where: { id } });

    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;