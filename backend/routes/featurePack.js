import { Router } from 'express';
import pool from '../db.js';
import { store, filterRecords, toCSV, runAI } from '../featurePack.js';
const router = Router();
const KINDS = ['match-score', 'content-brief', 'fraud-flag'];
function owner(req) { return (req.user && (req.user.id ?? req.user.userId)) ?? 'authenticated'; }
router.get('/tasks', (req, res) => res.json({ data: store.list(owner(req), req.query) }));
router.post('/tasks', (req, res) => { try { res.status(201).json(store.create(owner(req), req.body || {})); } catch (e) { res.status(e.status || 400).json({ error: e.message }); } });
router.put('/tasks/:id', (req, res) => { const t = store.update(owner(req), req.params.id, req.body || {}); if (!t) return res.status(404).json({ error: 'Task not found' }); res.json(t); });
router.patch('/tasks/:id', (req, res) => { const t = store.update(owner(req), req.params.id, req.body || {}); if (!t) return res.status(404).json({ error: 'Task not found' }); res.json(t); });
async function mainRows(req) { let rows = []; try { const r = await pool.query('SELECT * FROM influencers LIMIT 500'); rows = r.rows || []; } catch (_) { rows = []; } return filterRecords(rows, req.query); }
router.get('/export', async (req, res) => { const rows = await mainRows(req); const format = String(req.query.format || 'json').toLowerCase(); if (format === 'csv') { res.setHeader('Content-Type', 'text/csv'); return res.send(toCSV(rows)); } return res.json({ data: rows, count: rows.length }); });
for (const kind of KINDS) { router.post('/ai/' + kind, async (req, res) => { const body = req.body || {}; let records = Array.isArray(body.records) ? body.records : null; if (!records) records = await mainRows(req); res.json(await runAI(kind, records)); }); }
export default router;
