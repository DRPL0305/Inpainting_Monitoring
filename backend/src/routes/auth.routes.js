import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logActivity } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userAuth = await prisma.userAuth.findUnique({ where: { email } });
    if (!userAuth) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, userAuth.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: userAuth.id,
      email: userAuth.email,
      name: userAuth.name,
      role: userAuth.role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'inpainting_super_secret_jwt_key_2026',
      { expiresIn: '24h' }
    );

    await logActivity({
      userId: userAuth.id,
      userName: userAuth.name,
      userRole: userAuth.role,
      action: 'USER_LOGIN',
      details: `User ${userAuth.email} logged in successfully`
    });

    res.json({
      token,
      user: {
        id: userAuth.id,
        name: userAuth.name,
        email: userAuth.email,
        role: userAuth.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userAuth = await prisma.userAuth.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });
    if (!userAuth) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userAuth);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
