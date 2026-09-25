import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Auto-ensure channelName column exists in database schema
(async () => {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Logo" ADD COLUMN IF NOT EXISTS "channelName" TEXT DEFAULT 'General';`);
  } catch (err) {
    console.warn('Auto migration note:', err.message);
  }
})();

// Multer Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper to ensure DB column exists before query
const ensureChannelColumnExists = async () => {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Logo" ADD COLUMN IF NOT EXISTS "channelName" TEXT DEFAULT 'General';`);
  } catch (e) {
    // Ignore error if already exists
  }
};

// GET /api/logos - List all logos (optional filtering by channel)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { channel } = req.query;
    let logos = [];
    try {
      const where = {};
      if (channel && channel !== 'ALL') {
        where.channelName = channel;
      }
      logos = await prisma.logo.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbErr) {
      await ensureChannelColumnExists();
      const where = {};
      if (channel && channel !== 'ALL') {
        where.channelName = channel;
      }
      logos = await prisma.logo.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    }
    res.json(logos);
  } catch (err) {
    console.error('Error fetching logos:', err);
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
});

// GET /api/logos/:id - Fetch single logo strictly by exact ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rawId = req.params.id.replace(/^logo/i, '');
    const logoId = parseInt(rawId, 10);

    if (isNaN(logoId)) {
      return res.status(400).json({ error: 'Invalid logo ID format' });
    }

    const logo = await prisma.logo.findUnique({ where: { id: logoId } });
    if (!logo) {
      return res.status(404).json({ error: `Logo with ID #${req.params.id} is not available in database` });
    }

    res.json(logo);
  } catch (err) {
    console.error('Error fetching logo by id:', err);
    res.status(500).json({ error: 'Failed to fetch logo details' });
  }
});

// POST /api/logos/upload - Upload logo image
router.post('/upload', authenticateToken, authorizeRoles('ADMIN'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const channelName = req.body.channelName || 'Sony MAX';
    const fileUrl = `/uploads/logos/${req.file.filename}`;

    let newLogo;
    try {
      newLogo = await prisma.logo.create({
        data: {
          channelName,
          fileName: req.file.originalname,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedBy: req.user.name || req.user.email
        }
      });
    } catch (dbErr) {
      // Auto-migrate column on the fly if missing in production DB
      await ensureChannelColumnExists();
      newLogo = await prisma.logo.create({
        data: {
          channelName,
          fileName: req.file.originalname,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedBy: req.user.name || req.user.email
        }
      });
    }

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPLOAD_LOGO',
      details: `Uploaded logo ${req.file.originalname} for channel ${channelName} (${(req.file.size / 1024).toFixed(1)} KB)`
    });

    res.status(201).json(newLogo);
  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload logo' });
  }
});

// DELETE /api/logos/:id - Delete logo
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const logoId = parseInt(id, 10);

    const logo = await prisma.logo.findUnique({ where: { id: logoId } });
    if (!logo) {
      return res.status(404).json({ error: 'Logo not found' });
    }

    // Delete physical file if exists
    const diskPath = path.join(process.cwd(), logo.filePath);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        console.warn('Failed to delete file from disk:', e);
      }
    }

    await prisma.logo.delete({ where: { id: logoId } });

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_LOGO',
      details: `Deleted logo ${logo.fileName}`
    });

    res.json({ message: 'Logo deleted successfully' });
  } catch (err) {
    console.error('Error deleting logo:', err);
    res.status(500).json({ error: 'Failed to delete logo' });
  }
});

export default router;
