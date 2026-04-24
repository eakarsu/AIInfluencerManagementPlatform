import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all influencers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM influencers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get influencers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET influencer by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM influencers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Influencer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get influencer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create influencer
router.post('/', async (req, res) => {
  try {
    const { name, platform, handle, followers, engagement_rate, category, email, phone, location, bio, avatar_url, status } = req.body;
    const result = await pool.query(
      `INSERT INTO influencers (name, platform, handle, followers, engagement_rate, category, email, phone, location, bio, avatar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, platform, handle, followers, engagement_rate, category, email, phone, location, bio, avatar_url, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create influencer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update influencer
router.put('/:id', async (req, res) => {
  try {
    const { name, platform, handle, followers, engagement_rate, category, email, phone, location, bio, avatar_url, status } = req.body;
    const result = await pool.query(
      `UPDATE influencers SET name=$1, platform=$2, handle=$3, followers=$4, engagement_rate=$5, category=$6, email=$7, phone=$8, location=$9, bio=$10, avatar_url=$11, status=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [name, platform, handle, followers, engagement_rate, category, email, phone, location, bio, avatar_url, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Influencer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update influencer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE influencer
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM influencers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Influencer not found' });
    }
    res.json({ message: 'Influencer deleted', influencer: result.rows[0] });
  } catch (err) {
    console.error('Delete influencer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
