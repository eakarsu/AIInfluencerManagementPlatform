import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Megaphone } from 'lucide-react';
import api from '../api';

const emptyForm = { name: '', brand: '', status: 'Draft', budget: '', start_date: '', end_date: '', platform: 'Instagram', description: '', goals: '', target_audience: '' };
const statusColors = { Draft: 'badge-info', Active: 'badge-success', Completed: 'badge-primary', Paused: 'badge-warning', Cancelled: 'badge-danger' };

export default function Campaigns() {
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
    api.get('/campaigns').then(r => setItems(r.data.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/campaigns/${selected._id || selected.id}`, form); showToast('Campaign updated'); }
      else { await api.post('/campaigns', form); showToast('Campaign created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Operation failed', 'error'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/campaigns/${confirmDelete._id || confirmDelete.id}`); showToast('Campaign deleted'); setConfirmDelete(null); setSelected(null); fetchData(); }
    catch { showToast('Delete failed', 'error'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', brand: item.brand || '', status: item.status || 'Draft', budget: item.budget || '', start_date: item.start_date ? item.start_date.slice(0,10) : '', end_date: item.end_date ? item.end_date.slice(0,10) : '', platform: item.platform || 'Instagram', description: item.description || '', goals: item.goals || '', target_audience: item.target_audience || '' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.name||'').toLowerCase().includes(search.toLowerCase()) || (i.brand||'').toLowerCase().includes(search.toLowerCase()));

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back to Campaigns</button>
        <div className="detail-view">
          <div className="detail-header">
            <div><h2>{selected.name}</h2><span className={`badge ${statusColors[selected.status] || 'badge-info'}`} style={{ marginTop: 8 }}>{selected.status || 'Draft'}</span></div>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><label>Campaign Name</label><p>{selected.name}</p></div>
              <div className="detail-field"><label>Brand</label><p>{selected.brand || 'N/A'}</p></div>
              <div className="detail-field"><label>Budget</label><p>${(selected.budget || 0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Platform</label><p>{selected.platform || 'Instagram'}</p></div>
              <div className="detail-field"><label>Start Date</label><p>{selected.start_date ? new Date(selected.start_date).toLocaleDateString() : 'N/A'}</p></div>
              <div className="detail-field"><label>End Date</label><p>{selected.end_date ? new Date(selected.end_date).toLocaleDateString() : 'N/A'}</p></div>
              <div className="detail-field"><label>Target Audience</label><p>{selected.target_audience || 'N/A'}</p></div>
              <div className="detail-field"><label>Goals</label><p>{selected.goals || 'N/A'}</p></div>
            </div>
            {selected.description && <div className="detail-field" style={{ marginTop: 20 }}><label>Description</label><p>{selected.description}</p></div>}
          </div>
        </div>
        {confirmDelete && (
          <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete Campaign?</h4><p>Are you sure you want to delete "{confirmDelete.name}"?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>
        )}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>All Campaigns ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add New</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /><p>Loading...</p></div> :
        filtered.length === 0 ? <div className="empty-state"><Megaphone size={48} /><h4>No campaigns found</h4><p>Create your first campaign</p></div> :
        <table><thead><tr><th>Name</th><th>Brand</th><th>Status</th><th>Budget</th><th>Platform</th><th>Start</th><th>End</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id || item.id || i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.name}</td><td>{item.brand || 'N/A'}</td>
              <td><span className={`badge ${statusColors[item.status] || 'badge-info'}`}>{item.status || 'Draft'}</span></td>
              <td>${(item.budget || 0).toLocaleString()}</td><td>{item.platform || 'N/A'}</td>
              <td>{item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</td>
              <td>{item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add New'} Campaign</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label>Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="form-group"><label>Brand</label><input className="form-control" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Status</label><select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>Draft</option><option>Active</option><option>Completed</option><option>Paused</option><option>Cancelled</option></select></div>
            <div className="form-group"><label>Budget ($)</label><input className="form-control" type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Start Date</label><input className="form-control" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
            <div className="form-group"><label>End Date</label><input className="form-control" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Platform</label><select className="form-control" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}><option>Instagram</option><option>YouTube</option><option>TikTok</option><option>Twitter</option><option>LinkedIn</option><option>Multi-Platform</option></select></div>
            <div className="form-group"><label>Target Audience</label><input className="form-control" value={form.target_audience} onChange={e => setForm({...form, target_audience: e.target.value})} /></div></div>
            <div className="form-group"><label>Goals</label><input className="form-control" value={form.goals} onChange={e => setForm({...form, goals: e.target.value})} /></div>
            <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
