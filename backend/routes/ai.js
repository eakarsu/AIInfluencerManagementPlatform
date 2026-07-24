import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();
router.use(authenticateToken);

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip),
  message: { error: 'AI rate limit exceeded. Max 20 requests/hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(aiRateLimiter);

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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) {}
  try {
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(stripped);
  } catch (_) {}
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}
  return null;
}

async function saveAIResult(userId, toolName, entityId, result, raw) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, tool_name, entity_id, result, raw_response)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, toolName, entityId || null, result ? JSON.stringify(result) : null, raw]
    );
  } catch (_) {}
}

// POST /ai/generate-content
router.post('/generate-content', async (req, res) => {
  try {
    const { platform, topic, tone, audience, influencer_style, campaign_goals } = req.body;

    const systemPrompt = `You are an expert social media content creator and influencer marketing specialist. Generate engaging, platform-optimized content for influencer posts. Format your response as JSON with fields: caption, hashtags (array), posting_tips (array), content_hooks (array), and call_to_action.`;

    const userMessage = `Create content for ${platform || 'Instagram'}.
Topic: ${topic}
Tone: ${tone || 'engaging and authentic'}
Target Audience: ${audience || 'general'}
Influencer Style: ${influencer_style || 'lifestyle'}
Campaign Goals: ${campaign_goals || 'brand awareness and engagement'}`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);
    await saveAIResult(req.user?.id, 'generate-content', null, data, raw);
    res.json({ content: raw, data, raw });
  } catch (err) {
    console.error('AI generate content error:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// POST /ai/analyze-sentiment
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { text, context } = req.body;

    const systemPrompt = `You are an expert sentiment analysis AI specializing in social media and influencer marketing. Format your response as JSON with fields: overall_sentiment (positive/negative/neutral), confidence_score (0-1), emotions (object with emotion:score pairs), key_themes (array), brand_perception (string), recommendations (array), and toxicity_score (0-1).`;

    const userMessage = `Analyze the sentiment of the following content:
${text}
${context ? `Context: ${context}` : ''}`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);

    // Persist sentiment score to analytics if extracted
    if (data?.confidence_score !== undefined) {
      try {
        await pool.query(
          `INSERT INTO analytics (metric_name, value, metadata, recorded_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT DO NOTHING`,
          ['sentiment_score', data.confidence_score, JSON.stringify({ overall: data.overall_sentiment, text_preview: text.substring(0, 100) })]
        ).catch(() => {}); // analytics table may not exist, non-fatal
      } catch (_) {}
    }

    await saveAIResult(req.user?.id, 'analyze-sentiment', null, data, raw);
    res.json({ analysis: raw, data, raw });
  } catch (err) {
    console.error('AI sentiment analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// POST /ai/match-influencers
router.post('/match-influencers', async (req, res) => {
  try {
    const { brand_description, campaign_goals, target_audience, budget, platform, industry } = req.body;

    // Inject live influencer data
    let influencerContext = '';
    try {
      const infResult = await pool.query(
        `SELECT name, followers, category, engagement_rate, platform,
                COALESCE(bio, '') as niche
         FROM influencers ORDER BY followers DESC LIMIT 20`
      );
      if (infResult.rows.length > 0) {
        influencerContext = `\n\nAvailable influencers in database:\n${JSON.stringify(infResult.rows, null, 2)}`;
      }
    } catch (_) {}

    const systemPrompt = `You are an expert influencer discovery and matching AI. Format your response as JSON with fields: recommended_criteria (object), influencer_archetypes (array of objects with type, description, follower_range, engagement_range, estimated_cost), matching_score_factors (array), collaboration_ideas (array), and estimated_campaign_performance (object).`;

    const userMessage = `Find matching influencers for:
Brand: ${brand_description}
Campaign Goals: ${campaign_goals}
Target Audience: ${target_audience}
Budget: ${budget || 'flexible'}
Platform: ${platform || 'all platforms'}
Industry: ${industry || 'general'}${influencerContext}`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);
    await saveAIResult(req.user?.id, 'match-influencers', null, data, raw);
    res.json({ matches: raw, data, raw });
  } catch (err) {
    console.error('AI match influencers error:', err);
    res.status(500).json({ error: 'Failed to match influencers' });
  }
});

// POST /ai/generate-outreach
router.post('/generate-outreach', async (req, res) => {
  try {
    const { influencer_name, influencer_platform, brand_name, campaign_description, collaboration_type, compensation, tone } = req.body;

    const systemPrompt = `You are an expert outreach email and message copywriter for influencer marketing. Format your response as JSON with fields: subject_line (string), email_body (string), follow_up_message (string), dm_version (string), key_talking_points (array), and personalization_tips (array).`;

    const userMessage = `Generate outreach message:
Influencer: ${influencer_name}
Platform: ${influencer_platform || 'Instagram'}
Brand: ${brand_name}
Campaign: ${campaign_description}
Collaboration Type: ${collaboration_type || 'sponsored post'}
Compensation: ${compensation || 'to be discussed'}
Tone: ${tone || 'professional yet friendly'}`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);
    await saveAIResult(req.user?.id, 'generate-outreach', null, data, raw);
    res.json({ outreach: raw, data, raw });
  } catch (err) {
    console.error('AI generate outreach error:', err);
    res.status(500).json({ error: 'Failed to generate outreach' });
  }
});

// POST /ai/audience-analysis
router.post('/audience-analysis', async (req, res) => {
  try {
    const { demographics, interests, platform, engagement_data, follower_count, content_type } = req.body;

    const systemPrompt = `You are an expert audience analytics AI for influencer marketing. Format your response as JSON with fields: audience_quality_score (0-100), demographic_breakdown (object), content_preferences (array), best_posting_times (array), growth_opportunities (array), audience_overlap_risk (string), monetization_potential (string), and recommendations (array).`;

    const userMessage = `Analyze this audience:
Demographics: ${JSON.stringify(demographics) || 'not provided'}
Interests: ${JSON.stringify(interests) || 'not provided'}
Platform: ${platform || 'Instagram'}
Engagement Data: ${JSON.stringify(engagement_data) || 'not provided'}
Follower Count: ${follower_count || 'not provided'}
Content Type: ${content_type || 'mixed'}`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);
    await saveAIResult(req.user?.id, 'audience-analysis', null, data, raw);
    res.json({ analysis: raw, data, raw });
  } catch (err) {
    console.error('AI audience analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze audience' });
  }
});

// POST /ai/competitor-insights
router.post('/competitor-insights', async (req, res) => {
  try {
    const { brand_name, competitors, industry, platforms, focus_areas } = req.body;

    const systemPrompt = `You are an expert competitive intelligence AI for influencer marketing. Format your response as JSON with fields: competitive_landscape (string), competitor_analysis (array of objects), market_gaps (array), opportunity_areas (array), recommended_strategies (array), threat_assessment (object), and differentiation_ideas (array).`;

    const userMessage = `Analyze competitive landscape:
Brand: ${brand_name}
Competitors: ${JSON.stringify(competitors) || 'not specified'}
Industry: ${industry}
Platforms: ${JSON.stringify(platforms) || 'all'}
Focus Areas: ${JSON.stringify(focus_areas) || 'general'}`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);
    await saveAIResult(req.user?.id, 'competitor-insights', null, data, raw);
    res.json({ insights: raw, data, raw });
  } catch (err) {
    console.error('AI competitor insights error:', err);
    res.status(500).json({ error: 'Failed to analyze competitors' });
  }
});

// POST /ai/campaign-strategy
router.post('/campaign-strategy', async (req, res) => {
  try {
    const { brand_description, objectives, budget, timeline, target_audience, platforms, industry, past_performance, campaign_id } = req.body;

    // Inject campaign data if campaign_id provided
    let campaignContext = '';
    if (campaign_id) {
      try {
        const campResult = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaign_id]);
        if (campResult.rows.length > 0) {
          campaignContext = `\n\nExisting campaign data: ${JSON.stringify(campResult.rows[0])}`;
        }
      } catch (_) {}
    }

    const systemPrompt = `You are an expert campaign strategist for influencer marketing. Format your response as JSON with fields: strategy_overview (string), phases (array of objects with phase_name, duration, activities, budget_allocation), influencer_selection_criteria (object), content_plan (array), budget_breakdown (object), kpi_targets (object), risk_mitigation (array), and success_metrics (array).`;

    const userMessage = `Create a campaign strategy:
Brand: ${brand_description}
Objectives: ${JSON.stringify(objectives) || 'brand awareness'}
Budget: ${budget || 'to be determined'}
Timeline: ${timeline || 'flexible'}
Target Audience: ${JSON.stringify(target_audience) || 'general'}
Platforms: ${JSON.stringify(platforms) || 'multi-platform'}
Industry: ${industry || 'general'}
Past Performance: ${JSON.stringify(past_performance) || 'no historical data'}${campaignContext}`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);
    await saveAIResult(req.user?.id, 'campaign-strategy', campaign_id || null, data, raw);
    res.json({ strategy: raw, data, raw });
  } catch (err) {
    console.error('AI campaign strategy error:', err);
    res.status(500).json({ error: 'Failed to generate campaign strategy' });
  }
});

// POST /ai/brand-safety-scan — nightly-style brand safety sweep for an influencer
router.post('/brand-safety-scan', async (req, res) => {
  try {
    const { influencer_id } = req.body;
    if (!influencer_id) return res.status(400).json({ error: 'influencer_id is required' });

    const infResult = await pool.query('SELECT * FROM influencers WHERE id = $1', [influencer_id]);
    if (infResult.rows.length === 0) return res.status(404).json({ error: 'Influencer not found' });
    const inf = infResult.rows[0];

    // Fetch recent content for this influencer
    let recentContent = '';
    try {
      const contentResult = await pool.query(
        'SELECT caption, platform, created_at FROM content_calendar WHERE influencer_id = $1 ORDER BY created_at DESC LIMIT 10',
        [influencer_id]
      );
      if (contentResult.rows.length > 0) {
        recentContent = '\n\nRecent content captions:\n' + contentResult.rows.map(c => `[${c.platform}] ${c.caption}`).join('\n');
      }
    } catch (_) {}

    const systemPrompt = `You are an expert brand safety analyst for influencer marketing. Analyze this influencer for brand safety risks. Format your response as JSON with fields: safety_score (0-100, higher is safer), risk_level ("low"|"medium"|"high"|"critical"), toxicity_flags (array of strings), controversy_risks (array of strings), competitor_mentions (array of strings), recommended_actions (array of strings), safe_for_campaigns (boolean), detailed_assessment (string).`;

    const userMessage = `Perform a brand safety analysis for this influencer:
Name: ${inf.name}
Platform: ${inf.platform || 'multiple'}
Category: ${inf.category || 'general'}
Followers: ${inf.followers || 'unknown'}
Engagement Rate: ${inf.engagement_rate || 'unknown'}%
Bio/Description: ${inf.bio || 'Not provided'}${recentContent}

Identify any toxicity, controversy, competitor mentions, or brand safety risks based on the provided information.`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);

    // Persist result
    await saveAIResult(req.user?.id, 'brand-safety-scan', influencer_id, data, raw);

    // Ensure brand_safety_scans table exists and store result
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brand_safety_scans (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER,
        safety_score INTEGER,
        risk_level TEXT,
        result JSONB,
        scanned_at TIMESTAMP DEFAULT NOW()
      )
    `).catch(() => {});

    if (data?.safety_score !== undefined) {
      await pool.query(
        `INSERT INTO brand_safety_scans (influencer_id, safety_score, risk_level, result, scanned_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [influencer_id, data.safety_score, data.risk_level || 'unknown', JSON.stringify(data)]
      ).catch(() => {});
    }

    res.json({ influencer: inf, data, raw });
  } catch (err) {
    console.error('AI brand safety scan error:', err);
    res.status(500).json({ error: 'Failed to run brand safety scan' });
  }
});

// POST /ai/roi-analysis — AI-powered ROI analysis for a campaign
router.post('/roi-analysis', async (req, res) => {
  try {
    const { campaign_id } = req.body;
    if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });

    const campResult = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaign_id]);
    if (campResult.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    const campaign = campResult.rows[0];

    // Fetch payments for this campaign
    let paymentData = '';
    try {
      const payResult = await pool.query(
        'SELECT SUM(amount) as total_spent, COUNT(*) as payment_count FROM payments WHERE campaign_id = $1',
        [campaign_id]
      );
      paymentData = `\nTotal spent: $${payResult.rows[0].total_spent || 0}, Payments: ${payResult.rows[0].payment_count}`;
    } catch (_) {}

    const systemPrompt = `You are an expert influencer marketing ROI analyst. Format your response as JSON with fields: roi_percentage (number), estimated_revenue (number), cost_per_engagement (number), cost_per_reach (number), performance_grade ("A"|"B"|"C"|"D"|"F"), key_wins (array), improvement_areas (array), budget_recommendation (string), projected_next_campaign_roi (number).`;

    const userMessage = `Analyze ROI for this influencer campaign:
Campaign: ${campaign.name}
Budget: $${campaign.budget || 0}
Status: ${campaign.status || 'active'}
Platform: ${campaign.platform || 'multiple'}
Start: ${campaign.start_date || 'unknown'}, End: ${campaign.end_date || 'ongoing'}
Goals: ${campaign.goals || 'brand awareness'}${paymentData}`;

    const raw = await callOpenRouter(systemPrompt, userMessage);
    const data = parseJSON(raw);
    await saveAIResult(req.user?.id, 'roi-analysis', campaign_id, data, raw);

    // Persist to roi_calculations table
    if (data?.roi_percentage !== undefined) {
      await pool.query(
        `INSERT INTO roi_calculations (campaign_id, roi_percentage, notes, created_at)
         VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING`,
        [campaign_id, data.roi_percentage, JSON.stringify(data)]
      ).catch(() => {});
    }

    res.json({ campaign, data, raw });
  } catch (err) {
    console.error('AI ROI analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze ROI' });
  }
});

// GET /ai/results — fetch stored AI results history
router.get('/results', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const tool = req.query.tool;
    const params = tool ? [tool, limit] : [limit];
    const query = tool
      ? `SELECT id, user_id, tool_name, entity_id, raw_response, created_at FROM ai_results WHERE tool_name = $1 ORDER BY created_at DESC LIMIT $2`
      : `SELECT id, user_id, tool_name, entity_id, raw_response, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1`;
    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ai/audience-segmentation
router.post('/audience-segmentation', async (req, res) => {
  try {
    const { influencer_id, audience_data } = req.body;
    let baseAudience = audience_data || null;
    if (!baseAudience && influencer_id) {
      const r = await pool.query('SELECT * FROM audience WHERE influencer_id = $1', [influencer_id]).catch(() => ({ rows: [] }));
      if (r.rows.length > 0) baseAudience = r.rows;
    }
    if (!baseAudience) {
      return res.status(400).json({ error: 'audience_data or influencer_id with audience records required' });
    }

    const system = 'You are an audience analytics expert. Segment the influencer audience by demographics, interests, geo, and behavior; recommend targeted campaign angles and risk segments.';
    const user = `Segment this audience and recommend strategy.

Audience input:
${JSON.stringify(baseAudience, null, 2)}

Return JSON only:
{
  "segments": [
    {
      "name": string,
      "size_pct": number,
      "demographics": object,
      "interests": string[],
      "engagement_band": "low|medium|high",
      "campaign_angle": string,
      "products_to_promote": string[]
    }
  ],
  "high_value_segment": string,
  "risk_segments": string[],
  "summary": string
}`;
    const raw = await callOpenRouter(system, user);
    const structured = parseJSON(raw);
    saveAIResult(req.user?.id, 'audience-segmentation', influencer_id || null, structured, raw);
    res.json({ structured, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ai/performance-prediction
router.post('/performance-prediction', async (req, res) => {
  try {
    const { campaign_id, influencer_ids, content_brief, target_kpis } = req.body;

    let campaign = null;
    if (campaign_id) {
      const r = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaign_id]).catch(() => ({ rows: [] }));
      if (r.rows.length > 0) campaign = r.rows[0];
    }
    let influencers = [];
    if (Array.isArray(influencer_ids) && influencer_ids.length > 0) {
      const r = await pool.query('SELECT * FROM influencers WHERE id = ANY($1)', [influencer_ids]).catch(() => ({ rows: [] }));
      influencers = r.rows;
    }

    const system = 'You are a campaign performance forecaster. Predict reach, engagement, conversions, and ROI for an influencer marketing campaign before launch. Calibrate confidence honestly.';
    const user = `Predict campaign performance.

Campaign: ${campaign ? JSON.stringify(campaign) : 'no campaign loaded; use brief and influencers below'}
Influencers: ${JSON.stringify(influencers)}
Content brief: ${content_brief || 'not provided'}
Target KPIs: ${target_kpis || 'reach, engagement_rate, conversions, ROAS'}

Return JSON only:
{
  "predictions": {
    "reach": { "p50": number, "p10": number, "p90": number },
    "engagement_rate_pct": { "p50": number, "p10": number, "p90": number },
    "conversions": { "p50": number, "p10": number, "p90": number },
    "roas": { "p50": number, "p10": number, "p90": number }
  },
  "key_drivers": string[],
  "risk_factors": string[],
  "recommended_adjustments": string[],
  "go_no_go": "go|adjust|hold",
  "confidence_0_100": number,
  "rationale": string
}`;
    const raw = await callOpenRouter(system, user);
    const structured = parseJSON(raw);
    saveAIResult(req.user?.id, 'performance-prediction', campaign_id || null, structured, raw);
    res.json({ structured, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ai/fraud-detection
router.post('/fraud-detection', async (req, res) => {
  try {
    const { influencer_id, profile, recent_metrics } = req.body;

    let inf = profile || null;
    if (!inf && influencer_id) {
      const r = await pool.query('SELECT * FROM influencers WHERE id = $1', [influencer_id]).catch(() => ({ rows: [] }));
      if (r.rows.length > 0) inf = r.rows[0];
    }
    if (!inf) {
      return res.status(400).json({ error: 'influencer_id or profile required' });
    }

    const system = 'You are a fraud detection AI for influencer marketing. Flag fake followers, bot engagement, pod activity, and engagement-purchasing patterns. Be specific about evidence.';
    const user = `Assess fraud risk for this influencer.

Profile: ${JSON.stringify(inf)}
Recent metrics: ${JSON.stringify(recent_metrics || {})}

Return JSON only:
{
  "fraud_score_0_100": number,
  "risk_tier": "low|medium|high|critical",
  "indicators": [
    { "indicator": string, "severity": "low|medium|high", "evidence": string }
  ],
  "follower_quality_estimate_pct_real": number,
  "engagement_authenticity_estimate_pct_real": number,
  "recommended_actions": string[],
  "recommendation": "trust|verify_more|reject",
  "confidence_0_100": number,
  "rationale": string
}`;
    const raw = await callOpenRouter(system, user);
    const structured = parseJSON(raw);
    saveAIResult(req.user?.id, 'fraud-detection', influencer_id || null, structured, raw);
    res.json({ structured, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 503-on-no-key guard for new endpoints
function ensureAIConfigured(_req, res, next) {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI is not configured. Set OPENROUTER_API_KEY to enable this feature.' });
  }
  next();
}

// POST /ai/ltv-prediction
router.post('/ltv-prediction', ensureAIConfigured, async (req, res) => {
  try {
    const { influencer_id, brand_id, time_horizon_months } = req.body;
    let influencer = null;
    if (influencer_id) {
      const r = await pool.query('SELECT * FROM influencers WHERE id = $1', [influencer_id]).catch(() => ({ rows: [] }));
      if (r.rows.length > 0) influencer = r.rows[0];
    }
    let brand = null;
    if (brand_id) {
      const r = await pool.query('SELECT * FROM brands WHERE id = $1', [brand_id]).catch(() => ({ rows: [] }));
      if (r.rows.length > 0) brand = r.rows[0];
    }
    let pastCampaigns = [];
    if (influencer_id) {
      const r = await pool.query(
        'SELECT * FROM campaigns WHERE id IN (SELECT campaign_id FROM campaign_influencers WHERE influencer_id = $1) LIMIT 50',
        [influencer_id]
      ).catch(() => ({ rows: [] }));
      pastCampaigns = r.rows;
    }

    const horizon = Number(time_horizon_months) || 12;
    const system = 'You are a customer lifetime value (LTV) prediction AI for influencer-brand relationships. Forecast revenue, retention probability, and value drivers.';
    const user = `Predict LTV for the next ${horizon} months.

Influencer: ${JSON.stringify(influencer)}
Brand: ${JSON.stringify(brand)}
Past campaigns: ${JSON.stringify(pastCampaigns)}

Return JSON only:
{
  "ltv_usd": { "p50": number, "p10": number, "p90": number },
  "monthly_revenue_curve": [{ "month": number, "expected_usd": number }],
  "retention_probability_pct": number,
  "value_drivers": string[],
  "churn_risks": string[],
  "recommended_actions": string[],
  "confidence_0_100": number,
  "summary": string
}`;
    const raw = await callOpenRouter(system, user);
    const structured = parseJSON(raw);
    saveAIResult(req.user?.id, 'ltv-prediction', influencer_id || null, structured, raw);
    res.json({ structured, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ai/audience-overlap
router.post('/audience-overlap', ensureAIConfigured, async (req, res) => {
  try {
    const { influencer_ids, audiences } = req.body;
    let inputs = audiences || null;
    if (!inputs && Array.isArray(influencer_ids) && influencer_ids.length > 1) {
      const r = await pool.query('SELECT influencer_id, * FROM audience WHERE influencer_id = ANY($1)', [influencer_ids]).catch(() => ({ rows: [] }));
      inputs = r.rows;
    }
    if (!inputs || (Array.isArray(inputs) && inputs.length === 0)) {
      return res.status(400).json({ error: 'audiences (array) or influencer_ids (>=2) with audience records required' });
    }

    const system = 'You are an audience overlap detection AI. Estimate shared followers and unique reach across multiple influencers; flag cannibalization and recommend pairings.';
    const user = `Estimate overlap and unique reach.

Inputs:
${JSON.stringify(inputs, null, 2)}

Return JSON only:
{
  "pairwise_overlap_pct": [
    { "influencer_a": number, "influencer_b": number, "overlap_pct": number, "shared_segments": string[] }
  ],
  "estimated_unique_reach": number,
  "estimated_total_reach": number,
  "duplication_ratio": number,
  "recommended_pairings": [
    { "influencer_ids": number[], "reason": string, "incremental_reach_pct": number }
  ],
  "cannibalization_warnings": string[],
  "summary": string
}`;
    const raw = await callOpenRouter(system, user);
    const structured = parseJSON(raw);
    saveAIResult(req.user?.id, 'audience-overlap', null, structured, raw);
    res.json({ structured, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ai/trend-calendar
router.post('/trend-calendar', ensureAIConfigured, async (req, res) => {
  try {
    const { niche, region, horizon_weeks, brand_voice } = req.body;
    if (!niche) {
      return res.status(400).json({ error: 'niche is required' });
    }
    const weeks = Number(horizon_weeks) || 8;

    const system = 'You are a trend forecaster and content calendar AI. Predict emerging trends, viral formats, and seasonal moments; output a postable calendar.';
    const user = `Build a ${weeks}-week trend & content calendar.

Niche: ${niche}
Region: ${region || 'global'}
Brand voice: ${brand_voice || 'balanced, conversational'}

Return JSON only:
{
  "weeks": [
    {
      "week_index": number,
      "trends": [
        { "trend": string, "format": string, "rationale": string, "confidence_0_100": number }
      ],
      "content_suggestions": [
        { "platform": string, "format": string, "hook": string, "cta": string, "post_day": string }
      ],
      "seasonal_moments": string[]
    }
  ],
  "macro_trends": string[],
  "risks": string[],
  "summary": string
}`;
    const raw = await callOpenRouter(system, user);
    const structured = parseJSON(raw);
    saveAIResult(req.user?.id, 'trend-calendar', null, structured, raw);
    res.json({ structured, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ai/micro-influencer-discovery
router.post('/micro-influencer-discovery', ensureAIConfigured, async (req, res) => {
  try {
    const { brand_id, niche, target_audience, min_followers, max_followers, min_engagement_rate, top_k } = req.body;
    let brand = null;
    if (brand_id) {
      const r = await pool.query('SELECT * FROM brands WHERE id = $1', [brand_id]).catch(() => ({ rows: [] }));
      if (r.rows.length > 0) brand = r.rows[0];
    }
    const minF = Number(min_followers) || 1000;
    const maxF = Number(max_followers) || 100000;
    const minER = Number(min_engagement_rate) || 0;
    const k = Number(top_k) || 10;

    const candidates = await pool.query(
      'SELECT * FROM influencers WHERE COALESCE(followers_count, 0) BETWEEN $1 AND $2 AND COALESCE(engagement_rate, 0) >= $3 ORDER BY engagement_rate DESC NULLS LAST LIMIT 200',
      [minF, maxF, minER]
    ).catch(() => ({ rows: [] }));

    const system = 'You are a micro-influencer discovery AI. Rank candidate micro-influencers by fit with brand, niche, audience, authenticity, and projected ROI.';
    const user = `Find the top ${k} micro-influencers.

Brand: ${JSON.stringify(brand)}
Niche: ${niche || 'not specified'}
Target audience: ${target_audience || 'not specified'}
Follower range: ${minF}-${maxF}
Min engagement rate: ${minER}

Candidate influencers:
${JSON.stringify(candidates.rows)}

Return JSON only:
{
  "matches": [
    {
      "influencer_id": number,
      "fit_score_0_100": number,
      "rationale": string,
      "audience_alignment": string,
      "authenticity_estimate_pct": number,
      "projected_engagement_pct": number,
      "suggested_brief": string
    }
  ],
  "diversity_notes": string,
  "rejected_reasons": [{ "influencer_id": number, "reason": string }],
  "summary": string
}`;
    const raw = await callOpenRouter(system, user);
    const structured = parseJSON(raw);
    saveAIResult(req.user?.id, 'micro-influencer-discovery', brand_id || null, structured, raw);
    res.json({ structured, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
