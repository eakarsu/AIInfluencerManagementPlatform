import React, { useState } from 'react';
import { ArrowLeft, Sparkles, FileText, Brain, Users, Send, Eye, Swords, Target, Loader2, CheckCircle2, AlertCircle, Star, TrendingUp, Lightbulb, Zap, BarChart3, Heart } from 'lucide-react';
import api from '../api';

const tools = [
  { id: 'content', title: 'Content Generator', desc: 'Generate engaging content ideas, captions, and scripts for any platform', icon: FileText, color: '#6366f1', bg: '#eef2ff', endpoint: '/ai/generate-content', fields: [{ name: 'platform', type: 'select', options: ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'LinkedIn'] }, { name: 'topic', type: 'text', placeholder: 'e.g. Summer fashion trends' }, { name: 'tone', type: 'select', options: ['Professional', 'Casual', 'Humorous', 'Inspirational', 'Educational'] }, { name: 'content_type', type: 'select', options: ['Post Caption', 'Story Script', 'Video Script', 'Blog Outline', 'Tweet Thread'] }] },
  { id: 'sentiment', title: 'Sentiment Analysis', desc: 'Analyze audience sentiment and brand perception across platforms', icon: Brain, color: '#8b5cf6', bg: '#f5f3ff', endpoint: '/ai/analyze-sentiment', fields: [{ name: 'text', type: 'textarea', placeholder: 'Paste text, comments, or reviews to analyze...' }, { name: 'context', type: 'text', placeholder: 'Context (e.g. Instagram comments on product launch)' }] },
  { id: 'matching', title: 'Influencer Matching', desc: 'Find the perfect influencer matches for your brand and campaign goals', icon: Users, color: '#10b981', bg: '#d1fae5', endpoint: '/ai/match-influencers', fields: [{ name: 'brand_description', type: 'text', placeholder: 'Brand name and description' }, { name: 'campaign_goals', type: 'text', placeholder: 'e.g. Increase brand awareness among Gen Z' }, { name: 'budget', type: 'number', placeholder: 'Budget ($)' }, { name: 'platform', type: 'select', options: ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'Any'] }, { name: 'industry', type: 'text', placeholder: 'e.g. Fashion, Tech, Fitness' }] },
  { id: 'outreach', title: 'Outreach Generator', desc: 'Create personalized outreach messages for influencer collaborations', icon: Send, color: '#f59e0b', bg: '#fef3c7', endpoint: '/ai/generate-outreach', fields: [{ name: 'influencer_name', type: 'text', placeholder: 'Influencer name' }, { name: 'brand_name', type: 'text', placeholder: 'Your brand name' }, { name: 'collaboration_type', type: 'select', options: ['Product Review', 'Brand Ambassador', 'Sponsored Post', 'Event', 'Giveaway'] }, { name: 'campaign_description', type: 'textarea', placeholder: 'Describe the campaign and key talking points...' }] },
  { id: 'audience', title: 'Audience Analysis', desc: 'Get deep insights into audience demographics and behavior patterns', icon: Eye, color: '#3b82f6', bg: '#dbeafe', endpoint: '/ai/audience-analysis', fields: [{ name: 'platform', type: 'select', options: ['Instagram', 'YouTube', 'TikTok', 'Twitter'] }, { name: 'follower_count', type: 'number', placeholder: 'Approximate followers' }, { name: 'content_type', type: 'select', options: ['Lifestyle', 'Fashion', 'Tech', 'Fitness', 'Food', 'Travel', 'Mixed'] }] },
  { id: 'competitor', title: 'Competitor Insights', desc: 'Analyze competitor strategies and find opportunities for differentiation', icon: Swords, color: '#ef4444', bg: '#fee2e2', endpoint: '/ai/competitor-insights', fields: [{ name: 'brand_name', type: 'text', placeholder: 'Your brand/influencer' }, { name: 'competitors', type: 'text', placeholder: 'Competitor names (comma separated)' }, { name: 'industry', type: 'text', placeholder: 'Industry (e.g. Beauty, Tech)' }] },
  { id: 'strategy', title: 'Campaign Strategy', desc: 'Get AI-powered campaign strategy recommendations and optimization tips', icon: Target, color: '#ec4899', bg: '#fce7f3', endpoint: '/ai/campaign-strategy', fields: [{ name: 'brand_description', type: 'text', placeholder: 'Brand name and description' }, { name: 'objectives', type: 'select', options: ['Brand Awareness', 'Lead Generation', 'Sales Conversion', 'Community Building', 'Product Launch'] }, { name: 'budget', type: 'number', placeholder: 'Total budget ($)' }, { name: 'timeline', type: 'text', placeholder: 'e.g. 3 months' }, { name: 'industry', type: 'text', placeholder: 'e.g. Beauty, Fashion, Tech' }] },
];

function renderAIResult(toolId, data) {
  if (!data) return null;

  // Handle string responses
  if (typeof data === 'string') {
    return (
      <div className="ai-result-body">
        <div className="ai-result-section">
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14, color: 'var(--text-secondary)' }}>{data}</p>
        </div>
      </div>
    );
  }

  // Handle the response - try to extract from common response shapes
  const result = data.data || data.result || data.analysis || data.content || data.strategy || data.matches || data;

  // If it's a string after extraction
  if (typeof result === 'string') {
    const sections = result.split('\n\n').filter(Boolean);
    return (
      <div className="ai-result-body">
        {sections.map((section, i) => {
          const lines = section.split('\n');
          const isHeader = lines[0].startsWith('#') || lines[0].startsWith('**') || lines[0].endsWith(':');
          return (
            <div className="ai-result-section" key={i}>
              {isHeader && <h5><Sparkles size={16} style={{ color: 'var(--primary)' }} /> {lines[0].replace(/[#*]/g, '').trim()}</h5>}
              <ul>
                {lines.slice(isHeader ? 1 : 0).filter(Boolean).map((line, j) => (
                  <li key={j}>{line.replace(/^[-*]\s*/, '').trim()}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  // Handle array responses (like influencer matches)
  if (Array.isArray(result)) {
    return (
      <div className="ai-result-body">
        <div style={{ display: 'grid', gap: 16 }}>
          {result.map((item, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h5 style={{ fontSize: 15, fontWeight: 600 }}>
                  <Star size={14} style={{ color: 'var(--warning)', marginRight: 6 }} />
                  {item.name || item.title || `Result ${i + 1}`}
                </h5>
                {(item.score || item.match_score || item.rating) && (
                  <span className={`ai-score ${(item.score || item.match_score || item.rating) >= 80 ? 'high' : (item.score || item.match_score || item.rating) >= 50 ? 'medium' : 'low'}`}>
                    {item.score || item.match_score || item.rating}% match
                  </span>
                )}
              </div>
              {Object.entries(item).filter(([k]) => !['name', 'title', 'score', 'match_score', 'rating'].includes(k)).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', minWidth: 120, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</span>
                  <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle object responses
  if (typeof result === 'object') {
    const renderValue = (val, depth = 0) => {
      if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
      if (typeof val === 'boolean') return <span className={`badge ${val ? 'badge-success' : 'badge-danger'}`}>{val ? 'Yes' : 'No'}</span>;
      if (typeof val === 'number') return <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{val.toLocaleString()}</span>;
      if (typeof val === 'string') return <span>{val}</span>;
      if (Array.isArray(val)) {
        return (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {val.map((v, i) => (
              <li key={i} style={{ padding: '4px 0', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8, borderBottom: i < val.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
                {typeof v === 'object' ? renderValue(v, depth + 1) : String(v)}
              </li>
            ))}
          </ul>
        );
      }
      if (typeof val === 'object') {
        return (
          <div style={{ padding: depth > 0 ? '8px 0' : 0 }}>
            {Object.entries(val).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ')}</span>
                <div style={{ marginTop: 2 }}>{renderValue(v, depth + 1)}</div>
              </div>
            ))}
          </div>
        );
      }
      return <span>{String(val)}</span>;
    };

    const icons = { summary: Sparkles, recommendations: Lightbulb, tips: Zap, metrics: BarChart3, sentiment: Heart, strategy: Target, strengths: CheckCircle2, weaknesses: AlertCircle, opportunities: TrendingUp };

    return (
      <div className="ai-result-body">
        {Object.entries(result).map(([key, val]) => {
          const IconComp = icons[key] || Sparkles;
          return (
            <div className="ai-result-section" key={key} style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 12, border: '1px solid var(--border-light)' }}>
              <h5>
                <IconComp size={16} style={{ color: 'var(--primary)' }} />
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h5>
              <div style={{ marginTop: 8 }}>{renderValue(val)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return <div className="ai-result-body"><p>No structured data returned.</p></div>;
}

export default function AITools() {
  const [activeTool, setActiveTool] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!activeTool) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post(activeTool.endpoint, formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'AI generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (activeTool) {
    return (
      <div>
        <button className="back-btn" onClick={() => { setActiveTool(null); setResult(null); setError(null); setFormData({}); }}>
          <ArrowLeft size={16} /> Back to AI Tools
        </button>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: activeTool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <activeTool.icon size={20} style={{ color: activeTool.color }} />
              </div>
              <div>
                <h3>{activeTool.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{activeTool.desc}</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            {activeTool.fields.map((field) => (
              <div className="form-group" key={field.name}>
                <label style={{ textTransform: 'capitalize' }}>{field.name.replace(/_/g, ' ')}</label>
                {field.type === 'select' ? (
                  <select className="form-control" value={formData[field.name] || ''} onChange={e => setFormData({...formData, [field.name]: e.target.value})}>
                    <option value="">Select...</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea className="form-control" placeholder={field.placeholder} value={formData[field.name] || ''} onChange={e => setFormData({...formData, [field.name]: e.target.value})} />
                ) : (
                  <input className="form-control" type={field.type} placeholder={field.placeholder} value={formData[field.name] || ''} onChange={e => setFormData({...formData, [field.name]: e.target.value})} />
                )}
              </div>
            ))}
            <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading} style={{ width: '100%' }}>
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Sparkles size={18} /> Generate with AI</>}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: 16, background: 'var(--danger-bg)', borderRadius: 'var(--radius)', color: 'var(--danger)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <p>AI is analyzing and generating results...</p>
          </div>
        )}

        {result && (
          <div className="ai-result">
            <div className="ai-result-header">
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              <h4>AI Generated Results</h4>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
                <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Complete
              </span>
            </div>
            {renderAIResult(activeTool.id, result)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
          Leverage AI to optimize your influencer marketing strategy. Select a tool below to get started.
        </p>
      </div>
      <div className="ai-card-grid">
        {tools.map((tool) => (
          <div className="ai-card" key={tool.id} onClick={() => setActiveTool(tool)}>
            <div className="ai-card-icon" style={{ background: tool.bg }}>
              <tool.icon size={26} style={{ color: tool.color }} />
            </div>
            <h4>{tool.title}</h4>
            <p>{tool.desc}</p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--primary)' }}>
              <Sparkles size={14} /> Try it now
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
