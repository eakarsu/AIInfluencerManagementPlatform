import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET /dashboard/stats - aggregate dashboard data
router.get('/stats', async (req, res) => {
  try {
    const [influencersResult, campaignsResult, spendResult, roiResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM influencers'),
      pool.query("SELECT COUNT(*) as total FROM campaigns WHERE status = 'active'"),
      pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments'),
      pool.query('SELECT COALESCE(AVG(roi_percentage), 0) as average FROM roi_calculations'),
    ]);

    res.json({
      total_influencers: parseInt(influencersResult.rows[0].total),
      active_campaigns: parseInt(campaignsResult.rows[0].total),
      total_spend: parseFloat(spendResult.rows[0].total),
      avg_roi: parseFloat(roiResult.rows[0].average),
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
