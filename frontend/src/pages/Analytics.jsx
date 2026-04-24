import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, BarChart3, TrendingUp, Eye, Heart, Share2 } from 'lucide-react';
import api from '../api';

const emptyForm = { campaign: '', influencer: '', platform: 'Instagram', impressions: '', reach: '', engagement: '', clicks: '', conversions: '', revenue: '', date: '', notes: '' };

export default function Analytics() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/analytics').then(r => setItems(r.data.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/analytics/${selected._id || selected.id}`, form); showToast('Analytics updated'); }
      else { await api.post('/analytics', form); showToast('Analytics entry created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/analytics/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); }
    catch { showToast('Delete failed', 'error'); }
  };

  const openEdit = (item) => {
    setForm({ campaign: item.campaign||'', influencer: item.influencer||'', platform: item.platform||'Instagram', impressions: item.impressions||'', reach: item.reach||'', engagement: item.engagement||'', clicks: item.clicks||'', conversions: item.conversions||'', revenue: item.revenue||'', date: item.date ? item.date.slice(0,10) : '', notes: item.notes||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.campaign||'').toLowerCase().includes(search.toLowerCase()) || (i.influencer||'').toLowerCase().includes(search.toLowerCase()));

  // Summary stats
  const totalImpressions = items.reduce((s, i) => s + (i.impressions || 0), 0);
  const totalReach = items.reduce((s, i) => s + (i.reach || 0), 0);
  const totalEngagement = items.reduce((s, i) => s + (i.engagement || 0), 0);
  const totalRevenue = items.reduce((s, i) => s + (i.revenue || 0), 0);

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
        <div className="detail-view">
          <div className="detail-header">
            <h2>Analytics: {selected.campaign || 'Entry'}</h2>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon purple"><Eye size={24} /></div><h4>Impressions</h4><div className="stat-value">{(selected.impressions||0).toLocaleString()}</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon green"><TrendingUp size={24} /></div><h4>Reach</h4><div className="stat-value">{(selected.reach||0).toLocaleString()}</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon orange"><Heart size={24} /></div><h4>Engagement</h4><div className="stat-value">{(selected.engagement||0).toLocaleString()}</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon blue"><Share2 size={24} /></div><h4>Clicks</h4><div className="stat-value">{(selected.clicks||0).toLocaleString()}</div></div>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Campaign</label><p>{selected.campaign||'N/A'}</p></div>
              <div className="detail-field"><label>Influencer</label><p>{selected.influencer||'N/A'}</p></div>
              <div className="detail-field"><label>Platform</label><p>{selected.platform}</p></div>
              <div className="detail-field"><label>Conversions</label><p>{(selected.conversions||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Revenue</label><p>${(selected.revenue||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Date</label><p>{selected.date ? new Date(selected.date).toLocaleDateString() : 'N/A'}</p></div>
            </div>
            {selected.notes && <div className="detail-field" style={{ marginTop: 20 }}><label>Notes</label><p>{selected.notes}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete?</h4><p>Delete this analytics entry?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon purple"><Eye size={24} /></div><h4>Total Impressions</h4><div className="stat-value">{totalImpressions.toLocaleString()}</div></div>
        <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon green"><TrendingUp size={24} /></div><h4>Total Reach</h4><div className="stat-value">{totalReach.toLocaleString()}</div></div>
        <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon orange"><Heart size={24} /></div><h4>Total Engagement</h4><div className="stat-value">{totalEngagement.toLocaleString()}</div></div>
        <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon blue"><Share2 size={24} /></div><h4>Total Revenue</h4><div className="stat-value">${totalRevenue.toLocaleString()}</div></div>
      </div>
      <div className="table-container">
        <div className="table-header">
          <h3>Analytics Data ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add Entry</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><BarChart3 size={48} /><h4>No analytics data</h4></div> :
        <table><thead><tr><th>Campaign</th><th>Influencer</th><th>Platform</th><th>Impressions</th><th>Reach</th><th>Engagement</th><th>Revenue</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.campaign||'N/A'}</td><td>{item.influencer||'N/A'}</td>
              <td><span className="badge badge-primary">{item.platform}</span></td>
              <td>{(item.impressions||0).toLocaleString()}</td><td>{(item.reach||0).toLocaleString()}</td>
              <td>{(item.engagement||0).toLocaleString()}</td><td>${(item.revenue||0).toLocaleString()}</td>
            </tr>))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add'} Analytics</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label>Campaign</label><input className="form-control" value={form.campaign} onChange={e => setForm({...form, campaign: e.target.value})} /></div>
            <div className="form-group"><label>Influencer</label><input className="form-control" value={form.influencer} onChange={e => setForm({...form, influencer: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Platform</label><select className="form-control" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}><option>Instagram</option><option>YouTube</option><option>TikTok</option><option>Twitter</option></select></div>
            <div className="form-group"><label>Date</label><input className="form-control" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Impressions</label><input className="form-control" type="number" value={form.impressions} onChange={e => setForm({...form, impressions: e.target.value})} /></div>
            <div className="form-group"><label>Reach</label><input className="form-control" type="number" value={form.reach} onChange={e => setForm({...form, reach: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Engagement</label><input className="form-control" type="number" value={form.engagement} onChange={e => setForm({...form, engagement: e.target.value})} /></div>
            <div className="form-group"><label>Clicks</label><input className="form-control" type="number" value={form.clicks} onChange={e => setForm({...form, clicks: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Conversions</label><input className="form-control" type="number" value={form.conversions} onChange={e => setForm({...form, conversions: e.target.value})} /></div>
            <div className="form-group"><label>Revenue ($)</label><input className="form-control" type="number" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} /></div></div>
            <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
