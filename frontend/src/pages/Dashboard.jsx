import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Megaphone, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, FileText, Bot, Building2 } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats').then(r => r.data).catch(() => ({ total_influencers: 0, active_campaigns: 0, total_spend: 0, avg_roi: 0 })),
      api.get('/campaigns').then(r => (r.data.data || r.data || []).slice(0, 5)).catch(() => []),
      api.get('/influencers').then(r => (r.data.data || r.data || []).slice(0, 5)).catch(() => []),
    ]).then(([s, c, i]) => {
      setStats(s);
      setCampaigns(c);
      setInfluencers(i);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /><p>Loading dashboard...</p></div>;

  const statCards = [
    { title: 'Total Influencers', value: stats?.total_influencers ?? 0, change: 12, icon: Users, color: 'purple', path: '/influencers' },
    { title: 'Active Campaigns', value: stats?.active_campaigns ?? 0, change: 8, icon: Megaphone, color: 'green', path: '/campaigns' },
    { title: 'Total Spend', value: `$${(stats?.total_spend ?? 0).toLocaleString()}`, change: 15, icon: DollarSign, color: 'orange', path: '/payments' },
    { title: 'Average ROI', value: `${(stats?.avg_roi ?? 0).toFixed(1)}%`, change: 5, icon: TrendingUp, color: 'blue', path: '/roi-calculator' },
  ];

  const quickLinks = [
    { title: 'Content Calendar', icon: Calendar, path: '/content-calendar', color: '#6366f1', bg: '#eef2ff' },
    { title: 'Contracts', icon: FileText, path: '/contracts', color: '#10b981', bg: '#d1fae5' },
    { title: 'AI Tools', icon: Bot, path: '/ai-tools', color: '#8b5cf6', bg: '#f5f3ff' },
    { title: 'Brands', icon: Building2, path: '/brands', color: '#f59e0b', bg: '#fef3c7' },
  ];

  const statusColor = (s) => {
    const map = { active: 'badge-success', completed: 'badge-info', planned: 'badge-warning', draft: 'badge-primary', paused: 'badge-danger' };
    return map[s] || 'badge-primary';
  };

  return (
    <div>
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.title} className="stat-card" onClick={() => navigate(card.path)}>
            <div className={`stat-card-icon ${card.color}`}>
              <card.icon size={24} />
            </div>
            <h4>{card.title}</h4>
            <div className="stat-value">{card.value}</div>
            <div className={`stat-change ${card.change >= 0 ? 'positive' : 'negative'}`}>
              {card.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(card.change)}% from last month
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Campaigns</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/campaigns')}>View All</button>
          </div>
          <div style={{ padding: 0 }}>
            {campaigns.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No campaigns yet</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Name</th><th>Status</th><th>Budget</th></tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} onClick={() => navigate('/campaigns')}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td><span className={`badge ${statusColor(c.status)}`}>{c.status}</span></td>
                      <td>${Number(c.budget || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Top Influencers</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/influencers')}>View All</button>
          </div>
          <div style={{ padding: 0 }}>
            {influencers.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No influencers yet</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Name</th><th>Platform</th><th>Followers</th><th>Engagement</th></tr>
                </thead>
                <tbody>
                  {influencers.map(i => (
                    <tr key={i.id} onClick={() => navigate('/influencers')}>
                      <td style={{ fontWeight: 600 }}>{i.name}</td>
                      <td><span className="badge badge-primary">{i.platform}</span></td>
                      <td>{Number(i.followers || 0).toLocaleString()}</td>
                      <td>{i.engagement_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {quickLinks.map(link => (
          <div key={link.title} className="card" style={{ cursor: 'pointer', padding: 20, display: 'flex', alignItems: 'center', gap: 14 }} onClick={() => navigate(link.path)}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: link.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <link.icon size={22} style={{ color: link.color }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{link.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Quick access</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
