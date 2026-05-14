/*
 * routes/marketplace.js — Apply pass 5
 *
 * Mechanical influencer-marketplace discovery. Filters the existing `influencers`
 * table by audience size, engagement, niche, location and computes a deterministic
 * fit score against an optional brief. No external APIs.
 */
import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

function score(inf, brief) {
  let s = 50;
  const er = Number(inf.engagement_rate || 0);
  if (er >= 5) s += 25;
  else if (er >= 3) s += 15;
  else if (er >= 1) s += 5;

  const followers = Number(inf.followers_count || 0);
  if (brief.min_followers && followers >= Number(brief.min_followers)) s += 5;
  if (brief.max_followers && followers <= Number(brief.max_followers)) s += 5;

  if (brief.niche && inf.niche && String(inf.niche).toLowerCase().includes(String(brief.niche).toLowerCase())) s += 10;
  if (brief.location && inf.location && String(inf.location).toLowerCase().includes(String(brief.location).toLowerCase())) s += 5;

  return Math.max(0, Math.min(100, s));
}

// GET /api/marketplace/search?niche=&min_followers=&max_followers=&min_er=&top_k=
router.get('/search', async (req, res) => {
  try {
    const minF = Number(req.query.min_followers) || 0;
    const maxF = Number(req.query.max_followers) || 100_000_000;
    const minER = Number(req.query.min_er) || 0;
    const topK = Math.min(Number(req.query.top_k) || 25, 100);
    const niche = req.query.niche || null;
    const location = req.query.location || null;

    const params = [minF, maxF, minER];
    let where = `COALESCE(followers_count, 0) BETWEEN $1 AND $2 AND COALESCE(engagement_rate, 0) >= $3`;
    if (niche) { params.push(`%${niche}%`); where += ` AND COALESCE(niche, '') ILIKE $${params.length}`; }
    if (location) { params.push(`%${location}%`); where += ` AND COALESCE(location, '') ILIKE $${params.length}`; }

    const r = await pool.query(
      `SELECT * FROM influencers WHERE ${where} ORDER BY engagement_rate DESC NULLS LAST LIMIT 200`,
      params
    ).catch(() => ({ rows: [] }));

    const brief = { niche, location, min_followers: minF, max_followers: maxF };
    const ranked = r.rows
      .map((inf) => ({ ...inf, fit_score: score(inf, brief) }))
      .sort((a, b) => b.fit_score - a.fit_score)
      .slice(0, topK);

    res.json({
      total_candidates: r.rows.length,
      returned: ranked.length,
      filters: { min_followers: minF, max_followers: maxF, min_engagement_rate: minER, niche, location },
      results: ranked,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/featured — curated list (top engagement_rate, top followers)
router.get('/featured', async (_req, res) => {
  try {
    const top = await pool.query(
      `SELECT * FROM influencers ORDER BY engagement_rate DESC NULLS LAST LIMIT 10`
    ).catch(() => ({ rows: [] }));
    const big = await pool.query(
      `SELECT * FROM influencers ORDER BY followers_count DESC NULLS LAST LIMIT 10`
    ).catch(() => ({ rows: [] }));
    res.json({ top_engagement: top.rows, biggest_audiences: big.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
