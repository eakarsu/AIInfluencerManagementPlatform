/*
 * routes/messaging.js — Apply pass 5
 *
 * Brand-influencer in-app messaging. Mechanical only — no realtime/socket; clients poll.
 * Additive `bi_messages` table (CREATE TABLE IF NOT EXISTS). Messages are scoped to a
 * (brand_id, influencer_id) thread.
 */
import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

pool.query(`
  CREATE TABLE IF NOT EXISTS bi_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    brand_id INTEGER,
    influencer_id INTEGER,
    sender_role TEXT,
    body TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
  )
`).catch((e) => console.error('bi_messages bootstrap error:', e.message));

// POST /api/messaging — send a message in a brand/influencer thread
router.post('/', async (req, res) => {
  try {
    const { brand_id, influencer_id, sender_role, body } = req.body || {};
    if (!brand_id || !influencer_id || !body) {
      return res.status(400).json({ error: 'brand_id, influencer_id, body required' });
    }
    const role = sender_role === 'influencer' ? 'influencer' : 'brand';
    const r = await pool.query(
      `INSERT INTO bi_messages (user_id, brand_id, influencer_id, sender_role, body)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user?.id || null, brand_id, influencer_id, role, String(body).slice(0, 4000)]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messaging/thread?brand_id=&influencer_id=
router.get('/thread', async (req, res) => {
  try {
    const brand_id = Number(req.query.brand_id);
    const influencer_id = Number(req.query.influencer_id);
    if (!brand_id || !influencer_id) {
      return res.status(400).json({ error: 'brand_id and influencer_id required' });
    }
    const r = await pool.query(
      `SELECT * FROM bi_messages WHERE brand_id = $1 AND influencer_id = $2
       ORDER BY created_at ASC LIMIT 500`,
      [brand_id, influencer_id]
    );
    res.json({ thread: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messaging/:id/read — mark a message as read
router.post('/:id/read', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE bi_messages SET read_at = NOW() WHERE id = $1 RETURNING *`,
      [Number(req.params.id)]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messaging/unread/count — total unread for the current user's brand inbox
router.get('/unread/count', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c FROM bi_messages WHERE user_id != COALESCE($1, -1) AND read_at IS NULL`,
      [req.user?.id || null]
    );
    res.json({ unread: r.rows[0]?.c || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
