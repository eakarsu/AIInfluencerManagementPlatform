import React, { useEffect, useState } from 'react';
import api from '../api';

const empty = { name: '', brand_category: '', min_followers: 10000, min_engagement: 2.0, platforms: 'Instagram', priority: 'medium' };

export default function MatchingRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');

  const load = () => {
    api.get('/custom-views/matching-rules')
      .then((r) => setRules(r.data?.data || []))
      .catch((e) => setStatus('Load error: ' + e.message));
  };

  useEffect(load, []);

  const reset = () => { setForm(empty); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      min_followers: Number(form.min_followers),
      min_engagement: Number(form.min_engagement),
      platforms: String(form.platforms || '').split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await api.put(`/custom-views/matching-rules/${editingId}`, payload);
        setStatus('Rule updated');
      } else {
        await api.post('/custom-views/matching-rules', payload);
        setStatus('Rule created');
      }
      reset();
      load();
    } catch (err) {
      setStatus('Save error: ' + (err.response?.data?.error || err.message));
    }
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      brand_category: r.brand_category,
      min_followers: r.min_followers,
      min_engagement: r.min_engagement,
      platforms: (r.platforms || []).join(','),
      priority: r.priority,
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await api.delete(`/custom-views/matching-rules/${id}`);
      setStatus('Rule deleted');
      load();
    } catch (err) {
      setStatus('Delete error: ' + err.message);
    }
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Brand-Influencer Matching Rules</h3>
      <p style={{ color: '#64748b', marginTop: 4 }}>Define category, follower, engagement, and platform criteria</p>

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
        <input placeholder="Rule name" value={form.name} onChange={upd('name')} required style={inp} />
        <input placeholder="Brand category" value={form.brand_category} onChange={upd('brand_category')} required style={inp} />
        <input placeholder="Min followers" type="number" value={form.min_followers} onChange={upd('min_followers')} style={inp} />
        <input placeholder="Min engagement %" type="number" step="0.1" value={form.min_engagement} onChange={upd('min_engagement')} style={inp} />
        <input placeholder="Platforms (csv)" value={form.platforms} onChange={upd('platforms')} style={inp} />
        <select value={form.priority} onChange={upd('priority')} style={inp}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <div style={{ gridColumn: 'span 3', display: 'flex', gap: 8 }}>
          <button type="submit" style={btnPrimary}>{editingId ? 'Update Rule' : 'Add Rule'}</button>
          {editingId && <button type="button" onClick={reset} style={btnSecondary}>Cancel</button>}
          {status && <span style={{ color: '#475569', alignSelf: 'center', fontSize: 13 }}>{status}</span>}
        </div>
      </form>

      <table style={{ width: '100%', marginTop: 18, fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#64748b' }}>
            <th style={{ padding: 6 }}>Name</th><th>Category</th><th>Min Followers</th><th>Min Eng %</th><th>Platforms</th><th>Priority</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={{ padding: 6 }}>{r.name}</td>
              <td>{r.brand_category}</td>
              <td>{(r.min_followers || 0).toLocaleString()}</td>
              <td>{r.min_engagement}</td>
              <td>{(r.platforms || []).join(', ')}</td>
              <td>{r.priority}</td>
              <td style={{ textAlign: 'right' }}>
                <button onClick={() => edit(r)} style={btnLink}>Edit</button>
                <button onClick={() => remove(r.id)} style={{ ...btnLink, color: '#dc2626' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inp = { padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 };
const btnPrimary = { padding: '8px 14px', background: '#6366f1', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' };
const btnSecondary = { padding: '8px 14px', background: '#e2e8f0', color: '#0f172a', border: 0, borderRadius: 6, cursor: 'pointer' };
const btnLink = { padding: '4px 8px', background: 'transparent', color: '#6366f1', border: 0, cursor: 'pointer', fontSize: 13 };
