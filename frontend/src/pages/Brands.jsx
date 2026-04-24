import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Building2 } from 'lucide-react';
import api from '../api';

const emptyForm = { name: '', industry: '', contact_name: '', contact_email: '', website: '', budget: '', location: '', description: '', logo_url: '' };

export default function Brands() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = () => { setLoading(true); api.get('/brands').then(r => setItems(r.data.data || r.data || [])).catch(() => setItems([])).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/brands/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/brands', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => { try { await api.delete(`/brands/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); } catch { showToast('Failed', 'error'); } };

  const openEdit = (item) => {
    setForm({ name: item.name||'', industry: item.industry||'', contact_name: item.contact_name||'', contact_email: item.contact_email||'', website: item.website||'', budget: item.budget||'', location: item.location||'', description: item.description||'', logo_url: item.logo_url||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.name||'').toLowerCase().includes(search.toLowerCase()) || (i.industry||'').toLowerCase().includes(search.toLowerCase()));

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
              <div className="detail-field"><label>Industry</label><p>{selected.industry||'N/A'}</p></div>
              <div className="detail-field"><label>Contact Name</label><p>{selected.contact_name||'N/A'}</p></div>
              <div className="detail-field"><label>Contact Email</label><p>{selected.contact_email||'N/A'}</p></div>
              <div className="detail-field"><label>Website</label><p>{selected.website||'N/A'}</p></div>
              <div className="detail-field"><label>Budget</label><p>${(selected.budget||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Location</label><p>{selected.location||'N/A'}</p></div>
            </div>
            {selected.description && <div className="detail-field" style={{ marginTop: 20 }}><label>Description</label><p>{selected.description}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete Brand?</h4><p>Delete "{confirmDelete.name}"?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>All Brands ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search brands..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add Brand</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><Building2 size={48} /><h4>No brands found</h4></div> :
        <table><thead><tr><th>Name</th><th>Industry</th><th>Contact</th><th>Email</th><th>Budget</th><th>Location</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.name}</td><td>{item.industry||'N/A'}</td>
              <td>{item.contact_name||'N/A'}</td><td>{item.contact_email||'N/A'}</td>
              <td>${(item.budget||0).toLocaleString()}</td><td>{item.location||'N/A'}</td>
            </tr>))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add'} Brand</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label>Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="form-group"><label>Industry</label><input className="form-control" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Contact Name</label><input className="form-control" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} /></div>
            <div className="form-group"><label>Contact Email</label><input className="form-control" type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Website</label><input className="form-control" value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
            <div className="form-group"><label>Budget ($)</label><input className="form-control" type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} /></div></div>
            <div className="form-group"><label>Location</label><input className="form-control" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
            <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
