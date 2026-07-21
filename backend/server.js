
// === Batch 04 Gaps & Frontend Mounts ===
import route_gap_no_audience_segmentation_ai_audiencejs_i from './routes/gap-no-audience-segmentation-ai-audiencejs-i.js';
import route_gap_no_performance_prediction_model from './routes/gap-no-performance-prediction-model.js';
import route_gap_no_fake_follower_fraud_detector from './routes/gap-no-fake-follower-fraud-detector.js';
import route_gap_no_content_calendar_trend_ai from './routes/gap-no-content-calendar-trend-ai.js';
import route_gap_live_social_media_api_integrations_are from './routes/gap-live-social-media-api-integrations-are.js';
import route_gap_no_webhook_receivers_for_engagement_even from './routes/gap-no-webhook-receivers-for-engagement-even.js';
import route_gap_no_file_upload_for_content_briefs from './routes/gap-no-file-upload-for-content-briefs.js';
import route_gap_no_notification_engine_0_references from './routes/gap-no-notification-engine-0-references.js';
import route_gap_no_e_signature_for_contracts from './routes/gap-no-e-signature-for-contracts.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
// Apply pass 5 — additive
import contractTemplateRoutes from './routes/contractTemplates.js';
import messagingRoutes from './routes/messaging.js';
import marketplaceRoutes from './routes/marketplace.js';
import integrationRoutes from './routes/integrations.js';
import customViewsRoutes from './routes/customViews.js';
import governedCampaignRoutes from './routes/governedCampaigns.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
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
// Apply pass 5
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/governed-campaigns', authenticateToken, governedCampaignRoutes);
app.use('/api/brand-safety-clause-monitor', (await import('./routes/brandSafetyClauseMonitor.js')).default);
import('./routes/fakeFollowerDetector.js').then(m => app.use('/api/fake-follower-detector', m.default));
import('./routes/microInfluencerDiscovery.js').then(m => app.use('/api/micro-influencer-discovery', m.default));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/gap-no-audience-segmentation-ai-audiencejs-i', route_gap_no_audience_segmentation_ai_audiencejs_i);
app.use('/api/gap-no-performance-prediction-model', route_gap_no_performance_prediction_model);
app.use('/api/gap-no-fake-follower-fraud-detector', route_gap_no_fake_follower_fraud_detector);
app.use('/api/gap-no-content-calendar-trend-ai', route_gap_no_content_calendar_trend_ai);
app.use('/api/gap-live-social-media-api-integrations-are', route_gap_live_social_media_api_integrations_are);
app.use('/api/gap-no-webhook-receivers-for-engagement-even', route_gap_no_webhook_receivers_for_engagement_even);
app.use('/api/gap-no-file-upload-for-content-briefs', route_gap_no_file_upload_for_content_briefs);
app.use('/api/gap-no-notification-engine-0-references', route_gap_no_notification_engine_0_references);
app.use('/api/gap-no-e-signature-for-contracts', route_gap_no_e_signature_for_contracts);

// Mount custom views BEFORE any 404 fallback
app.use('/api/custom-views', customViewsRoutes);

// 404 fallback for unmatched /api routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
