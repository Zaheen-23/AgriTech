
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import FarmerNavbar from '../components/FarmerNavbar';
import { useLanguage } from '../context/LanguageContext';

const API = 'https://agritech-backend-qadd.onrender.com/api';
const PEST_API = `${API}/pests`;

const SEASONS = [
  'All Seasons',
  'Kharif',
  'Rabi',
  'Zaid',
  'All-Season'
];

const SEVERITY_COLORS = {
  Low: '#198754',
  Medium: '#b58105',
  High: '#dc6b16',
  Critical: '#dc3545'
};

function PestManagement() {
  const { t } = useLanguage();

  const [alerts, setAlerts] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);

  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('All Seasons');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load pest advisories and emergency alerts
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const seasons = ['Kharif', 'Rabi', 'Zaid', 'All-Season'];

      const responses = await Promise.all(
        seasons.map((season) =>
          fetch(
            `${PEST_API}/season/${encodeURIComponent(season)}`
          )
        )
      );

      const failedResponse = responses.find(
        (response) => !response.ok
      );

      if (failedResponse) {
        throw new Error(
          'Pest API request failed. Check the backend route.'
        );
      }

      const results = await Promise.all(
        responses.map((response) => response.json())
      );

      const uniqueAlerts = new Map();

      results.forEach((result) => {
        (result.alerts || []).forEach((alert) => {
          uniqueAlerts.set(
            alert._id ||
              `${alert.pestName}-${alert.affectedCrop}`,
            alert
          );
        });
      });

      const emergencyResponse = await fetch(
        `${PEST_API}/emergency`
      );

      if (!emergencyResponse.ok) {
        throw new Error(
          'Could not load emergency pest alerts.'
        );
      }

      const emergencyResult = await emergencyResponse.json();

      setAlerts(Array.from(uniqueAlerts.values()));
      setEmergencyAlerts(emergencyResult.alerts || []);
    } catch (err) {
      setError(
        err.message || 'Could not load pest advisories.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate crop options from database records
  const crops = useMemo(() => {
    return [
      ...new Set(
        alerts
          .map((alert) => alert.affectedCrop)
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));
  }, [alerts]);

  // Generate symptom options from database records
  const symptoms = useMemo(() => {
    return [
      ...new Set(
        alerts
          .map((alert) => alert.symptoms)
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));
  }, [alerts]);

  // Filter pest advisories
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const cropMatches =
        !selectedCrop ||
        alert.affectedCrop === selectedCrop;

      const seasonMatches =
        selectedSeason === 'All Seasons' ||
        alert.season === selectedSeason;

      const symptomsMatch =
        selectedSymptoms.length === 0 ||
        selectedSymptoms.every((symptom) =>
          alert.symptoms
            ?.toLowerCase()
            .includes(symptom.toLowerCase())
        );

      const searchableText = [
        alert.pestName,
        alert.affectedCrop,
        alert.season,
        alert.symptoms,
        alert.treatment
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const searchMatches = searchableText.includes(
        search.trim().toLowerCase()
      );

      return (
        cropMatches &&
        seasonMatches &&
        symptomsMatch &&
        searchMatches
      );
    });
  }, [
    alerts,
    selectedCrop,
    selectedSeason,
    selectedSymptoms,
    search
  ]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedCrop('');
    setSelectedSeason('All Seasons');
    setSelectedSymptoms([]);
    setSearch('');
  };

  // Toggle symptom selection
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    );
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#f4f8f2',
      color: '#203326',
      fontFamily: "'Segoe UI', sans-serif"
    },

    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '30px 18px'
    },

    panel: {
      background: '#fff',
      border: '1px solid #e1e9df',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 16px rgba(26,70,35,0.05)'
    },

    input: {
      width: '100%',
      padding: '11px 12px',
      border: '1px solid #d4dfd1',
      borderRadius: '9px',
      background: '#fff',
      color: '#203326',
      outlineOffset: '2px'
    }
  };

  return (
    <div style={styles.page}>
      <FarmerNavbar />

      <main style={styles.container}>
        {/* Page heading */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <div
              className="fw-semibold mb-1"
              style={{ color: '#398044' }}
            >
              {t('cropHealthCentre')}
            </div>

            <h1 className="fw-bold mb-2">
              {t('pestManagementTitle')}
            </h1>

            <p className="text-secondary mb-0">
              {t('pestManagementSubtitle')}
            </p>
          </div>

          <button
            className="btn btn-success rounded-pill px-4"
            type="button"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? 'Loading...' : t('refreshBtn')}
          </button>
        </div>

        {/* Emergency alerts */}
        {emergencyAlerts.map((alert) => (
          <div
            key={alert._id || alert.pestName}
            className="alert alert-danger rounded-3 mb-3"
            role="alert"
          >
            <h5 className="fw-bold">
              {t('emergencyAlertPrefix')} {alert.pestName}
            </h5>

            <p>
              <strong>{t('cropLabel')}:</strong>{' '}
              {alert.affectedCrop}
            </p>

            <p>
              <strong>{t('symptomsLabel')}:</strong>{' '}
              {alert.symptoms}
            </p>

            <p className="mb-0">
              <strong>{t('advisoryLabel')}:</strong>{' '}
              {alert.treatment}
            </p>
          </div>
        ))}

        {/* Filters */}
        <section style={styles.panel} className="mb-4">
          <h4 className="fw-bold mb-3">
            {t('findCropProblemTitle')}
          </h4>

          <div className="row g-3">
            {/* Crop filter */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                {t('cropDropdownLabel')}
              </label>

              <select
                style={styles.input}
                value={selectedCrop}
                onChange={(event) =>
                  setSelectedCrop(event.target.value)
                }
              >
                <option value="">
                  {t('allCropsOption')}
                </option>

                {crops.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>

            {/* Season filter */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                {t('seasonDropdownLabel')}
              </label>

              <select
                style={styles.input}
                value={selectedSeason}
                onChange={(event) =>
                  setSelectedSeason(event.target.value)
                }
              >
                {SEASONS.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>

            {/* Symptoms filter */}
            <div className="col-12">
              <label className="form-label fw-semibold">
                {t('selectSymptomsLabel')}
              </label>

              {symptoms.length === 0 ? (
                <p className="text-secondary">
                  {t('noSymptomsLoadedText')}
                </p>
              ) : (
                <div className="row g-2">
                  {symptoms.map((symptom) => {
                    const isSelected =
                      selectedSymptoms.includes(symptom);

                    return (
                      <div
                        className="col-12 col-md-6"
                        key={symptom}
                      >
                        <label
                          className="d-flex align-items-start gap-2 p-3 rounded-3 h-100"
                          style={{
                            cursor: 'pointer',
                            border: isSelected
                              ? '1px solid #398044'
                              : '1px solid #e1e9df',
                            background: isSelected
                              ? '#edf7ed'
                              : '#fff'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleSymptom(symptom)
                            }
                            className="mt-1"
                          />

                          <span>{symptom}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="col-12">
              <label className="form-label fw-semibold">
                {t('searchPestKeywordLabel')}
              </label>

              <input
                style={styles.input}
                type="search"
                placeholder={t('searchPestPlaceholder')}
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            {/* Filter actions */}
            <div className="col-12 d-flex flex-wrap align-items-center gap-2">
              <span className="text-secondary small">
                {selectedSymptoms.length}{' '}
                {t('symptomsSelectedSuffix')}
              </span>

              <button
                type="button"
                className="btn btn-outline-success btn-sm"
                onClick={() => setSelectedSymptoms([])}
              >
                {t('clearSymptomsBtn')}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={resetFilters}
              >
                {t('resetAllFiltersBtn')}
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border text-success"
              role="status"
            >
              <span className="visually-hidden">
                Loading
              </span>
            </div>

            <p className="mt-3">
              {t('loadingAdvisoriesText')}
            </p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <strong>
              {t('unableToLoadAdvisories')}
            </strong>

            <p className="mb-2">{error}</p>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={loadData}
            >
              {t('tryAgainBtn')}
            </button>
          </div>
        ) : (
          <>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h4 className="fw-bold mb-0">
                {t('matchingAdvisoriesTitle')}
              </h4>

              <span className="badge text-bg-success rounded-pill">
                {filteredAlerts.length}{' '}
                {t('foundBadgeSuffix')}
              </span>
            </div>

            {filteredAlerts.length === 0 ? (
              <div
                style={styles.panel}
                className="text-center py-5"
              >
                <div style={{ fontSize: 42 }}>🌱</div>

                <h5 className="fw-bold mt-2">
                  {t('noMatchingAdvisoryTitle')}
                </h5>

                <p className="text-secondary">
                  {t('noMatchingAdvisoryDesc')}
                </p>

                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={resetFilters}
                >
                  {t('resetAllFiltersBtn')}
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {filteredAlerts.map((alert) => (
                  <div
                    className="col-12 col-md-6 col-xl-4"
                    key={
                      alert._id ||
                      `${alert.pestName}-${alert.affectedCrop}`
                    }
                  >
                    <article
                      style={{
                        ...styles.panel,
                        height: '100%',
                        borderTop: `4px solid ${
                          SEVERITY_COLORS[alert.severity] ||
                          '#398044'
                        }`
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                        <h5 className="fw-bold mb-0">
                          {alert.pestName}
                        </h5>

                        <span
                          className="badge flex-shrink-0"
                          style={{
                            background:
                              SEVERITY_COLORS[alert.severity] ||
                              '#398044',
                            color: '#fff'
                          }}
                        >
                          {alert.severity || 'Medium'}
                        </span>
                      </div>

                      <p>
                        <strong>
                          🌾 {t('cropLabel')}:
                        </strong>{' '}
                        {alert.affectedCrop}
                      </p>

                      <p>
                        <strong>
                          {t('seasonListItemLabel')}
                        </strong>{' '}
                        {alert.season}
                      </p>

                      <h6 className="fw-bold">
                        {t('observedSymptomsHeader')}
                      </h6>

                      <p className="text-secondary">
                        {alert.symptoms}
                      </p>

                      <div
                        className="rounded-3 p-3"
                        style={{
                          background: '#edf7ed',
                          overflowWrap: 'anywhere'
                        }}
                      >
                        <h6 className="fw-bold">
                          {t('managementAdvisoryHeader')}
                        </h6>

                        <p className="mb-0">
                          {alert.treatment}
                        </p>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Disclaimer */}
        <p className="text-secondary small mt-4">
          {t('pestManagementDisclaimer')}
        </p>
      </main>
    </div>
  );
}

export default PestManagement;
