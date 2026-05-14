import React, { useEffect, useState } from 'react';
import api from '../api';

/* Apply pass 5: 4-tab page covering contract templates, marketplace search,
   brand <-> influencer messaging, and integration status. */
export default function Pass5Tools() {
  const [tab, setTab] = useState('templates');
  return (
    <div style={{ padding: 16 }}>
      <h2>Pass 5 Tools</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['templates', 'marketplace', 'messaging', 'integrations'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ccc',
              background: tab === t ? '#222' : '#fff',
              color: tab === t ? '#fff' : '#222',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'templates' && <ContractTemplates />}
      {tab === 'marketplace' && <Marketplace />}
      {tab === 'messaging' && <Messaging />}
      {tab === 'integrations' && <Integrations />}
    </div>
  );
}

function ContractTemplates() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState('sponsored-post');
  const [variables, setVariables] = useState({});
  const [rendered, setRendered] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/contract-templates').then((r) => setList(r.data.templates || [])).catch(() => {});
  }, []);

  const current = list.find((t) => t.key === selected);

  async function render() {
    setError(null);
    try {
      const r = await api.post(`/contract-templates/${selected}/render`, { variables });
      setRendered(r.data.rendered || '');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }

  return (
    <div>
      <h3>Contract Templates</h3>
      <select value={selected} onChange={(e) => { setSelected(e.target.value); setVariables({}); setRendered(''); }}>
        {list.map((t) => <option key={t.key} value={t.key}>{t.title}</option>)}
      </select>
      {current && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
          <div>
            {(current.variables || []).map((v) => (
              <div key={v} style={{ marginBottom: 6 }}>
                <label>{v}</label>
                <input
                  style={{ width: '100%' }}
                  value={variables[v] || ''}
                  onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                />
              </div>
            ))}
            <button onClick={render}>Render</button>
            {error && <div style={{ color: 'crimson' }}>{error}</div>}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 8 }}>{rendered}</pre>
        </div>
      )}
    </div>
  );
}

function Marketplace() {
  const [filters, setFilters] = useState({ niche: '', min_followers: 1000, min_er: 1, top_k: 25 });
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  async function search() {
    setError(null);
    try {
      const r = await api.get('/marketplace/search', { params: filters });
      setResults(r.data.results || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }

  return (
    <div>
      <h3>Marketplace Discovery</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['niche', 'location', 'min_followers', 'max_followers', 'min_er', 'top_k'].map((k) => (
          <input
            key={k}
            placeholder={k}
            value={filters[k] || ''}
            onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
          />
        ))}
        <button onClick={search}>Search</button>
      </div>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <ul>
        {results.map((r) => (
          <li key={r.id}>
            <strong>{r.name || r.username || `#${r.id}`}</strong> — fit {r.fit_score} | followers {r.followers_count} | ER {r.engagement_rate}%
          </li>
        ))}
      </ul>
    </div>
  );
}

function Messaging() {
  const [thread, setThread] = useState({ brand_id: '', influencer_id: '' });
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const r = await api.get('/messaging/thread', { params: thread });
      setMessages(r.data.thread || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }

  async function send() {
    if (!body) return;
    try {
      await api.post('/messaging', { ...thread, sender_role: 'brand', body });
      setBody('');
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }

  return (
    <div>
      <h3>Messaging</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="brand_id" value={thread.brand_id} onChange={(e) => setThread({ ...thread, brand_id: e.target.value })} />
        <input placeholder="influencer_id" value={thread.influencer_id} onChange={(e) => setThread({ ...thread, influencer_id: e.target.value })} />
        <button onClick={load}>Load thread</button>
      </div>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <ul>
        {messages.map((m) => (
          <li key={m.id}><strong>{m.sender_role}:</strong> {m.body}</li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={body} onChange={(e) => setBody(e.target.value)} style={{ flex: 1 }} placeholder="Type a message..." />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

function Integrations() {
  const [status, setStatus] = useState(null);
  useEffect(() => { api.get('/integrations/status').then((r) => setStatus(r.data)).catch(() => {}); }, []);
  if (!status) return <div>Loading...</div>;
  return (
    <div>
      <h3>Integration Status</h3>
      <ul>
        {Object.entries(status).map(([k, v]) => (
          <li key={k}>{k}: {v ? 'configured' : 'NOT configured (returns 503)'}</li>
        ))}
      </ul>
      <p>See <code>_BACKLOG_NEEDS_CREDS.md</code> for required env vars.</p>
    </div>
  );
}
