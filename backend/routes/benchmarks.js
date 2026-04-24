import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all benchmarks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM benchmarks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get benchmarks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET benchmark by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM benchmarks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get benchmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create benchmark
router.post('/', async (req, res) => {
  try {
    const { category, platform, avg_engagement_rate, avg_follower_growth, avg_cost_per_post, avg_roi, avg_reach, industry, period, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO benchmarks (category, platform, avg_engagement_rate, avg_follower_growth, avg_cost_per_post, avg_roi, avg_reach, industry, period, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [category, platform, avg_engagement_rate, avg_follower_growth, avg_cost_per_post, avg_roi, avg_reach, industry, period, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create benchmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update benchmark
router.put('/:id', async (req, res) => {
  try {
    const { category, platform, avg_engagement_rate, avg_follower_growth, avg_cost_per_post, avg_roi, avg_reach, industry, period, notes } = req.body;
    const result = await pool.query(
      `UPDATE benchmarks SET category=$1, platform=$2, avg_engagement_rate=$3, avg_follower_growth=$4, avg_cost_per_post=$5, avg_roi=$6, avg_reach=$7, industry=$8, period=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [category, platform, avg_engagement_rate, avg_follower_growth, avg_cost_per_post, avg_roi, avg_reach, industry, period, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update benchmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE benchmark
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM benchmarks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }
    res.json({ message: 'Benchmark deleted', benchmark: result.rows[0] });
  } catch (err) {
    console.error('Delete benchmark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
