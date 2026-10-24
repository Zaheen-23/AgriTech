import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const API = 'http://localhost:5000/api/auth';

function SignUp() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'farmer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError(t('passwordLengthError'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || t('signUpFailed'));
        return;
      }

      navigate('/login');
    } catch {
      setError(t('serverUnreachable'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center text-light"
      style={{ background: 'linear-gradient(135deg, #102d1b, #1b5e20 50%, #07180d)' }}
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
        <h2 className="fw-bold mb-4 text-center">{t('createAccountTitle')}</h2>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <label className="form-label" htmlFor="name">{t('fullNameLabel')}</label>
        <input
          id="name"
          name="name"
          className="form-control mb-3"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label className="form-label" htmlFor="email">{t('emailLabel')}</label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-control mb-3"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label className="form-label" htmlFor="password">{t('passwordLabel')}</label>
        <input
          id="password"
          name="password"
          type="password"
          className="form-control mb-3"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label className="form-label" htmlFor="role">{t('iamA')}</label>
        <select
          id="role"
          name="role"
          className="form-select mb-4"
          value={form.role}
          onChange={handleChange}
        >
          <option value="farmer">{t('farmerRole')}</option>
          <option value="buyer">{t('buyerRole')}</option>
          <option value="agriculturalist">{t('agriExpertRole')}</option>
        </select>

        <button
          type="submit"
          className="btn btn-success w-100 fw-bold"
          disabled={loading}
        >
          {loading ? t('creatingAccount') : t('createAccountTitle')}
        </button>

        <p className="text-white-50 small text-center mt-3 mb-0">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#81c784' }}>
            {t('signInLink')}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default SignUp;