import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// In-memory store for brand-influencer matching rules (CRUD)
const matchingRules = [
  { id: 1, name: 'Beauty Premium', brand_category: 'Beauty', min_followers: 100000, min_engagement: 3.0, platforms: ['Instagram', 'TikTok'], priority: 'high' },
  { id: 2, name: 'Tech Micro', brand_category: 'Technology', min_followers: 10000, min_engagement: 5.0, platforms: ['YouTube', 'Twitter'], priority: 'medium' },
  { id: 3, name: 'Fitness Mega', brand_category: 'Fitness', min_followers: 1000000, min_engagement: 2.5, platforms: ['Instagram', 'YouTube'], priority: 'high' },
];
let ruleSeq = 4;

// VIZ 1: GET /campaign-performance — per-influencer campaign performance chart data
router.get('/campaign-performance', async (req, res) => {
  try {
    const inf = await pool.query(
      'SELECT id, name, platform, followers, engagement_rate, rate_per_post FROM influencers ORDER BY followers DESC LIMIT 10'
    );
    const series = inf.rows.map((r) => {
      const reach = Number(r.followers || 0);
      const eng = Number(r.engagement_rate || 0);
      const interactions = Math.round(reach * (eng / 100));
      const conversions = Math.round(interactions * 0.02);
      const spend = Number(r.rate_per_post || 0);
      const revenue = Math.round(conversions * 35);
      const roi = spend > 0 ? Number((((revenue - spend) / spend) * 100).toFixed(1)) : 0;
      return {
        influencer_id: r.id,
        influencer: r.name,
        platform: r.platform,
        reach,
        interactions,
        conversions,
        spend,
        revenue,
        roi,
      };
    });
    res.json({ chart: 'bar', x: 'influencer', metrics: ['reach', 'interactions', 'conversions', 'revenue'], series });
  } catch (err) {
    console.error('campaign-performance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// VIZ 2: GET /engagement-heatmap — influencer x platform engagement heatmap
router.get('/engagement-heatmap', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, platform, engagement_rate FROM influencers ORDER BY name LIMIT 12'
    );
    const platforms = ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'Facebook'];
    const influencers = [...new Set(result.rows.map((r) => r.name))];
    const cells = [];
    for (const r of result.rows) {
      const base = Number(r.engagement_rate || 0);
      for (const p of platforms) {
        // Synthesize a deterministic value per (influencer, platform)
        const isHome = p === r.platform;
        const variation = ((r.id * 13 + p.length * 7) % 30) / 10; // 0-3
        const value = isHome ? base : Math.max(0, Number((base * 0.45 + variation).toFixed(2)));
        cells.push({ influencer: r.name, platform: p, value });
      }
    }
    res.json({ chart: 'heatmap', x: 'platform', y: 'influencer', xLabels: platforms, yLabels: influencers, cells });
  } catch (err) {
    console.error('engagement-heatmap error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// NON-VIZ 1: GET /campaign-brief/:id/pdf — generate a campaign brief PDF
router.get('/campaign-brief/:id/pdf', async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    let campaign = null;
    let brand = null;
    if (!Number.isNaN(cid)) {
      const cq = await pool.query('SELECT * FROM campaigns WHERE id = $1', [cid]);
      if (cq.rows.length) {
        campaign = cq.rows[0];
        if (campaign.brand_id) {
          const bq = await pool.query('SELECT * FROM brands WHERE id = $1', [campaign.brand_id]);
          brand = bq.rows[0] || null;
        }
      }
    }
    if (!campaign) {
      campaign = { id: cid || 0, name: 'Sample Campaign', description: 'Placeholder brief', budget: 0, status: 'draft', start_date: null, end_date: null, platforms: '', goals: '' };
    }

    // Minimal PDF generator (no extra deps) - emits a valid PDF 1.4 document
    const esc = (s) => String(s || '').replace(/[\\()]/g, (c) => '\\' + c);
    const lines = [
      `Campaign Brief #${campaign.id}`,
      `Name: ${campaign.name || ''}`,
      `Brand: ${brand ? brand.name : 'N/A'}`,
      `Status: ${campaign.status || ''}`,
      `Budget: $${campaign.budget || 0}`,
      `Dates: ${campaign.start_date || ''} - ${campaign.end_date || ''}`,
      `Platforms: ${campaign.platforms || ''}`,
      `Goals: ${campaign.goals || campaign.goal || ''}`,
      `Audience: ${campaign.target_audience || ''}`,
      `Description: ${(campaign.description || '').slice(0, 240)}`,
    ];
    let textOps = 'BT /F1 14 Tf 60 760 Td (' + esc(lines[0]) + ') Tj ET\n';
    let y = 740;
    for (let i = 1; i < lines.length; i++) {
      textOps += `BT /F1 11 Tf 60 ${y} Td (${esc(lines[i])}) Tj ET\n`;
      y -= 18;
    }
    const stream = textOps;
    const streamLen = Buffer.byteLength(stream, 'utf8');
    const objs = [];
    objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objs.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objs.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
    objs.push(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}endstream\nendobj\n`);
    objs.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    for (const o of objs) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += o;
    }
    const xrefStart = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      pdf += String(off).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="campaign-brief-${campaign.id}.pdf"`);
    res.send(Buffer.from(pdf, 'utf8'));
  } catch (err) {
    console.error('campaign-brief pdf error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// NON-VIZ 2: brand-influencer matching rules CRUD on /matching-rules
router.get('/matching-rules', (req, res) => {
  res.json({ data: matchingRules, total: matchingRules.length });
});

router.post('/matching-rules', (req, res) => {
  const { name, brand_category, min_followers, min_engagement, platforms, priority } = req.body || {};
  if (!name || !brand_category) return res.status(400).json({ error: 'name and brand_category required' });
  const rule = {
    id: ruleSeq++,
    name,
    brand_category,
    min_followers: Number(min_followers || 0),
    min_engagement: Number(min_engagement || 0),
    platforms: Array.isArray(platforms) ? platforms : (platforms ? String(platforms).split(',').map(s => s.trim()) : []),
    priority: priority || 'medium',
  };
  matchingRules.push(rule);
  res.status(201).json(rule);
});

router.put('/matching-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = matchingRules.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const cur = matchingRules[idx];
  const { name, brand_category, min_followers, min_engagement, platforms, priority } = req.body || {};
  matchingRules[idx] = {
    ...cur,
    name: name ?? cur.name,
    brand_category: brand_category ?? cur.brand_category,
    min_followers: min_followers !== undefined ? Number(min_followers) : cur.min_followers,
    min_engagement: min_engagement !== undefined ? Number(min_engagement) : cur.min_engagement,
    platforms: platforms !== undefined ? (Array.isArray(platforms) ? platforms : String(platforms).split(',').map(s => s.trim())) : cur.platforms,
    priority: priority ?? cur.priority,
  };
  res.json(matchingRules[idx]);
});

router.delete('/matching-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = matchingRules.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const [removed] = matchingRules.splice(idx, 1);
  res.json({ message: 'Rule deleted', rule: removed });
});

export default router;
