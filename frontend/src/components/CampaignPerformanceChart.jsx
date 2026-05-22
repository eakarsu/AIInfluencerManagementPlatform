import React, { useEffect, useState } from 'react';
import api from '../api';

export default function CampaignPerformanceChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/custom-views/campaign-performance')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message || 'Failed to load'));
  }, []);

  if (error) return <div style={{ padding: 12, color: 'crimson' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 12 }}>Loading campaign performance...</div>;

  const series = data.series || [];
  const maxRevenue = Math.max(1, ...series.map((s) => s.revenue || 0));

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Campaign Performance (Per Influencer)</h3>
      <p style={{ color: '#64748b', marginTop: 4 }}>Revenue, reach, interactions across top influencers</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 240, padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
        {series.map((s) => {
          const h = Math.max(4, Math.round(((s.revenue || 0) / maxRevenue) * 220));
          return (
            <div key={s.influencer_id} style={{ flex: 1, textAlign: 'center' }}>
              <div title={`Revenue: $${s.revenue} • ROI: ${s.roi}%`} style={{
                margin: '0 auto',
                width: '70%',
                height: h,
                background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                borderRadius: '6px 6px 0 0',
              }} />
              <div style={{ marginTop: 6, fontSize: 11, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.influencer}
              </div>
            </div>
          );
        })}
      </div>
      <table style={{ width: '100%', marginTop: 16, fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#64748b' }}>
            <th style={{ padding: 6 }}>Influencer</th><th>Platform</th><th>Reach</th><th>Interactions</th><th>Conversions</th><th>Revenue</th><th>ROI %</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.influencer_id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={{ padding: 6 }}>{s.influencer}</td>
              <td>{s.platform}</td>
              <td>{(s.reach || 0).toLocaleString()}</td>
              <td>{(s.interactions || 0).toLocaleString()}</td>
              <td>{(s.conversions || 0).toLocaleString()}</td>
              <td>${(s.revenue || 0).toLocaleString()}</td>
              <td>{s.roi}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
