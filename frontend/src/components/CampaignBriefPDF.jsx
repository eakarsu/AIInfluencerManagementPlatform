import React, { useEffect, useState } from 'react';
import api from '../api';

export default function CampaignBriefPDF() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get('/campaigns')
      .then((r) => {
        const list = r.data?.data || r.data || [];
        setCampaigns(list);
        if (list.length) setSelected(String(list[0].id));
      })
      .catch(() => setCampaigns([]));
  }, []);

  const download = async () => {
    if (!selected) return;
    setStatus('Generating PDF...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/custom-views/campaign-brief/${selected}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-brief-${selected}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('PDF downloaded');
    } catch (e) {
      setStatus('Error: ' + (e.message || 'failed'));
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Campaign Brief PDF</h3>
      <p style={{ color: '#64748b', marginTop: 4 }}>Generate a downloadable brief for any campaign</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, minWidth: 240 }}
        >
          {campaigns.length === 0 && <option value="">No campaigns available</option>}
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name || `Campaign #${c.id}`}</option>
          ))}
        </select>
        <button
          onClick={download}
          disabled={!selected}
          style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}
        >
          Download PDF
        </button>
        {status && <span style={{ color: '#475569', fontSize: 13 }}>{status}</span>}
      </div>
    </div>
  );
}
