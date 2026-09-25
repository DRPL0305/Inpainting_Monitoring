import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash default password
  const defaultPassword = await bcrypt.hash('Admin@1234', 10);
  const viewerPassword = await bcrypt.hash('Viewer@1234', 10);

  // 1. Seed Auth Users
  const adminAuth = await prisma.userAuth.upsert({
    where: { email: 'admin@inpainting.com' },
    update: {},
    create: {
      email: 'admin@inpainting.com',
      password: defaultPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  const viewerAuth = await prisma.userAuth.upsert({
    where: { email: 'viewer@inpainting.com' },
    update: {},
    create: {
      email: 'viewer@inpainting.com',
      password: viewerPassword,
      name: 'Viewer User',
      role: 'VIEWER'
    }
  });

  // 2. Seed Users
  await prisma.user.upsert({
    where: { email: 'admin@inpainting.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@inpainting.com',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  await prisma.user.upsert({
    where: { email: 'viewer@inpainting.com' },
    update: {},
    create: {
      name: 'Viewer User',
      email: 'viewer@inpainting.com',
      role: 'VIEWER',
      status: 'ACTIVE'
    }
  });

  // 4. Seed Activity Logs
  const initialLogs = [
    {
      timestamp: new Date().toISOString(),
      userId: adminAuth.id.toString(),
      userName: 'Admin User',
      userRole: 'ADMIN',
      action: 'SYSTEM_INIT',
      details: 'Inpainting Monitoring System initialized'
    },
    {
      timestamp: new Date().toISOString(),
      userId: adminAuth.id.toString(),
      userName: 'Admin User',
      userRole: 'ADMIN',
      action: 'SEED_ASSETS',
      details: 'Seeded initial sample inpainting assets'
    }
  ];

  for (const log of initialLogs) {
    await prisma.activityLog.create({ data: log });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
