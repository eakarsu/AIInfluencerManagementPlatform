// Micro-influencer discovery flagging emerging high-engagement creators for
// early partnerships.
// Audit: batch_04.md / AIInfluencerManagementPlatform / Custom Feature Suggestions #6
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();
router.use(authenticateToken);

const aiRateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 60 });

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
  const r = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Influencer - Micro Discovery'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4, max_tokens: 2500
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/micro-influencer-discovery/scan
// Body: { niche, platform?, target_follower_range?, geo? }
router.post('/scan', aiRateLimiter, async (req, res) => {
  try {
    const {
      niche, platform = 'instagram',
      target_follower_range = { low: 5000, high: 50000 },
      geo = 'global'
    } = req.body || {};
    if (!niche) return res.status(400).json({ error: 'niche required' });

    let existing = { rows: [] };
    try {
      existing = await pool.query(
        `SELECT id, name, handle, follower_count, niche FROM influencers WHERE niche = $1 LIMIT 20`,
        [niche]
      );
    } catch (_) {}

    const systemPrompt = `You are a micro-influencer discovery analyst. Identify emerging creator archetypes,
content signals to look for, and discovery tactics. Return STRICT JSON only.`;

    const userPrompt = `Niche: ${niche}
Platform: ${platform}
Target follower range: ${JSON.stringify(target_follower_range)}
Geography: ${geo}
Already-known creators: ${JSON.stringify(existing.rows)}

Return JSON:
{
  "summary": "...",
  "creator_archetypes": [
    { "archetype": "string", "content_signals": ["..."], "search_keywords": ["..."], "estimated_engagement_rate_pct": 0 }
  ],
  "discovery_tactics": [{ "channel": "hashtag|trending_audio|comment_mining|affiliate_referral", "instructions": "string" }],
  "first_message_template": "string",
  "watchlist_criteria": ["..."],
  "disclaimer": "Discovery guidance; verify creator authenticity before outreach."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ niche, platform, target_follower_range, scan: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/niches', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT DISTINCT niche FROM influencers WHERE niche IS NOT NULL LIMIT 50`)
      .catch(() => ({ rows: [] }));
    res.json(r.rows.map(x => x.niche));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
