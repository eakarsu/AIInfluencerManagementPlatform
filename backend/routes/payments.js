import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all payments with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM payments');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    if (!req.query.page && !req.query.limit) {
      return res.json(result.rows);
    }
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET payment by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create payment
router.post('/', async (req, res) => {
  try {
    const { contract_id, influencer_id, campaign_id, amount, currency, payment_method, status, payment_date, due_date, invoice_url, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO payments (contract_id, influencer_id, campaign_id, amount, currency, payment_method, status, payment_date, due_date, invoice_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [contract_id, influencer_id, campaign_id, amount, currency || 'USD', payment_method, status || 'pending', payment_date, due_date, invoice_url, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update payment
router.put('/:id', async (req, res) => {
  try {
    const { contract_id, influencer_id, campaign_id, amount, currency, payment_method, status, payment_date, due_date, invoice_url, notes } = req.body;
    const result = await pool.query(
      `UPDATE payments SET contract_id=$1, influencer_id=$2, campaign_id=$3, amount=$4, currency=$5, payment_method=$6, status=$7, payment_date=$8, due_date=$9, invoice_url=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [contract_id, influencer_id, campaign_id, amount, currency, payment_method, status, payment_date, due_date, invoice_url, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE payment
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted', payment: result.rows[0] });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
