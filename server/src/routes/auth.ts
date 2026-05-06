import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { generateTokens, authenticateToken } from '../middleware/auth.js';

const router = Router();

// Register new restaurant (tenant)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existingTenant = await prisma.tenant.findUnique({ where: { email } });
    if (existingTenant) {
      return res.status(400).json({ error: 'Restaurant already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const tenant = await prisma.tenant.create({
      data: {
        name,
        email,
        phone,
        address,
        subscription: 'trial',
        trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const owner = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        password: hashedPassword,
        name,
        role: 'owner',
        phone,
      },
    });

    // Create default settings
    await prisma.settings.create({
      data: {
        tenantId: tenant.id,
        currency: '£',
        taxRate: 18,
        timeZone: 'Asia/Kolkata',
      },
    });

    const tokens = generateTokens({
      userId: owner.id,
      tenantId: tenant.id,
      role: owner.role,
    });

    res.status(201).json({
      user: { id: owner.id, name: owner.name, email: owner.email, role: owner.role },
      tenant: { id: tenant.id, name: tenant.name, subscription: tenant.subscription },
      ...tokens,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        logo: user.tenant.logo,
        subscription: user.tenant.subscription,
      },
      ...tokens,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const { verifyToken } = await import('../middleware/auth.js');
    const payload = verifyToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    const tokens = generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    res.json(tokens);
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Logout (client-side handles token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        logo: user.tenant.logo,
        subscription: user.tenant.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;