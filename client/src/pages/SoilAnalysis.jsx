
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmerNavbar from '../components/FarmerNavbar';

const API = 'https://agritech-backend-qadd.onrender.com/api/soil';
const FARMS_API = 'https://agritech-backend-qadd.onrender.com/api/farms/all';

const INITIAL_FORM = {
  farm: '',
  soilType: 'Alluvial',
  pHLevel: '',
  nitrogen: '',
  phosphorus: '',
  potassium: '',
};

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
};

const getError = (data, fallback) =>
  data?.message || data?.error || fallback;

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f5f7',
    color: '#172b24',
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    paddingBottom: '40px',
  },

  container: {
    width: 'calc(100% - 32px)',
    maxWidth: '1060px',
    margin: '0 auto',
    paddingTop: '22px',
  },

  hero: {
    background: 'linear-gradient(115deg, #174b37 0%, #286c50 100%)',
    color: '#fff',
    padding: '28px 26px',
    borderRadius: '12px',
    marginBottom: '18px',
    boxShadow: '0 5px 16px rgba(24, 75, 55, 0.14)',
  },

  eyebrow: {
    fontSize: '11px',
    fontWeight: 750,
    letterSpacing: '1.1px',
    color: '#8ce0b4',
    marginBottom: '8px',
    display: 'block',
  },

  heroContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
  },

  heroTitle: {
    margin: 0,
    fontSize: 'clamp(23px, 3vw, 30px)',
    fontWeight: 750,
    letterSpacing: '-0.6px',
  },

  heroDescription: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: '#e0eee7',
    lineHeight: 1.6,
  },

  heroButton: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    borderRadius: '22px',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 650,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },

  statCard: {
    background: '#fff',
    border: '1px solid #e5e9ed',
    borderRadius: '11px',
    padding: '17px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    boxShadow: '0 2px 7px rgba(20, 40, 30, 0.035)',
  },

  statIcon: {
    width: '43px',
    height: '43px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    background: '#edfaf2',
    fontSize: '21px',
  },

  statLabel: {
    margin: 0,
    fontSize: '12px',
    color: '#718078',
  },

  statNumber: {
    margin: '4px 0 0',
    fontSize: '23px',
    fontWeight: 750,
    color: '#173d2c',
  },

  card: {
    background: '#fff',
    border: '1px solid #e5e9ed',
    borderRadius: '12px',
    padding: '22px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(20, 40, 30, 0.035)',
  },

  sectionHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #edf0f2',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '19px',
    fontWeight: 750,
    color: '#183b2b',
  },

  sectionDescription: {
    margin: '6px 0 0',
    color: '#7a8780',
    fontSize: '12px',
    lineHeight: 1.6,
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '17px',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    minWidth: 0,
  },

  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#35483d',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '42px',
    padding: '10px 12px',
    border: '1px solid #dce4de',
    borderRadius: '7px',
    fontSize: '13px',
    color: '#263b30',
    background: '#fff',
    outlineColor: '#278452',
  },

  formFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
    borderTop: '1px solid #edf0f2',
    marginTop: '22px',
    paddingTop: '18px',
  },

  hint: {
    margin: 0,
    fontSize: '11px',
    color: '#7b8980',
    lineHeight: 1.6,
  },

  buttonGroup: {
    display: 'flex',
    gap: '9px',
    flexWrap: 'wrap',
  },

  secondaryButton: {
    background: '#fff',
    color: '#235b3e',
    border: '1px solid #cbded1',
    padding: '10px 14px',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  primaryButton: {
    background: '#237447',
    color: '#fff',
    border: '1px solid #237447',
    padding: '10px 14px',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  message: (type) => ({
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '17px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '12px',
    lineHeight: 1.6,
    background:
      type === 'success'
        ? '#eaf8ef'
        : type === 'error'
          ? '#fff0ef'
          : '#fff8e5',
    color:
      type === 'success'
        ? '#17663b'
        : type === 'error'
          ? '#b42318'
          : '#8a5a00',
    border: `1px solid ${
      type === 'success'
        ? '#c8ead4'
        : type === 'error'
          ? '#f6d0cd'
          : '#f1e0ad'
    }`,
  }),

  reportHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '15px',
  },

  countBadge: {
    background: '#e9f7ee',
    color: '#216a41',
    borderRadius: '20px',
    padding: '6px 11px',
    fontSize: '11px',
    fontWeight: 750,
  },

  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
    gap: '15px',
  },

  reportCard: {
    background: '#fff',
    border: '1px solid #e5e9ed',
    borderRadius: '11px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minWidth: 0,
    boxShadow: '0 2px 7px rgba(20, 40, 30, 0.025)',
  },

  reportTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },

  reportIcon: {
    width: '39px',
    height: '39px',
    borderRadius: '9px',
    background: '#edfaf2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '21px',
  },

  statusBadge: (isFinal) => ({
    borderRadius: '20px',
    padding: '5px 10px',
    fontSize: '10px',
    fontWeight: 750,
    background: isFinal ? '#e8f7ed' : '#f1f4f2',
    color: isFinal ? '#217346' : '#66736b',
  }),

  farmName: {
    margin: 0,
    color: '#193e2c',
    fontSize: '16px',
    fontWeight: 750,
    overflowWrap: 'anywhere',
  },

  soilType: {
    margin: '5px 0 0',
    color: '#7c8981',
    fontSize: '11px',
    textTransform: 'capitalize',
  },

  phBox: {
    padding: '13px',
    borderRadius: '8px',
    background: '#f5f8f6',
    border: '1px solid #edf1ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },

  metricList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  recommendation: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #edf0f2',
  },

  recommendationIcon: {
    width: '30px',
    height: '30px',
    flexShrink: 0,
    borderRadius: '7px',
    background: '#eff8f1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '15px',
  },

  emptyState: {
    background: '#fff',
    border: '1px solid #e5e9ed',
    borderRadius: '11px',
    padding: '38px 18px',
    textAlign: 'center',
  },

  footer: {
    textAlign: 'center',
    color: '#8a968f',
    fontSize: '11px',
    padding: '12px 0 0',
  },
};

function renderMetric(label, value, color, maxValue = 100) {
  const number = Number(value);
  const safeValue = Number.isFinite(number) ? number : 0;
  const percentage = Math.min(
    100,
    Math.max(0, (safeValue / maxValue) * 100)
  );

  return (
    <div
      key={label}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '11px',
          color: '#728078',
        }}
      >
        <span>{label}</span>
        <strong style={{ color: '#294536' }}>{safeValue}</strong>
      </div>

      <div
        style={{
          height: '6px',
          background: '#e9eeeb',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: color,
            borderRadius: '10px',
            transition: 'width 0.25s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function SoilAnalysis() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState(INITIAL_FORM);

  const getHeaders = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Please log in again to continue.');
    }

    return { Authorization: `Bearer ${token}` };
  };

  const fetchFarms = async () => {
    const response = await fetch(FARMS_API, {
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getError(data, 'Unable to load farms.'));
    }

    const farmList = getList(data, ['farms', 'data']);
    setFarms(farmList);
    return farmList;
  };

  const fetchReports = async () => {
    const response = await fetch(`${API}/all`, {
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getError(data, 'Unable to load soil reports.'));
    }

    const reportList =
      data?.success && Array.isArray(data.reports)
        ? data.reports
        : getList(data, ['reports', 'data']);

    setReports(reportList);
    return reportList;
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        if (!localStorage.getItem('token')) {
          throw new Error('Please log in again to access soil analysis.');
        }

        const results = await Promise.allSettled([
          fetchFarms(),
          fetchReports(),
        ]);

        if (!active) return;

        const errors = [];

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            errors.push(
              `${index === 0 ? 'Farms' : 'Reports'}: ${
                result.reason?.message || 'Loading failed.'
              }`
            );
          }
        });

        if (errors.length) {
          setMessage({ type: 'warning', text: errors.join(' ') });
        }
      } catch (error) {
        if (active) {
          setMessage({
            type: 'error',
            text: error.message || 'Could not connect to server.',
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setMessage({ type: '', text: '' });

    const status = event.nativeEvent.submitter?.value || 'draft';

    if (!formData.farm) {
      setMessage({
        type: 'error',
        text: 'Please select a farm first.',
      });
      return;
    }

    const numericFields = [
      ['pHLevel', 'pH level'],
      ['nitrogen', 'Nitrogen'],
      ['phosphorus', 'Phosphorus'],
      ['potassium', 'Potassium'],
    ];

    for (const [field, label] of numericFields) {
      if (
        formData[field] === '' ||
        !Number.isFinite(Number(formData[field]))
      ) {
        setMessage({
          type: 'error',
          text: `Please enter a valid ${label} value.`,
        });
        return;
      }
    }

    if (Number(formData.pHLevel) < 0 || Number(formData.pHLevel) > 14) {
      setMessage({
        type: 'error',
        text: 'pH level must be between 0 and 14.',
      });
      return;
    }

    if (numericFields.some(([field]) => Number(formData[field]) < 0)) {
      setMessage({
        type: 'error',
        text: 'Nutrient values cannot be negative.',
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        pHLevel: Number(formData.pHLevel),
        nitrogen: Number(formData.nitrogen),
        phosphorus: Number(formData.phosphorus),
        potassium: Number(formData.potassium),
        status,
      };

      const response = await fetch(`${API}/add`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getError(data, 'Failed to save soil report.'));
      }

      setMessage({
        type: 'success',
        text:
          data?.message ||
          (status === 'final'
            ? 'Final soil report saved.'
            : 'Soil report saved as draft.'),
      });

      setFormData(INITIAL_FORM);
      await fetchReports();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Could not save soil report.',
      });
    } finally {
      setSaving(false);
    }
  };

  const draftCount = reports.filter(
    (report) => report.status === 'draft'
  ).length;

  const finalCount = reports.filter(
    (report) => report.status === 'final'
  ).length;

  const getFarmName = (report) => {
    if (report.farm && typeof report.farm === 'object') {
      return (
        report.farm.farmName ||
        report.farm.name ||
        'Farm'
      );
    }

    const matchingFarm = farms.find(
      (farm) => farm._id === report.farm
    );

    return (
      report.farmName ||
      matchingFarm?.farmName ||
      matchingFarm?.name ||
      'Farm'
    );
  };

  return (
    <div style={styles.page}>
      <FarmerNavbar />

      <main style={styles.container}>
        <section style={styles.hero}>
          <span style={styles.eyebrow}>
            AGRITECH / SOIL HEALTH MANAGEMENT
          </span>

          <div style={styles.heroContent}>
            <div>
              <h1 style={styles.heroTitle}>
                Soil Analysis 🧪
              </h1>

              <p style={styles.heroDescription}>
                Monitor soil health, review test results and manage
                recommendations for your farms.
              </p>
            </div>

            <button
              type="button"
              style={styles.heroButton}
              onClick={() => navigate('/dashboard/farmer')}
            >
              ← Farmer Dashboard
            </button>
          </div>
        </section>

        <section style={styles.statsGrid}>
          <article style={styles.statCard}>
            <div style={styles.statIcon}>📋</div>
            <div>
              <p style={styles.statLabel}>Total reports</p>
              <h2 style={styles.statNumber}>{reports.length}</h2>
            </div>
          </article>

          <article style={styles.statCard}>
            <div style={styles.statIcon}>📝</div>
            <div>
              <p style={styles.statLabel}>Draft reports</p>
              <h2 style={styles.statNumber}>{draftCount}</h2>
            </div>
          </article>

          <article style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <p style={styles.statLabel}>Final reports</p>
              <h2 style={styles.statNumber}>{finalCount}</h2>
            </div>
          </article>
        </section>

        {message.text && (
          <div style={styles.message(message.type)} role="status">
            <span>
              {message.type === 'success'
                ? '✓'
                : message.type === 'error'
                  ? '!'
                  : 'ℹ'}
            </span>

            <span style={{ flex: 1 }}>{message.text}</span>

            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setMessage({ type: '', text: '' })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontSize: '19px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        )}

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <div>
              <span style={styles.eyebrow}>
                SOIL RECORDS
              </span>

              <h2 style={styles.sectionTitle}>
                Add a soil report
              </h2>

              <p style={styles.sectionDescription}>
                Enter the values recorded in your soil test.
              </p>
            </div>

            <div style={styles.statIcon}>🌱</div>
          </div>

          {farms.length === 0 && !loading && (
            <div
              style={{
                padding: '12px 14px',
                background: '#fff8e5',
                color: '#815b12',
                border: '1px solid #f1e0ad',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '18px',
              }}
            >
              No farms are available. Please add a farm first.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label htmlFor="farm" style={styles.label}>
                  Select farm
                </label>

                <select
                  id="farm"
                  name="farm"
                  value={formData.farm}
                  onChange={handleChange}
                  required
                  disabled={loading || farms.length === 0 || saving}
                  style={styles.input}
                >
                  <option value="">
                    {loading
                      ? 'Loading farms...'
                      : farms.length === 0
                        ? 'No farms available'
                        : 'Choose a farm'}
                  </option>

                  {farms.map((farm) => (
                    <option key={farm._id} value={farm._id}>
                      {farm.farmName || farm.name || 'Unnamed Farm'}
                      {farm.location ? ` — ${farm.location}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label htmlFor="soilType" style={styles.label}>
                  Soil type
                </label>

                <select
                  id="soilType"
                  name="soilType"
                  value={formData.soilType}
                  onChange={handleChange}
                  disabled={saving}
                  style={styles.input}
                >
                  <option value="Alluvial">Alluvial</option>
                  <option value="Black">Black</option>
                  <option value="Red">Red and Yellow</option>
                  <option value="Laterite">Laterite</option>
                  <option value="Sandy">Sandy / Desert</option>
                  <option value="Mountain">Mountain / Forest</option>
                </select>
              </div>

              <div style={styles.field}>
                <label htmlFor="pHLevel" style={styles.label}>
                  pH level (0–14)
                </label>

                <input
                  id="pHLevel"
                  type="number"
                  name="pHLevel"
                  min="0"
                  max="14"
                  step="0.1"
                  placeholder="e.g. 6.8"
                  value={formData.pHLevel}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="nitrogen" style={styles.label}>
                  Nitrogen (N)
                </label>

                <input
                  id="nitrogen"
                  type="number"
                  name="nitrogen"
                  min="0"
                  step="any"
                  placeholder="Enter nitrogen value"
                  value={formData.nitrogen}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="phosphorus" style={styles.label}>
                  Phosphorus (P)
                </label>

                <input
                  id="phosphorus"
                  type="number"
                  name="phosphorus"
                  min="0"
                  step="any"
                  placeholder="Enter phosphorus value"
                  value={formData.phosphorus}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="potassium" style={styles.label}>
                  Potassium (K)
                </label>

                <input
                  id="potassium"
                  type="number"
                  name="potassium"
                  min="0"
                  step="any"
                  placeholder="Enter potassium value"
                  value={formData.potassium}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formFooter}>
              <p style={styles.hint}>
                ⓘ Use values from your soil test for reliable records.
              </p>

              <div style={styles.buttonGroup}>
                <button
                  type="submit"
                  name="status"
                  value="draft"
                  style={{
                    ...styles.secondaryButton,
                    opacity: saving || loading || farms.length === 0 ? 0.6 : 1,
                  }}
                  disabled={saving || loading || farms.length === 0}
                >
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>

                <button
                  type="submit"
                  name="status"
                  value="final"
                  style={{
                    ...styles.primaryButton,
                    opacity: saving || loading || farms.length === 0 ? 0.6 : 1,
                  }}
                  disabled={saving || loading || farms.length === 0}
                >
                  {saving ? 'Saving...' : '✓ Save as Final'}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section>
          <div style={styles.reportHeading}>
            <div>
              <span style={styles.eyebrow}>
                YOUR RECORDS
              </span>

              <h2 style={styles.sectionTitle}>
                Soil health reports
              </h2>

              <p style={styles.sectionDescription}>
                Review soil values and recommendations saved for your farms.
              </p>
            </div>

            <span style={styles.countBadge}>
              {reports.length} reports
            </span>
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>
                ⏳
              </div>

              <h3 style={{ margin: 0, fontSize: '16px' }}>
                Loading soil reports...
              </h3>

              <p style={styles.sectionDescription}>
                Please wait while we retrieve your records.
              </p>
            </div>
          ) : reports.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '30px', marginBottom: '10px' }}>
                🌿
              </div>

              <h3 style={{ margin: 0, fontSize: '16px', color: '#193e2c' }}>
                No soil reports yet
              </h3>

              <p style={styles.sectionDescription}>
                Add your first soil test above to start monitoring soil health.
              </p>
            </div>
          ) : (
            <div style={styles.reportsGrid}>
              {reports.map((report) => {
                const ph = report.pHLevel ?? 0;
                const nitrogen = report.nitrogen ?? 0;
                const phosphorus = report.phosphorus ?? 0;
                const potassium = report.potassium ?? 0;
                const isFinal = report.status === 'final';

                const crops = Array.isArray(report.recommendedCrops)
                  ? report.recommendedCrops.join(', ')
                  : report.recommendedCrops || 'Not available';

                const fertilizers = Array.isArray(
                  report.fertilizerRecommendations
                )
                  ? report.fertilizerRecommendations.join('; ')
                  : report.fertilizerRecommendations ||
                    'No recommendations available';

                return (
                  <article key={report._id} style={styles.reportCard}>
                    <div style={styles.reportTop}>
                      <div style={styles.reportIcon}>🌾</div>

                      <span style={styles.statusBadge(isFinal)}>
                        {isFinal ? '✓ Final' : 'Draft'}
                      </span>
                    </div>

                    <div>
                      <h3 style={styles.farmName}>
                        {getFarmName(report)}
                      </h3>

                      <p style={styles.soilType}>
                        {report.soilType || 'General'} soil
                      </p>
                    </div>

                    <div style={styles.phBox}>
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#7a8780',
                            display: 'block',
                            marginBottom: '4px',
                          }}
                        >
                          pH level
                        </span>

                        <strong style={{ fontSize: '21px', color: '#193e2c' }}>
                          {ph}
                        </strong>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color:
                            Number(ph) < 6.5
                              ? '#b7791f'
                              : Number(ph) > 7.5
                                ? '#7b5bc7'
                                : '#237447',
                          textAlign: 'right',
                        }}
                      >
                        {Number(ph) < 6.5
                          ? 'Acidic range'
                          : Number(ph) > 7.5
                            ? 'Alkaline range'
                            : 'Near neutral range'}
                      </span>
                    </div>

                    <div style={styles.metricList}>
                      {renderMetric('Nitrogen (N)', nitrogen, '#269b61')}
                      {renderMetric('Phosphorus (P)', phosphorus, '#d69a28')}
                      {renderMetric('Potassium (K)', potassium, '#5686d8')}
                    </div>

                    <div style={styles.recommendation}>
                      <div style={styles.recommendationIcon}>🌱</div>

                      <div style={{ minWidth: 0 }}>
                        <h4
                          style={{
                            margin: '0 0 5px',
                            fontSize: '12px',
                            color: '#294536',
                          }}
                        >
                          Suggested crops
                        </h4>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            color: '#748078',
                            lineHeight: 1.7,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {crops}
                        </p>
                      </div>
                    </div>

                    <div style={styles.recommendation}>
                      <div style={styles.recommendationIcon}>🧪</div>

                      <div style={{ minWidth: 0 }}>
                        <h4
                          style={{
                            margin: '0 0 5px',
                            fontSize: '12px',
                            color: '#294536',
                          }}
                        >
                          Fertilizer advice
                        </h4>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            color: '#748078',
                            lineHeight: 1.7,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {fertilizers}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer style={styles.footer}>
          🌿 AgriTech · Soil Health Management
        </footer>
      </main>
    </div>
  );
}
