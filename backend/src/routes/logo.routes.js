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

// GET /api/logos - List all logos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logos = await prisma.logo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(logos);
  } catch (err) {
    console.error('Error fetching logos:', err);
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
});

// POST /api/logos - Upload logo image
router.post('/upload', authenticateToken, authorizeRoles('ADMIN'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const fileUrl = `/uploads/logos/${req.file.filename}`;

    const newLogo = await prisma.logo.create({
      data: {
        fileName: req.file.originalname,
        filePath: fileUrl,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user.name || req.user.email
      }
    });

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPLOAD_LOGO',
      details: `Uploaded logo ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`
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
