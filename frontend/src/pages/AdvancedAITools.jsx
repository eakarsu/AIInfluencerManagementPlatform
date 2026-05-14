import React, { useEffect, useState } from 'react';
import { Sparkles, Users, TrendingUp, ShieldAlert, Loader2, DollarSign, Layers, CalendarRange, UserPlus } from 'lucide-react';
import api from '../api';

const TOOLS = [
  {
    id: 'audience-segmentation',
    title: 'Audience Segmentation',
    icon: Users,
    color: '#6366f1',
    bg: '#eef2ff',
    endpoint: '/ai/audience-segmentation',
    desc: 'Cohort segments with sizing, interests, engagement bands, and recommended campaign angles.',
    fields: [
      { name: 'influencer_id', type: 'number', placeholder: 'Influencer ID (optional, pulls audience records)' },
      { name: 'audience_data', type: 'textarea', placeholder: 'Optional inline audience data (JSON or freeform notes)' },
    ],
  },
  {
    id: 'performance-prediction',
    title: 'Performance Prediction',
    icon: TrendingUp,
    color: '#10b981',
    bg: '#d1fae5',
    endpoint: '/ai/performance-prediction',
    desc: 'P10/P50/P90 predictions for reach, engagement, conversions, ROAS plus go/no-go.',
    fields: [
      { name: 'campaign_id', type: 'number', placeholder: 'Campaign ID', required: true },
      { name: 'influencer_ids', type: 'text', placeholder: 'Influencer IDs (comma-separated, optional)' },
    ],
  },
  {
    id: 'fraud-detection',
    title: 'Fraud Detection',
    icon: ShieldAlert,
    color: '#ef4444',
    bg: '#fee2e2',
    endpoint: '/ai/fraud-detection',
    desc: 'Fraud score, indicators, follower/engagement authenticity estimates, recommended action.',
    fields: [
      { name: 'influencer_id', type: 'number', placeholder: 'Influencer ID (preferred)' },
      { name: 'profile', type: 'textarea', placeholder: 'Or paste a profile snapshot (followers, engagement %, recent posts)' },
    ],
  },
  {
    id: 'ltv-prediction',
    title: 'LTV Prediction',
    icon: DollarSign,
    color: '#0ea5e9',
    bg: '#e0f2fe',
    endpoint: '/ai/ltv-prediction',
    desc: 'Forecast influencer-brand lifetime value: revenue curve, retention, value drivers.',
    fields: [
      { name: 'influencer_id', type: 'number', placeholder: 'Influencer ID' },
      { name: 'brand_id', type: 'number', placeholder: 'Brand ID (optional)' },
      { name: 'time_horizon_months', type: 'number', placeholder: 'Time horizon months (default 12)' },
    ],
  },
  {
    id: 'audience-overlap',
    title: 'Audience Overlap',
    icon: Layers,
    color: '#f59e0b',
    bg: '#fef3c7',
    endpoint: '/ai/audience-overlap',
    desc: 'Estimate shared followers and unique reach across multiple influencers; flag cannibalization.',
    fields: [
      { name: 'influencer_ids', type: 'text', placeholder: 'Influencer IDs (comma-separated, >=2)' },
      { name: 'audiences', type: 'textarea', placeholder: 'Or paste inline audience data (JSON)' },
    ],
  },
  {
    id: 'trend-calendar',
    title: 'Trend & Content Calendar',
    icon: CalendarRange,
    color: '#8b5cf6',
    bg: '#ede9fe',
    endpoint: '/ai/trend-calendar',
    desc: 'Build a multi-week trend calendar with viral formats, hooks, and seasonal moments.',
    fields: [
      { name: 'niche', type: 'text', placeholder: 'Niche (e.g. fitness, beauty, gaming)', required: true },
      { name: 'region', type: 'text', placeholder: 'Region (default global)' },
      { name: 'horizon_weeks', type: 'number', placeholder: 'Horizon weeks (default 8)' },
      { name: 'brand_voice', type: 'text', placeholder: 'Brand voice (optional)' },
    ],
  },
  {
    id: 'micro-influencer-discovery',
    title: 'Micro-Influencer Discovery',
    icon: UserPlus,
    color: '#14b8a6',
    bg: '#ccfbf1',
    endpoint: '/ai/micro-influencer-discovery',
    desc: 'Rank candidate micro-influencers by brand fit, audience alignment, authenticity, and projected ROI.',
    fields: [
      { name: 'brand_id', type: 'number', placeholder: 'Brand ID (optional)' },
      { name: 'niche', type: 'text', placeholder: 'Niche' },
      { name: 'target_audience', type: 'textarea', placeholder: 'Target audience description' },
      { name: 'min_followers', type: 'number', placeholder: 'Min followers (default 1000)' },
      { name: 'max_followers', type: 'number', placeholder: 'Max followers (default 100000)' },
      { name: 'min_engagement_rate', type: 'number', placeholder: 'Min engagement rate %' },
      { name: 'top_k', type: 'number', placeholder: 'Top K (default 10)' },
    ],
  },
];

export default function AdvancedAITools() {
  const [tab, setTab] = useState(TOOLS[0].id);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const tool = TOOLS.find((t) => t.id === tab);
  const Icon = tool.icon;
  const formData = forms[tab] || {};

  useEffect(() => {
    setError(null);
    setResult(null);
  }, [tab]);

  const setField = (name, value) => {
    setForms((p) => ({ ...p, [tab]: { ...(p[tab] || {}), [name]: value } }));
  };

  const submit = async (e) => {
    e.preventDefault();
    for (const f of tool.fields) {
      if (f.required && (formData[f.name] === undefined || formData[f.name] === '')) {
        setError(`${f.placeholder || f.name} is required`);
        return;
      }
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const body = {};
      tool.fields.forEach((f) => {
        const v = formData[f.name];
        if (v === undefined || v === '' || v === null) return;
        if (f.name === 'influencer_ids' && typeof v === 'string') {
          body.influencer_ids = v.split(',').map((s) => Number(s.trim())).filter(Boolean);
        } else if (f.name === 'audiences' && typeof v === 'string') {
          try { body.audiences = JSON.parse(v); } catch (_) { body.audiences = v; }
        } else if (f.type === 'number') {
          body[f.name] = Number(v);
        } else {
          body[f.name] = v;
        }
      });
      const res = await api.post(tool.endpoint, body);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 503) {
        setError(err.response?.data?.error || 'AI is not configured.');
      } else {
        const msg = err.response?.data?.error || err.message || 'Request failed';
        setError(msg);
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={26} color="#8b5cf6" /> Advanced AI Tools
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Audience segmentation, performance prediction, and fraud detection</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {TOOLS.map((t) => {
          const TIcon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius)',
                background: active ? t.color : 'var(--bg)',
                color: active ? 'white' : 'var(--text)',
                border: '1px solid var(--border)',
                cursor: 'pointer', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <TIcon size={16} /> {t.title}
            </button>
          );
        })}
      </div>

      <div style={{ background: tool.bg, padding: 24, borderRadius: 'var(--radius)', border: `1px solid ${tool.color}33` }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: tool.color }}>
          <Icon size={20} /> {tool.title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{tool.desc}</p>

        <form onSubmit={submit} style={{ background: 'white', padding: 16, borderRadius: 'var(--radius)', marginTop: 12 }}>
          {tool.fields.map((f) => (
            <div key={f.name} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
                {f.placeholder} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={4}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', fontSize: 14 }}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }}
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius)', border: 'none',
              background: loading ? '#94a3b8' : tool.color, color: 'white',
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Generating...</> : <>Run Analysis</>}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius)' }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 16, padding: 16, background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ marginTop: 0 }}>Result</h4>
            <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 6, overflow: 'auto', fontSize: 12, maxHeight: 520 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
