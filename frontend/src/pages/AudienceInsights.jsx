import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Eye, Users, MapPin, Clock } from 'lucide-react';
import api from '../api';

const emptyForm = { influencer: '', platform: 'Instagram', total_audience: '', age_group: '', gender_split: '', top_locations: '', interests: '', active_hours: '', growth_rate: '', authenticity_score: '', notes: '' };

export default function AudienceInsights() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = () => { setLoading(true); api.get('/audience-insights').then(r => setItems(r.data.data || r.data || [])).catch(() => setItems([])).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/audience-insights/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/audience-insights', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => { try { await api.delete(`/audience-insights/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); } catch { showToast('Failed', 'error'); } };

  const openEdit = (item) => {
    setForm({ influencer: item.influencer||'', platform: item.platform||'Instagram', total_audience: item.total_audience||'', age_group: item.age_group||'', gender_split: item.gender_split||'', top_locations: item.top_locations||'', interests: item.interests||'', active_hours: item.active_hours||'', growth_rate: item.growth_rate||'', authenticity_score: item.authenticity_score||'', notes: item.notes||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.influencer||'').toLowerCase().includes(search.toLowerCase()));

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
        <div className="detail-view">
          <div className="detail-header">
            <h2>Audience: {selected.influencer || 'Insight'}</h2>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon purple"><Users size={24} /></div><h4>Total Audience</h4><div className="stat-value">{(selected.total_audience||0).toLocaleString()}</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon green"><Eye size={24} /></div><h4>Growth Rate</h4><div className="stat-value">{selected.growth_rate||0}%</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon blue"><Clock size={24} /></div><h4>Authenticity</h4><div className="stat-value">{selected.authenticity_score||0}%</div></div>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Influencer</label><p>{selected.influencer}</p></div>
              <div className="detail-field"><label>Platform</label><p>{selected.platform}</p></div>
              <div className="detail-field"><label>Age Group</label><p>{selected.age_group||'N/A'}</p></div>
              <div className="detail-field"><label>Gender Split</label><p>{selected.gender_split||'N/A'}</p></div>
              <div className="detail-field"><label>Top Locations</label><p>{selected.top_locations||'N/A'}</p></div>
              <div className="detail-field"><label>Interests</label><p>{selected.interests||'N/A'}</p></div>
              <div className="detail-field"><label>Active Hours</label><p>{selected.active_hours||'N/A'}</p></div>
            </div>
            {selected.notes && <div className="detail-field" style={{ marginTop: 20 }}><label>Notes</label><p>{selected.notes}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete?</h4><p>Delete this audience insight?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>Audience Insights ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add Insight</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><Eye size={48} /><h4>No audience insights</h4></div> :
        <table><thead><tr><th>Influencer</th><th>Platform</th><th>Audience</th><th>Age Group</th><th>Growth</th><th>Authenticity</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.influencer||'N/A'}</td>
              <td><span className="badge badge-primary">{item.platform}</span></td>
              <td>{(item.total_audience||0).toLocaleString()}</td>
              <td>{item.age_group||'N/A'}</td>
              <td>{item.growth_rate||0}%</td>
              <td><span className={`badge ${(item.authenticity_score||0) >= 80 ? 'badge-success' : (item.authenticity_score||0) >= 50 ? 'badge-warning' : 'badge-danger'}`}>{item.authenticity_score||0}%</span></td>
            </tr>))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add'} Audience Insight</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label>Influencer *</label><input className="form-control" required value={form.influencer} onChange={e => setForm({...form, influencer: e.target.value})} /></div>
            <div className="form-group"><label>Platform</label><select className="form-control" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}><option>Instagram</option><option>YouTube</option><option>TikTok</option><option>Twitter</option></select></div></div>
            <div className="form-row"><div className="form-group"><label>Total Audience</label><input className="form-control" type="number" value={form.total_audience} onChange={e => setForm({...form, total_audience: e.target.value})} /></div>
            <div className="form-group"><label>Growth Rate (%)</label><input className="form-control" type="number" step="0.1" value={form.growth_rate} onChange={e => setForm({...form, growth_rate: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Age Group</label><input className="form-control" value={form.age_group} onChange={e => setForm({...form, age_group: e.target.value})} placeholder="e.g. 18-34" /></div>
            <div className="form-group"><label>Gender Split</label><input className="form-control" value={form.gender_split} onChange={e => setForm({...form, gender_split: e.target.value})} placeholder="e.g. 60% F / 40% M" /></div></div>
            <div className="form-row"><div className="form-group"><label>Authenticity Score (%)</label><input className="form-control" type="number" value={form.authenticity_score} onChange={e => setForm({...form, authenticity_score: e.target.value})} /></div>
            <div className="form-group"><label>Active Hours</label><input className="form-control" value={form.active_hours} onChange={e => setForm({...form, active_hours: e.target.value})} placeholder="e.g. 9AM-11PM" /></div></div>
            <div className="form-group"><label>Top Locations</label><input className="form-control" value={form.top_locations} onChange={e => setForm({...form, top_locations: e.target.value})} /></div>
            <div className="form-group"><label>Interests</label><input className="form-control" value={form.interests} onChange={e => setForm({...form, interests: e.target.value})} /></div>
            <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
