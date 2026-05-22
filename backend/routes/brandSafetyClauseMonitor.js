import express from 'express';

const router = express.Router();

function monitor(input = {}) {
  const posts = input.posts || [
    { influencer: 'creator_a', campaign: 'skin care launch', disclosure_present: true, restricted_terms: ['medical cure'], sentiment_risk: 0.42 },
    { influencer: 'creator_b', campaign: 'fitness app', disclosure_present: false, restricted_terms: [], sentiment_risk: 0.21 },
  ];
  return {
    posts: posts.map((p) => {
      const score = (p.disclosure_present ? 0 : 35) + p.restricted_terms.length * 30 + Math.round(Number(p.sentiment_risk) * 35);
      return { ...p, clause_risk_score: Math.min(100, score), action: score >= 65 ? 'hold_payment_and_review' : score >= 35 ? 'request_revision' : 'clear' };
    }),
  };
}

router.get('/', (req, res) => res.json(monitor()));
router.post('/monitor', (req, res) => res.json(monitor(req.body || {})));

export default router;
