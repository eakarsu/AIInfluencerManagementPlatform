import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all contracts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contracts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get contracts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET contract by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get contract error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create contract
router.post('/', async (req, res) => {
  try {
    const { campaign_id, influencer_id, brand_id, terms, deliverables, compensation, start_date, end_date, status, signed_date, document_url } = req.body;
    const result = await pool.query(
      `INSERT INTO contracts (campaign_id, influencer_id, brand_id, terms, deliverables, compensation, start_date, end_date, status, signed_date, document_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [campaign_id, influencer_id, brand_id, terms, deliverables, compensation, start_date, end_date, status || 'draft', signed_date, document_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create contract error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update contract
router.put('/:id', async (req, res) => {
  try {
    const { campaign_id, influencer_id, brand_id, terms, deliverables, compensation, start_date, end_date, status, signed_date, document_url } = req.body;
    const result = await pool.query(
      `UPDATE contracts SET campaign_id=$1, influencer_id=$2, brand_id=$3, terms=$4, deliverables=$5, compensation=$6, start_date=$7, end_date=$8, status=$9, signed_date=$10, document_url=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [campaign_id, influencer_id, brand_id, terms, deliverables, compensation, start_date, end_date, status, signed_date, document_url, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update contract error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE contract
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM contracts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({ message: 'Contract deleted', contract: result.rows[0] });
  } catch (err) {
    console.error('Delete contract error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
