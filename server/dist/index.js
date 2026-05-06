import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.CLIENT_URL
            : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
const prisma = new PrismaClient();
export { prisma };
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});
app.use(express.json({ limit: '10mb' }));
app.set('io', io);
// Import routes
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
import paymentSettingsRoutes from './routes/paymentSettings.js';
import stripePaymentRoutes from './routes/payments/stripe.js';
import razorpayPaymentRoutes from './routes/payments/razorpay.js';
import paypalPaymentRoutes from './routes/payments/paypal.js';
import payuPaymentRoutes from './routes/payments/payu.js';
import { authenticateSocket } from './middleware/auth.js';
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
app.use('/api/settings', paymentSettingsRoutes);
app.use('/api/payments/stripe', stripePaymentRoutes);
app.use('/api/payments/razorpay', razorpayPaymentRoutes);
app.use('/api/payments/paypal', paypalPaymentRoutes);
app.use('/api/payments/payu', payuPaymentRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
io.use(authenticateSocket);
io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);
    socket.on('join-tenant', (tenantId) => socket.join(`tenant:${tenantId}`));
    socket.on('join-kitchen', (tenantId) => socket.join(`kitchen:${tenantId}`));
    socket.on('disconnect', () => console.log(`❌ Client disconnected: ${socket.id}`));
});
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientPath));
    app.get('*', (req, res) => res.sendFile(path.join(clientPath, 'index.html')));
}
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
export default app;
//# sourceMappingURL=index.js.map