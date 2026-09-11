import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logActivity = async ({ userId = '0', userName = 'System', userRole = 'SYSTEM', action, details }) => {
  try {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await prisma.activityLog.create({
      data: {
        timestamp,
        userId: String(userId),
        userName,
        userRole,
        action,
        details
      }
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};
