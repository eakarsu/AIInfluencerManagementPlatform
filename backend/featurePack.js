// Feature pack helpers (FP37B): pure, DB-free, testable. No secrets, no paid calls.
export function hasProviderKey(env) { const e = env || process.env; return Boolean(e.OPENROUTER_API_KEY || e.OPENAI_API_KEY); }
export function filterRecords(records, query) {
  const list = Array.isArray(records) ? records : [];
  const q = (query && query.q != null ? String(query.q) : '').trim().toLowerCase();
  const status = query && query.status != null && query.status !== '' ? String(query.status) : null;
  return list.filter((r) => { if (status !== null && String(r.status ?? '') !== status) return false; if (!q) return true; return Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q)); });
}
export function toCSV(records) {
  const rows = Array.isArray(records) ? records : []; if (rows.length === 0) return 'id,title,status\n';
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v) => { if (v === null || v === undefined) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}
export function createTaskStore() {
  const tasks = new Map(); let seq = 1;
  return {
    list(owner, query) { return filterRecords([...tasks.values()].filter((t) => t.owner_id === owner), query || {}); },
    create(owner, body) { const b = body || {}; if (b.title === undefined || b.title === null || String(b.title).trim() === '') { const e = new Error('title is required'); e.status = 400; throw e; } const t = { id: seq++, owner_id: owner, title: String(b.title), description: b.description ?? '', status: b.status ?? 'open', priority: b.priority ?? 'medium', done: b.done ?? false, estimate: b.estimate ?? 0, created_at: new Date().toISOString() }; tasks.set(t.id, t); return t; },
    update(owner, id, body) { const t = tasks.get(Number(id)); if (!t || t.owner_id !== owner) return null; const b = body || {}; for (const k of ['title','description','status','priority','done','estimate']) if (Object.prototype.hasOwnProperty.call(b, k)) t[k] = b[k]; return t; },
  };
}
export const store = createTaskStore();
function labelled(title, lines) { return { title, lines: lines.map((l) => String(l)) }; }
const BUILDERS = {
  'match-score': (rows) => ({ Overview: labelled('Overview', ['Influencers analysed: ' + rows.length, 'Active: ' + rows.filter((r) => r.status === 'active').length]), Detail: labelled('Detail', rows.slice(0, 5).map((r) => (r.name ?? '') + ' | followers=' + (r.followers ?? 0) + ' | engagement=' + (r.engagement_rate ?? 0))) }),
  'content-brief': (rows) => ({ Signal: labelled('Signal', ['Zero-follower rows preserved: ' + rows.filter((r) => Number(r.followers) === 0).length, 'Empty-category preserved: ' + rows.filter((r) => !r.category).length]), Action: labelled('Action', ['Brief from observed category and engagement only.']) }),
  'fraud-flag': (rows) => ({ Signal: labelled('Signal', ['High followers with zero engagement: ' + rows.filter((r) => Number(r.followers) > 100000 && Number(r.engagement_rate) === 0).length]), Action: labelled('Action', ['Manually review flagged accounts; no fraud conclusion asserted.']) }),
};
export function fallback(kind, records) { const rows = Array.isArray(records) ? records : []; return { aiGenerated: false, provider: 'deterministic-fallback', kind, recordCount: rows.length, sections: BUILDERS[kind](rows) }; }
export async function runAI(kind, records, env) {
  const rows = Array.isArray(records) ? records : []; if (!hasProviderKey(env)) return fallback(kind, rows);
  try { const e = env || process.env; const key = e.OPENROUTER_API_KEY || e.OPENAI_API_KEY; const b = (e.OPENROUTER_API_KEY ? (e.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') : 'https://api.openai.com/v1').replace(/\/$/, ''); const res = await fetch(b + '/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: e.OPENROUTER_MODEL || 'openai/gpt-4o-mini', messages: [{ role: 'user', content: 'Analyse ' + kind + ': ' + JSON.stringify(rows).slice(0, 4000) }], max_tokens: 600 }) }); if (!res.ok) return fallback(kind, rows); const data = await res.json(); const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content; if (!text) return fallback(kind, rows); return { aiGenerated: true, provider: 'provider', kind, recordCount: rows.length, sections: { Provider: labelled('Provider', [text]) } }; } catch (_) { return fallback(kind, rows); }
}
