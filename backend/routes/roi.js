import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all ROI calculations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roi_calculations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get ROI calculations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ROI calculation by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roi_calculations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ROI calculation not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get ROI calculation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create ROI calculation
router.post('/', async (req, res) => {
  try {
    const { campaign_id, influencer_id, total_spend, total_revenue, roi_percentage, impressions, conversions, cost_per_conversion, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO roi_calculations (campaign_id, influencer_id, total_spend, total_revenue, roi_percentage, impressions, conversions, cost_per_conversion, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [campaign_id, influencer_id, total_spend, total_revenue, roi_percentage, impressions, conversions, cost_per_conversion, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create ROI calculation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update ROI calculation
router.put('/:id', async (req, res) => {
  try {
    const { campaign_id, influencer_id, total_spend, total_revenue, roi_percentage, impressions, conversions, cost_per_conversion, notes } = req.body;
    const result = await pool.query(
      `UPDATE roi_calculations SET campaign_id=$1, influencer_id=$2, total_spend=$3, total_revenue=$4, roi_percentage=$5, impressions=$6, conversions=$7, cost_per_conversion=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [campaign_id, influencer_id, total_spend, total_revenue, roi_percentage, impressions, conversions, cost_per_conversion, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ROI calculation not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update ROI calculation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE ROI calculation
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM roi_calculations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ROI calculation not found' });
    }
    res.json({ message: 'ROI calculation deleted', roi_calculation: result.rows[0] });
  } catch (err) {
    console.error('Delete ROI calculation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
