import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import FarmerNavbar from '../components/FarmerNavbar';
import SoilCharts from '../components/SoilCharts';

const API = 'http://localhost:5000/api';
const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Mountain'];

const NPK_RANGES = {
  nitrogen:   { low: 280, high: 560, max: 560 },
  phosphorus: { low: 10,  high: 25,  max: 50 },
  potassium:  { low: 120, high: 280, max: 560 }
};

const barInfo = (value, nutrient, t) => {
  const number = Number(value);
  const range = NPK_RANGES[nutrient];

  if (value === null || value === undefined || value === '' ||
      !Number.isFinite(number) || number < 0) {
    return {
      width: 0,
      color: '#9ca3af',
      status: t('unavailableStatus') || 'Unavailable'
    };
  }

  if (number < range.low) {
    return {
      width: Math.min(100, (number / range.max) * 100),
      color: '#f59e0b',
      status: t('lowStatus') || 'Low'
    };
  }

  if (number <= range.high) {
    return {
      width: Math.min(100, (number / range.max) * 100),
      color: '#a3e635',
      status: t('optimalStatus') || 'Optimal'
    };
  }

  return {
    width: 100,
    color: '#f87171',
    status: t('highStatus') || 'High'
  };
};

const EMPTY = {
  farm: '',
  soilType: 'Alluvial',
  pHLevel: '',
  nitrogen: '',
  phosphorus: '',
  potassium: ''
};

function CropMonitoring() {
  
  const { user } = useAuth();
  
  const { t } = useLanguage();
  const navigate = useNavigate();
  const userId = user?.id || user?._id;

  const [farms, setFarms] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Authenticated API request
  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : ''
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Request failed: ${response.status}`
      );
    }

    return data;
  }, []);

  const load = useCallback(async () => {
    if (!userId) {
      setError(t('pleaseLoginError') || 'Please log in to view your farm and soil reports.');
      return;
    }

    setError('');

    try {
      const farmData = await authFetch(`${API}/farms/all`);

      const allFarms = Array.isArray(farmData)
        ? farmData
        : Array.isArray(farmData.farms)
          ? farmData.farms
          : Array.isArray(farmData.data)
            ? farmData.data
            : [];

      const myFarms = allFarms.filter((farm) => {
        const farmerId = farm.farmer?._id || farm.farmer;
        return String(farmerId) === String(userId);
      });

      setFarms(myFarms);

      const farmIds = new Set(myFarms.map((farm) => String(farm._id)));

      const soilData = await authFetch(`${API}/soil/all`);

      const allReports = Array.isArray(soilData)
        ? soilData
        : Array.isArray(soilData.reports)
          ? soilData.reports
          : Array.isArray(soilData.data)
            ? soilData.data
            : [];

      const myReports = allReports
        .filter((report) => {
          const farmId = report.farm?._id || report.farm;
          return farmId && farmIds.has(String(farmId));
        })
        .sort(
          (a, b) =>
            new Date(b.testedAt || 0) - new Date(a.testedAt || 0)
        );

      setReports(myReports);
    } catch (err) {
      setError(err.message || t('couldNotLoadData') || 'Could not load data. Please try again.');
    }
  }, [userId, authFetch, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'farm') {
      const selectedFarm = farms.find((farm) => farm._id === value);

      setForm((previous) => ({
        ...previous,
        farm: value,
        soilType: selectedFarm?.soilType || previous.soilType
      }));
    } else {
      setForm((previous) => ({
        ...previous,
        [name]: value
      }));
    }
  };

  const save = async (status) => {
    setError('');
    setNotice('');

    if (!form.farm) {
      setError(t('chooseFarm') || 'Please choose a farm first.');
      return;
    }

    if (
      form.pHLevel === '' ||
      form.nitrogen === '' ||
      form.phosphorus === '' ||
      form.potassium === ''
    ) {
      setError(t('fillSoilNutrientsError') || 'Please fill in pH, nitrogen, phosphorus and potassium.');
      return;
    }

    const pH = Number(form.pHLevel);
    const nitrogen = Number(form.nitrogen);
    const phosphorus = Number(form.phosphorus);
    const potassium = Number(form.potassium);

    if (
      !Number.isFinite(pH) ||
      pH < 0 ||
      pH > 14 ||
      !Number.isFinite(nitrogen) ||
      nitrogen < 0 ||
      !Number.isFinite(phosphorus) ||
      phosphorus < 0 ||
      !Number.isFinite(potassium) ||
      potassium < 0
    ) {
      setError('Enter a pH between 0 and 14 and non-negative nutrient values.');
      return;
    }

    try {
      await authFetch(`${API}/soil/add`, {
        method: 'POST',
        body: JSON.stringify({
          farm: form.farm,
          soilType: form.soilType,
          pHLevel: pH,
          nitrogen,
          phosphorus,
          potassium,
          status
        })
      });

      setForm({ ...EMPTY });
      setNotice(
        status === 'final'
          ? 'Report saved and locked.'
          : 'Report saved as draft.'
      );

      await load();
    } catch (err) {
      setError(err.message || 'Could not save the report.');
    }
  };

  const finalize = async (id) => {
    if (
      !window.confirm(
        'Finalize this report? It will be locked and cannot be edited.'
      )
    ) {
      return;
    }

    setError('');
    setNotice('');

    try {
      await authFetch(`${API}/soil/finalize/${id}`, {
        method: 'PUT'
      });

      setNotice('Report finalized successfully.');
      await load();
    } catch (err) {
      setError(err.message || 'Could not finalize the report.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this report?')) {
      return;
    }

    setError('');
    setNotice('');

    try {
      await authFetch(`${API}/soil/delete/${id}`, {
        method: 'DELETE'
      });

      setNotice('Report deleted successfully.');
      await load();
    } catch (err) {
      setError(err.message || 'Could not delete the report.');
    }
  };

  const finals = reports.filter((report) => report.status === 'final').length;

  return (
    <div className="ag-page">
      <FarmerNavbar />

      <div className="ag-container">
        <header className="ag-header" data-icon="🧪">
          <div className="ag-crumb">AGRITECH / {t('soilTest')?.toUpperCase() || 'SOIL ANALYSIS'}</div>
          <h1 className="ag-title">{t('soilTest') || 'Soil Analysis'} 🧪</h1>
          <p className="ag-sub">
            Record your soil test results and get crop and fertilizer advice for each farm.
          </p>
        </header>

        <section className="ag-stats">
          <div className="ag-stat">
            <div className="ag-stat-label">Total reports</div>
            <div className="ag-stat-num">{reports.length}</div>
          </div>

          <div className="ag-stat">
            <div className="ag-stat-label">Drafts</div>
            <div className="ag-stat-num">{reports.length - finals}</div>
          </div>

          <div className="ag-stat">
            <div className="ag-stat-label">Final (locked)</div>
            <div className="ag-stat-num">{finals}</div>
          </div>
        </section>

        {error && <div className="ag-error">{error}</div>}

        {notice && (
          <div
            className="ag-error"
            style={{
              background: 'rgba(163,230,53,0.10)',
              borderColor: '#56784b',
              color: '#d9f99d'
            }}
          >
            {notice}
          </div>
        )}

        <section className="ag-panel">
          <h3 className="ag-section-title">Add a soil report</h3>

          {farms.length === 0 ? (
            <div className="ag-empty">
              You need a farm before you can add a soil report.
              <br />
              <button
                className="ag-btn"
                style={{ marginTop: 14 }}
                onClick={() => navigate('/farms')}
              >
                Add a farm
              </button>
            </div>
          ) : (
            <>
              <div className="ag-form-grid">
                <div>
                  <label className="ag-label" htmlFor="farm">
                    Farm
                  </label>

                  <select
                    id="farm"
                    name="farm"
                    className="ag-input"
                    value={form.farm}
                    onChange={handleChange}
                  >
                    <option value="">Choose a farm</option>
                    {farms.map((farm) => (
                      <option key={farm._id} value={farm._id}>
                        {farm.farmName || farm.name || 'Unnamed Farm'}
                        {farm.location ? ` (${farm.location})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="ag-label" htmlFor="soilType">
                    Soil type
                  </label>

                  <select
                    id="soilType"
                    name="soilType"
                    className="ag-input"
                    value={form.soilType}
                    onChange={handleChange}
                  >
                    {SOIL_TYPES.map((soil) => (
                      <option key={soil} value={soil}>
                        {soil}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="ag-label" htmlFor="pHLevel">
                    pH level (0 to 14)
                  </label>
                  <input
                    id="pHLevel"
                    name="pHLevel"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    className="ag-input"
                    placeholder="e.g. 6.8"
                    value={form.pHLevel}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="ag-label" htmlFor="nitrogen">
                    Nitrogen (N)
                  </label>
                  <input
                    id="nitrogen"
                    name="nitrogen"
                    type="number"
                    min="0"
                    className="ag-input"
                    placeholder="e.g. 40"
                    value={form.nitrogen}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="ag-label" htmlFor="phosphorus">
                    Phosphorus (P)
                  </label>
                  <input
                    id="phosphorus"
                    name="phosphorus"
                    type="number"
                    min="0"
                    className="ag-input"
                    placeholder="e.g. 28"
                    value={form.phosphorus}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="ag-label" htmlFor="potassium">
                    Potassium (K)
                  </label>
                  <input
                    id="potassium"
                    name="potassium"
                    type="number"
                    min="0"
                    className="ag-input"
                    placeholder="e.g. 35"
                    value={form.potassium}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 20,
                  flexWrap: 'wrap'
                }}
              >
                <button className="ag-btn" onClick={() => save('draft')}>
                  {t('saveDraft') || 'Save as draft'}
                </button>

                <button
                  className="ag-btn-ghost"
                  onClick={() => save('final')}
                >
                  Save and lock as final
                </button>
              </div>
            </>
          )}
        </section>

        <SoilCharts reports={reports} farms={farms} />

        <h3 className="ag-section-title">Your reports</h3>

        {reports.length === 0 && !error && (
          <div className="ag-empty">
            No soil reports yet. Add your first report above.
          </div>
        )}

        <div className="ag-grid">
          {reports.map((report) => (
            <article className="ag-card" key={report._id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 14
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      color: '#d8f5cf',
                      fontSize: 18
                    }}
                  >
                    {report.farm?.farmName || 'Farm'}
                  </h4>

                  <div className="ag-muted" style={{ fontSize: 12 }}>
                    {report.soilType} soil, tested{' '}
                    {report.testedAt
                      ? new Date(report.testedAt).toLocaleDateString()
                      : 'date unavailable'}
                  </div>
                </div>

                <span
                  className="ag-pill"
                  style={
                    report.status === 'draft'
                      ? {
                          background: 'rgba(250,204,117,0.12)',
                          color: '#facc75'
                        }
                      : {}
                  }
                >
                  {report.status}
                </span>
              </div>

              <div
                className="ag-muted"
                style={{ fontSize: 13, marginBottom: 10 }}
              >
                pH: <b style={{ color: '#fff' }}>{report.pHLevel}</b>
              </div>

              {[
                ['Nitrogen (N)', report.nitrogen, 'nitrogen'],
                ['Phosphorus (P)', report.phosphorus, 'phosphorus'],
                ['Potassium (K)', report.potassium, 'potassium']
              ].map(([name, value, nutrient]) => {
                const bar = barInfo(value, nutrient, t);

                return (
                  <div key={name} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13
                      }}
                    >
                      <span>{name}</span>
                      <span style={{ color: bar.color, fontWeight: 700 }}>
                        {value ?? 'N/A'} ({bar.status})
                      </span>
                    </div>

                    <div
                      style={{
                        height: 8,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 4,
                        marginTop: 4
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${bar.width}%`,
                          background: bar.color,
                          borderRadius: 4
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              <div style={{ fontSize: 13, marginTop: 14 }}>
                <b>Suggested crops:</b>{' '}
                <span className="ag-muted">
                  {(report.recommendedCrops || []).join(', ') || 'Not available'}
                </span>
              </div>

              <div style={{ fontSize: 13, marginTop: 8 }}>
                <b>Fertilizer advice:</b>
                <ul
                  className="ag-muted"
                  style={{ margin: '6px 0 0', paddingLeft: 18 }}
                >
                  {(report.fertilizerRecommendations || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: '1px solid #2b4030'
                }}
              >
                {report.status === 'draft' && (
                  <button
                    className="ag-btn-ghost"
                    onClick={() => finalize(report._id)}
                  >
                    Finalize
                  </button>
                )}

                <button
                  className="ag-btn-danger"
                  onClick={() => remove(report._id)}
                >
                  🗑 {t('delete') || 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CropMonitoring;