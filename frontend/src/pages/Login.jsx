import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [checkingDemo, setCheckingDemo] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    api.get('/auth/demo', { signal: controller.signal })
      .then((response) => setDemoEnabled(Boolean(response.data?.enabled)))
      .catch(() => setDemoEnabled(false))
      .finally(() => setCheckingDemo(false));
    return () => controller.abort();
  }, []);

  const acceptLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    navigate('/dashboard');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      acceptLogin(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/demo');
      acceptLogin(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Demo login is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Sparkles size={28} />
          </div>
          <h2>InfluencerAI</h2>
          <p>Sign in to your management platform</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="button"
            onClick={loginAsDemo}
            disabled={loading || checkingDemo || !demoEnabled}
            aria-label="Log in as Demo"
            title={!checkingDemo && !demoEnabled ? 'Demo login is disabled in this environment.' : undefined}
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: loading || !demoEnabled ? 'not-allowed' : 'pointer' }}
          >
            {checkingDemo ? 'Checking Demo Login…' : loading ? 'Signing in…' : 'Log in as Demo'}
          </button>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}
