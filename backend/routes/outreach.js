import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all outreach messages
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outreach_messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get outreach messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET outreach message by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outreach_messages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outreach message not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get outreach message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create outreach message
router.post('/', async (req, res) => {
  try {
    const { influencer_id, campaign_id, subject, message, channel, status, sent_at, response, response_at } = req.body;
    const result = await pool.query(
      `INSERT INTO outreach_messages (influencer_id, campaign_id, subject, message, channel, status, sent_at, response, response_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [influencer_id, campaign_id, subject, message, channel || 'email', status || 'draft', sent_at, response, response_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create outreach message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update outreach message
router.put('/:id', async (req, res) => {
  try {
    const { influencer_id, campaign_id, subject, message, channel, status, sent_at, response, response_at } = req.body;
    const result = await pool.query(
      `UPDATE outreach_messages SET influencer_id=$1, campaign_id=$2, subject=$3, message=$4, channel=$5, status=$6, sent_at=$7, response=$8, response_at=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [influencer_id, campaign_id, subject, message, channel, status, sent_at, response, response_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outreach message not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update outreach message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE outreach message
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM outreach_messages WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outreach message not found' });
    }
    res.json({ message: 'Outreach message deleted', outreach: result.rows[0] });
  } catch (err) {
    console.error('Delete outreach message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
