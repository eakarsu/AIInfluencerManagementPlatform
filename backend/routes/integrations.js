/*
 * routes/integrations.js — Apply pass 5 (NEEDS-CREDS stubs)
 *
 * Social media platform + payment processor integration scaffolds. Each endpoint
 * returns 503 with an explicit env-var hint when the corresponding credentials
 * are not configured (mirrors the quickbooks/routes/ai.js 503-on-no-key pattern).
 *
 * Required env vars (see _BACKLOG_NEEDS_CREDS.md):
 *   INSTAGRAM_ACCESS_TOKEN
 *   TIKTOK_ACCESS_TOKEN
 *   YOUTUBE_API_KEY
 *   STRIPE_SECRET_KEY
 *   PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

function noKey(res, provider, vars) {
  return res.status(503).json({
    error: `${provider} integration unavailable: credentials not configured`,
    required_env: vars,
    provider_status: 'not_configured',
  });
}

// --- Social platforms ---------------------------------------------------
router.post('/instagram/profile', (req, res) => {
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
    return noKey(res, 'Instagram', ['INSTAGRAM_ACCESS_TOKEN']);
  }
  // TODO: GET https://graph.instagram.com/{user-id}?fields=...&access_token=...
  res.status(501).json({ error: 'Instagram integration scaffolded but not implemented' });
});

router.post('/tiktok/profile', (req, res) => {
  if (!process.env.TIKTOK_ACCESS_TOKEN) {
    return noKey(res, 'TikTok', ['TIKTOK_ACCESS_TOKEN']);
  }
  // TODO: TikTok Display API call
  res.status(501).json({ error: 'TikTok integration scaffolded but not implemented' });
});

router.post('/youtube/channel', (req, res) => {
  if (!process.env.YOUTUBE_API_KEY) {
    return noKey(res, 'YouTube', ['YOUTUBE_API_KEY']);
  }
  // TODO: GET https://www.googleapis.com/youtube/v3/channels?part=...&id=...&key=...
  res.status(501).json({ error: 'YouTube integration scaffolded but not implemented' });
});

// --- Payment processors -------------------------------------------------
router.post('/stripe/payout', (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return noKey(res, 'Stripe', ['STRIPE_SECRET_KEY']);
  }
  // TODO: stripe.transfers.create({ amount, currency, destination })
  res.status(501).json({ error: 'Stripe payout scaffolded but not implemented' });
});

router.post('/paypal/payout', (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return noKey(res, 'PayPal', ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']);
  }
  // TODO: PayPal Payouts API
  res.status(501).json({ error: 'PayPal payout scaffolded but not implemented' });
});

// GET /api/integrations/status — config status for the dashboard
router.get('/status', (_req, res) => {
  res.json({
    instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    tiktok: !!process.env.TIKTOK_ACCESS_TOKEN,
    youtube: !!process.env.YOUTUBE_API_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
  });
});

export default router;
