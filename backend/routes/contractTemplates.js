/*
 * routes/contractTemplates.js — Apply pass 5
 *
 * Mechanical contract template management. Three built-in templates (sponsored
 * post, brand ambassador, UGC license) with mustache-style placeholder fill.
 * Persists drafts to a new `contract_drafts` table (additive, IF NOT EXISTS).
 */
import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Bootstrap additive schema (idempotent)
pool.query(`
  CREATE TABLE IF NOT EXISTS contract_drafts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    template_key TEXT,
    influencer_id INTEGER,
    brand_id INTEGER,
    campaign_id INTEGER,
    rendered_text TEXT,
    variables JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch((e) => console.error('contract_drafts bootstrap error:', e.message));

// ---------------------------------------------------------------------------
// Built-in templates (additive; safe defaults; no legal advice)
// ---------------------------------------------------------------------------
const TEMPLATES = {
  'sponsored-post': {
    title: 'Sponsored Post Agreement',
    body:
`# Sponsored Post Agreement

This Agreement is entered into on {{date}} between {{brand_name}} ("Brand") and {{influencer_name}} ("Influencer").

## 1. Scope of Work
Influencer agrees to publish {{post_count}} sponsored post(s) on {{platforms}} between {{start_date}} and {{end_date}}.

## 2. Compensation
Brand agrees to pay USD {{amount_usd}} within {{net_days}} days of post publication.

## 3. Disclosure
Influencer will include #ad, #sponsored, or platform-native paid-partnership disclosure on every post.

## 4. Exclusivity
{{exclusivity_clause}}

## 5. Usage Rights
Brand receives a {{usage_term_months}}-month license to repost on the Brand's owned channels.

NOTE: This is a starter template. Have qualified counsel review before execution.`,
    variables: ['date', 'brand_name', 'influencer_name', 'post_count', 'platforms', 'start_date', 'end_date', 'amount_usd', 'net_days', 'exclusivity_clause', 'usage_term_months'],
  },
  'brand-ambassador': {
    title: 'Brand Ambassador Agreement',
    body:
`# Brand Ambassador Agreement

Effective {{start_date}}, {{influencer_name}} becomes a brand ambassador for {{brand_name}} for an initial term of {{term_months}} months.

## 1. Deliverables (per month)
- {{posts_per_month}} feed posts
- {{stories_per_month}} story posts
- {{events_per_quarter}} appearances per quarter

## 2. Compensation
- Monthly retainer: USD {{retainer_usd}}
- Per-conversion bonus: USD {{bonus_usd}} via discount code {{discount_code}}

## 3. Exclusivity
Influencer will not partner with direct competitors ({{competitor_list}}) during the term.

## 4. Termination
Either party may terminate with {{notice_days}} days written notice.

NOTE: This is a starter template. Have qualified counsel review before execution.`,
    variables: ['start_date', 'influencer_name', 'brand_name', 'term_months', 'posts_per_month', 'stories_per_month', 'events_per_quarter', 'retainer_usd', 'bonus_usd', 'discount_code', 'competitor_list', 'notice_days'],
  },
  'ugc-license': {
    title: 'UGC Content License',
    body:
`# User-Generated Content License

{{influencer_name}} grants {{brand_name}} a license to use the content listed in Schedule A on the following terms.

## 1. Grant
Non-exclusive, worldwide, {{usage_term_months}}-month license to display, reproduce, and adapt the licensed content for marketing and advertising.

## 2. Channels
Permitted channels: {{channels}}.

## 3. Compensation
USD {{license_fee_usd}} flat fee, paid within {{net_days}} days of execution.

## 4. Moral Rights
Influencer retains attribution credit; Brand will not modify in a manner that materially distorts intent.

## 5. Schedule A
{{content_list}}

NOTE: This is a starter template. Have qualified counsel review before execution.`,
    variables: ['influencer_name', 'brand_name', 'usage_term_months', 'channels', 'license_fee_usd', 'net_days', 'content_list'],
  },
};

function fillTemplate(body, variables) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => {
    if (variables && Object.prototype.hasOwnProperty.call(variables, key)) {
      return String(variables[key]);
    }
    return `[${key}]`;
  });
}

// GET /api/contract-templates — list available templates
router.get('/', (_req, res) => {
  res.json({
    templates: Object.entries(TEMPLATES).map(([key, t]) => ({
      key,
      title: t.title,
      variables: t.variables,
    })),
  });
});

// GET /api/contract-templates/:key — preview a specific template body
router.get('/:key', (req, res) => {
  const t = TEMPLATES[req.params.key];
  if (!t) return res.status(404).json({ error: 'Template not found' });
  res.json({ key: req.params.key, title: t.title, body: t.body, variables: t.variables });
});

// POST /api/contract-templates/:key/render — fill placeholders, optionally persist
router.post('/:key/render', async (req, res) => {
  try {
    const t = TEMPLATES[req.params.key];
    if (!t) return res.status(404).json({ error: 'Template not found' });
    const variables = (req.body && req.body.variables) || {};
    const rendered = fillTemplate(t.body, variables);

    let savedId = null;
    if (req.body && req.body.persist) {
      const r = await pool.query(
        `INSERT INTO contract_drafts (user_id, template_key, influencer_id, brand_id, campaign_id, rendered_text, variables)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          req.user?.id || null,
          req.params.key,
          req.body.influencer_id || null,
          req.body.brand_id || null,
          req.body.campaign_id || null,
          rendered,
          JSON.stringify(variables),
        ]
      ).catch(() => null);
      savedId = r && r.rows && r.rows[0] ? r.rows[0].id : null;
    }

    res.json({
      key: req.params.key,
      title: t.title,
      rendered,
      missing_variables: t.variables.filter((v) => !(v in variables)),
      draft_id: savedId,
      disclaimer: 'This is a starter contract template. Have qualified legal counsel review before execution.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contract-templates/drafts/list — list saved drafts for current user
router.get('/drafts/list', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, template_key, influencer_id, brand_id, campaign_id, created_at
       FROM contract_drafts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user?.id || null]
    );
    res.json({ drafts: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
