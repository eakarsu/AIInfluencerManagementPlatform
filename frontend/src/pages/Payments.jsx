import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, CreditCard, DollarSign } from 'lucide-react';
import api from '../api';

const emptyForm = { influencer: '', brand: '', campaign: '', amount: '', status: 'Pending', payment_method: 'Bank Transfer', date: '', invoice_number: '', notes: '' };
const statusColors = { Pending: 'badge-warning', Paid: 'badge-success', Overdue: 'badge-danger', Cancelled: 'badge-info', Processing: 'badge-primary' };

export default function Payments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchData = () => {
    setLoading(true);
    api.get(`/payments?page=${page}&limit=${limit}`)
      .then(r => { setItems(r.data.data || r.data || []); setTotalPages(r.data.pagination?.totalPages || 1); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, [page]);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/payments/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/payments', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => { try { await api.delete(`/payments/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); } catch { showToast('Failed', 'error'); } };

  const openEdit = (item) => {
    setForm({ influencer: item.influencer||'', brand: item.brand||'', campaign: item.campaign||'', amount: item.amount||'', status: item.status||'Pending', payment_method: item.payment_method||'Bank Transfer', date: item.date ? item.date.slice(0,10) : '', invoice_number: item.invoice_number||'', notes: item.notes||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.influencer||'').toLowerCase().includes(search.toLowerCase()) || (i.brand||'').toLowerCase().includes(search.toLowerCase()));
  const totalPaid = items.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = items.filter(i => i.status === 'Pending').reduce((s, i) => s + (i.amount || 0), 0);

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
        <div className="detail-view">
          <div className="detail-header">
            <div><h2>Payment: ${(selected.amount||0).toLocaleString()}</h2><span className={`badge ${statusColors[selected.status]||'badge-info'}`} style={{ marginTop: 8 }}>{selected.status}</span></div>
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
              <div className="detail-field"><label>Amount</label><p style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>${(selected.amount||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Payment Method</label><p>{selected.payment_method||'N/A'}</p></div>
              <div className="detail-field"><label>Invoice #</label><p>{selected.invoice_number||'N/A'}</p></div>
              <div className="detail-field"><label>Date</label><p>{selected.date ? new Date(selected.date).toLocaleDateString() : 'N/A'}</p></div>
            </div>
            {selected.notes && <div className="detail-field" style={{ marginTop: 20 }}><label>Notes</label><p>{selected.notes}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete Payment?</h4><p>Delete this payment record?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon green"><DollarSign size={24} /></div><h4>Total Paid</h4><div className="stat-value">${totalPaid.toLocaleString()}</div></div>
        <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon orange"><CreditCard size={24} /></div><h4>Pending</h4><div className="stat-value">${totalPending.toLocaleString()}</div></div>
      </div>
      <div className="table-container">
        <div className="table-header">
          <h3>All Payments ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add Payment</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><CreditCard size={48} /><h4>No payments found</h4></div> :
        <table><thead><tr><th>Influencer</th><th>Brand</th><th>Amount</th><th>Status</th><th>Method</th><th>Date</th><th>Invoice</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.influencer||'N/A'}</td><td>{item.brand||'N/A'}</td>
              <td style={{ fontWeight: 600 }}>${(item.amount||0).toLocaleString()}</td>
              <td><span className={`badge ${statusColors[item.status]||'badge-info'}`}>{item.status}</span></td>
              <td>{item.payment_method||'N/A'}</td>
              <td>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
              <td>{item.invoice_number||'N/A'}</td>
            </tr>))}</tbody></table>}
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: '6px 12px', fontSize: 14 }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add'} Payment</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label>Influencer</label><input className="form-control" value={form.influencer} onChange={e => setForm({...form, influencer: e.target.value})} /></div>
            <div className="form-group"><label>Brand</label><input className="form-control" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Campaign</label><input className="form-control" value={form.campaign} onChange={e => setForm({...form, campaign: e.target.value})} /></div>
            <div className="form-group"><label>Amount ($) *</label><input className="form-control" type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Status</label><select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>Pending</option><option>Processing</option><option>Paid</option><option>Overdue</option><option>Cancelled</option></select></div>
            <div className="form-group"><label>Payment Method</label><select className="form-control" value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}><option>Bank Transfer</option><option>PayPal</option><option>Wire</option><option>Check</option><option>Crypto</option></select></div></div>
            <div className="form-row"><div className="form-group"><label>Date</label><input className="form-control" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div className="form-group"><label>Invoice #</label><input className="form-control" value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} /></div></div>
            <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
