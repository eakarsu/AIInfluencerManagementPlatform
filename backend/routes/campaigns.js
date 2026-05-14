import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all campaigns with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM campaigns');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM campaigns ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    if (!req.query.page && !req.query.limit) {
      return res.json(result.rows);
    }
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Get campaigns error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET campaign by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create campaign
router.post('/', async (req, res) => {
  try {
    const { name, brand_id, description, start_date, end_date, budget, status, goals, target_audience, platforms } = req.body;
    const result = await pool.query(
      `INSERT INTO campaigns (name, brand_id, description, start_date, end_date, budget, status, goals, target_audience, platforms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, brand_id, description, start_date, end_date, budget, status || 'draft', goals, target_audience, platforms]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update campaign
router.put('/:id', async (req, res) => {
  try {
    const { name, brand_id, description, start_date, end_date, budget, status, goals, target_audience, platforms } = req.body;
    const result = await pool.query(
      `UPDATE campaigns SET name=$1, brand_id=$2, description=$3, start_date=$4, end_date=$5, budget=$6, status=$7, goals=$8, target_audience=$9, platforms=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [name, brand_id, description, start_date, end_date, budget, status, goals, target_audience, platforms, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE campaign
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM campaigns WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ message: 'Campaign deleted', campaign: result.rows[0] });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
