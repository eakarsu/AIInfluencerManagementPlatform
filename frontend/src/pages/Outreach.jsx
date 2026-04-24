import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Send } from 'lucide-react';
import api from '../api';

const emptyForm = { influencer: '', brand: '', campaign: '', type: 'Email', status: 'Pending', subject: '', message: '', sent_date: '', response_date: '', notes: '' };
const statusColors = { Pending: 'badge-warning', Sent: 'badge-info', Responded: 'badge-success', Accepted: 'badge-success', Declined: 'badge-danger', 'Follow Up': 'badge-primary' };

export default function Outreach() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = () => { setLoading(true); api.get('/outreach').then(r => setItems(r.data.data || r.data || [])).catch(() => setItems([])).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/outreach/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/outreach', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => { try { await api.delete(`/outreach/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); } catch { showToast('Failed', 'error'); } };

  const openEdit = (item) => {
    setForm({ influencer: item.influencer||'', brand: item.brand||'', campaign: item.campaign||'', type: item.type||'Email', status: item.status||'Pending', subject: item.subject||'', message: item.message||'', sent_date: item.sent_date ? item.sent_date.slice(0,10) : '', response_date: item.response_date ? item.response_date.slice(0,10) : '', notes: item.notes||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.influencer||'').toLowerCase().includes(search.toLowerCase()) || (i.subject||'').toLowerCase().includes(search.toLowerCase()));

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
        <div className="detail-view">
          <div className="detail-header">
            <div><h2>{selected.subject || 'Outreach'}</h2><span className={`badge ${statusColors[selected.status]||'badge-info'}`} style={{ marginTop: 8 }}>{selected.status}</span></div>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><label>Influencer</label><p>{selected.influencer||'N/A'}</p></div>
              <div className="detail-field"><label>Brand</label><p>{selected.brand||'N/A'}</p></div>
              <div className="detail-field"><label>Campaign</label><p>{selected.campaign||'N/A'}</p></div>
              <div className="detail-field"><label>Type</label><p>{selected.type||'Email'}</p></div>
              <div className="detail-field"><label>Sent Date</label><p>{selected.sent_date ? new Date(selected.sent_date).toLocaleDateString() : 'N/A'}</p></div>
              <div className="detail-field"><label>Response Date</label><p>{selected.response_date ? new Date(selected.response_date).toLocaleDateString() : 'N/A'}</p></div>
            </div>
            {selected.message && <div className="detail-field" style={{ marginTop: 20 }}><label>Message</label><p style={{ whiteSpace: 'pre-wrap' }}>{selected.message}</p></div>}
            {selected.notes && <div className="detail-field" style={{ marginTop: 12 }}><label>Notes</label><p>{selected.notes}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete?</h4><p>Delete this outreach record?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>Outreach ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> New Outreach</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><Send size={48} /><h4>No outreach records</h4></div> :
        <table><thead><tr><th>Influencer</th><th>Subject</th><th>Type</th><th>Status</th><th>Brand</th><th>Sent</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.influencer||'N/A'}</td><td>{item.subject||'N/A'}</td>
              <td>{item.type||'Email'}</td>
              <td><span className={`badge ${statusColors[item.status]||'badge-info'}`}>{item.status}</span></td>
              <td>{item.brand||'N/A'}</td>
              <td>{item.sent_date ? new Date(item.sent_date).toLocaleDateString() : 'N/A'}</td>
            </tr>))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'New'} Outreach</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label>Influencer</label><input className="form-control" value={form.influencer} onChange={e => setForm({...form, influencer: e.target.value})} /></div>
            <div className="form-group"><label>Brand</label><input className="form-control" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Campaign</label><input className="form-control" value={form.campaign} onChange={e => setForm({...form, campaign: e.target.value})} /></div>
            <div className="form-group"><label>Type</label><select className="form-control" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option>Email</option><option>DM</option><option>Phone</option><option>In Person</option></select></div></div>
            <div className="form-row"><div className="form-group"><label>Status</label><select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>Pending</option><option>Sent</option><option>Responded</option><option>Accepted</option><option>Declined</option><option>Follow Up</option></select></div>
            <div className="form-group"><label>Sent Date</label><input className="form-control" type="date" value={form.sent_date} onChange={e => setForm({...form, sent_date: e.target.value})} /></div></div>
            <div className="form-group"><label>Subject</label><input className="form-control" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></div>
            <div className="form-group"><label>Message</label><textarea className="form-control" value={form.message} onChange={e => setForm({...form, message: e.target.value})} /></div>
            <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
