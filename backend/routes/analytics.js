import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all analytics with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM analytics');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM analytics ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    if (!req.query.page && !req.query.limit) {
      return res.json(result.rows);
    }
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET analytics by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analytics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create analytics
router.post('/', async (req, res) => {
  try {
    const { campaign_id, influencer_id, platform, impressions, reach, engagement, clicks, conversions, spend, revenue, date } = req.body;
    const result = await pool.query(
      `INSERT INTO analytics (campaign_id, influencer_id, platform, impressions, reach, engagement, clicks, conversions, spend, revenue, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [campaign_id, influencer_id, platform, impressions, reach, engagement, clicks, conversions, spend, revenue, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update analytics
router.put('/:id', async (req, res) => {
  try {
    const { campaign_id, influencer_id, platform, impressions, reach, engagement, clicks, conversions, spend, revenue, date } = req.body;
    const result = await pool.query(
      `UPDATE analytics SET campaign_id=$1, influencer_id=$2, platform=$3, impressions=$4, reach=$5, engagement=$6, clicks=$7, conversions=$8, spend=$9, revenue=$10, date=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [campaign_id, influencer_id, platform, impressions, reach, engagement, clicks, conversions, spend, revenue, date, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE analytics
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM analytics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }
    res.json({ message: 'Analytics record deleted', analytics: result.rows[0] });
  } catch (err) {
    console.error('Delete analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
