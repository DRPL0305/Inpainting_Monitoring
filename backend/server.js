import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.routes.js';
import assetRoutes from './src/routes/asset.routes.js';
import logoRoutes from './src/routes/logo.routes.js';
import userRoutes from './src/routes/user.routes.js';
import logRoutes from './src/routes/log.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// CORS setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static logo uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Inpainting Monitoring API', time: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/logos', logoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

// Server updated: 2026-09-25
app.listen(PORT, () => {
  console.log(`🚀 Inpainting Monitoring Server running on port ${PORT}`);
});
