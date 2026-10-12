import React, { useEffect, useState } from 'react';
import api from '../api';
import AIWorkspaceModal from './AIWorkspaceModal';
import FormattedAIReport, { readableLabel } from './FormattedAIReport';
import './AIWorkspace.css';

export default function AIResultHistory({ tool, title, refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tool) return undefined;
    const controller = new AbortController();
    setError('');
    api.get('/ai/results', { params: { tool, limit: 20 }, signal: controller.signal })
      .then((response) => setItems(Array.isArray(response.data?.data) ? response.data.data : []))
      .catch((failure) => {
        if (failure.name !== 'CanceledError' && failure.name !== 'AbortError') {
          setError(failure.response?.data?.error || 'Saved AI results could not be loaded.');
        }
      });
    return () => controller.abort();
  }, [tool, refreshKey]);

  return <section className="ai-history native-ai-history">
    <h3>Saved {title || readableLabel(tool)} results</h3>
    <p className="ai-muted">Open a saved result to review it in the same formatted report used for a new response.</p>
    {error && <div className="ai-alert" role="alert">{error}</div>}
    {!error && !items.length && <p className="ai-muted">No saved results for this tool yet.</p>}
    {items.map((item) => (
      <button type="button" className="ai-history-row" key={item.id} onClick={() => setSelected(item)}>
        <span><strong>{title || readableLabel(item.tool_name)}</strong><br /><small className="ai-muted">{new Date(item.created_at).toLocaleString()}{item.entity_id ? ` · Record ${item.entity_id}` : ''}</small></span>
        <span>Open result →</span>
      </button>
    ))}
    {selected && <AIWorkspaceModal title={`Saved ${title || readableLabel(tool)} result`} className="ai-workspace-dialog" onClose={() => setSelected(null)} footer={<button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>}>
      <FormattedAIReport response={{ structured: selected.result, raw: selected.raw_response }} title={title || readableLabel(tool)} />
    </AIWorkspaceModal>}
  </section>;
}
