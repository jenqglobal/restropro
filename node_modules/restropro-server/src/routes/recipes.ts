import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all recipes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        menuItem: true,
        ingredients: {
          include: { inventoryItem: true },
        },
      },
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recipes' });
  }
});

// Get single recipe
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        menuItem: true,
        ingredients: {
          include: { inventoryItem: true },
        },
      },
    });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recipe' });
  }
});

// Create recipe
router.post('/', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { menuItemId, ingredients, yield: recipeYield, instructions } = req.body;
    
    const recipe = await prisma.recipe.create({
      data: {
        tenantId: req.user.tenantId,
        menuItemId,
        yield: recipeYield,
        instructions,
        ingredients: {
          create: ingredients.map((ing: any) => ({
            inventoryItemId: ing.inventoryItemId,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        },
      },
      include: { ingredients: true },
    });
    
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Update recipe
router.put('/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { ingredients, yield: recipeYield, instructions } = req.body;
    
    // Delete existing ingredients
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: req.params.id } });
    
    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        yield: recipeYield,
        instructions,
        ingredients: {
          create: ingredients.map((ing: any) => ({
            inventoryItemId: ing.inventoryItemId,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        },
      },
      include: { ingredients: { include: { inventoryItem: true } } },
    });
    
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
router.delete('/:id', authenticateToken, requireRole('owner', 'manager'), async (req, res) => {
  try {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: req.params.id } });
    await prisma.recipe.delete({ where: { id: req.params.id } });
    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

export default router;