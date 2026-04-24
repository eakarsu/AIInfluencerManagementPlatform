import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Trophy } from 'lucide-react';
import api from '../api';

const emptyForm = { name: '', category: '', platform: 'Instagram', metric: '', value: '', industry_average: '', top_performer: '', period: '', source: '', notes: '' };

export default function Benchmarks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = () => { setLoading(true); api.get('/benchmarks').then(r => setItems(r.data.data || r.data || [])).catch(() => setItems([])).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/benchmarks/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/benchmarks', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => { try { await api.delete(`/benchmarks/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); } catch { showToast('Failed', 'error'); } };

  const openEdit = (item) => {
    setForm({ name: item.name||'', category: item.category||'', platform: item.platform||'Instagram', metric: item.metric||'', value: item.value||'', industry_average: item.industry_average||'', top_performer: item.top_performer||'', period: item.period||'', source: item.source||'', notes: item.notes||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.name||'').toLowerCase().includes(search.toLowerCase()) || (i.metric||'').toLowerCase().includes(search.toLowerCase()));

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.name || selected.metric}</h2>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card" style={{ cursor: 'default' }}><h4>Your Value</h4><div className="stat-value" style={{ color: 'var(--primary)' }}>{selected.value || 'N/A'}</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><h4>Industry Average</h4><div className="stat-value" style={{ color: 'var(--warning)' }}>{selected.industry_average || 'N/A'}</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><h4>Top Performer</h4><div className="stat-value" style={{ color: 'var(--success)' }}>{selected.top_performer || 'N/A'}</div></div>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Name</label><p>{selected.name}</p></div>
              <div className="detail-field"><label>Category</label><p>{selected.category||'N/A'}</p></div>
              <div className="detail-field"><label>Platform</label><p>{selected.platform}</p></div>
              <div className="detail-field"><label>Metric</label><p>{selected.metric||'N/A'}</p></div>
              <div className="detail-field"><label>Period</label><p>{selected.period||'N/A'}</p></div>
              <div className="detail-field"><label>Source</label><p>{selected.source||'N/A'}</p></div>
            </div>
            {selected.notes && <div className="detail-field" style={{ marginTop: 20 }}><label>Notes</label><p>{selected.notes}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete?</h4><p>Delete this benchmark?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>Benchmarks ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add Benchmark</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><Trophy size={48} /><h4>No benchmarks</h4></div> :
        <table><thead><tr><th>Name</th><th>Platform</th><th>Metric</th><th>Value</th><th>Avg</th><th>Top</th><th>Period</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.name||'N/A'}</td>
              <td><span className="badge badge-primary">{item.platform}</span></td>
              <td>{item.metric||'N/A'}</td>
              <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.value||'N/A'}</td>
              <td>{item.industry_average||'N/A'}</td>
              <td>{item.top_performer||'N/A'}</td>
              <td>{item.period||'N/A'}</td>
            </tr>))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add'} Benchmark</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label>Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="form-group"><label>Category</label><input className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Platform</label><select className="form-control" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}><option>Instagram</option><option>YouTube</option><option>TikTok</option><option>Twitter</option><option>All</option></select></div>
            <div className="form-group"><label>Metric</label><input className="form-control" value={form.metric} onChange={e => setForm({...form, metric: e.target.value})} placeholder="e.g. Engagement Rate" /></div></div>
            <div className="form-row"><div className="form-group"><label>Your Value</label><input className="form-control" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div>
            <div className="form-group"><label>Industry Average</label><input className="form-control" value={form.industry_average} onChange={e => setForm({...form, industry_average: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Top Performer</label><input className="form-control" value={form.top_performer} onChange={e => setForm({...form, top_performer: e.target.value})} /></div>
            <div className="form-group"><label>Period</label><input className="form-control" value={form.period} onChange={e => setForm({...form, period: e.target.value})} placeholder="e.g. Q1 2024" /></div></div>
            <div className="form-group"><label>Source</label><input className="form-control" value={form.source} onChange={e => setForm({...form, source: e.target.value})} /></div>
            <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
