import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Har role ke liye exact specific navigation links
const MENUS = {
  farmer: [
    { to: '/dashboard/farmer', key: 'dashboard', end: true },
    { to: '/farms', key: 'farms' },
    { to: '/soil', key: 'soil' },
    { to: '/crops', key: 'myCrops' },
    { to: '/weather', key: 'weather' },
    { to: '/shop', key: 'shop' },
    { to: '/orders', key: 'myOrders' },
    { to: '/community', key: 'community' },
    { to: '/experts', key: 'experts' },
    { to: '/pest-management', key: 'pestManagement' },
    { to: '/profile', key: 'profile' }
  ],

  buyer: [
    { to: '/dashboard/buyer', key: 'marketplace', end: true },
    { to: '/weather', key: 'weather' },
    { to: '/shop', key: 'shop' },
    { to: '/orders', key: 'myOrders' },
    { to: '/community', key: 'community' },
    { to: '/experts', key: 'experts' },
    { to: '/pest-management', key: 'pestManagement' },
    { to: '/profile', key: 'profile' }
  ],

  agriculturalist: [
    { to: '/dashboard/expert', key: 'questions', end: true },
    { to: '/weather', key: 'weather' },
    { to: '/shop', key: 'shop' },
    { to: '/orders', key: 'myOrders' },
    { to: '/community', key: 'community' },
    { to: '/experts', key: 'experts' },
    { to: '/pest-management', key: 'pestManagement' },
    { to: '/profile', key: 'profile' }
  ],

  admin: [
    { to: '/dashboard/admin', key: 'adminDashboard', end: true },
    { to: '/weather', key: 'weather' },
    { to: '/shop', key: 'shop' },
    { to: '/orders', key: 'myOrders' },
    { to: '/community', key: 'community' },
    { to: '/experts', key: 'experts' },
    { to: '/pest-management', key: 'pestManagement' },
    { to: '/profile', key: 'profile' }
  ]
};

function FarmerNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const role = String(user?.role || '')
    .trim()
    .toLowerCase();

  const normalizedRole = role === 'expert' ? 'agriculturalist' : role;
  const links = MENUS[normalizedRole] || MENUS.farmer;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="ag-nav">
      <div className="ag-nav-inner">
        <NavLink to="/" className="ag-brand">
          <span className="ag-brand-icon">🌱</span>
          <span>AgriTech</span>
        </NavLink>

        <div className="ag-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `ag-link ${isActive ? 'active' : ''}`
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
        </div>

        <div className="ag-nav-actions">
          <label className="ag-language">
            <span className="ag-language-icon">🌐</span>
            <select
              aria-label="Select language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>

          <NavLink to="/profile" className="ag-user">
            <span className="ag-user-icon">👤</span>
            <span className="ag-user-name">
              {user?.name || 'User'}
            </span>
          </NavLink>

          <button
            type="button"
            className="ag-btn-ghost"
            onClick={handleLogout}
          >
            <span aria-hidden="true">↪</span>
            {t('logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default FarmerNavbar;