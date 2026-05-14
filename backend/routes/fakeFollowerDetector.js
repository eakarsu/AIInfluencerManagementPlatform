// Fake-follower detection scoring engagement authenticity.
// Audit: batch_04.md / AIInfluencerManagementPlatform / Custom Feature Suggestions #5
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();
router.use(authenticateToken);

const aiRateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 60 });

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Influencer - Fake Follower Detector'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2, max_tokens: 2000
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/fake-follower-detector/score { influencer_id }
router.post('/score', aiRateLimiter, async (req, res) => {
  try {
    const { influencer_id } = req.body || {};
    if (!influencer_id) return res.status(400).json({ error: 'influencer_id required' });

    let influencer = null, audience = null, engagement = null;
    try {
      const r = await pool.query(`SELECT * FROM influencers WHERE id = $1`, [influencer_id]);
      influencer = r.rows[0] || null;
    } catch (_) {}
    try {
      const r = await pool.query(`SELECT * FROM audience_analytics WHERE influencer_id = $1 ORDER BY captured_at DESC LIMIT 5`, [influencer_id]);
      audience = r.rows[0] || null;
    } catch (_) {}
    try {
      const r = await pool.query(`SELECT * FROM content WHERE influencer_id = $1 ORDER BY published_at DESC LIMIT 20`, [influencer_id]);
      engagement = r.rows;
    } catch (_) {}

    const systemPrompt = `You are a follower authenticity analyst. Score follower authenticity (0-100) by
weighing follower-growth pattern, engagement rate vs reach, comment quality, location dispersion, and bot
heuristics. Return STRICT JSON only.`;

    const userPrompt = `Influencer: ${JSON.stringify(influencer)}
Audience snapshot: ${JSON.stringify(audience)}
Recent content engagement: ${JSON.stringify(engagement)}

Return JSON:
{
  "summary": "...",
  "authenticity_score_0_100": 0,
  "risk_signals": [{ "signal": "string", "severity": "low|medium|high", "evidence": "string" }],
  "estimated_fake_pct": 0,
  "estimated_real_reach": 0,
  "recommendation": "approve|negotiate_lower_rate|request_proof|decline",
  "rate_adjustment_suggestion_pct": 0,
  "disclaimer": "Heuristic; supplement with third-party audit tools."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ influencer_id, score: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name, handle FROM influencers LIMIT 50`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
