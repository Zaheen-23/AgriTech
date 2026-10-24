import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api/auth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || t('loginFailed'));
        return;
      }

      if (!data.token || !data.user) {
        setError(t('invalidResponse'));
        return;
      }

      // Save the authenticated user and token
      login(data.token, data.user);

      // Normalize the role received from the backend
      const role = String(data.user?.role || '')
        .trim()
        .toLowerCase();

      const routes = {
        farmer: '/dashboard/farmer',
        buyer: '/dashboard/buyer',
        agriculturalist: '/dashboard/expert',
        expert: '/dashboard/expert',
        admin: '/dashboard/admin'
      };

      const destination = routes[role];

      if (destination) {
        navigate(destination, { replace: true });
      } else {
        setError(
          `${t('unknownRolePrefix')} ${role || 'missing'}${t('unknownRoleSuffix')}`
        );
      }
    } catch {
      setError(t('serverUnreachable'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center text-light"
      style={{
        background:
          'linear-gradient(135deg, #102d1b, #1b5e20 50%, #07180d)'
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-4"
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)'
        }}
      >
        <h2 className="fw-bold mb-4 text-center">{t('signInTitle')}</h2>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <label className="form-label" htmlFor="email">
          {t('emailLabel')}
        </label>

        <input
          id="email"
          type="email"
          className="form-control mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label className="form-label" htmlFor="password">
          {t('passwordLabel')}
        </label>

        <input
          id="password"
          type="password"
          className="form-control mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          className="btn btn-success w-100 fw-bold"
          disabled={loading}
        >
          {loading ? t('signingIn') : t('signInTitle')}
        </button>

        <p className="text-white-50 small text-center mt-3 mb-0">
          {t('dontHaveAccount')}{' '}
          <Link
            to="/signup"
            className="fw-bold text-decoration-none"
            style={{ color: '#81c784' }}
          >
            {t('signUpLink')}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;