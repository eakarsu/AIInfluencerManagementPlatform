import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all competitors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM competitors ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get competitors error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET competitor by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM competitors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get competitor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create competitor
router.post('/', async (req, res) => {
  try {
    const { brand_id, name, website, social_handles, follower_count, engagement_rate, content_strategy, strengths, weaknesses, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO competitors (brand_id, name, website, social_handles, follower_count, engagement_rate, content_strategy, strengths, weaknesses, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [brand_id, name, website, social_handles, follower_count, engagement_rate, content_strategy, strengths, weaknesses, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create competitor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update competitor
router.put('/:id', async (req, res) => {
  try {
    const { brand_id, name, website, social_handles, follower_count, engagement_rate, content_strategy, strengths, weaknesses, notes } = req.body;
    const result = await pool.query(
      `UPDATE competitors SET brand_id=$1, name=$2, website=$3, social_handles=$4, follower_count=$5, engagement_rate=$6, content_strategy=$7, strengths=$8, weaknesses=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [brand_id, name, website, social_handles, follower_count, engagement_rate, content_strategy, strengths, weaknesses, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update competitor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE competitor
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM competitors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    res.json({ message: 'Competitor deleted', competitor: result.rows[0] });
  } catch (err) {
    console.error('Delete competitor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
