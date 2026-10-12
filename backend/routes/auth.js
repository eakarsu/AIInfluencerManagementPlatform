import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const demoCredentials = () => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL !== 'true') return null;
  const pairs = [
    ['DEMO_EMAIL', 'DEMO_PASSWORD'],
    ['DEMO_ADMIN_EMAIL', 'DEMO_ADMIN_PASSWORD'],
    ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'],
    ['ADMIN_EMAIL', 'ADMIN_PASSWORD'],
    ['DEFAULT_EMAIL', 'DEFAULT_PASSWORD'],
  ];
  for (const [emailKey, passwordKey] of pairs) {
    const email = String(process.env[emailKey] || '').trim().toLowerCase();
    const password = String(process.env[passwordKey] || '');
    if (email && password) return { email, password };
  }
  return null;
};

const loginResponse = (user) => ({
  token: jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' },
  ),
  user: { id: user.id, name: user.name, email: user.email, role: user.role },
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, password_hash, role)
       VALUES ($1, $2, 'migrated-to-password-hash', $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash, role || 'user']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(loginResponse(user));
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Demo credentials remain server-side and only authenticate an existing account.
router.get('/demo', (_req, res) => {
  res.json({ enabled: Boolean(demoCredentials()) });
});

router.post('/demo', async (_req, res) => {
  const credentials = demoCredentials();
  if (!credentials) return res.status(404).json({ error: 'Demo login is not enabled.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [credentials.email]);
    if (!result.rows.length || !await bcrypt.compare(credentials.password, result.rows[0].password_hash)) {
      return res.status(503).json({ error: 'The configured demo account is unavailable.' });
    }
    return res.json(loginResponse(result.rows[0]));
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
