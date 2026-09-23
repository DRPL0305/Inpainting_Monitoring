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

  // 3. Seed Initial Assets
  const sampleAssets = [
    {
      id: 'INP_1001',
      title: 'Movie_Scene_01_Inpaint.mp4',
      logoType: 'Channel Logo',
      logoId: 'LOGO_101',
      duration: 7200.0, // 2 hours
      status: 'COMPLETED',
      doneTimestamp: '2026-09-10 14:30:00',
      language: 'English',
      exportTimestamp: '2026-09-10 15:00:00',
      filePath: '/videos/Movie_Scene_01_Inpaint.mp4',
      fileSize: '450 MB',
      resolution: '1920x1080'
    },
    {
      id: 'INP_1002',
      title: 'Commercial_Ad_Hindi.mp4',
      logoType: 'Watermark',
      logoId: 'LOGO_102',
      duration: 1800.0, // 0.5 hours
      status: 'PENDING',
      doneTimestamp: null,
      language: 'Hindi',
      exportTimestamp: null,
      filePath: '/videos/Commercial_Ad_Hindi.mp4',
      fileSize: '120 MB',
      resolution: '1920x1080'
    },
    {
      id: 'INP_1003',
      title: 'Documentary_Ep02_Cleanup.mp4',
      logoType: 'Network Bug',
      logoId: 'LOGO_103',
      duration: 5400.0, // 1.5 hours
      status: 'COMPLETED',
      doneTimestamp: '2026-09-11 11:20:00',
      language: 'Spanish',
      exportTimestamp: null,
      filePath: '/videos/Documentary_Ep02_Cleanup.mp4',
      fileSize: '980 MB',
      resolution: '3840x2160'
    },
    {
      id: 'INP_1004',
      title: 'Sports_Highlight_Logo_Remove.mp4',
      logoType: 'Sponsor Banner',
      logoId: 'LOGO_104',
      duration: 2400.0, // 0.67 hours
      status: 'PENDING',
      doneTimestamp: null,
      language: 'English',
      exportTimestamp: null,
      filePath: '/videos/Sports_Highlight_Logo_Remove.mp4',
      fileSize: '240 MB',
      resolution: '1920x1080'
    },
    {
      id: 'INP_1005',
      title: 'Drama_Series_Pt1.mp4',
      logoType: 'Channel Logo',
      logoId: 'LOGO_105',
      duration: 9000.0, // 2.5 hours
      status: 'COMPLETED',
      doneTimestamp: '2026-09-11 09:15:00',
      language: 'Portuguese',
      exportTimestamp: '2026-09-11 09:45:00',
      filePath: '/videos/Drama_Series_Pt1.mp4',
      fileSize: '820 MB',
      resolution: '1920x1080'
    }
  ];

  for (const asset of sampleAssets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {},
      create: asset
    });
  }

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
