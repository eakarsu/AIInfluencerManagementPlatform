import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all content
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM content_calendar ORDER BY scheduled_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get content error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET content by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM content_calendar WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get content error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create content
router.post('/', async (req, res) => {
  try {
    const { campaign_id, influencer_id, title, content_type, platform, scheduled_date, status, caption, media_url, hashtags, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO content_calendar (campaign_id, influencer_id, title, content_type, platform, scheduled_date, status, caption, media_url, hashtags, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [campaign_id, influencer_id, title, content_type, platform, scheduled_date, status || 'draft', caption, media_url, hashtags, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create content error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update content
router.put('/:id', async (req, res) => {
  try {
    const { campaign_id, influencer_id, title, content_type, platform, scheduled_date, status, caption, media_url, hashtags, notes } = req.body;
    const result = await pool.query(
      `UPDATE content_calendar SET campaign_id=$1, influencer_id=$2, title=$3, content_type=$4, platform=$5, scheduled_date=$6, status=$7, caption=$8, media_url=$9, hashtags=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [campaign_id, influencer_id, title, content_type, platform, scheduled_date, status, caption, media_url, hashtags, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update content error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE content
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM content_calendar WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json({ message: 'Content deleted', content: result.rows[0] });
  } catch (err) {
    console.error('Delete content error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
