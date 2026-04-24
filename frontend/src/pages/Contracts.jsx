import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, FileText } from 'lucide-react';
import api from '../api';

const emptyForm = { title: '', influencer: '', brand: '', status: 'Draft', value: '', start_date: '', end_date: '', terms: '', deliverables: '', payment_terms: '' };
const statusColors = { Draft: 'badge-info', Pending: 'badge-warning', Active: 'badge-success', Completed: 'badge-primary', Terminated: 'badge-danger' };

export default function Contracts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = () => { setLoading(true); api.get('/contracts').then(r => setItems(r.data.data || r.data || [])).catch(() => setItems([])).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/contracts/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/contracts', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => { try { await api.delete(`/contracts/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); } catch { showToast('Failed', 'error'); } };

  const openEdit = (item) => {
    setForm({ title: item.title||'', influencer: item.influencer||'', brand: item.brand||'', status: item.status||'Draft', value: item.value||'', start_date: item.start_date ? item.start_date.slice(0,10) : '', end_date: item.end_date ? item.end_date.slice(0,10) : '', terms: item.terms||'', deliverables: item.deliverables||'', payment_terms: item.payment_terms||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.title||'').toLowerCase().includes(search.toLowerCase()) || (i.influencer||'').toLowerCase().includes(search.toLowerCase()));

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
        <div className="detail-view">
          <div className="detail-header">
            <div><h2>{selected.title}</h2><span className={`badge ${statusColors[selected.status]||'badge-info'}`} style={{ marginTop: 8 }}>{selected.status}</span></div>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><label>Title</label><p>{selected.title}</p></div>
              <div className="detail-field"><label>Influencer</label><p>{selected.influencer||'N/A'}</p></div>
              <div className="detail-field"><label>Brand</label><p>{selected.brand||'N/A'}</p></div>
              <div className="detail-field"><label>Value</label><p>${(selected.value||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Start Date</label><p>{selected.start_date ? new Date(selected.start_date).toLocaleDateString() : 'N/A'}</p></div>
              <div className="detail-field"><label>End Date</label><p>{selected.end_date ? new Date(selected.end_date).toLocaleDateString() : 'N/A'}</p></div>
            </div>
            {selected.terms && <div className="detail-field" style={{ marginTop: 20 }}><label>Terms</label><p>{selected.terms}</p></div>}
            {selected.deliverables && <div className="detail-field" style={{ marginTop: 12 }}><label>Deliverables</label><p>{selected.deliverables}</p></div>}
            {selected.payment_terms && <div className="detail-field" style={{ marginTop: 12 }}><label>Payment Terms</label><p>{selected.payment_terms}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete Contract?</h4><p>Delete "{confirmDelete.title}"?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>All Contracts ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add New</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><FileText size={48} /><h4>No contracts found</h4></div> :
        <table><thead><tr><th>Title</th><th>Influencer</th><th>Brand</th><th>Status</th><th>Value</th><th>Start</th><th>End</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.title}</td><td>{item.influencer||'N/A'}</td><td>{item.brand||'N/A'}</td>
              <td><span className={`badge ${statusColors[item.status]||'badge-info'}`}>{item.status}</span></td>
              <td>${(item.value||0).toLocaleString()}</td>
              <td>{item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</td>
              <td>{item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</td>
            </tr>))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add'} Contract</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-group"><label>Title *</label><input className="form-control" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="form-row"><div className="form-group"><label>Influencer</label><input className="form-control" value={form.influencer} onChange={e => setForm({...form, influencer: e.target.value})} /></div>
            <div className="form-group"><label>Brand</label><input className="form-control" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Status</label><select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>Draft</option><option>Pending</option><option>Active</option><option>Completed</option><option>Terminated</option></select></div>
            <div className="form-group"><label>Value ($)</label><input className="form-control" type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Start Date</label><input className="form-control" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
            <div className="form-group"><label>End Date</label><input className="form-control" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div></div>
            <div className="form-group"><label>Terms</label><textarea className="form-control" value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} /></div>
            <div className="form-group"><label>Deliverables</label><textarea className="form-control" value={form.deliverables} onChange={e => setForm({...form, deliverables: e.target.value})} /></div>
            <div className="form-group"><label>Payment Terms</label><input className="form-control" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
