# Audit Apply Notes — AIInfluencerManagementPlatform

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 31.

## Original Recommendations (AI Counterparts)
- `/audience-segmentation`
- `/performance-prediction`
- `/fraud-detection`

## Implemented (this pass)
Three endpoints appended to `backend/routes/ai.js` (ESM, follows existing `callOpenRouter`, `parseJSON`, `saveAIResult` helpers and shared aiRateLimiter):

- `POST /api/ai/audience-segmentation` — accepts inline `audience_data` or pulls audience records by `influencer_id`; returns segment list with sizing, interests, engagement bands, and recommended campaign angles.
- `POST /api/ai/performance-prediction` — pulls campaign and selected influencers; returns probabilistic (p10/p50/p90) predictions for reach, engagement, conversions, ROAS, plus go/no-go.
- `POST /api/ai/fraud-detection` — accepts inline `profile` or pulls by `influencer_id`; returns fraud score, indicators, follower/engagement authenticity estimates, recommended action.

All three persist to `ai_results` via existing `saveAIResult` helper and follow the global `authenticateToken` + `aiRateLimiter`.

Syntax: `node --check` passes.

## Backlog (Custom Feature Suggestions)
- Agentic campaign manager (autonomous discovery → brief → negotiate → monitor).
- Influencer lifetime value prediction.
- Audience overlap detection (could compose with new `/audience-segmentation`).
- Trend & content calendar AI.
- Micro-influencer discovery (could compose with `/performance-prediction`).
- Non-AI: marketplace discovery, contract templates, payment processing, social media API integrations (NEEDS-CREDS), brand-influencer messaging.

## Categorization
- MECHANICAL: 3 endpoints (done).
- NEEDS-CREDS: Instagram / TikTok / YouTube APIs, payment processor.
- NEEDS-PRODUCT-DECISION: agentic manager autonomy bounds.

## Apply pass 3 (frontend)

LEFT-AS-IS. `frontend/src/pages/AITools.jsx` covers the 9 original endpoints (`/ai/generate-content`, `/analyze-sentiment`, `/match-influencers`, `/generate-outreach`, `/audience-analysis`, `/competitor-insights`, `/campaign-strategy`, `/brand-safety-scan`, `/roi-analysis`). `frontend/src/pages/AdvancedAITools.jsx` covers the 3 newer endpoints (`/audience-segmentation`, `/performance-prediction`, `/fraud-detection`). Both routes registered in `App.jsx` (`/ai-tools`, `/advanced-ai`); shared `frontend/src/api.js` axios instance carries JWT Bearer from localStorage. No changes needed.
