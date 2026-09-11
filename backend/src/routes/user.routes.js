import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users - List all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create new user & auth credentials
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['ADMIN', 'VIEWER'].includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Role must be ADMIN or VIEWER' });
    }

    const existingAuth = await prisma.userAuth.findUnique({ where: { email } });
    if (existingAuth) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role.toUpperCase();

    // Create UserAuth entry
    await prisma.userAuth.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole
      }
    });

    // Create User entry
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: assignedRole,
        status: 'ACTIVE'
      }
    });

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_USER',
      details: `Created user ${email} with role ${assignedRole}`
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/:id - Update user role or status
router.patch('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { name, role, status } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (role && ['ADMIN', 'VIEWER'].includes(role.toUpperCase())) updateData.role = role.toUpperCase();
    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) updateData.status = status.toUpperCase();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Also update UserAuth role/name if modified
    if (updateData.role || updateData.name) {
      await prisma.userAuth.updateMany({
        where: { email: existingUser.email },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.role && { role: updateData.role })
        }
      });
    }

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_USER',
      details: `Updated user ${existingUser.email}`
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id: userId } });
    await prisma.userAuth.deleteMany({ where: { email: existingUser.email } });

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_USER',
      details: `Deleted user ${existingUser.email}`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
