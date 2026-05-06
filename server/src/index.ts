import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenant.js';
import userRoutes from './routes/users.js';
import menuRoutes from './routes/menu.js';
import tableRoutes from './routes/tables.js';
import orderRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import customerRoutes from './routes/customers.js';
import reportRoutes from './routes/reports.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import expenseRoutes from './routes/expenses.js';
import recipeRoutes from './routes/recipes.js';
import { authenticateSocket } from './middleware/auth.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

export const prisma = new PrismaClient();
export { io };

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json({ limit: '10mb' }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/inventory', purchaseOrderRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/recipes', recipeRoutes);

// Import payment routes
import paymentSettingsRoutes from './routes/paymentSettings.js';
import stripePaymentRoutes from './routes/payments/stripe.js';
import razorpayPaymentRoutes from './routes/payments/razorpay.js';
import paypalPaymentRoutes from './routes/payments/paypal.js';
import payuPaymentRoutes from './routes/payments/payu.js';

app.use('/api/settings', paymentSettingsRoutes);
app.use('/api/payments/stripe', stripePaymentRoutes);
app.use('/api/payments/razorpay', razorpayPaymentRoutes);
app.use('/api/payments/paypal', paypalPaymentRoutes);
app.use('/api/payments/payu', payuPaymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant:${tenantId}`);
    console.log(`📱 Socket ${socket.id} joined tenant: ${tenantId}`);
  });

  socket.on('join-kitchen', (tenantId) => {
    socket.join(`kitchen:${tenantId}`);
    console.log(`🍳 Socket ${socket.id} joined kitchen: ${tenantId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;