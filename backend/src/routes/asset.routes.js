import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/assets/stats - Dashboard 3 Cards stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalAssets = await prisma.asset.count();
    const pendingAssets = await prisma.asset.count({ where: { status: 'PENDING' } });
    const completedAssets = await prisma.asset.count({ where: { status: 'COMPLETED' } });

    // Sum duration of completed assets
    const completedAssetsList = await prisma.asset.findMany({
      where: { status: 'COMPLETED' },
      select: { duration: true }
    });
    const totalCompletedSeconds = completedAssetsList.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const completedHours = parseFloat((totalCompletedSeconds / 3600).toFixed(2));

    res.json({
      totalAssets,
      completedAssets,
      pendingAssets,
      completedHours
    });
  } catch (err) {
    console.error('Error fetching asset stats:', err);
    res.status(500).json({ error: 'Failed to fetch asset stats' });
  }
});

// GET /api/assets - List all assets with filtering & search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { logoType: { contains: search, mode: 'insensitive' } },
        { logoId: { contains: search, mode: 'insensitive' } },
        { blitzAgId: { contains: search, mode: 'insensitive' } },
        { whichLogo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const mappedAssets = assets.map((a) => ({
      ...a,
      blitzAgId: a.blitzAgId || a.blitzagid || a.blitz_ag_id || null,
      logoPresent: a.logoPresent || a.logopresent || null,
      whichLogo: a.whichLogo || a.whichlogo || null
    }));

    res.json(mappedAssets);
  } catch (err) {
    console.error('Error fetching assets:', err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// POST /api/assets - Create new Asset
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id, title, logoType, logoId, duration, status, doneTimestamp, filePath, fileSize, resolution, blitzAgId, logoPresent, whichLogo } = req.body;

    if (!id || !title) {
      return res.status(400).json({ error: 'Asset ID and title are required' });
    }

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (existing) {
      return res.status(400).json({ error: `Asset with ID ${id} already exists` });
    }

    const newAsset = await prisma.asset.create({
      data: {
        id,
        title,
        logoType: logoType || null,
        logoId: logoId || null,
        duration: duration ? parseFloat(duration) : 0,
        status: status || 'PENDING',
        doneTimestamp: doneTimestamp || null,
        filePath: filePath || null,
        fileSize: fileSize || null,
        resolution: resolution || null,
        blitzAgId: blitzAgId || null,
        logoPresent: logoPresent || null,
        whichLogo: whichLogo || null
      }
    });

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_ASSET',
      details: `Created asset ${id} (${title})`
    });

    res.status(201).json(newAsset);
  } catch (err) {
    console.error('Error creating asset:', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// PATCH /api/assets/:id - Update Asset
router.patch('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, logoType, logoId, duration, status, doneTimestamp, filePath, fileSize, resolution, blitzAgId, logoPresent, whichLogo } = req.body;

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const updatedData = {};
    if (title !== undefined) updatedData.title = title;
    if (logoType !== undefined) updatedData.logoType = logoType;
    if (logoId !== undefined) updatedData.logoId = logoId;
    if (duration !== undefined) updatedData.duration = parseFloat(duration);
    if (status !== undefined) updatedData.status = status;
    if (doneTimestamp !== undefined) updatedData.doneTimestamp = doneTimestamp;
    if (filePath !== undefined) updatedData.filePath = filePath;
    if (fileSize !== undefined) updatedData.fileSize = fileSize;
    if (resolution !== undefined) updatedData.resolution = resolution;
    if (blitzAgId !== undefined) updatedData.blitzAgId = blitzAgId;
    if (logoPresent !== undefined) updatedData.logoPresent = logoPresent;
    if (whichLogo !== undefined) updatedData.whichLogo = whichLogo;

    // Auto set timestamps if status changed to COMPLETED and timestamp not provided
    if (status === 'COMPLETED' && !updatedData.doneTimestamp && !existing.doneTimestamp) {
      updatedData.doneTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updatedData
    });

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_ASSET',
      details: `Updated asset ${id} status to ${updatedAsset.status}`
    });

    res.json(updatedAsset);
  } catch (err) {
    console.error('Error updating asset:', err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.asset.delete({ where: { id } });

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_ASSET',
      details: `Deleted asset ${id}`
    });

    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
