import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Users } from 'lucide-react';
import api from '../api';

const emptyForm = { name: '', email: '', platform: 'Instagram', handle: '', followers: '', category: '', engagement_rate: '', location: '', bio: '' };

export default function Influencers() {
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
    api.get('/influencers').then(r => setItems(r.data.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/influencers/${selected._id || selected.id}`, form);
        showToast('Influencer updated successfully');
      } else {
        await api.post('/influencers', form);
        showToast('Influencer created successfully');
      }
      setShowForm(false);
      setEditing(false);
      setSelected(null);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/influencers/${confirmDelete._id || confirmDelete.id}`);
      showToast('Influencer deleted successfully');
      setConfirmDelete(null);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', email: item.email || '', platform: item.platform || 'Instagram', handle: item.handle || '', followers: item.followers || '', category: item.category || '', engagement_rate: item.engagement_rate || '', location: item.location || '', bio: item.bio || '' });
    setEditing(true);
    setShowForm(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(true);
  };

  const filtered = items.filter(i =>
    (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.handle || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.platform || '').toLowerCase().includes(search.toLowerCase())
  );

  if (selected && !showForm) {
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}>
          <ArrowLeft size={16} /> Back to Influencers
        </button>
        <div className="detail-view">
          <div className="detail-header">
            <div>
              <h2>{selected.name}</h2>
              <span className="badge badge-primary" style={{ marginTop: 8 }}>{selected.platform || 'Instagram'}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><label>Name</label><p>{selected.name}</p></div>
              <div className="detail-field"><label>Email</label><p>{selected.email || 'N/A'}</p></div>
              <div className="detail-field"><label>Handle</label><p>@{selected.handle || 'N/A'}</p></div>
              <div className="detail-field"><label>Platform</label><p>{selected.platform || 'Instagram'}</p></div>
              <div className="detail-field"><label>Followers</label><p>{(selected.followers || 0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Engagement Rate</label><p>{selected.engagement_rate || 0}%</p></div>
              <div className="detail-field"><label>Category</label><p>{selected.category || 'N/A'}</p></div>
              <div className="detail-field"><label>Location</label><p>{selected.location || 'N/A'}</p></div>
            </div>
            {selected.bio && (
              <div className="detail-field" style={{ marginTop: 20 }}><label>Bio</label><p>{selected.bio}</p></div>
            )}
          </div>
        </div>
        {confirmDelete && (
          <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modal-body">
                <div className="confirm-dialog">
                  <h4>Delete Influencer?</h4>
                  <p>Are you sure you want to delete "{confirmDelete.name}"? This cannot be undone.</p>
                  <div className="confirm-actions">
                    <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>All Influencers ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar">
              <Search />
              <input placeholder="Search influencers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add New</button>
          </div>
        </div>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /><p>Loading influencers...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><Users size={48} /><h4>No influencers found</h4><p>Add your first influencer to get started</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Handle</th><th>Platform</th><th>Followers</th><th>Engagement</th><th>Category</th><th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item._id || item.id || i} onClick={() => setSelected(item)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>@{item.handle || 'N/A'}</td>
                  <td><span className="badge badge-primary">{item.platform || 'Instagram'}</span></td>
                  <td>{(item.followers || 0).toLocaleString()}</td>
                  <td>{item.engagement_rate || 0}%</td>
                  <td>{item.category || 'N/A'}</td>
                  <td>{item.location || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Influencer' : 'Add New Influencer'}</h3>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Platform</label>
                    <select className="form-control" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                      <option>Instagram</option><option>YouTube</option><option>TikTok</option><option>Twitter</option><option>LinkedIn</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Handle</label><input className="form-control" value={form.handle} onChange={e => setForm({...form, handle: e.target.value})} placeholder="@username" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Followers</label><input className="form-control" type="number" value={form.followers} onChange={e => setForm({...form, followers: e.target.value})} /></div>
                  <div className="form-group"><label>Engagement Rate (%)</label><input className="form-control" type="number" step="0.1" value={form.engagement_rate} onChange={e => setForm({...form, engagement_rate: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Category</label><input className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Fashion, Tech" /></div>
                  <div className="form-group"><label>Location</label><input className="form-control" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Bio</label><textarea className="form-control" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} Influencer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
