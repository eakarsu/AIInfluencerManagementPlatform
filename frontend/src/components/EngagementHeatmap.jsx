import React, { useEffect, useState } from 'react';
import api from '../api';

function colorFor(v, max) {
  const pct = Math.max(0, Math.min(1, v / Math.max(1, max)));
  // gradient: light yellow -> red
  const r = Math.round(255);
  const g = Math.round(237 - 180 * pct);
  const b = Math.round(160 - 130 * pct);
  return `rgb(${r}, ${Math.max(0, g)}, ${Math.max(0, b)})`;
}

export default function EngagementHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/custom-views/engagement-heatmap')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message || 'Failed to load'));
  }, []);

  if (error) return <div style={{ padding: 12, color: 'crimson' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 12 }}>Loading engagement heatmap...</div>;

  const { xLabels = [], yLabels = [], cells = [] } = data;
  const max = Math.max(0.01, ...cells.map((c) => c.value));
  const grid = {};
  for (const c of cells) {
    grid[c.influencer + '|' + c.platform] = c.value;
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Engagement Heatmap (Influencer × Platform)</h3>
      <p style={{ color: '#64748b', marginTop: 4 }}>Engagement rate intensity across platforms</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: 6 }}></th>
              {xLabels.map((p) => (
                <th key={p} style={{ padding: '6px 10px', color: '#475569', textAlign: 'center' }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yLabels.map((inf) => (
              <tr key={inf}>
                <td style={{ padding: '6px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{inf}</td>
                {xLabels.map((p) => {
                  const v = grid[inf + '|' + p] || 0;
                  return (
                    <td key={p} title={`${inf} · ${p}: ${v}%`} style={{
                      padding: 0,
                      width: 64,
                      height: 30,
                      background: colorFor(v, max),
                      color: '#1f2937',
                      textAlign: 'center',
                      border: '1px solid #fff',
                      fontWeight: 600,
                    }}>
                      {v.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
