import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FarmerNavbar from '../components/FarmerNavbar';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${BASE}/api`;

const PLACEHOLDER_PHONE = '0000000000'; // signup saves this until a real number is added
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

const ROLE_LABEL = {
  farmer: 'Farmer',
  buyer: 'Buyer',
  agriculturalist: 'Agricultural Expert',
  admin: 'Admin'
};
const ROLE_ICON = { farmer: '🌾', buyer: '🛒', agriculturalist: '🧑‍🔬', admin: '🛡️' };

const AVATAR_COLORS = [
  ['#a3e635', '#22c55e'],
  ['#38bdf8', '#6366f1'],
  ['#fbbf24', '#ef4444'],
  ['#f472b6', '#a855f7'],
  ['#2dd4bf', '#0ea5e9']
];

const C = {
  bg: '#0b1710',
  panel: '#122019',
  card: '#17291e',
  line: '#263b2c',
  lineStrong: '#2b4030',
  chip: '#203b29',
  lime: '#a3e635',
  limeHover: '#bef264',
  limeSoft: '#7acb7e',
  text: '#f1f8f1',
  muted: '#8fa292',
  soft: '#bdcdbf',
  red: '#ef4444',
  redText: '#fca5a5',
  amber: '#facc75',
  blue: '#93c5fd'
};

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */
async function readResponse(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const normPhone = (p = '') => p.replace(/[\s-]/g, '');
const showPhone = (p) => (p && p !== PLACEHOLDER_PHONE ? p : '');
const createForm = (u = {}) => ({
  name: u.name || '',
  email: u.email || '',
  phone: showPhone(u.phone)
});

const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const formatDate = (value, withTime = false) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });
};

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Too weak', color: '#ef4444' },
    { label: 'Weak', color: '#f59e0b' },
    { label: 'Fair', color: '#facc15' },
    { label: 'Good', color: '#a3e635' },
    { label: 'Strong', color: '#22c55e' }
  ];
  return { score, ...levels[pw ? score : 0] };
}

function validateDetails(f) {
  const e = {};
  const name = f.name.trim();
  const email = f.email.trim().toLowerCase();
  const phone = normPhone(f.phone);

  if (!name) e.name = 'Please enter your name.';
  else if (name.length > 100) e.name = 'Name can have up to 100 characters.';

  if (!email) e.email = 'Please enter your email address.';
  else if (!EMAIL_PATTERN.test(email)) e.email = 'Please enter a valid email address.';

  if (phone && !PHONE_PATTERN.test(phone)) e.phone = 'Phone number must have 10 to 15 digits.';
  return e;
}

function validatePassword(pw) {
  const e = {};
  if (!pw.current) e.current = 'Enter your current password.';
  if (!pw.next) e.next = 'Enter a new password.';
  else if (pw.next.length < 6) e.next = 'New password must be at least 6 characters long.';
  else if (pw.next === pw.current) e.next = 'Choose a password different from the current one.';
  if (!pw.confirm) e.confirm = 'Please confirm your new password.';
  else if (pw.next !== pw.confirm) e.confirm = 'Passwords do not match.';
  return e;
}

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window === 'undefined' ? 1200 : window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

/* ------------------------------------------------------------------ */
/*  Shared style objects                                               */
/* ------------------------------------------------------------------ */
const S = {
  page: {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    paddingBottom: 60,
    boxSizing: 'border-box'
  },
  container: { width: 'min(1180px, 92%)', margin: '0 auto', paddingTop: 28 },
  banner: {
    background: 'linear-gradient(120deg, #173b26, #10251a)',
    border: '1px solid #294a32',
    borderRadius: 22,
    padding: 28,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden'
  },
  crumb: {
    color: C.lime,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 20
  },
  h1: { margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, color: '#f7fff5' },
  panel: {
    background: C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 20,
    padding: 24,
    boxSizing: 'border-box'
  },
  sectionTitle: { margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#f3fbf0' },
  muted: { color: C.muted },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: C.soft, marginBottom: 8 },
  input: {
    display: 'block',
    width: '100%',
    minHeight: 46,
    padding: '12px 14px',
    background: C.bg,
    color: C.text,
    border: '1px solid #304537',
    borderRadius: 11,
    fontFamily: 'inherit',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#29452c',
    color: '#c5edaa',
    borderRadius: 50,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 700
  },
  pillMuted: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.06)',
    color: C.soft,
    borderRadius: 50,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600
  },
  divider: { borderTop: `1px solid ${C.lineStrong}`, margin: '18px 0' }
};

/* ------------------------------------------------------------------ */
/*  Reusable pieces                                                    */
/* ------------------------------------------------------------------ */
function Spinner({ size = 36, color = C.lime }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" role="img" aria-label="Loading">
      <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="31 125"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

function Btn({ variant = 'primary', full, disabled, children, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const active = hover && !disabled;

  const variants = {
    primary: {
      background: active ? C.limeHover : C.lime,
      color: '#14210f',
      border: `1px solid ${active ? C.limeHover : C.lime}`,
      borderRadius: 11
    },
    ghost: {
      background: active ? '#2b4b33' : C.chip,
      color: active ? '#fff' : '#d9f5d9',
      border: '1px solid #3c5a41',
      borderRadius: 50
    },
    danger: {
      background: active ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.08)',
      color: active ? '#fff' : '#ffaaa6',
      border: '1px solid rgba(239,68,68,0.35)',
      borderRadius: 11
    }
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '12px 20px',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, transform 0.15s, color 0.2s',
        transform: active ? 'translateY(-1px)' : 'none',
        outline: focus ? `2px solid ${C.limeSoft}` : 'none',
        outlineOffset: 2,
        opacity: disabled ? 0.5 : 1,
        width: full ? '100%' : undefined,
        ...variants[variant],
        ...style
      }}
    >
      {children}
    </button>
  );
}

function Field({ id, label, error, hint, right, onFocus, onBlur, ...inputProps }) {
  const [focus, setFocus] = useState(false);
  const disabled = !!inputProps.disabled;
  const describedBy = error ? `${id}-msg` : hint ? `${id}-msg` : undefined;

  return (
    <div>
      <label htmlFor={id} style={S.label}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...inputProps}
          onFocus={(e) => {
            setFocus(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            if (onBlur) onBlur(e);
          }}
          style={{
            ...S.input,
            paddingRight: right ? 80 : 14,
            borderColor: error ? C.red : focus ? C.limeSoft : '#304537',
            boxShadow: focus
              ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(122,203,126,0.15)'}`
              : 'none',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text'
          }}
        />
        {right && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            {right}
          </div>
        )}
      </div>
      {error ? (
        <div id={`${id}-msg`} role="alert" style={{ color: C.redText, fontSize: 12, marginTop: 6 }}>
          {error}
        </div>
      ) : hint ? (
        <div id={`${id}-msg`} style={{ ...S.muted, fontSize: 12, marginTop: 6 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function LinkButton({ children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        background: 'none',
        border: 'none',
        color: C.lime,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 4
      }}
    >
      {children}
    </button>
  );
}

function Avatar({ name, colors, size = 88 }) {
  return (
    <div
      role="img"
      aria-label={`Avatar for ${name || 'user'}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        color: '#10200f',
        display: 'grid',
        placeItems: 'center',
        fontSize: size * 0.4,
        fontWeight: 800,
        flexShrink: 0,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
      }}
    >
      {initialsOf(name)}
    </div>
  );
}

function Ring({ percent, size = 112 }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`Profile ${percent} percent complete`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={percent === 100 ? '#22c55e' : C.lime}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: 24,
          fontWeight: 800
        }}
      >
        {percent}%
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast.text) return null;
  const ok = toast.type === 'success';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 200,
        maxWidth: 'min(380px, calc(100vw - 40px))',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 14,
        fontSize: 14,
        lineHeight: 1.5,
        background: ok ? '#16301d' : '#331616',
        border: `1px solid ${ok ? '#56784b' : '#783a35'}`,
        color: ok ? '#d9f99d' : '#fecaca',
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)'
      }}
    >
      <span aria-hidden="true">{ok ? '✅' : '⚠️'}</span>
      <span style={{ flex: 1 }}>{toast.text}</span>
      <button
        type="button"
        aria-label="Close message"
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}
      >
        ✕
      </button>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.65)',
        display: 'grid',
        placeItems: 'center',
        padding: 20
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{ ...S.panel, width: 'min(420px, 100%)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: 20 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, onCopy }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        borderBottom: `1px solid ${C.lineStrong}`,
        flexWrap: 'wrap'
      }}
    >
      <span style={{ ...S.muted, fontSize: 14 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <b style={{ fontSize: 14, overflowWrap: 'anywhere' }}>{value || '-'}</b>
        {onCopy && value && value !== '-' && <LinkButton onClick={onCopy}>Copy</LinkButton>}
      </span>
    </div>
  );
}

function Rule({ ok, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: ok ? '#a3e635' : C.muted }}>
      <span aria-hidden="true">{ok ? '✔' : '○'}</span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isWide = width >= 920;
  const isPhone = width < 560;

  const userId = user?.id || user?._id;

  // Keep logout in a ref so effects do not re-run when the auth context re-renders
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const expire = useCallback(() => {
    logoutRef.current();
    navigate('/login');
  }, [navigate]);

  // ----- Profile data -----
  const [form, setForm] = useState(createForm());
  const [original, setOriginal] = useState(createForm());
  const [meta, setMeta] = useState({ role: '', createdAt: '', updatedAt: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // ----- UI state -----
  const [tab, setTab] = useState('details');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [toast, setToast] = useState({ type: '', text: '', id: 0 });
  const [stats, setStats] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // ----- Password state -----
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwVisible, setPwVisible] = useState({ current: false, next: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  // ----- Avatar colour (remembered in this browser) -----
  const colorKey = `ag-avatar-${userId}`;
  const [colorIndex, setColorIndex] = useState(0);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(colorKey));
      if (Number.isInteger(saved) && saved >= 0 && saved < AVATAR_COLORS.length) setColorIndex(saved);
    } catch {
      /* storage not available, keep default */
    }
  }, [colorKey]);

  const pickColor = (i) => {
    setColorIndex(i);
    try {
      localStorage.setItem(colorKey, String(i));
    } catch {
      /* ignore */
    }
  };

  const showToast = useCallback((type, text) => setToast({ type, text, id: Date.now() }), []);

  useEffect(() => {
    if (!toast.text) return undefined;
    const timer = setTimeout(() => setToast((t) => ({ ...t, text: '' })), 6000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.text]);

  // ---------- Load profile ----------
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProfile() {
      setLoading(true);
      setLoadError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Please log in to view your profile.');

        const res = await fetch(`${API}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const data = await readResponse(res);

        if (res.status === 401 || res.status === 403) {
          expire();
          return;
        }
        if (!res.ok) throw new Error(data.message || 'Could not load your profile.');
        if (!data.user) throw new Error('The server returned an invalid profile.');

        const f = createForm(data.user);
        setForm(f);
        setOriginal(f);
        setMeta({
          role: data.user.role || '',
          createdAt: data.user.createdAt || '',
          updatedAt: data.user.updatedAt || ''
        });
      } catch (err) {
        if (err.name === 'AbortError') return;
        setLoadError(err.message || 'Unable to connect to the server.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchProfile();
    return () => controller.abort();
  }, [expire, attempt]);

  // ---------- Role based stats ----------
  useEffect(() => {
    if (!userId || !meta.role) return undefined;
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    const opts = { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal };
    const getJson = (url) =>
      fetch(url, opts)
        .then((r) => r.json())
        .catch(() => null);
    const mine = (v) => String(v?._id || v) === String(userId);
    const role = String(meta.role).toLowerCase();

    (async () => {
      let items = [];

      if (role === 'farmer') {
        const [farms, orders, crops] = await Promise.all([
          getJson(`${API}/farms/all`),
          getJson(`${API}/orders?userId=${userId}&role=farmer`),
          getJson(`${API}/crops/all`)
        ]);
        items = [
          { icon: '🏡', label: 'Farms', value: Array.isArray(farms) ? farms.filter((f) => mine(f.farmer)).length : '-' },
          { icon: '📦', label: 'Orders', value: Array.isArray(orders) ? orders.length : '-' },
          { icon: '🌾', label: 'Crops listed', value: Array.isArray(crops) ? crops.filter((c) => mine(c.farmer)).length : '-' }
        ];
      } else if (role === 'agriculturalist') {
        const all = await getJson(`${API}/expert/all`);
        items = [
          {
            icon: '✅',
            label: 'Questions answered',
            value: Array.isArray(all) ? all.filter((q) => q.status === 'Answered' && mine(q.expert)).length : '-'
          },
          {
            icon: '⏳',
            label: 'Waiting for an answer',
            value: Array.isArray(all) ? all.filter((q) => q.status === 'Pending').length : '-'
          }
        ];
      } else if (role === 'buyer') {
        const crops = await getJson(`${API}/crops/all`);
        items = [{ icon: '🛒', label: 'Crops on the market', value: Array.isArray(crops) ? crops.length : '-' }];
      }

      if (!controller.signal.aborted) setStats(items);
    })();

    return () => controller.abort();
  }, [userId, meta.role]);

  // ---------- Derived values ----------
  const liveErrors = useMemo(() => validateDetails(form), [form]);
  const errorFor = (name) => (touched[name] && liveErrors[name]) || serverErrors[name] || '';

  const dirty =
    form.name.trim() !== original.name ||
    form.email.trim().toLowerCase() !== original.email.toLowerCase() ||
    normPhone(form.phone) !== normPhone(original.phone);

  useEffect(() => {
    if (!editing || !dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editing, dirty]);

  useEffect(() => {
    if (!confirmLogout) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmLogout(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmLogout]);

  const roleKey = String(meta.role).toLowerCase();
  const roleLabel = ROLE_LABEL[roleKey] || meta.role || 'Member';

  const checklist = [
    { label: 'Add your full name', done: !!original.name },
    { label: 'Add your email address', done: !!original.email },
    { label: 'Add your phone number', done: !!original.phone }
  ];
  const percent = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  const strength = strengthOf(pw.next);

  // ---------- Details form handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setServerErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const startEdit = () => {
    setForm({ ...original });
    setTouched({});
    setServerErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm({ ...original });
    setTouched({});
    setServerErrors({});
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (savingRef.current || !dirty) return;

    setTouched({ name: true, email: true, phone: true });
    if (Object.keys(liveErrors).length > 0) {
      showToast('error', 'Please fix the highlighted fields.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      expire();
      return;
    }

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = normPhone(form.phone);

    savingRef.current = true;
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, ...(phone ? { phone } : {}) })
      });
      const data = await readResponse(res);

      if (res.status === 401 || res.status === 403) {
        expire();
        return;
      }
      if (!res.ok) {
        const message = data.message || 'Could not update your profile.';
        if (/email/i.test(message)) setServerErrors({ email: message });
        else if (/phone/i.test(message)) setServerErrors({ phone: message });
        throw new Error(message);
      }
      if (!data.user) throw new Error('The server returned an invalid profile.');

      const f = createForm(data.user);
      setForm(f);
      setOriginal(f);
      setMeta((m) => ({
        role: data.user.role || m.role,
        createdAt: data.user.createdAt || m.createdAt,
        updatedAt: data.user.updatedAt || new Date().toISOString()
      }));

      // Keep AuthContext and localStorage in sync (the top menu shows the name)
      login(token, { ...user, ...data.user, role: data.user.role || meta.role });

      setEditing(false);
      setTouched({});
      setServerErrors({});
      showToast('success', 'Profile updated successfully.');
    } catch (err) {
      showToast('error', err.message || 'Unable to update your profile. Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // ---------- Password handlers ----------
  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPw((prev) => ({ ...prev, [name]: value }));
    setPwErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleVisible = (name) => setPwVisible((prev) => ({ ...prev, [name]: !prev[name] }));

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwSaving) return;

    const errors = validatePassword(pw);
    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      showToast('error', 'Please fix the highlighted fields.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      expire();
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch(`${API}/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next })
      });
      const data = await readResponse(res);

      if (res.status === 401 || res.status === 403) {
        expire();
        return;
      }
      if (!res.ok) {
        const message = data.message || 'Could not change your password.';
        if (/current/i.test(message)) setPwErrors({ current: message });
        throw new Error(message);
      }

      setPw({ current: '', next: '', confirm: '' });
      setPwVisible({ current: false, next: false, confirm: false });
      setPwErrors({});
      showToast('success', 'Password changed successfully.');
    } catch (err) {
      showToast('error', err.message || 'Could not change your password.');
    } finally {
      setPwSaving(false);
    }
  };

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `${what} copied.`);
    } catch {
      showToast('error', 'Could not copy. Select the text and copy it by hand.');
    }
  };

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
    navigate('/login', { replace: true });
  };

  const switchTab = (next) => {
    if (next === tab) return;
    if (editing && dirty && !window.confirm('You have unsaved changes. Discard them and switch tab?')) return;
    if (editing) cancelEdit();
    setTab(next);
  };

  /* ---------------- Loading and error screens ---------------- */
  if (loading) {
    return (
      <div style={S.page}>
        <FarmerNavbar />
        <div style={{ ...S.container, display: 'grid', placeItems: 'center', minHeight: 360 }}>
          <div role="status" aria-live="polite" style={{ textAlign: 'center' }}>
            <Spinner size={48} />
            <p style={{ ...S.muted, marginTop: 14 }}>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={S.page}>
        <FarmerNavbar />
        <div style={S.container}>
          <div style={{ ...S.panel, borderColor: '#783a35', background: 'rgba(127,29,29,0.18)' }} role="alert">
            <h3 style={{ margin: '0 0 8px', color: '#fecaca' }}>We could not load your profile</h3>
            <p style={{ margin: '0 0 18px', color: '#fecaca', lineHeight: 1.6 }}>{loadError}</p>
            <Btn onClick={() => setAttempt((n) => n + 1)}>Try again</Btn>
          </div>
        </div>
      </div>
    );
  }

  const colors = AVATAR_COLORS[colorIndex];

  /* ---------------- Main page ---------------- */
  return (
    <div style={S.page}>
      <FarmerNavbar />

      <div style={S.container}>
        {/* Banner */}
        <header style={S.banner}>
          <div style={S.crumb}>AGRITECH / MY PROFILE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <Avatar name={original.name} colors={colors} size={isPhone ? 72 : 96} />
            <div style={{ minWidth: 0 }}>
              <h1 style={S.h1}>{original.name || 'Your profile'}</h1>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <span style={S.pill}>
                  <span aria-hidden="true">{ROLE_ICON[roleKey] || '👤'}</span>
                  {roleLabel}
                </span>
                <span style={S.pillMuted}>Member since {formatDate(meta.createdAt)}</span>
              </div>
            </div>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isWide ? '320px minmax(0, 1fr)' : '1fr',
            gap: 24,
            alignItems: 'start'
          }}
        >
          {/* ---------- Sidebar ---------- */}
          <aside style={{ display: 'grid', gap: 24 }}>
            <section style={S.panel}>
              <h3 style={{ ...S.sectionTitle, fontSize: 17 }}>Profile completeness</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <Ring percent={percent} />
                <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
                  {checklist.map((c) => (
                    <Rule key={c.label} ok={c.done}>
                      {c.label}
                    </Rule>
                  ))}
                </div>
              </div>
              {percent < 100 && (
                <p style={{ ...S.muted, fontSize: 12, lineHeight: 1.6, margin: '14px 0 0' }}>
                  A complete profile helps farmers, buyers and experts reach you.
                </p>
              )}
            </section>

            {stats && stats.length > 0 && (
              <section style={S.panel}>
                <h3 style={{ ...S.sectionTitle, fontSize: 17 }}>Your activity</h3>
                <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        background: '#0c1911',
                        border: '1px solid #25392a',
                        borderRadius: 14,
                        padding: '12px 14px'
                      }}
                    >
                      <span style={{ fontSize: 24 }} aria-hidden="true">
                        {s.icon}
                      </span>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{s.value}</div>
                        <div style={{ ...S.muted, fontSize: 12 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section style={S.panel}>
              <h3 style={{ ...S.sectionTitle, fontSize: 17 }}>Avatar colour</h3>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                {AVATAR_COLORS.map((pair, i) => (
                  <button
                    key={pair[0]}
                    type="button"
                    aria-label={`Use avatar colour ${i + 1}`}
                    aria-pressed={i === colorIndex}
                    onClick={() => pickColor(i)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,
                      border: i === colorIndex ? '3px solid #fff' : '3px solid transparent',
                      outline: i === colorIndex ? `2px solid ${C.limeSoft}` : 'none'
                    }}
                  />
                ))}
              </div>
              <p style={{ ...S.muted, fontSize: 12, margin: '12px 0 0' }}>Saved on this device only.</p>
            </section>
          </aside>

          {/* ---------- Main column ---------- */}
          <main style={{ minWidth: 0 }}>
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Profile sections"
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 20,
                overflowX: 'auto',
                paddingBottom: 4
              }}
            >
              {[
                ['details', 'Details'],
                ['security', 'Security'],
                ['account', 'Account']
              ].map(([key, label]) => {
                const on = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => switchTab(key)}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 50,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      background: on ? C.lime : 'transparent',
                      color: on ? '#14210f' : C.soft,
                      border: `1px solid ${on ? C.lime : '#304537'}`
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ===== Details tab ===== */}
            {tab === 'details' && (
              <form style={S.panel} onSubmit={handleSave} noValidate role="tabpanel">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 20
                  }}
                >
                  <div>
                    <h3 style={S.sectionTitle}>Account details</h3>
                    <p style={{ ...S.muted, fontSize: 13, margin: 0 }}>
                      {editing ? 'Make your changes, then save.' : 'Press Edit profile to change your details.'}
                    </p>
                  </div>
                  {editing && dirty && (
                    <span style={{ ...S.pill, background: 'rgba(250,204,117,0.12)', color: C.amber }}>
                      Unsaved changes
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isPhone ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                    gap: 18
                  }}
                >
                  <Field
                    id="profile-name"
                    name="name"
                    label="Full name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!editing || saving}
                    autoComplete="name"
                    maxLength={100}
                    error={errorFor('name')}
                  />

                  <Field
                    id="profile-email"
                    name="email"
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!editing || saving}
                    autoComplete="email"
                    maxLength={254}
                    error={errorFor('email')}
                  />

                  <Field
                    id="profile-phone"
                    name="phone"
                    label="Phone number"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!editing || saving}
                    autoComplete="tel"
                    maxLength={16}
                    error={errorFor('phone')}
                    hint="10 to 15 digits. A + at the start is allowed."
                  />

                  <Field
                    id="profile-role"
                    label="Account role"
                    type="text"
                    value={roleLabel}
                    disabled
                    readOnly
                    hint="Your role cannot be changed here."
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
                  {!editing ? (
                    <Btn type="button" onClick={startEdit}>
                      ✏️ Edit profile
                    </Btn>
                  ) : (
                    <>
                      <Btn type="submit" disabled={saving || !dirty}>
                        {saving ? (
                          <>
                            <Spinner size={16} color="#14210f" /> Saving...
                          </>
                        ) : (
                          'Save changes'
                        )}
                      </Btn>
                      <Btn type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>
                        Cancel
                      </Btn>
                    </>
                  )}
                </div>
              </form>
            )}

            {/* ===== Security tab ===== */}
            {tab === 'security' && (
              <form style={S.panel} onSubmit={handlePasswordSave} noValidate role="tabpanel">
                <h3 style={S.sectionTitle}>Change password</h3>
                <p style={{ ...S.muted, fontSize: 13, margin: '0 0 22px' }}>
                  Use a password you do not use anywhere else.
                </p>

                <div style={{ display: 'grid', gap: 18, maxWidth: 440 }}>
                  <Field
                    id="pw-current"
                    name="current"
                    label="Current password"
                    type={pwVisible.current ? 'text' : 'password'}
                    value={pw.current}
                    onChange={handlePwChange}
                    autoComplete="current-password"
                    disabled={pwSaving}
                    error={pwErrors.current}
                    right={
                      <LinkButton onClick={() => toggleVisible('current')}>
                        {pwVisible.current ? 'Hide' : 'Show'}
                      </LinkButton>
                    }
                  />

                  <div>
                    <Field
                      id="pw-next"
                      name="next"
                      label="New password"
                      type={pwVisible.next ? 'text' : 'password'}
                      value={pw.next}
                      onChange={handlePwChange}
                      autoComplete="new-password"
                      disabled={pwSaving}
                      error={pwErrors.next}
                      right={
                        <LinkButton onClick={() => toggleVisible('next')}>
                          {pwVisible.next ? 'Hide' : 'Show'}
                        </LinkButton>
                      }
                    />
                    {pw.next && (
                      <div style={{ marginTop: 10 }}>
                        <div
                          style={{
                            height: 6,
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: 4,
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${(strength.score / 4) * 100}%`,
                              background: strength.color,
                              borderRadius: 4,
                              transition: 'width 0.25s, background 0.25s'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 12, marginTop: 5, color: strength.color, fontWeight: 700 }}>
                          {strength.label}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
                      <Rule ok={pw.next.length >= 6}>At least 6 characters (required)</Rule>
                      <Rule ok={pw.next.length >= 8}>8 or more characters</Rule>
                      <Rule ok={/[a-z]/.test(pw.next) && /[A-Z]/.test(pw.next)}>Upper and lower case letters</Rule>
                      <Rule ok={/\d/.test(pw.next)}>A number</Rule>
                      <Rule ok={/[^A-Za-z0-9]/.test(pw.next)}>A symbol, like ! or @</Rule>
                    </div>
                  </div>

                  <div>
                    <Field
                      id="pw-confirm"
                      name="confirm"
                      label="Confirm new password"
                      type={pwVisible.confirm ? 'text' : 'password'}
                      value={pw.confirm}
                      onChange={handlePwChange}
                      autoComplete="new-password"
                      disabled={pwSaving}
                      error={pwErrors.confirm}
                      right={
                        <LinkButton onClick={() => toggleVisible('confirm')}>
                          {pwVisible.confirm ? 'Hide' : 'Show'}
                        </LinkButton>
                      }
                    />
                    {pw.confirm && pw.next === pw.confirm && !pwErrors.confirm && (
                      <div style={{ fontSize: 12, marginTop: 6, color: '#a3e635' }}>✔ Passwords match</div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 26 }}>
                  <Btn type="submit" disabled={pwSaving}>
                    {pwSaving ? (
                      <>
                        <Spinner size={16} color="#14210f" /> Updating...
                      </>
                    ) : (
                      'Update password'
                    )}
                  </Btn>
                </div>
              </form>
            )}

            {/* ===== Account tab ===== */}
            {tab === 'account' && (
              <section style={S.panel} role="tabpanel">
                <h3 style={S.sectionTitle}>Account information</h3>
                <p style={{ ...S.muted, fontSize: 13, margin: '0 0 8px' }}>
                  Details about your account. You may need your account ID if you contact support.
                </p>

                <InfoRow label="Account ID" value={userId} onCopy={() => copy(String(userId), 'Account ID')} />
                <InfoRow label="Email" value={original.email} onCopy={() => copy(original.email, 'Email')} />
                <InfoRow label="Account type" value={roleLabel} />
                <InfoRow label="Member since" value={formatDate(meta.createdAt)} />
                <InfoRow label="Last updated" value={formatDate(meta.updatedAt, true)} />

                <div style={S.divider} />

                <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>Sign out</h4>
                <p style={{ ...S.muted, fontSize: 13, margin: '0 0 14px' }}>
                  You will need to log in again to use your account.
                </p>
                <Btn type="button" variant="danger" onClick={() => setConfirmLogout(true)}>
                  ↪ Log out
                </Btn>
              </section>
            )}
          </main>
        </div>
      </div>

      {confirmLogout && (
        <Modal title="Log out of AgriTech?" onClose={() => setConfirmLogout(false)}>
          <p style={{ ...S.muted, lineHeight: 1.6, margin: '0 0 20px' }}>
            You will be taken to the login page.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Btn type="button" variant="ghost" onClick={() => setConfirmLogout(false)}>
              Stay logged in
            </Btn>
            <Btn type="button" variant="danger" onClick={handleLogout}>
              Log out
            </Btn>
          </div>
        </Modal>
      )}

      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, text: '' }))} />
    </div>
  );
}

export default Profile;