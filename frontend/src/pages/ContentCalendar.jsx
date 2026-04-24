import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';

const emptyForm = { title: '', content_type: 'Post', platform: 'Instagram', scheduled_date: '', status: 'Planned', influencer: '', campaign: '', description: '', hashtags: '' };
const statusColors = { Planned: 'badge-info', 'In Progress': 'badge-warning', Published: 'badge-success', Approved: 'badge-primary', Rejected: 'badge-danger' };

export default function ContentCalendar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const fetchData = () => {
    setLoading(true);
    api.get('/content').then(r => setItems(r.data.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/content/${selected._id || selected.id}`, form); showToast('Content updated'); }
      else { await api.post('/content', form); showToast('Content created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Operation failed', 'error'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/content/${confirmDelete._id || confirmDelete.id}`); showToast('Content deleted'); setConfirmDelete(null); setSelected(null); fetchData(); }
    catch { showToast('Delete failed', 'error'); }
  };

  const openEdit = (item) => {
    setForm({ title: item.title || '', content_type: item.content_type || 'Post', platform: item.platform || 'Instagram', scheduled_date: item.scheduled_date ? item.scheduled_date.slice(0, 10) : '', status: item.status || 'Planned', influencer: item.influencer || '', campaign: item.campaign || '', description: item.description || '', hashtags: item.hashtags || '' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.title||'').toLowerCase().includes(search.toLowerCase()));

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back to Content</button>
        <div className="detail-view">
          <div className="detail-header">
            <div><h2>{selected.title}</h2><span className={`badge ${statusColors[selected.status] || 'badge-info'}`} style={{ marginTop: 8 }}>{selected.status}</span></div>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><label>Title</label><p>{selected.title}</p></div>
              <div className="detail-field"><label>Type</label><p>{selected.content_type}</p></div>
              <div className="detail-field"><label>Platform</label><p>{selected.platform}</p></div>
              <div className="detail-field"><label>Scheduled Date</label><p>{selected.scheduled_date ? new Date(selected.scheduled_date).toLocaleDateString() : 'N/A'}</p></div>
              <div className="detail-field"><label>Influencer</label><p>{selected.influencer || 'N/A'}</p></div>
              <div className="detail-field"><label>Campaign</label><p>{selected.campaign || 'N/A'}</p></div>
              <div className="detail-field"><label>Hashtags</label><p>{selected.hashtags || 'N/A'}</p></div>
            </div>
            {selected.description && <div className="detail-field" style={{ marginTop: 20 }}><label>Description</label><p>{selected.description}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete Content?</h4><p>Delete "{confirmDelete.title}"?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>Content Calendar ({filtered.length})</h3>
          <div className="table-actions">
            <div className="filter-chips">
              <button className={`chip ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
              <button className={`chip ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Calendar</button>
            </div>
            <div className="search-bar"><Search /><input placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Add New</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><Calendar size={48} /><h4>No content found</h4><p>Schedule your first content</p></div> :
        <table><thead><tr><th>Title</th><th>Type</th><th>Platform</th><th>Date</th><th>Status</th><th>Influencer</th></tr></thead>
          <tbody>{filtered.map((item, i) => (
            <tr key={item._id || item.id || i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.title}</td><td>{item.content_type}</td>
              <td><span className="badge badge-primary">{item.platform}</span></td>
              <td>{item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'N/A'}</td>
              <td><span className={`badge ${statusColors[item.status] || 'badge-info'}`}>{item.status}</span></td>
              <td>{item.influencer || 'N/A'}</td>
            </tr>))}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Add New'} Content</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-group"><label>Title *</label><input className="form-control" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="form-row"><div className="form-group"><label>Content Type</label><select className="form-control" value={form.content_type} onChange={e => setForm({...form, content_type: e.target.value})}><option>Post</option><option>Story</option><option>Reel</option><option>Video</option><option>Blog</option><option>Tweet</option></select></div>
            <div className="form-group"><label>Platform</label><select className="form-control" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}><option>Instagram</option><option>YouTube</option><option>TikTok</option><option>Twitter</option><option>LinkedIn</option></select></div></div>
            <div className="form-row"><div className="form-group"><label>Scheduled Date</label><input className="form-control" type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} /></div>
            <div className="form-group"><label>Status</label><select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>Planned</option><option>In Progress</option><option>Approved</option><option>Published</option><option>Rejected</option></select></div></div>
            <div className="form-row"><div className="form-group"><label>Influencer</label><input className="form-control" value={form.influencer} onChange={e => setForm({...form, influencer: e.target.value})} /></div>
            <div className="form-group"><label>Campaign</label><input className="form-control" value={form.campaign} onChange={e => setForm({...form, campaign: e.target.value})} /></div></div>
            <div className="form-group"><label>Hashtags</label><input className="form-control" value={form.hashtags} onChange={e => setForm({...form, hashtags: e.target.value})} placeholder="#tag1 #tag2" /></div>
            <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
