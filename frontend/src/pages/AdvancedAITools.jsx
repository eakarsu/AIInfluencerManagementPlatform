import AIResultHistory from "../components/AIResultHistory";
import NativeAIControls from "../components/NativeAIControls";
import useNativeAIRequest from "../components/useNativeAIRequest";
import FormattedAIReport from "../components/FormattedAIReport";
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
      { name: 'influencer_id', type: 'reference', source: 'influencers', placeholder: 'Existing influencer (optional, pulls audience records)' },
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
      { name: 'campaign_id', type: 'reference', source: 'campaigns', placeholder: 'Existing campaign', required: true },
      { name: 'influencer_ids', type: 'text', placeholder: 'Influencer IDs (comma-separated, optional)' },
      { name: 'content_brief', type: 'textarea', placeholder: 'Content brief and deliverables (optional)' },
      { name: 'target_kpis', type: 'textarea', placeholder: 'Target KPIs and thresholds (optional)' },
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
      { name: 'influencer_id', type: 'reference', source: 'influencers', placeholder: 'Existing influencer (preferred)' },
      { name: 'profile', type: 'textarea', placeholder: 'Or paste a profile snapshot (followers, engagement %, recent posts)' },
      { name: 'recent_metrics', type: 'textarea', placeholder: 'Recent metrics JSON or observations (optional)' },
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
      { name: 'influencer_id', type: 'reference', source: 'influencers', placeholder: 'Existing influencer' },
      { name: 'brand_id', type: 'reference', source: 'brands', placeholder: 'Existing brand (optional)' },
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
      { name: 'audiences', type: 'textarea', placeholder: '[{"name":"Fictional cohort A","follower_count":1200,"interests":["fitness"]},{"name":"Fictional cohort B","follower_count":900,"interests":["cooking"]}]' },
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
      { name: 'brand_id', type: 'reference', source: 'brands', placeholder: 'Existing brand (optional)' },
      { name: 'niche', type: 'text', placeholder: 'Niche' },
      { name: 'target_audience', type: 'textarea', placeholder: 'Target audience description' },
      { name: 'min_followers', type: 'number', placeholder: 'Min followers (default 1000)' },
      { name: 'max_followers', type: 'number', placeholder: 'Max followers (default 100000)' },
      { name: 'min_engagement_rate', type: 'number', placeholder: 'Min engagement rate %' },
      { name: 'top_k', type: 'number', placeholder: 'Top K (default 10)' },
    ],
  },
];

const advancedPresetNames = ['Baseline review', 'Growth scenario', 'Risk review'];
const advancedExamples = {
  audience_data: [
    '{"followers":85000,"top_regions":["US","Canada"],"interests":["sustainable fashion","personal style"],"engagement_rate":4.8}',
    '{"followers":140000,"top_regions":["US","UK"],"interests":["fitness","wellness"],"engagement_rate":5.2}',
    '{"followers":220000,"top_regions":["US","Australia"],"interests":["travel","outdoor gear"],"engagement_rate":4.4}',
  ],
  content_brief: ['Four-week summer launch: one review, two reels, three story sets, and approved usage rights.', 'Six-week fitness challenge with weekly videos, community check-ins, and tracked registrations.', 'Eight-week travel campaign with packing tutorials, field tests, and approved tracked links.'],
  target_kpis: ['Reach 350000; engagement rate >=4%; saves >=6000; ROAS >=2.5.', 'Registrations 1200; completion rate >=35%; engagement rate >=4.5%.', 'Qualified clicks 8000; conversions 700; ROAS >=3.0; negative sentiment <5%.'],
  profile: ['{"followers":85000,"engagement_rate":4.8,"recent_posts":12,"avg_comments":410}', '{"followers":140000,"engagement_rate":5.2,"recent_posts":16,"avg_comments":730}', '{"followers":220000,"engagement_rate":4.4,"recent_posts":10,"avg_comments":640}'],
  recent_metrics: ['{"follower_growth_30d_pct":2.8,"like_comment_ratio":18,"audience_country_match_pct":72}', '{"follower_growth_30d_pct":3.4,"like_comment_ratio":16,"audience_country_match_pct":78}', '{"follower_growth_30d_pct":1.9,"like_comment_ratio":21,"audience_country_match_pct":69}'],
  audiences: [
    '[{"name":"Style cohort","follower_count":85000,"interests":["fashion","sustainability"]},{"name":"Beauty cohort","follower_count":72000,"interests":["beauty","fashion"]}]',
    '[{"name":"Fitness cohort","follower_count":140000,"interests":["fitness","nutrition"]},{"name":"Wellness cohort","follower_count":98000,"interests":["wellness","productivity"]}]',
    '[{"name":"Travel cohort","follower_count":220000,"interests":["travel","photography"]},{"name":"Outdoor cohort","follower_count":110000,"interests":["hiking","gear"]}]',
  ],
  niche: ['Sustainable fashion', 'Home fitness', 'Responsible travel'],
  region: ['United States and Canada', 'United States and United Kingdom', 'United States and Australia'],
  brand_voice: ['Optimistic, practical, and transparent', 'Encouraging, evidence-informed, and inclusive', 'Curious, durable, and environmentally responsible'],
  target_audience: ['Gen Z shoppers interested in capsule wardrobes and responsible sourcing.', 'Professionals aged 25–44 seeking short, practical home workouts.', 'Eco-conscious travelers aged 25–40 who value repairable gear.'],
};

function advancedPresetValue(field, variant, references, current) {
  if (field.type === 'reference') {
    const records = references[field.source] || [];
    return records.length ? String(records[variant % records.length].id) : current || null;
  }
  if (field.name === 'influencer_ids') {
    const ids = (references.influencers || []).slice(0, 3).map((item) => item.id);
    return ids.length >= 2 ? ids.join(', ') : current || null;
  }
  if (advancedExamples[field.name]) return advancedExamples[field.name][variant];
  const numeric = {
    time_horizon_months: [12, 18, 24], horizon_weeks: [4, 6, 8], min_followers: [1000, 5000, 10000],
    max_followers: [75000, 100000, 150000], min_engagement_rate: [3, 4, 5], top_k: [5, 8, 10],
  };
  if (numeric[field.name]) return numeric[field.name][variant];
  return `Complete ${advancedPresetNames[variant].toLowerCase()} example for ${field.name.replace(/_/g, ' ')}.`;
}

function advancedPresets(tool, references, current, apply) {
  return advancedPresetNames.map((name, variant) => ({ name, fill: () => {
    const next = {};
    const manual = [];
    tool.fields.forEach((field) => {
      const value = advancedPresetValue(field, variant, references, current[field.name]);
      if (value === null) manual.push(field.placeholder || field.name.replace(/_/g, ' '));
      else next[field.name] = value;
    });
    apply(next);
    return { filled: Object.keys(next).length, manual };
  } }));
}

export default function AdvancedAITools() {
  const nativeAIRequest = useNativeAIRequest();

  const [tab, setTab] = useState(TOOLS[0].id);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [references, setReferences] = useState({ influencers: [], campaigns: [], brands: [] });
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const tool = TOOLS.find((t) => t.id === tab);
  const Icon = tool.icon;
  const formData = forms[tab] || {};

  useEffect(() => {
    setError(null);
    setResult(null);
  }, [tab]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(['influencers', 'campaigns', 'brands'].map(async (source) => {
      try {
        const response = await api.get(`/${source}`, { params: { page: 1, limit: 100 }, signal: controller.signal });
        return [source, Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : []];
      } catch (_) {
        return [source, []];
      }
    })).then((entries) => setReferences(Object.fromEntries(entries)));
    return () => controller.abort();
  }, []);

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
        } else if (['audiences', 'audience_data', 'profile', 'recent_metrics'].includes(f.name) && typeof v === 'string') {
          try { body[f.name] = JSON.parse(v); } catch (_) { body[f.name] = v; }
        } else if (f.type === 'number' || f.type === 'reference') {
          body[f.name] = Number(v);
        } else {
          body[f.name] = v;
        }
      });
      const res = await nativeAIRequest.run((signal) => api.post(tool.endpoint, body, { signal }));
      setResult(res.data);
      setHistoryRefresh((value) => value + 1);
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
    <NativeAIControls busy={nativeAIRequest.busy} onCancel={nativeAIRequest.cancel} context="Influencer Management Platform" presets={advancedPresets(tool, references, formData, (next) => setForms((current) => ({ ...current, [tab]: next })))}><div>
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
              {f.type === 'reference' ? (
                <select data-ai-field={f.name}
                  value={formData[f.name] || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }}
                >
                  <option value="">Select a current record…</option>
                  {(references[f.source] || []).map((record) => <option key={record.id} value={record.id}>{record.name || record.title || record.email || `Record ${record.id}`} (#{record.id})</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea data-ai-field={f.name}
                  rows={4}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', fontSize: 14 }}
                />
              ) : (
                <input data-ai-field={f.name}
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
            <FormattedAIReport response={result} title={`${tool.title} result`} />
          </div>
        )}
        <AIResultHistory tool={tool.id} title={tool.title} refreshKey={historyRefresh} />
      </div>
    </div></NativeAIControls>
  );
}
