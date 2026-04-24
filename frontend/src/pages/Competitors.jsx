import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Swords } from 'lucide-react';
import api from '../api';

const emptyForm = { name: '', platform: 'Instagram', followers: '', engagement_rate: '', category: '', strengths: '', weaknesses: '', content_strategy: '', posting_frequency: '', website: '', notes: '' };

export default function Competitors() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = () => { setLoading(true); api.get('/competitors').then(r => setItems(r.data.data || r.data || [])).catch(() => setItems([])).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/competitors/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/competitors', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => { try { await api.delete(`/competitors/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); } catch { showToast('Failed', 'error'); } };

  const openEdit = (item) => {
    setForm({ name: item.name||'', platform: item.platform||'Instagram', followers: item.followers||'', engagement_rate: item.engagement_rate||'', category: item.category||'', strengths: item.strengths||'', weaknesses: item.weaknesses||'', content_strategy: item.content_strategy||'', posting_frequency: item.posting_frequency||'', website: item.website||'', notes: item.notes||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.name||'').toLowerCase().includes(search.toLowerCase()));

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.name}</h2>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><label>Name</label><p>{selected.name}</p></div>
              <div className="detail-field"><label>Platform</label><p>{selected.platform}</p></div>
              <div className="detail-field"><label>Followers</label><p>{(selected.followers||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Engagement Rate</label><p>{selected.engagement_rate||0}%</p></div>
              <div className="detail-field"><label>Category</label><p>{selected.category||'N/A'}</p></div>
              <div className="detail-field"><label>Posting Frequency</label><p>{selected.posting_frequency||'N/A'}</p></div>
              <div className="detail-field"><label>Website</label><p>{selected.website||'N/A'}</p></div>
            </div>
            {selected.strengths && <div className="detail-field" style={{ marginTop: 20 }}><label>Strengths</label><p>{selected.strengths}</p></div>}
            {selected.weaknesses && <div className="detail-field" style={{ marginTop: 12 }}><label>Weaknesses</label><p>{selected.weaknesses}</p></div>}
            {selected.content_strategy && <div className="detail-field" style={{ marginTop: 12 }}><label>Content Strategy</label><p>{selected.content_strategy}</p></div>}
            {selected.notes && <div className="detail-field" style={{ marginTop: 12 }}><label>Notes</label><p>{selected.notes}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete?</h4><p>Delete "{confirmDelete.name}"?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>Competitors ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add Competitor</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><Swords size={48} /><h4>No competitors tracked</h4></div> :
        <table><thead><tr><th>Name</th><th>Platform</th><th>Followers</th><th>Engagement</th><th>Category</th><th>Frequency</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.name}</td>
              <td><span className="badge badge-primary">{item.platform}</span></td>
              <td>{(item.followers||0).toLocaleString()}</td>
              <td>{item.engagement_rate||0}%</td>
              <td>{item.category||'N/A'}</td>
              <td>{item.posting_frequency||'N/A'}</td>
            </tr>))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add'} Competitor</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label>Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="form-group"><label>Platform</label><select className="form-control" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}><option>Instagram</option><option>YouTube</option><option>TikTok</option><option>Twitter</option></select></div></div>
            <div className="form-row"><div className="form-group"><label>Followers</label><input className="form-control" type="number" value={form.followers} onChange={e => setForm({...form, followers: e.target.value})} /></div>
            <div className="form-group"><label>Engagement Rate (%)</label><input className="form-control" type="number" step="0.1" value={form.engagement_rate} onChange={e => setForm({...form, engagement_rate: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Category</label><input className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
            <div className="form-group"><label>Posting Frequency</label><input className="form-control" value={form.posting_frequency} onChange={e => setForm({...form, posting_frequency: e.target.value})} placeholder="e.g. 3x/week" /></div></div>
            <div className="form-group"><label>Website</label><input className="form-control" value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
            <div className="form-group"><label>Strengths</label><textarea className="form-control" value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})} /></div>
            <div className="form-group"><label>Weaknesses</label><textarea className="form-control" value={form.weaknesses} onChange={e => setForm({...form, weaknesses: e.target.value})} /></div>
            <div className="form-group"><label>Content Strategy</label><textarea className="form-control" value={form.content_strategy} onChange={e => setForm({...form, content_strategy: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
