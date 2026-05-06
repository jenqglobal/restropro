import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Sales overview
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const { period = 'today', startDate, endDate } = req.query;

    let startDateTime = new Date();
    let endDateTime = new Date();

    switch (period) {
      case 'today':
        startDateTime.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDateTime.setDate(startDateTime.getDate() - 1);
        startDateTime.setHours(0, 0, 0, 0);
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDateTime.setDate(startDateTime.getDate() - 7);
        startDateTime.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDateTime.setMonth(startDateTime.getMonth() - 1);
        startDateTime.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (startDate && endDate) {
          startDateTime = new Date(startDate as string);
          endDateTime = new Date(endDate as string);
        }
        break;
    }

    const orders = await prisma.order.findMany({
      where: {
        tenantId: req.user.tenantId,
        status: 'completed',
        createdAt: { gte: startDateTime, lte: endDateTime },
      },
      select: {
        total: true,
        subtotal: true,
        discount: true,
        tax: true,
        createdAt: true,
        paymentMode: true,
      },
    });

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Sales by payment mode
    const byPaymentMode = orders.reduce((acc, o) => {
      acc[o.paymentMode || 'unknown'] = (acc[o.paymentMode || 'unknown'] || 0) + o.total;
      return acc;
    }, {} as Record<string, number>);

    // Daily sales for chart
    const dailySales: Record<string, number> = {};
    orders.forEach((o) => {
      const date = o.createdAt.toISOString().slice(0, 10);
      dailySales[date] = (dailySales[date] || 0) + o.total;
    });

    res.json({
      totalSales,
      totalOrders,
      avgOrderValue,
      byPaymentMode,
      dailySales,
      period: period as string,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sales report' });
  }
});

// Top selling items
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let startDateTime = new Date();
    switch (period) {
      case 'today':
        startDateTime.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDateTime.setDate(startDateTime.getDate() - 7);
        break;
      case 'month':
        startDateTime.setMonth(startDateTime.getMonth() - 1);
        break;
    }

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          tenantId: req.user.tenantId,
          status: 'completed',
          createdAt: { gte: startDateTime },
        },
      },
      include: { menuItem: true },
    });

    const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orderItems.forEach((item) => {
      if (!itemStats[item.menuItemId]) {
        itemStats[item.menuItemId] = {
          name: item.menuItem.name,
          quantity: 0,
          revenue: 0,
        };
      }
      itemStats[item.menuItemId].quantity += item.quantity;
      itemStats[item.menuItemId].revenue += item.totalPrice;
    });

    const topItems = Object.values(itemStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json(topItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get items report' });
  }
});

// Category-wise sales
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let startDateTime = new Date();
    switch (period) {
      case 'today':
        startDateTime.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDateTime.setDate(startDateTime.getDate() - 7);
        break;
      case 'month':
        startDateTime.setMonth(startDateTime.getMonth() - 1);
        break;
    }

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          tenantId: req.user.tenantId,
          status: 'completed',
          createdAt: { gte: startDateTime },
        },
      },
      include: {
        menuItem: { include: { category: true } },
      },
    });

    const categoryStats: Record<string, { name: string; revenue: number; orders: number }> = {};

    orderItems.forEach((item) => {
      const catName = item.menuItem.category.name;
      if (!categoryStats[catName]) {
        categoryStats[catName] = { name: catName, revenue: 0, orders: 0 };
      }
      categoryStats[catName].revenue += item.totalPrice;
      categoryStats[catName].orders += 1;
    });

    res.json(Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue));
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category report' });
  }
});

// Hourly sales distribution
router.get('/hours', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        tenantId: req.user.tenantId,
        status: 'completed',
        createdAt: { gte: today },
      },
      select: { total: true, createdAt: true },
    });

    const hourlySales = Array(24).fill(0);
    orders.forEach((order) => {
      const hour = order.createdAt.getHours();
      hourlySales[hour] += order.total;
    });

    res.json(hourlySales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hourly report' });
  }
});

// Dashboard summary
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.order.findMany({
      where: {
        tenantId: req.user.tenantId,
        createdAt: { gte: today },
      },
    });

    const activeOrders = todayOrders.filter((o) => o.status !== 'completed').length;
    const completedOrders = todayOrders.filter((o) => o.status === 'completed').length;
    const todayRevenue = todayOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);

    // Low stock count
    const lowStockItems = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM InventoryItem
      WHERE tenantId = ${req.user.tenantId}
      AND currentStock <= minStock
    ` as any;

    const tableStats = await prisma.table.groupBy({
      by: ['status'],
      where: { tenantId: req.user.tenantId },
      _count: true,
    });

    const tablesAvailable = tableStats.find((t) => t.status === 'available')?._count || 0;
    const tablesOccupied = tableStats.find((t) => t.status === 'occupied')?._count || 0;

    res.json({
      activeOrders,
      completedOrders,
      todayRevenue,
      lowStock: lowStockItems[0]?.count || 0,
      tablesAvailable,
      tablesOccupied,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

export default router;