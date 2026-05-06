import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { tenantId: req.user.tenantId };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          table: true,
          customer: true,
          user: { select: { name: true } },
          items: { include: { menuItem: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get active orders (for kitchen)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        tenantId: req.user.tenantId,
        status: { in: ['pending', 'preparing'] },
      },
      include: {
        table: true,
        user: { select: { name: true } },
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get active orders' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, tenantId: req.user.tenantId },
      include: {
        table: true,
        customer: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tableId, customerId, orderType, items, notes } = req.body;
    console.log('Order request - user:', req.user?.userId, 'tenant:', req.user?.tenantId);
    console.log('Order data:', { tableId, customerId, orderType, itemCount: items?.length });

    // Validate user
    if (!req.user?.userId || !req.user?.tenantId) {
      return res.status(401).json({ error: 'Invalid user session' });
    }

    // Handle tableId - set to null if empty string
    const finalTableId = tableId === '' || tableId === 'null' ? null : tableId;
    console.log('Create order - body:', { tableId, orderType, items: items?.length, notes });

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Generate order number
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const orderCount = await prisma.order.count({
      where: {
        tenantId: req.user.tenantId,
        createdAt: { gte: startOfDay },
      },
    });
    const orderNumber = `ORD-${dateStr}-${String(orderCount + 1).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) {
        console.log('Menu item not found:', item.menuItemId);
        continue;
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        notes: item.notes || null,
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ error: 'No valid menu items found' });
    }

    const settings = await prisma.settings.findUnique({ where: { tenantId: req.user.tenantId } });
    const taxRate = settings?.taxRate || 18;
    const tax = subtotal * (taxRate / 100);

    const order = await prisma.order.create({
      data: {
        tenantId: req.user.tenantId,
        tableId: finalTableId,
        customerId: customerId || null,
        orderType: orderType || 'dine-in',
        orderNumber,
        userId: req.user.userId,
        subtotal,
        tax,
        total: subtotal + tax,
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        table: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
      },
    });

    // Update table status
    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'occupied' },
      });
    }

    // Deduct inventory
    await deductInventory(req.user.tenantId, orderItems);

    // Create KOT items
    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    
    if (createdOrder) {
      await Promise.all(
        createdOrder.items.map((item) =>
          prisma.kotItem.create({
            data: {
              tenantId: req.user.tenantId,
              orderId: createdOrder.id,
              orderItemId: item.id,
              status: 'pending',
              priority: 'normal',
            },
          })
        )
      );
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`tenant:${req.user.tenantId}`).emit('new-order', order);
    io.to(`kitchen:${req.user.tenantId}`).emit('new-order', order);

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Add items to order
router.post('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const order = await prisma.order.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let additionalTotal = 0;
    const newItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) continue;

      const itemTotal = menuItem.price * item.quantity;
      additionalTotal += itemTotal;

      newItems.push({
        orderId: id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        notes: item.notes,
      });
    }

    // Create order items
    await prisma.orderItem.createMany({ data: newItems });

    // Recalculate totals
    const allItems = await prisma.orderItem.findMany({ where: { orderId: id } });
    const subtotal = order.subtotal + additionalTotal;
    const tax = subtotal * (order.tax / (order.subtotal || 1));

    const updated = await prisma.order.update({
      where: { id },
      data: {
        subtotal,
        tax,
        total: subtotal + tax,
      },
      include: {
        table: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`tenant:${req.user.tenantId}`).emit('order-updated', updated);
    io.to(`kitchen:${req.user.tenantId}`).emit('order-updated', updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add items' });
  }
});

// Update order status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        table: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
      },
    });

    // Release table if completed
    if (status === 'completed' && order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'available' },
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`tenant:${req.user.tenantId}`).emit('order-status-changed', updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Apply discount
router.post('/:id/discount', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { discountType, discountValue } = req.body;

    const order = await prisma.order.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let discount = 0;
    if (discountType === 'percentage') {
      discount = order.subtotal * (discountValue / 100);
    } else if (discountType === 'flat') {
      discount = discountValue;
    }

    const total = order.subtotal + order.tax - discount;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        discount,
        discountType,
        discountValue,
        total,
      },
      include: {
        table: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

// Process payment
router.post('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, amount, reference } = req.body;

    const order = await prisma.order.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        tenantId: req.user.tenantId,
        orderId: id,
        amount: amount || order.total,
        mode,
        reference,
      },
    });

    // Update order
    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentMode: mode,
        paymentStatus: 'paid',
        status: 'completed',
      },
      include: {
        table: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
      },
    });

    // Release table
    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'available' },
      });
    }

    // Update customer loyalty points
    if (order.customerId) {
      const pointsEarned = Math.floor(order.total / 10);
      await prisma.customer.update({
        where: { id: order.customerId },
        data: {
          loyaltyPoints: { increment: pointsEarned },
          totalSpent: { increment: order.total },
          visitCount: { increment: 1 },
        },
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`tenant:${req.user.tenantId}`).emit('order-completed', updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Helper function to deduct inventory
async function deductInventory(tenantId: string, items: any[]) {
  for (const item of items) {
    const recipes = await prisma.recipe.findMany({
      where: { tenantId, menuItemId: item.menuItemId },
      include: { ingredients: true },
    });

    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        const stockNeeded = ingredient.quantity * item.quantity;
        await prisma.inventoryItem.update({
          where: { id: ingredient.inventoryItemId },
          data: { currentStock: { decrement: stockNeeded } },
        });
      }
    }
  }
}

// Get KOT for order
router.get('/kot/:id', authenticateToken, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        table: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
        kotItems: true,
      },
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get KOT' });
  }
});

// Generate/Regenerate KOT for order
router.post('/kot/:id', authenticateToken, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { items: true },
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Delete existing KOT items
    await prisma.kotItem.deleteMany({ where: { orderId: order.id } });
    
    // Create KOT items from order items
    const kotItems = await Promise.all(
      order.items.map(async (item) => {
        return prisma.kotItem.create({
          data: {
            tenantId: req.user.tenantId,
            orderId: order.id,
            orderItemId: item.id,
            status: 'pending',
            priority: 'normal',
          },
        });
      })
    );
    
    const updatedOrder = await prisma.order.findFirst({
      where: { id: req.params.id },
      include: {
        table: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
        kotItems: true,
      },
    });
    
    // Emit to kitchen
    const io = req.app.get('io');
    io.to(`kitchen:${req.user.tenantId}`).emit('new-kot', updatedOrder);
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate KOT' });
  }
});

// Print KOT - mark as printed
router.post('/kot/:id/print', authenticateToken, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Update all KOT items as printed
    await prisma.kotItem.updateMany({
      where: { orderId: order.id },
      data: { printedAt: new Date() },
    });
    
    // Update order status to preparing
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'preparing' },
    });
    
    res.json({ message: 'KOT printed', status: 'preparing' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to print KOT' });
  }
});

// Get bill/receipt for order
router.get('/bill/:id', authenticateToken, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        table: true,
        customer: true,
        user: { select: { name: true } },
        items: { include: { menuItem: true } },
      },
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Get tenant info for bill
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId } });
    const settings = await prisma.settings.findUnique({ where: { tenantId: req.user.tenantId } });
    
    res.json({ order, tenant, settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bill' });
  }
});

export default router;