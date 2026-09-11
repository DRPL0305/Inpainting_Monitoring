import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/logs - List all activity logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
