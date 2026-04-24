import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

async function callOpenRouter(systemPrompt, userMessage) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
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

// POST /ai/generate-content
router.post('/generate-content', async (req, res) => {
  try {
    const { platform, topic, tone, audience, influencer_style, campaign_goals } = req.body;

    const systemPrompt = `You are an expert social media content creator and influencer marketing specialist. Generate engaging, platform-optimized content for influencer posts. Your content should be authentic, on-brand, and designed to maximize engagement. Always provide captions, hashtag suggestions, and posting tips. Format your response as JSON with fields: caption, hashtags (array), posting_tips (array), content_hooks (array), and call_to_action.`;

    const userMessage = `Create content for ${platform || 'Instagram'}.
Topic: ${topic}
Tone: ${tone || 'engaging and authentic'}
Target Audience: ${audience || 'general'}
Influencer Style: ${influencer_style || 'lifestyle'}
Campaign Goals: ${campaign_goals || 'brand awareness and engagement'}`;

    const result = await callOpenRouter(systemPrompt, userMessage);
    res.json({ content: result });
  } catch (err) {
    console.error('AI generate content error:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// POST /ai/analyze-sentiment
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { text, context } = req.body;

    const systemPrompt = `You are an expert sentiment analysis AI specializing in social media and influencer marketing. Analyze the sentiment of comments, posts, and content. Provide detailed sentiment breakdowns including overall sentiment, emotion detection, brand perception, and actionable insights. Format your response as JSON with fields: overall_sentiment (positive/negative/neutral), confidence_score (0-1), emotions (object with emotion:score pairs), key_themes (array), brand_perception (string), recommendations (array), and toxicity_score (0-1).`;

    const userMessage = `Analyze the sentiment of the following content:
${text}
${context ? `Context: ${context}` : ''}`;

    const result = await callOpenRouter(systemPrompt, userMessage);
    res.json({ analysis: result });
  } catch (err) {
    console.error('AI sentiment analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// POST /ai/match-influencers
router.post('/match-influencers', async (req, res) => {
  try {
    const { brand_description, campaign_goals, target_audience, budget, platform, industry } = req.body;

    const systemPrompt = `You are an expert influencer discovery and matching AI. Based on brand requirements and campaign goals, recommend ideal influencer profiles and matching criteria. Provide detailed matching rationale, estimated performance metrics, and collaboration suggestions. Format your response as JSON with fields: recommended_criteria (object), influencer_archetypes (array of objects with type, description, follower_range, engagement_range, estimated_cost), matching_score_factors (array), collaboration_ideas (array), and estimated_campaign_performance (object).`;

    const userMessage = `Find matching influencers for:
Brand: ${brand_description}
Campaign Goals: ${campaign_goals}
Target Audience: ${target_audience}
Budget: ${budget || 'flexible'}
Platform: ${platform || 'all platforms'}
Industry: ${industry || 'general'}`;

    const result = await callOpenRouter(systemPrompt, userMessage);
    res.json({ matches: result });
  } catch (err) {
    console.error('AI match influencers error:', err);
    res.status(500).json({ error: 'Failed to match influencers' });
  }
});

// POST /ai/generate-outreach
router.post('/generate-outreach', async (req, res) => {
  try {
    const { influencer_name, influencer_platform, brand_name, campaign_description, collaboration_type, compensation, tone } = req.body;

    const systemPrompt = `You are an expert outreach email and message copywriter for influencer marketing. Craft compelling, personalized outreach messages that get high response rates. Messages should feel authentic, not spammy, and clearly communicate value to the influencer. Format your response as JSON with fields: subject_line (string), email_body (string), follow_up_message (string), dm_version (string), key_talking_points (array), and personalization_tips (array).`;

    const userMessage = `Generate outreach message:
Influencer: ${influencer_name}
Platform: ${influencer_platform || 'Instagram'}
Brand: ${brand_name}
Campaign: ${campaign_description}
Collaboration Type: ${collaboration_type || 'sponsored post'}
Compensation: ${compensation || 'to be discussed'}
Tone: ${tone || 'professional yet friendly'}`;

    const result = await callOpenRouter(systemPrompt, userMessage);
    res.json({ outreach: result });
  } catch (err) {
    console.error('AI generate outreach error:', err);
    res.status(500).json({ error: 'Failed to generate outreach' });
  }
});

// POST /ai/audience-analysis
router.post('/audience-analysis', async (req, res) => {
  try {
    const { demographics, interests, platform, engagement_data, follower_count, content_type } = req.body;

    const systemPrompt = `You are an expert audience analytics AI for influencer marketing. Analyze audience data and provide actionable insights about audience quality, demographics, content preferences, and growth opportunities. Format your response as JSON with fields: audience_quality_score (0-100), demographic_breakdown (object), content_preferences (array), best_posting_times (array), growth_opportunities (array), audience_overlap_risk (string), monetization_potential (string), and recommendations (array).`;

    const userMessage = `Analyze this audience:
Demographics: ${JSON.stringify(demographics) || 'not provided'}
Interests: ${JSON.stringify(interests) || 'not provided'}
Platform: ${platform || 'Instagram'}
Engagement Data: ${JSON.stringify(engagement_data) || 'not provided'}
Follower Count: ${follower_count || 'not provided'}
Content Type: ${content_type || 'mixed'}`;

    const result = await callOpenRouter(systemPrompt, userMessage);
    res.json({ analysis: result });
  } catch (err) {
    console.error('AI audience analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze audience' });
  }
});

// POST /ai/competitor-insights
router.post('/competitor-insights', async (req, res) => {
  try {
    const { brand_name, competitors, industry, platforms, focus_areas } = req.body;

    const systemPrompt = `You are an expert competitive intelligence AI for influencer marketing. Analyze competitor strategies, identify gaps and opportunities, and provide actionable competitive insights. Format your response as JSON with fields: competitive_landscape (string), competitor_analysis (array of objects), market_gaps (array), opportunity_areas (array), recommended_strategies (array), threat_assessment (object), and differentiation_ideas (array).`;

    const userMessage = `Analyze competitive landscape:
Brand: ${brand_name}
Competitors: ${JSON.stringify(competitors) || 'not specified'}
Industry: ${industry}
Platforms: ${JSON.stringify(platforms) || 'all'}
Focus Areas: ${JSON.stringify(focus_areas) || 'general'}`;

    const result = await callOpenRouter(systemPrompt, userMessage);
    res.json({ insights: result });
  } catch (err) {
    console.error('AI competitor insights error:', err);
    res.status(500).json({ error: 'Failed to analyze competitors' });
  }
});

// POST /ai/campaign-strategy
router.post('/campaign-strategy', async (req, res) => {
  try {
    const { brand_description, objectives, budget, timeline, target_audience, platforms, industry, past_performance } = req.body;

    const systemPrompt = `You are an expert campaign strategist for influencer marketing. Create comprehensive campaign strategies with detailed timelines, influencer selection criteria, content plans, budget allocation, and KPI targets. Format your response as JSON with fields: strategy_overview (string), phases (array of objects with phase_name, duration, activities, budget_allocation), influencer_selection_criteria (object), content_plan (array), budget_breakdown (object), kpi_targets (object), risk_mitigation (array), and success_metrics (array).`;

    const userMessage = `Create a campaign strategy:
Brand: ${brand_description}
Objectives: ${JSON.stringify(objectives) || 'brand awareness'}
Budget: ${budget || 'to be determined'}
Timeline: ${timeline || 'flexible'}
Target Audience: ${JSON.stringify(target_audience) || 'general'}
Platforms: ${JSON.stringify(platforms) || 'multi-platform'}
Industry: ${industry || 'general'}
Past Performance: ${JSON.stringify(past_performance) || 'no historical data'}`;

    const result = await callOpenRouter(systemPrompt, userMessage);
    res.json({ strategy: result });
  } catch (err) {
    console.error('AI campaign strategy error:', err);
    res.status(500).json({ error: 'Failed to generate campaign strategy' });
  }
});

export default router;
