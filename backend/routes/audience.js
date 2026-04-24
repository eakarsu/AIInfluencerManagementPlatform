import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET all audience insights
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audience_insights ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get audience insights error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET audience insight by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audience_insights WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audience insight not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get audience insight error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create audience insight
router.post('/', async (req, res) => {
  try {
    const { influencer_id, age_range, gender_split, top_locations, interests, language, authenticity_score, growth_rate, engagement_quality } = req.body;
    const result = await pool.query(
      `INSERT INTO audience_insights (influencer_id, age_range, gender_split, top_locations, interests, language, authenticity_score, growth_rate, engagement_quality)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [influencer_id, age_range, gender_split, top_locations, interests, language, authenticity_score, growth_rate, engagement_quality]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create audience insight error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update audience insight
router.put('/:id', async (req, res) => {
  try {
    const { influencer_id, age_range, gender_split, top_locations, interests, language, authenticity_score, growth_rate, engagement_quality } = req.body;
    const result = await pool.query(
      `UPDATE audience_insights SET influencer_id=$1, age_range=$2, gender_split=$3, top_locations=$4, interests=$5, language=$6, authenticity_score=$7, growth_rate=$8, engagement_quality=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [influencer_id, age_range, gender_split, top_locations, interests, language, authenticity_score, growth_rate, engagement_quality, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audience insight not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update audience insight error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE audience insight
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM audience_insights WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audience insight not found' });
    }
    res.json({ message: 'Audience insight deleted', audience_insight: result.rows[0] });
  } catch (err) {
    console.error('Delete audience insight error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
