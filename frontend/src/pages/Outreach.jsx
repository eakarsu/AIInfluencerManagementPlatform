import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Send, Bell, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Follow-ups
  const [followUps, setFollowUps] = useState([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get(`/outreach?page=${page}&limit=${limit}`)
      .then(r => {
        setItems(r.data.data || r.data || []);
        setTotalPages(r.data.pagination?.totalPages || 1);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadFollowUps = async () => {
    setFollowUpsLoading(true);
    try {
      const res = await api.get('/outreach/follow-ups-due');
      setFollowUps(res.data.data || []);
      setShowFollowUps(true);
    } catch (err) {
      if (err.response?.status === 429) {
        showToast('AI rate limit reached. Please wait.', 'error');
      } else {
        showToast('Failed to load follow-ups', 'error');
      }
    }
    setFollowUpsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/outreach/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/outreach', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/outreach/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); }
    catch { showToast('Failed', 'error'); }
  };

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
      {/* Follow-ups Due Section */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bell size={18} style={{ color: followUps.length > 0 ? 'var(--warning, #f59e0b)' : 'var(--text-secondary)' }} />
            <span style={{ fontWeight: 600 }}>Follow-ups Due</span>
            {followUps.length > 0 && (
              <span style={{ padding: '2px 8px', background: '#f59e0b', color: 'white', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {followUps.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={loadFollowUps} disabled={followUpsLoading}>
              {followUpsLoading ? 'Loading...' : 'Review Follow-ups'}
            </button>
            {showFollowUps && followUps.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowFollowUps(f => !f)}>
                {showFollowUps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </div>

        {showFollowUps && followUps.length > 0 && (
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {followUps.map(fu => (
              <div key={fu.outreach_id} style={{ padding: 16, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{fu.influencer_name}</span>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Outreach #{fu.outreach_id}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => showToast('Message sent!', 'success')}>
                    <Send size={12} /> Send
                  </button>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>SUGGESTED FOLLOW-UP</div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, padding: 12, background: '#f0fdf4', borderRadius: 6, borderLeft: '3px solid #22c55e' }}>{fu.suggested_followup}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showFollowUps && followUps.length === 0 && (
          <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            No follow-ups due. All outreach is up to date.
          </div>
        )}
      </div>

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

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: '6px 12px', fontSize: 14 }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

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
