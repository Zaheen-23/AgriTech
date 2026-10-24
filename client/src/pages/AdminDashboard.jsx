
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://agritech-backend-qadd.onrender.com/api/admin';

const COLORS = {
  bg: '#f4f7f5',
  card: '#ffffff',
  green: '#176b45',
  dark: '#123d2b',
  sidebar: '#103c2b',
  border: '#e4ebe6',
  text: '#20352a',
  muted: '#75847b',
  blue: '#3779c8',
  orange: '#d58b25',
  red: '#ce5147',
  purple: '#8058bb',
};

const INITIAL_STATS = {
  totalUsers: 0,
  farmers: 0,
  buyers: 0,
  experts: 0,
  products: 0,
  orders: 0,
  pendingOrders: 0,
  soilReports: 0,
};

const NAV_ITEMS = [
  { id: 'overview', icon: '◫', label: 'Overview' },
  { id: 'users', icon: '♙', label: 'User Management' },
  { id: 'agriculture', icon: '♧', label: 'Agriculture' },
  { id: 'marketplace', icon: '▣', label: 'Marketplace' },
  { id: 'community', icon: '☷', label: 'Community' },
  { id: 'analytics', icon: '▥', label: 'Analytics' },
];

const ROLE_LABELS = {
  farmer: 'Farmer',
  buyer: 'Buyer',
  agriculturalist: 'Expert',
  supplier: 'Supplier',
  admin: 'Admin',
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'U';
}

function getRole(user) {
  return String(user?.role || 'unknown').toLowerCase();
}

function getUserId(user) {
  return String(user?._id || user?.id || '');
}

function Card({ children, style = {} }) {
  return (
    <section
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 20,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 18,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 19, color: COLORS.text }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ margin: '5px 0 0', color: COLORS.muted, fontSize: 13 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) {
  const styles = {
    primary: {
      background: COLORS.green,
      color: '#fff',
      border: `1px solid ${COLORS.green}`,
    },
    secondary: {
      background: '#fff',
      color: COLORS.green,
      border: `1px solid ${COLORS.border}`,
    },
    danger: {
      background: '#fff3f1',
      color: COLORS.red,
      border: '1px solid #f1d3ce',
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...styles[variant],
        padding: '9px 13px',
        borderRadius: 9,
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ icon, label, value, note, color }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ color: COLORS.muted, fontSize: 13 }}>{label}</div>
          <div
            style={{
              fontSize: 29,
              fontWeight: 800,
              marginTop: 10,
              color: COLORS.text,
            }}
          >
            {formatNumber(value)}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 7 }}>
            {note}
          </div>
        </div>

        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            background: `${color}18`,
            color,
            display: 'grid',
            placeItems: 'center',
            fontSize: 23,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ value }) {
  const status = String(value || 'Unknown').toLowerCase();

  let bg = '#eef1ef';
  let color = '#647168';

  if (['active', 'answered', 'delivered', 'completed'].includes(status)) {
    bg = '#e6f5eb';
    color = '#207344';
  } else if (
    ['pending', 'processing', 'waiting'].includes(status)
  ) {
    bg = '#fff3db';
    color = '#98630c';
  } else if (
    ['blocked', 'cancelled', 'rejected', 'inactive'].includes(status)
  ) {
    bg = '#fdebea';
    color = '#b53d36';
  }

  return (
    <span
      style={{
        background: bg,
        color,
        borderRadius: 30,
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: 'nowrap',
      }}
    >
      {String(value || 'Unknown')}
    </span>
  );
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((item) => Number(item.value || 0)));

  return (
    <div style={{ display: 'grid', gap: 19 }}>
      {data.map((item) => (
        <div key={item.label}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            <span style={{ color: COLORS.text }}>{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
          </div>
          <div
            style={{
              height: 9,
              background: '#edf2ee',
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(
                  100,
                  (Number(item.value || 0) / max) * 100
                )}%`,
                background: item.color || COLORS.green,
                borderRadius: 20,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div
      style={{
        padding: '32px 12px',
        textAlign: 'center',
        color: COLORS.muted,
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(INITIAL_STATS);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [period, setPeriod] = useState('7d');

  const [chartData, setChartData] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');

try {
  const token = localStorage.getItem('token');

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [overviewRes, usersRes, activityRes] = await Promise.all([
    fetch(`${API}/overview`, { headers }),
    fetch(`${API}/users`, { headers }),
    fetch(`${API}/activity`, { headers }),
  ]);


      const [overview, usersData, activityData] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        activityRes.json(),
      ]);

      if (!overviewRes.ok) {
        throw new Error(
          overview?.message || overview?.error || 'Could not load dashboard.'
        );
      }

      if (!usersRes.ok) {
        throw new Error(
          usersData?.message || usersData?.error || 'Could not load users.'
        );
      }

      if (!activityRes.ok) {
        throw new Error(
          activityData?.message ||
            activityData?.error ||
            'Could not load activity.'
        );
      }

      setStats({ ...INITIAL_STATS, ...(overview.stats || overview) });

      setUsers(
        Array.isArray(usersData)
          ? usersData
          : Array.isArray(usersData.users)
            ? usersData.users
            : []
      );

      setActivity(
        Array.isArray(activityData)
          ? activityData
          : Array.isArray(activityData.activity)
            ? activityData.activity
            : []
      );

      setChartData(
        Array.isArray(overview.chartData) ? overview.chartData : []
      );
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((item) => {
      const role = getRole(item);
      const status = String(item.status || 'active').toLowerCase();

      const matchesSearch =
        !term ||
        `${item.name || ''} ${item.email || ''} ${item.phone || ''}`
          .toLowerCase()
          .includes(term);

      const matchesRole = roleFilter === 'all' || role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const userCounts = useMemo(
    () => [
      { label: 'Farmers', value: stats.farmers, color: COLORS.green },
      { label: 'Buyers', value: stats.buyers, color: COLORS.blue },
      { label: 'Experts', value: stats.experts, color: COLORS.purple },
    ],
    [stats]
  );

  const chartRows = useMemo(() => {
    if (chartData.length) {
      return chartData.map((item) => ({
        label: item.label || item.month || item.date || 'Period',
        value: Number(item.value ?? item.users ?? 0),
      }));
    }

    return [];
  }, [chartData]);

  const updateUserStatus = async (item) => {
    const id = getUserId(item);
    if (!id || busyId) return;

    const nextStatus =
      String(item.status || 'active').toLowerCase() === 'blocked'
        ? 'active'
        : 'blocked';

    const confirmed = window.confirm(
      `Change ${item.name || 'this user'} status to ${nextStatus}?`
    );

    if (!confirmed) return;

    setBusyId(id);
    setNotice('');

    try {
      const response = await fetch(`${API}/users/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        
headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
},

        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Could not update user status.'
        );
      }

      setUsers((previous) =>
        previous.map((entry) =>
          getUserId(entry) === id
            ? { ...entry, ...data.user, status: nextStatus }
            : entry
        )
      );

      setNotice(`User status updated to ${nextStatus}.`);
    } catch (err) {
      setNotice(err.message || 'Could not update user.');
    } finally {
      setBusyId('');
    }
  };

  const exportUsers = () => {
    const headers = ['Name', 'Email', 'Role', 'Status'];
    const rows = filteredUsers.map((item) => [
      item.name || '',
      item.email || '',
      getRole(item),
      item.status || 'active',
    ]);

    const csvCell = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');

    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    );

    const link = document.createElement('a');
    link.href = url;
    link.download = 'k-agritech-users.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const pageTitle =
    NAV_ITEMS.find((item) => item.id === section)?.label || 'Overview';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        button, input, select { font: inherit; }
        button:focus-visible, input:focus-visible, select:focus-visible {
          outline: 2px solid #32885e;
          outline-offset: 2px;
        }
        .admin-layout {
          display: grid;
          grid-template-columns: 248px minmax(0, 1fr);
          min-height: 100vh;
        }
        .admin-main { min-width: 0; padding: 28px; }
        .admin-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .admin-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
          gap: 18px;
        }
        .admin-table-wrap { overflow-x: auto; }
        .admin-table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          background: #f7f9f7;
          color: #718076;
          font-size: 12px;
          font-weight: 700;
        }
        .admin-table th, .admin-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #edf1ee;
          font-size: 13px;
        }
        .admin-mobile-menu { display: none; }
        @media(max-width: 1100px) {
          .admin-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .admin-grid { grid-template-columns: 1fr; }
        }
        @media(max-width: 760px) {
          .admin-layout { grid-template-columns: 1fr; }
          .admin-sidebar {
            display: none !important;
          }
          .admin-sidebar.mobile-open {
            display: flex !important;
            position: fixed;
            inset: 0 auto 0 0;
            width: min(280px, 85vw);
            z-index: 100;
            overflow-y: auto;
            box-shadow: 20px 0 60px #0003;
          }
          .admin-main { padding: 16px; }
          .admin-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
          .admin-mobile-menu { display: inline-flex; }
        }
        @media(max-width: 380px) {
          .admin-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-layout">
        <aside
          className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}
          style={{
            background: COLORS.sidebar,
            color: '#fff',
            padding: 20,
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '8px 4px 26px',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                background: '#d7f2df',
                color: COLORS.dark,
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
              }}
            >
              ♧
            </div>
            <div>
              <div style={{ fontWeight: 850, fontSize: 17 }}>K AgriTech</div>
              <div style={{ color: '#a8c6b4', fontSize: 11 }}>
                ADMIN CONSOLE
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 0,
                color: '#fff',
                fontSize: 20,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#83ad94',
              letterSpacing: 1.4,
              padding: '0 10px 12px',
            }}
          >
            WORKSPACE
          </div>

          <nav style={{ display: 'grid', gap: 6 }}>
            {NAV_ITEMS.map((item) => {
              const active = section === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setSidebarOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 13px',
                    border: 0,
                    borderRadius: 10,
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: active ? '#fff' : '#c0d6c8',
                    background: active ? '#286b49' : 'transparent',
                    fontSize: 13,
                    fontWeight: active ? 800 : 500,
                  }}
                >
                  <span style={{ width: 20, fontSize: 18 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: 28 }}>
            <div
              style={{
                borderTop: '1px solid #315b45',
                paddingTop: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 50,
                  background: '#d8eee0',
                  color: COLORS.dark,
                  fontWeight: 800,
                }}
              >
                {getInitials(user?.name || 'Admin')}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {user?.name || 'Administrator'}
                </div>
                <div style={{ color: '#a8c6b4', fontSize: 11 }}>
                  Administrator
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 15,
              flexWrap: 'wrap',
              marginBottom: 26,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="admin-mobile-menu"
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                style={{
                  background: '#fff',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 9,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                ☰
              </button>

              <div>
                <div style={{ color: COLORS.muted, fontSize: 12 }}>
                  K AgriTech / Admin
                </div>
                <h1 style={{ margin: '6px 0 0', fontSize: 25, fontWeight: 850 }}>
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <ActionButton
                variant="secondary"
                onClick={loadDashboard}
                disabled={loading}
              >
                {loading ? 'Loading...' : '↻ Refresh'}
              </ActionButton>
              <ActionButton onClick={() => navigate('/')}>
                View Website ↗
              </ActionButton>
            </div>
          </header>

          {error && (
            <div
              role="alert"
              style={{
                padding: 16,
                background: '#fff0ee',
                border: '1px solid #f0c9c3',
                color: '#a53b33',
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <strong>Dashboard could not load.</strong>
              <div style={{ marginTop: 6 }}>{error}</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                Check that the backend is running and the admin API routes
                exist. This dashboard does not generate fake database data.
              </div>
              <div style={{ marginTop: 12 }}>
                <ActionButton variant="danger" onClick={loadDashboard}>
                  Try again
                </ActionButton>
              </div>
            </div>
          )}

          {notice && (
            <div
              role="status"
              style={{
                padding: 13,
                background: '#e9f6ed',
                color: '#176b45',
                borderRadius: 10,
                marginBottom: 18,
                fontSize: 13,
              }}
            >
              {notice}
            </div>
          )}

          {loading && !error ? (
            <Card>
              <div role="status" style={{ padding: 25, color: COLORS.muted }}>
                Loading dashboard data...
              </div>
            </Card>
          ) : (
            <>
              {section === 'overview' && (
                <>
                  <div
                    style={{
                      background: `linear-gradient(115deg, ${COLORS.dark}, #26764d)`,
                      color: '#fff',
                      padding: '25px 27px',
                      borderRadius: 17,
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ color: '#c1e4ce', fontSize: 12 }}>
                      ADMINISTRATOR WORKSPACE
                    </div>
                    <h2 style={{ margin: '9px 0', fontSize: 25 }}>
                      Welcome back, {user?.name || 'Admin'}!
                    </h2>
                    <p
                      style={{
                        color: '#d7ecde',
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      Monitor platform users, agricultural activity and
                      marketplace operations from one place.
                    </p>
                  </div>

                  <div className="admin-stats" style={{ marginBottom: 20 }}>
                    <StatCard
                      icon="♙"
                      label="Total users"
                      value={stats.totalUsers}
                      note="Registered accounts"
                      color={COLORS.green}
                    />
                    <StatCard
                      icon="♧"
                      label="Farmers"
                      value={stats.farmers}
                      note="Farmer accounts"
                      color={COLORS.green}
                    />
                    <StatCard
                      icon="▣"
                      label="Products"
                      value={stats.products}
                      note="Marketplace products"
                      color={COLORS.blue}
                    />
                    <StatCard
                      icon="▤"
                      label="Total orders"
                      value={stats.orders}
                      note={`${formatNumber(stats.pendingOrders)} pending`}
                      color={COLORS.orange}
                    />
                  </div>

                  <div className="admin-grid" style={{ marginBottom: 20 }}>
                    <Card>
                      <SectionTitle
                        title="Platform overview"
                        subtitle="Distribution of registered users"
                      />
                      <BarChart data={userCounts} />
                    </Card>

                    <Card>
                      <SectionTitle
                        title="Agriculture snapshot"
                        subtitle="Current platform activity"
                      />
                      <div style={{ display: 'grid', gap: 0 }}>
                        {[
                          ['Agricultural experts', stats.experts, COLORS.purple],
                          ['Soil reports', stats.soilReports, COLORS.green],
                          ['Pending orders', stats.pendingOrders, COLORS.orange],
                        ].map(([label, value, color]) => (
                          <div
                            key={label}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              padding: '15px 0',
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                fontSize: 13,
                              }}
                            >
                              <span
                                style={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: 50,
                                  background: color,
                                }}
                              />
                              {label}
                            </div>
                            <strong>{formatNumber(value)}</strong>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card>
                    <SectionTitle
                      title="Recent activity"
                      subtitle="Latest activity returned by your backend"
                      action={
                        <ActionButton
                          variant="secondary"
                          onClick={() => setSection('analytics')}
                        >
                          View analytics
                        </ActionButton>
                      }
                    />

                    {activity.length === 0 ? (
                      <EmptyState text="No recent activity available." />
                    ) : (
                      <div style={{ display: 'grid', gap: 0 }}>
                        {activity.slice(0, 8).map((item, index) => (
                          <div
                            key={item._id || item.id || index}
                            style={{
                              display: 'flex',
                              gap: 12,
                              alignItems: 'flex-start',
                              padding: '14px 0',
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}
                          >
                            <div
                              style={{
                                width: 35,
                                height: 35,
                                borderRadius: 10,
                                background: '#eaf5ed',
                                display: 'grid',
                                placeItems: 'center',
                                color: COLORS.green,
                              }}
                            >
                              •
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>
                                {item.title || item.action || 'Platform activity'}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: COLORS.muted,
                                  marginTop: 5,
                                }}
                              >
                                {item.description || item.message || ''}
                              </div>
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.muted }}>
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString()
                                : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </>
              )}

              {section === 'users' && (
                <Card>
                  <SectionTitle
                    title="User management"
                    subtitle={`${filteredUsers.length} matching accounts`}
                    action={
                      <ActionButton variant="secondary" onClick={exportUsers}>
                        Export CSV
                      </ActionButton>
                    }
                  />

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      marginBottom: 18,
                    }}
                  >
                    <input
                      aria-label="Search users"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, email or phone..."
                      style={{
                        flex: '1 1 220px',
                        minWidth: 0,
                        padding: 11,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 9,
                      }}
                    />

                    <select
                      aria-label="Filter by role"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      style={{
                        padding: 11,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 9,
                        background: '#fff',
                      }}
                    >
                      <option value="all">All roles</option>
                      <option value="farmer">Farmers</option>
                      <option value="buyer">Buyers</option>
                      <option value="agriculturalist">Experts</option>
                      <option value="supplier">Suppliers</option>
                      <option value="admin">Admins</option>
                    </select>

                    <select
                      aria-label="Filter by status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        padding: 11,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 9,
                        background: '#fff',
                      }}
                    >
                      <option value="all">All statuses</option>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((item) => {
                          const role = getRole(item);
                          const status = String(
                            item.status || 'active'
                          ).toLowerCase();
                          const isAdmin = role === 'admin';
                          const isSelf =
                            getUserId(item) === getUserId(user);

                          return (
                            <tr key={getUserId(item)}>
                              <td>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 35,
                                      height: 35,
                                      borderRadius: 50,
                                      background: '#e8f3eb',
                                      display: 'grid',
                                      placeItems: 'center',
                                      color: COLORS.green,
                                      fontWeight: 800,
                                    }}
                                  >
                                    {getInitials(item.name)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800 }}>
                                      {item.name || 'Unnamed user'}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: COLORS.muted,
                                        marginTop: 3,
                                      }}
                                    >
                                      {item.email || 'No email'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                {ROLE_LABELS[role] || role}
                              </td>
                              <td>{item.phone || '—'}</td>
                              <td>
                                <StatusBadge value={status} />
                              </td>
                              <td>
                                <ActionButton
                                  variant={
                                    status === 'blocked'
                                      ? 'secondary'
                                      : 'danger'
                                  }
                                  disabled={Boolean(busyId) || isAdmin || isSelf}
                                  onClick={() => updateUserStatus(item)}
                                >
                                  {busyId === getUserId(item)
                                    ? 'Saving...'
                                    : status === 'blocked'
                                      ? 'Unblock'
                                      : 'Block'}
                                </ActionButton>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredUsers.length === 0 && (
                    <EmptyState text="No users match the selected filters." />
                  )}
                </Card>
              )}

              {section === 'agriculture' && (
                <>
                  <div className="admin-stats" style={{ marginBottom: 20 }}>
                    <StatCard
                      icon="♧"
                      label="Farmers"
                      value={stats.farmers}
                      note="Registered farmers"
                      color={COLORS.green}
                    />
                    <StatCard
                      icon="♙"
                      label="Experts"
                      value={stats.experts}
                      note="Agricultural experts"
                      color={COLORS.purple}
                    />
                    <StatCard
                      icon="▤"
                      label="Soil reports"
                      value={stats.soilReports}
                      note="Reports in the system"
                      color={COLORS.blue}
                    />
                    <StatCard
                      icon="♧"
                      label="Crop monitoring"
                      value={stats.cropReports ?? 0}
                      note="Requires backend count"
                      color={COLORS.orange}
                    />
                  </div>

                  <Card>
                    <SectionTitle
                      title="Agriculture operations"
                      subtitle="Quick access to existing project pages"
                    />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <ActionButton
                        variant="secondary"
                        onClick={() => navigate('/farms')}
                      >
                        Farms
                      </ActionButton>
                      <ActionButton
                        variant="secondary"
                        onClick={() => navigate('/soil')}
                      >
                        Soil analysis
                      </ActionButton>
                      <ActionButton
                        variant="secondary"
                        onClick={() => navigate('/crops')}
                      >
                        Crop monitoring
                      </ActionButton>
                      <ActionButton
                        variant="secondary"
                        onClick={() => navigate('/community')}
                      >
                        Community
                      </ActionButton>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        lineHeight: 1.7,
                        color: COLORS.muted,
                        marginTop: 18,
                      }}
                    >
                      These shortcuts open existing frontend routes. They do
                      not grant admin permissions by themselves.
                    </p>
                  </Card>
                </>
              )}

              {section === 'marketplace' && (
                <>
                  <div className="admin-stats" style={{ marginBottom: 20 }}>
                    <StatCard
                      icon="▣"
                      label="Products"
                      value={stats.products}
                      note="Marketplace inventory"
                      color={COLORS.blue}
                    />
                    <StatCard
                      icon="▤"
                      label="Orders"
                      value={stats.orders}
                      note="All orders"
                      color={COLORS.green}
                    />
                    <StatCard
                      icon="◷"
                      label="Pending orders"
                      value={stats.pendingOrders}
                      note="Awaiting processing"
                      color={COLORS.orange}
                    />
                    <StatCard
                      icon="♙"
                      label="Buyers"
                      value={stats.buyers}
                      note="Buyer accounts"
                      color={COLORS.purple}
                    />
                  </div>

                  <Card>
                    <SectionTitle
                      title="Marketplace operations"
                      subtitle="Open your existing marketplace pages"
                    />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <ActionButton
                        variant="secondary"
                        onClick={() => navigate('/shop')}
                      >
                        Shop
                      </ActionButton>
                      <ActionButton
                        variant="secondary"
                        onClick={() => navigate('/orders')}
                      >
                        Orders
                      </ActionButton>
                    </div>
                    <p
                      style={{
                        color: COLORS.muted,
                        fontSize: 12,
                        lineHeight: 1.7,
                        marginTop: 18,
                      }}
                    >
                      Order lists, revenue and order status controls require
                      the corresponding protected backend endpoints.
                    </p>
                  </Card>
                </>
              )}

              {section === 'community' && (
                <Card>
                  <SectionTitle
                    title="Community management"
                    subtitle="Community and expert consultation overview"
                  />
                  <div className="admin-stats">
                    <StatCard
                      icon="☷"
                      label="Recent activities"
                      value={activity.length}
                      note="Returned by backend"
                      color={COLORS.green}
                    />
                    <StatCard
                      icon="♙"
                      label="Experts"
                      value={stats.experts}
                      note="Registered experts"
                      color={COLORS.purple}
                    />
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <ActionButton
                      variant="secondary"
                      onClick={() => navigate('/community')}
                    >
                      Open Community
                    </ActionButton>
                  </div>
                </Card>
              )}

              {section === 'analytics' && (
                <div style={{ display: 'grid', gap: 18 }}>
                  <Card>
                    <SectionTitle
                      title="Platform analytics"
                      subtitle="Select a reporting period"
                      action={
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                          style={{
                            padding: 10,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 9,
                            background: '#fff',
                          }}
                        >
                          <option value="7d">Last 7 days</option>
                          <option value="30d">Last 30 days</option>
                          <option value="90d">Last 90 days</option>
                          <option value="1y">Last year</option>
                        </select>
                      }
                    />
                    <p
                      style={{
                        color: COLORS.muted,
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      Analytics must be calculated by the backend for the
                      selected period ({period}). The chart below uses the
                      series returned by the overview endpoint.
                    </p>

                    {chartRows.length ? (
                      <BarChart data={chartRows} />
                    ) : (
                      <EmptyState text="No analytics series returned by the backend yet." />
                    )}
                  </Card>

                  <div className="admin-stats">
                    <StatCard
                      icon="♙"
                      label="Users"
                      value={stats.totalUsers}
                      note="All registered users"
                      color={COLORS.green}
                    />
                    <StatCard
                      icon="▣"
                      label="Products"
                      value={stats.products}
                      note="Current inventory"
                      color={COLORS.blue}
                    />
                    <StatCard
                      icon="▤"
                      label="Orders"
                      value={stats.orders}
                      note="All recorded orders"
                      color={COLORS.orange}
                    />
                    <StatCard
                      icon="♧"
                      label="Soil reports"
                      value={stats.soilReports}
                      note="Recorded reports"
                      color={COLORS.purple}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
