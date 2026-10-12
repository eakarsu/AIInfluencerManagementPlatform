import NativeAIControls from "../components/NativeAIControls.jsx";
import FormattedAIReport from "../components/FormattedAIReport.jsx";
import AIResultHistory from "../components/AIResultHistory.jsx";
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Sparkles, FileText, Brain, Users, Send, Eye, Swords, Target, Loader2, CheckCircle2, AlertCircle, Star, TrendingUp, Lightbulb, Zap, BarChart3, Heart, Copy, Check } from 'lucide-react';
import api from '../api';

const tools = [
  { id: 'content', historyTool: 'generate-content', title: 'Content Generator', desc: 'Generate engaging content ideas, captions, and scripts for any platform', icon: FileText, color: '#6366f1', bg: '#eef2ff', endpoint: '/ai/generate-content', fields: [
    { name: 'platform', type: 'select', options: ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'LinkedIn'] },
    { name: 'topic', type: 'text', placeholder: 'e.g. Summer fashion trends' },
    { name: 'tone', type: 'select', options: ['Professional', 'Casual', 'Humorous', 'Inspirational', 'Educational'] },
    { name: 'content_type', type: 'select', options: ['Post Caption', 'Story Script', 'Video Script', 'Blog Outline', 'Tweet Thread'] },
    { name: 'audience', type: 'text', placeholder: 'Target audience (optional)' },
    { name: 'influencer_style', type: 'text', placeholder: 'Influencer style (optional)' },
    { name: 'campaign_goals', type: 'textarea', placeholder: 'Campaign goals and success criteria (optional)' },
  ] },
  { id: 'sentiment', historyTool: 'analyze-sentiment', title: 'Sentiment Analysis', desc: 'Analyze audience sentiment and brand perception across platforms', icon: Brain, color: '#8b5cf6', bg: '#f5f3ff', endpoint: '/ai/analyze-sentiment', fields: [{ name: 'text', type: 'textarea', placeholder: 'Paste text, comments, or reviews to analyze...' }, { name: 'context', type: 'text', placeholder: 'Context (e.g. Instagram comments on product launch)' }] },
  { id: 'matching', historyTool: 'match-influencers', title: 'Influencer Matching', desc: 'Find the perfect influencer matches for your brand and campaign goals', icon: Users, color: '#10b981', bg: '#d1fae5', endpoint: '/ai/match-influencers', fields: [
    { name: 'brand_description', type: 'textarea', placeholder: 'Brand name and description' },
    { name: 'campaign_goals', type: 'textarea', placeholder: 'Campaign goals' },
    { name: 'target_audience', type: 'textarea', placeholder: 'Target audience (optional)' },
    { name: 'budget', type: 'number', placeholder: 'Budget ($)' },
    { name: 'platform', type: 'select', options: ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'Any'] },
    { name: 'industry', type: 'text', placeholder: 'e.g. Fashion, Tech, Fitness' },
  ] },
  { id: 'outreach', historyTool: 'generate-outreach', title: 'Outreach Generator', desc: 'Create personalized outreach messages for influencer collaborations', icon: Send, color: '#f59e0b', bg: '#fef3c7', endpoint: '/ai/generate-outreach', fields: [
    { name: 'influencer_name', type: 'text', placeholder: 'Influencer name' },
    { name: 'influencer_platform', type: 'select', options: ['Instagram', 'YouTube', 'TikTok', 'LinkedIn'] },
    { name: 'brand_name', type: 'text', placeholder: 'Your brand name' },
    { name: 'collaboration_type', type: 'select', options: ['Product Review', 'Brand Ambassador', 'Sponsored Post', 'Event', 'Giveaway'] },
    { name: 'campaign_description', type: 'textarea', placeholder: 'Describe the campaign and key talking points...' },
    { name: 'compensation', type: 'text', placeholder: 'Compensation proposal (optional)' },
    { name: 'tone', type: 'select', options: ['Professional', 'Friendly', 'Concise'] },
  ] },
  { id: 'audience', historyTool: 'audience-analysis', title: 'Audience Analysis', desc: 'Get deep insights into audience demographics and behavior patterns', icon: Eye, color: '#3b82f6', bg: '#dbeafe', endpoint: '/ai/audience-analysis', fields: [
    { name: 'platform', type: 'select', options: ['Instagram', 'YouTube', 'TikTok', 'Twitter'] },
    { name: 'follower_count', type: 'number', placeholder: 'Approximate followers' },
    { name: 'content_type', type: 'select', options: ['Lifestyle', 'Fashion', 'Tech', 'Fitness', 'Food', 'Travel', 'Mixed'] },
    { name: 'demographics', type: 'textarea', placeholder: 'Audience demographics JSON (optional)' },
    { name: 'interests', type: 'textarea', placeholder: 'Audience interests JSON (optional)' },
    { name: 'engagement_data', type: 'textarea', placeholder: 'Engagement observations JSON (optional)' },
  ] },
  { id: 'competitor', historyTool: 'competitor-insights', title: 'Competitor Insights', desc: 'Analyze competitor strategies and find opportunities for differentiation', icon: Swords, color: '#ef4444', bg: '#fee2e2', endpoint: '/ai/competitor-insights', fields: [
    { name: 'brand_name', type: 'text', placeholder: 'Your brand/influencer' },
    { name: 'competitors', type: 'text', placeholder: 'Competitor names (comma separated)' },
    { name: 'industry', type: 'text', placeholder: 'Industry (e.g. Beauty, Tech)' },
    { name: 'platforms', type: 'text', placeholder: 'Platforms to compare (optional)' },
    { name: 'focus_areas', type: 'textarea', placeholder: 'Focus areas and questions (optional)' },
  ] },
  { id: 'strategy', historyTool: 'campaign-strategy', title: 'Campaign Strategy', desc: 'Get AI-powered campaign strategy recommendations and optimization tips', icon: Target, color: '#ec4899', bg: '#fce7f3', endpoint: '/ai/campaign-strategy', fields: [
    { name: 'brand_description', type: 'textarea', placeholder: 'Brand name and description' },
    { name: 'objectives', type: 'select', options: ['Brand Awareness', 'Lead Generation', 'Sales Conversion', 'Community Building', 'Product Launch'] },
    { name: 'budget', type: 'number', placeholder: 'Total budget ($)' },
    { name: 'timeline', type: 'text', placeholder: 'e.g. 3 months' },
    { name: 'industry', type: 'text', placeholder: 'e.g. Beauty, Fashion, Tech' },
    { name: 'target_audience', type: 'textarea', placeholder: 'Target audience (optional)' },
    { name: 'platforms', type: 'text', placeholder: 'Platforms (optional)' },
    { name: 'past_performance', type: 'textarea', placeholder: 'Past performance JSON or notes (optional)' },
    { name: 'campaign_id', type: 'reference', source: 'campaigns', placeholder: 'Existing campaign (optional)' },
  ] },
  { id: 'brand-safety', historyTool: 'brand-safety-scan', title: 'Brand Safety Scanner', desc: 'Scan an influencer for brand safety risks, toxicity, and controversy flags before campaign launch', icon: Zap, color: '#f97316', bg: '#fff7ed', endpoint: '/ai/brand-safety-scan', fields: [{ name: 'influencer_id', type: 'reference', source: 'influencers', placeholder: 'Existing influencer' }] },
  { id: 'roi-analysis', historyTool: 'roi-analysis', title: 'Campaign ROI Analyzer', desc: 'AI-powered ROI analysis for a campaign — performance grade, cost metrics, and recommendations', icon: BarChart3, color: '#0ea5e9', bg: '#e0f2fe', endpoint: '/ai/roi-analysis', fields: [{ name: 'campaign_id', type: 'reference', source: 'campaigns', placeholder: 'Existing campaign' }] },
];

const presetNames = ['Launch brief', 'Growth campaign', 'Executive review'];
const examples = {
  topic: ['Summer capsule wardrobe launch', 'Creator-led fitness challenge', 'Sustainable travel essentials'],
  audience: ['US Gen Z fashion shoppers aged 18–27', 'Busy professionals interested in practical wellness', 'Eco-conscious travelers aged 25–40'],
  influencer_style: ['Editorial, candid, and product-led', 'Energetic, educational, and community-focused', 'Warm documentary storytelling with practical tips'],
  campaign_goals: ['Build qualified awareness and save rate; report reach, saves, and profile visits.', 'Drive challenge sign-ups and measure completed registrations and engagement quality.', 'Increase consideration while documenting clicks, saves, and attributable purchases.'],
  text: ['I love the design and the tutorial was useful, but shipping updates were unclear.', 'The challenge feels achievable and the coach answers questions thoughtfully.', 'The product quality exceeded expectations; please add clearer sizing guidance.'],
  context: ['Customer comments from an Instagram launch post', 'YouTube comments on a sponsored fitness series', 'Post-purchase feedback from a creator landing page'],
  brand_description: ['Northstar Apparel is a mid-market sustainable fashion brand launching a versatile summer collection.', 'Harbor Health offers accessible at-home fitness programs for time-constrained professionals.', 'Field & Coast makes durable, repairable travel accessories with transparent sourcing.'],
  target_audience: ['US shoppers aged 18–27 who follow sustainable fashion and capsule wardrobes.', 'Professionals aged 25–44 seeking short, evidence-informed home workouts.', 'Eco-conscious travelers aged 25–40 who value durability and repairability.'],
  influencer_name: ['Jordan Lee', 'Maya Chen', 'Alex Rivera'],
  influencer_platform: ['Instagram', 'YouTube', 'TikTok'],
  brand_name: ['Northstar Apparel', 'Harbor Health', 'Field & Coast'],
  campaign_description: ['A four-week summer capsule launch with one review, two styling reels, and usage rights for approved assets.', 'A six-week fitness challenge with weekly videos, community check-ins, and tracked registrations.', 'A travel essentials launch featuring packing tutorials, honest product tests, and tracked links.'],
  compensation: ['$2,500 fixed fee plus approved product', '$4,000 fixed fee plus registration bonus', '$3,200 fixed fee plus travel kit'],
  demographics: ['{"age_18_24_pct":42,"age_25_34_pct":36,"top_regions":["US","Canada"]}', '{"age_25_34_pct":48,"age_35_44_pct":27,"top_regions":["US","UK"]}', '{"age_25_34_pct":44,"age_35_44_pct":31,"top_regions":["US","Australia"]}'],
  interests: ['["sustainable fashion","capsule wardrobes","personal style"]', '["home fitness","meal planning","work-life balance"]', '["responsible travel","outdoor gear","photography"]'],
  engagement_data: ['{"avg_reach":82000,"avg_engagement_rate":4.8,"saves_per_post":2100}', '{"avg_reach":125000,"avg_engagement_rate":5.2,"comments_per_post":860}', '{"avg_reach":97000,"avg_engagement_rate":4.4,"link_click_rate":1.9}'],
  competitors: ['Everlane, Reformation, Quince', 'Peloton, Apple Fitness+, FitOn', 'Patagonia, Peak Design, Cotopaxi'],
  platforms: ['Instagram, TikTok', 'YouTube, Instagram', 'TikTok, YouTube'],
  focus_areas: ['Compare creator positioning, content cadence, engagement quality, and whitespace for a summer launch.', 'Compare challenge formats, conversion paths, community mechanics, and retention signals.', 'Compare proof points, creator partnerships, customer objections, and differentiation opportunities.'],
  timeline: ['6 weeks', '8 weeks', '10 weeks'],
  industry: ['Sustainable fashion', 'Health and fitness', 'Travel accessories'],
  past_performance: ['{"reach":420000,"engagement_rate":4.2,"conversions":680,"roas":2.8}', '{"reach":610000,"engagement_rate":5.1,"registrations":1400,"roas":3.2}', '{"reach":530000,"engagement_rate":4.6,"conversions":920,"roas":3.5}'],
};

function exampleValue(field, variant, references, current) {
  if (field.type === 'reference') {
    const records = references[field.source] || [];
    return records.length ? String(records[variant % records.length].id) : current || null;
  }
  if (field.options) return field.options[variant % field.options.length];
  if (examples[field.name]) return examples[field.name][variant];
  if (field.name === 'budget') return [12000, 24000, 36000][variant];
  if (field.name === 'follower_count') return [85000, 140000, 220000][variant];
  return `Complete ${presetNames[variant].toLowerCase()} example for ${field.name.replace(/_/g, ' ')}.`;
}

function toolPresets(tool, references, current, setFormData) {
  return presetNames.map((name, variant) => ({ name, fill: () => {
    const next = {};
    const manual = [];
    tool.fields.forEach((field) => {
      const value = exampleValue(field, variant, references, current[field.name]);
      if (value === null) manual.push(field.placeholder || field.name.replace(/_/g, ' '));
      else next[field.name] = value;
    });
    setFormData(next);
    return { filled: Object.keys(next).length, manual };
  } }));
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
      {copied ? <><Check size={12} style={{ color: 'var(--success)' }} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

function OutreachCards({ data }) {
  const cards = [
    { label: 'Email Subject Line', key: 'subject_line', icon: '✉️' },
    { label: 'Email Body', key: 'email_body', icon: '📧' },
    { label: 'DM Version', key: 'dm_version', icon: '💬' },
    { label: 'Follow-up Message', key: 'follow_up_message', icon: '🔁' },
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {cards.map(card => data[card.key] && (
        <div key={card.key} style={{ padding: 16, background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h5 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{card.icon} {card.label}</h5>
            <CopyButton text={data[card.key]} />
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{data[card.key]}</p>
        </div>
      ))}
      {data.key_talking_points?.length > 0 && (
        <div style={{ padding: 16, background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius)' }}>
          <h5 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Key Talking Points</h5>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.key_talking_points.map((p, i) => <li key={i} style={{ fontSize: 14, padding: '3px 0' }}>{p}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function SentimentCards({ data }) {
  const sentimentColor = { positive: '#22c55e', negative: '#ef4444', neutral: '#6b7280' }[data.overall_sentiment] || '#6b7280';
  const score = Math.round((data.confidence_score || 0) * 100);
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ padding: '12px 20px', borderRadius: 8, background: sentimentColor + '22', border: `2px solid ${sentimentColor}` }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Overall Sentiment</div>
          <div style={{ fontWeight: 700, color: sentimentColor, textTransform: 'capitalize', fontSize: 16 }}>{data.overall_sentiment || '—'}</div>
        </div>
        <div style={{ padding: '12px 20px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Confidence</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 8, background: 'var(--border)', borderRadius: 4 }}>
              <div style={{ height: '100%', width: `${score}%`, background: sentimentColor, borderRadius: 4 }} />
            </div>
            <span style={{ fontWeight: 700, color: sentimentColor }}>{score}%</span>
          </div>
        </div>
        {data.toxicity_score !== undefined && (
          <div style={{ padding: '12px 20px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Toxicity</div>
            <div style={{ fontWeight: 700, color: data.toxicity_score > 0.5 ? '#ef4444' : '#22c55e' }}>{Math.round((data.toxicity_score || 0) * 100)}%</div>
          </div>
        )}
      </div>

      {data.emotions && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>EMOTION BREAKDOWN</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(data.emotions).map(([emotion, score]) => (
              <span key={emotion} style={{ padding: '4px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 13 }}>
                {emotion}: <strong>{Math.round((score || 0) * 100)}%</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {data.key_themes?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>KEY THEMES</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.key_themes.map((t, i) => <span key={i} style={{ padding: '4px 12px', background: 'var(--primary-bg, #eef2ff)', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>{t}</span>)}
          </div>
        </div>
      )}

      {data.brand_perception && (
        <div style={{ padding: 16, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Brand Perception</div>
          <p style={{ margin: 0, fontSize: 14 }}>{data.brand_perception}</p>
        </div>
      )}

      {data.recommendations?.length > 0 && (
        <div>
          <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>RECOMMENDATIONS</h5>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.recommendations.map((r, i) => <li key={i} style={{ fontSize: 14, padding: '4px 0' }}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function CampaignStrategyCards({ data }) {
  return (
    <div>
      {data.strategy_overview && (
        <div style={{ padding: 16, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
          <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>STRATEGY OVERVIEW</h5>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{data.strategy_overview}</p>
        </div>
      )}

      {data.phases?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>CAMPAIGN PHASES</h5>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.phases.map((phase, i) => (
              <div key={i} style={{ padding: 16, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h5 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Phase {i + 1}: {phase.phase_name}</h5>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {phase.duration && <span className="badge badge-info">{phase.duration}</span>}
                    {phase.budget_allocation && <span className="badge badge-success">{phase.budget_allocation}</span>}
                  </div>
                </div>
                {phase.activities?.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {phase.activities.map((a, j) => <li key={j}>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.kpi_targets && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>KPI TARGETS</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(data.kpi_targets).map(([kpi, val]) => (
              <span key={kpi} style={{ padding: '6px 14px', background: 'var(--primary-bg, #eef2ff)', border: '1px solid var(--primary)', borderRadius: 20, fontSize: 13 }}>
                <strong style={{ textTransform: 'capitalize' }}>{kpi.replace(/_/g, ' ')}:</strong> {String(val)}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.success_metrics?.length > 0 && (
        <div>
          <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>SUCCESS METRICS</h5>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.success_metrics.map((m, i) => <li key={i} style={{ fontSize: 14, padding: '3px 0' }}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderAIResult(toolId, responseData) {
  const { data, raw } = responseData || {};

  // Tool-specific structured renders
  if (data && typeof data === 'object') {
    if (toolId === 'outreach' && (data.subject_line || data.email_body || data.dm_version)) {
      return <OutreachCards data={data} />;
    }
    if (toolId === 'sentiment' && data.overall_sentiment !== undefined) {
      return <SentimentCards data={data} />;
    }
    if (toolId === 'strategy' && (data.strategy_overview || data.phases)) {
      return <CampaignStrategyCards data={data} />;
    }
  }

  // Generic structured object render
  if (data && typeof data === 'object') {
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
        {Object.entries(data).map(([key, val]) => {
          const IconComp = icons[key] || Sparkles;
          return (
            <div className="ai-result-section" key={key} style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 12, border: '1px solid var(--border-light)' }}>
              <h5><IconComp size={16} style={{ color: 'var(--primary)' }} />{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
              <div style={{ marginTop: 8 }}>{renderValue(val)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: show raw text
  const text = raw || (typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2));
  return (
    <div className="ai-result-body">
      <div className="ai-result-section">
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14, color: 'var(--text-secondary)' }}>{text}</p>
      </div>
    </div>
  );
}

export default function AITools() {
  const [activeTool, setActiveTool] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [references, setReferences] = useState({ influencers: [], campaigns: [] });
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(['influencers', 'campaigns'].map(async (source) => {
      try {
        const response = await api.get(`/${source}`, { params: { page: 1, limit: 100 }, signal: controller.signal });
        return [source, Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : []];
      } catch (failure) {
        if (failure.name === 'CanceledError' || failure.name === 'AbortError') return [source, []];
        return [source, []];
      }
    })).then((entries) => setReferences(Object.fromEntries(entries)));
    return () => controller.abort();
  }, []);

  const handleGenerate = async () => {
    if (!activeTool) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const structuredFields = new Set(['demographics', 'interests', 'engagement_data', 'past_performance']);
      const body = Object.fromEntries(Object.entries(formData).map(([key, value]) => {
        if (!structuredFields.has(key) || typeof value !== 'string') return [key, value];
        try { return [key, JSON.parse(value)]; } catch (_) { return [key, value]; }
      }));
      const res = await api.post(activeTool.endpoint, body);
      setResult(res.data);
      setHistoryRefresh((value) => value + 1);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('AI request limit reached. Please wait before trying again.');
      } else {
        setError(err.response?.data?.error || 'AI generation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (activeTool) {
    return (
      <NativeAIControls busy={loading} context="InfluencerManagementPlatform" presets={toolPresets(activeTool, references, formData, setFormData)}><div>
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
                {field.type === 'select' || field.type === 'reference' ? (
                  <select data-ai-field={field.name} className="form-control" value={formData[field.name] || ''} onChange={e => setFormData({...formData, [field.name]: e.target.value})}>
                    <option value="">{field.type === 'reference' ? `Select ${field.placeholder.toLowerCase()}…` : 'Select...'}</option>
                    {(field.type === 'reference' ? references[field.source] || [] : field.options).map((option) => field.type === 'reference'
                      ? <option key={option.id} value={option.id}>{option.name || option.title || option.email || `Record ${option.id}`} (#{option.id})</option>
                      : <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea data-ai-field={field.name} className="form-control" placeholder={field.placeholder} value={formData[field.name] || ''} onChange={e => setFormData({...formData, [field.name]: e.target.value})} />
                ) : (
                  <input data-ai-field={field.name} className="form-control" type={field.type} placeholder={field.placeholder} value={formData[field.name] || ''} onChange={e => setFormData({...formData, [field.name]: e.target.value})} />
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

        {result && <FormattedAIReport response={result} title={`${activeTool.title} result`} />}
        <AIResultHistory tool={activeTool.historyTool} title={activeTool.title} refreshKey={historyRefresh} />
      </div></NativeAIControls>
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
