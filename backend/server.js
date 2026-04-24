import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import authRoutes from './routes/auth.js';
import influencerRoutes from './routes/influencers.js';
import campaignRoutes from './routes/campaigns.js';
import contentRoutes from './routes/content.js';
import analyticsRoutes from './routes/analytics.js';
import contractRoutes from './routes/contracts.js';
import paymentRoutes from './routes/payments.js';
import brandRoutes from './routes/brands.js';
import aiRoutes from './routes/ai.js';
import outreachRoutes from './routes/outreach.js';
import audienceRoutes from './routes/audience.js';
import competitorRoutes from './routes/competitors.js';
import benchmarkRoutes from './routes/benchmarks.js';
import dashboardRoutes from './routes/dashboard.js';
import roiRoutes from './routes/roi.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/audience', audienceRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/roi', roiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
