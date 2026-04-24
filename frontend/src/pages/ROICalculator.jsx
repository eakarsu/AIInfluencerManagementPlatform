import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Edit3, Trash2, X, Calculator, DollarSign, TrendingUp, Target } from 'lucide-react';
import api from '../api';

const emptyForm = { campaign: '', investment: '', revenue: '', impressions: '', conversions: '', clicks: '', cpm: '', cpc: '', cpa: '', roi_percentage: '', notes: '' };

export default function ROICalculator() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  // Live calculator
  const [calcInvestment, setCalcInvestment] = useState('');
  const [calcRevenue, setCalcRevenue] = useState('');
  const [calcImpressions, setCalcImpressions] = useState('');
  const [calcClicks, setCalcClicks] = useState('');
  const [calcConversions, setCalcConversions] = useState('');

  const calcROI = calcInvestment > 0 ? (((calcRevenue - calcInvestment) / calcInvestment) * 100).toFixed(1) : 0;
  const calcCPM = calcImpressions > 0 ? ((calcInvestment / calcImpressions) * 1000).toFixed(2) : 0;
  const calcCPC = calcClicks > 0 ? (calcInvestment / calcClicks).toFixed(2) : 0;
  const calcCPA = calcConversions > 0 ? (calcInvestment / calcConversions).toFixed(2) : 0;

  const fetchData = () => { setLoading(true); api.get('/roi').then(r => setItems(r.data.data || r.data || [])).catch(() => setItems([])).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/roi/${selected._id || selected.id}`, form); showToast('Updated'); }
      else { await api.post('/roi', form); showToast('Created'); }
      setShowForm(false); setEditing(false); setSelected(null); setForm(emptyForm); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => { try { await api.delete(`/roi/${confirmDelete._id || confirmDelete.id}`); showToast('Deleted'); setConfirmDelete(null); setSelected(null); fetchData(); } catch { showToast('Failed', 'error'); } };

  const openEdit = (item) => {
    setForm({ campaign: item.campaign||'', investment: item.investment||'', revenue: item.revenue||'', impressions: item.impressions||'', conversions: item.conversions||'', clicks: item.clicks||'', cpm: item.cpm||'', cpc: item.cpc||'', cpa: item.cpa||'', roi_percentage: item.roi_percentage||'', notes: item.notes||'' });
    setEditing(true); setShowForm(true);
  };

  const filtered = items.filter(i => (i.campaign||'').toLowerCase().includes(search.toLowerCase()));

  if (selected && !showForm) {
    const roi = selected.investment > 0 ? (((selected.revenue - selected.investment) / selected.investment) * 100).toFixed(1) : selected.roi_percentage || 0;
    return (
      <div>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back</button>
        <div className="detail-view">
          <div className="detail-header">
            <h2>ROI: {selected.campaign || 'Entry'}</h2>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon purple"><DollarSign size={24} /></div><h4>Investment</h4><div className="stat-value">${(selected.investment||0).toLocaleString()}</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon green"><TrendingUp size={24} /></div><h4>Revenue</h4><div className="stat-value">${(selected.revenue||0).toLocaleString()}</div></div>
              <div className="stat-card" style={{ cursor: 'default' }}><div className="stat-card-icon orange"><Target size={24} /></div><h4>ROI</h4><div className="stat-value" style={{ color: roi >= 0 ? 'var(--success)' : 'var(--danger)' }}>{roi}%</div></div>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Campaign</label><p>{selected.campaign}</p></div>
              <div className="detail-field"><label>Impressions</label><p>{(selected.impressions||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Clicks</label><p>{(selected.clicks||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>Conversions</label><p>{(selected.conversions||0).toLocaleString()}</p></div>
              <div className="detail-field"><label>CPM</label><p>${selected.cpm||'N/A'}</p></div>
              <div className="detail-field"><label>CPC</label><p>${selected.cpc||'N/A'}</p></div>
              <div className="detail-field"><label>CPA</label><p>${selected.cpa||'N/A'}</p></div>
            </div>
            {selected.notes && <div className="detail-field" style={{ marginTop: 20 }}><label>Notes</label><p>{selected.notes}</p></div>}
          </div>
        </div>
        {confirmDelete && <div className="modal-overlay" onClick={() => setConfirmDelete(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}><div className="modal-body"><div className="confirm-dialog"><h4>Delete?</h4><p>Delete this ROI entry?</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div></div></div></div></div>}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div>
      {/* Live Calculator */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3>Quick ROI Calculator</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div className="form-group" style={{ margin: 0 }}><label>Investment ($)</label><input className="form-control" type="number" value={calcInvestment} onChange={e => setCalcInvestment(e.target.value)} placeholder="10000" /></div>
            <div className="form-group" style={{ margin: 0 }}><label>Revenue ($)</label><input className="form-control" type="number" value={calcRevenue} onChange={e => setCalcRevenue(e.target.value)} placeholder="25000" /></div>
            <div className="form-group" style={{ margin: 0 }}><label>Impressions</label><input className="form-control" type="number" value={calcImpressions} onChange={e => setCalcImpressions(e.target.value)} placeholder="500000" /></div>
            <div className="form-group" style={{ margin: 0 }}><label>Clicks</label><input className="form-control" type="number" value={calcClicks} onChange={e => setCalcClicks(e.target.value)} placeholder="5000" /></div>
            <div className="form-group" style={{ margin: 0 }}><label>Conversions</label><input className="form-control" type="number" value={calcConversions} onChange={e => setCalcConversions(e.target.value)} placeholder="100" /></div>
          </div>
          <div className="stats-grid">
            <div className="stat-card" style={{ cursor: 'default' }}><h4>ROI</h4><div className="stat-value" style={{ color: calcROI >= 0 ? 'var(--success)' : 'var(--danger)' }}>{calcROI}%</div></div>
            <div className="stat-card" style={{ cursor: 'default' }}><h4>CPM</h4><div className="stat-value">${calcCPM}</div></div>
            <div className="stat-card" style={{ cursor: 'default' }}><h4>CPC</h4><div className="stat-value">${calcCPC}</div></div>
            <div className="stat-card" style={{ cursor: 'default' }}><h4>CPA</h4><div className="stat-value">${calcCPA}</div></div>
          </div>
        </div>
      </div>

      {/* Saved ROI Data */}
      <div className="table-container">
        <div className="table-header">
          <h3>Saved ROI Records ({filtered.length})</h3>
          <div className="table-actions">
            <div className="search-bar"><Search /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(false); setShowForm(true); }}><Plus size={16} /> Save ROI</button>
          </div>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
        filtered.length === 0 ? <div className="empty-state"><Calculator size={48} /><h4>No ROI records</h4></div> :
        <table><thead><tr><th>Campaign</th><th>Investment</th><th>Revenue</th><th>ROI</th><th>Impressions</th><th>Conversions</th></tr></thead>
          <tbody>{filtered.map((item, i) => {
            const r = item.investment > 0 ? (((item.revenue - item.investment) / item.investment) * 100).toFixed(1) : item.roi_percentage || 0;
            return (
            <tr key={item._id||item.id||i} onClick={() => setSelected(item)}>
              <td style={{ fontWeight: 600 }}>{item.campaign||'N/A'}</td>
              <td>${(item.investment||0).toLocaleString()}</td>
              <td>${(item.revenue||0).toLocaleString()}</td>
              <td><span className={`badge ${r >= 0 ? 'badge-success' : 'badge-danger'}`}>{r}%</span></td>
              <td>{(item.impressions||0).toLocaleString()}</td>
              <td>{(item.conversions||0).toLocaleString()}</td>
            </tr>);
          })}</tbody></table>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); }}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editing ? 'Edit' : 'Save'} ROI Record</h3><button className="modal-close" onClick={() => { setShowForm(false); setEditing(false); }}><X size={18} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-group"><label>Campaign *</label><input className="form-control" required value={form.campaign} onChange={e => setForm({...form, campaign: e.target.value})} /></div>
            <div className="form-row"><div className="form-group"><label>Investment ($)</label><input className="form-control" type="number" value={form.investment} onChange={e => setForm({...form, investment: e.target.value})} /></div>
            <div className="form-group"><label>Revenue ($)</label><input className="form-control" type="number" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Impressions</label><input className="form-control" type="number" value={form.impressions} onChange={e => setForm({...form, impressions: e.target.value})} /></div>
            <div className="form-group"><label>Clicks</label><input className="form-control" type="number" value={form.clicks} onChange={e => setForm({...form, clicks: e.target.value})} /></div></div>
            <div className="form-row"><div className="form-group"><label>Conversions</label><input className="form-control" type="number" value={form.conversions} onChange={e => setForm({...form, conversions: e.target.value})} /></div>
            <div className="form-group"><label>ROI (%)</label><input className="form-control" type="number" step="0.1" value={form.roi_percentage} onChange={e => setForm({...form, roi_percentage: e.target.value})} /></div></div>
            <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(false); }}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Save'}</button></div></form>
        </div></div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
