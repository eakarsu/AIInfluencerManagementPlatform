import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all brands
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM brands ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get brands error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET brand by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM brands WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get brand error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create brand
router.post('/', async (req, res) => {
  try {
    const { name, industry, website, logo_url, description, contact_name, contact_email, contact_phone, budget_range, status } = req.body;
    const result = await pool.query(
      `INSERT INTO brands (name, industry, website, logo_url, description, contact_name, contact_email, contact_phone, budget_range, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, industry, website, logo_url, description, contact_name, contact_email, contact_phone, budget_range, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create brand error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update brand
router.put('/:id', async (req, res) => {
  try {
    const { name, industry, website, logo_url, description, contact_name, contact_email, contact_phone, budget_range, status } = req.body;
    const result = await pool.query(
      `UPDATE brands SET name=$1, industry=$2, website=$3, logo_url=$4, description=$5, contact_name=$6, contact_email=$7, contact_phone=$8, budget_range=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [name, industry, website, logo_url, description, contact_name, contact_email, contact_phone, budget_range, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update brand error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE brand
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM brands WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json({ message: 'Brand deleted', brand: result.rows[0] });
  } catch (err) {
    console.error('Delete brand error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
