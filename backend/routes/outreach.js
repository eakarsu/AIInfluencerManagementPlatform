import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

async function callOpenRouter(systemPrompt, userMessage) {
  const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// GET all outreach messages with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM outreach_messages');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM outreach_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    if (!req.query.page && !req.query.limit) {
      return res.json(result.rows);
    }
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Get outreach messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET follow-ups due
router.get('/follow-ups-due', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT om.*, i.name as influencer_name
      FROM outreach_messages om
      LEFT JOIN influencers i ON om.influencer_id = i.id
      WHERE om.status = 'sent'
        AND om.created_at < NOW() - interval '3 days'
        AND (om.response_status = 'pending' OR om.response_status IS NULL)
      ORDER BY om.created_at ASC
      LIMIT 50
    `);

    const followUps = [];
    for (const msg of result.rows) {
      let suggestedFollowup = 'Unable to generate follow-up at this time.';
      try {
        suggestedFollowup = await callOpenRouter(
          'You are an expert influencer outreach specialist. Generate a brief, personalized follow-up message.',
          `Generate a follow-up message for this outreach that received no response after 3+ days.
Original message subject: ${msg.subject || 'Collaboration Opportunity'}
Original message: ${(msg.message || '').substring(0, 500)}
Influencer name: ${msg.influencer_name || 'the influencer'}

Write a short, friendly follow-up (2-3 sentences max) that doesn't feel pushy.`
        );
      } catch (_) {}

      followUps.push({
        outreach_id: msg.id,
        influencer_name: msg.influencer_name || 'Unknown',
        original_message: msg.message,
        suggested_followup: suggestedFollowup,
      });
    }

    res.json({ data: followUps, count: followUps.length });
  } catch (err) {
    console.error('Follow-ups due error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET outreach message by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outreach_messages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outreach message not found' });
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
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outreach message not found' });
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
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outreach message not found' });
    res.json({ message: 'Outreach message deleted', outreach: result.rows[0] });
  } catch (err) {
    console.error('Delete outreach message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
