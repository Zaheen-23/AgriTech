
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FarmerNavbar from '../components/FarmerNavbar';
import { useLanguage } from '../context/LanguageContext';

const API = 'https://agritech-backend-qadd.onrender.com/api/farms';

const SOIL_TYPES = [
  'Alluvial',
  'Black',
  'Red',
  'Laterite',
  'Sandy',
  'Mountain',
];

function Farms() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [farms, setFarms] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    farmName: '',
    location: '',
    size: '',
    soilType: 'Alluvial',
  });

  const loadFarms = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');

    fetch(`${API}/all`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('fetchFarmsError'));
        return res.json();
      })
      .then((data) => {
        const userId = user._id || user.id;

        const myFarms = Array.isArray(data)
          ? data.filter(
              (farm) =>
                String(farm.farmer?._id || farm.farmer) ===
                String(userId)
            )
          : [];

        setFarms(myFarms);
        setError('');
      })
      .catch(() => {
        setError(t('serverReachError'));
      })
      .finally(() => setLoading(false));
  }, [user, t]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const userId = user?._id || user?.id;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          ...form,
          farmer: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('addFarmError'));
        return;
      }

      setForm({
        farmName: '',
        location: '',
        size: '',
        soilType: 'Alluvial',
      });

      loadFarms();
    } catch {
      setError(t('serverReachError'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteFarm'))) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API}/delete/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!res.ok) {
        setError(t('deleteFarmError'));
        return;
      }

      loadFarms();
    } catch {
      setError(t('deleteFarmError'));
    }
  };

  const uniqueSoilTypes = new Set(
    farms.map((farm) => farm.soilType).filter(Boolean)
  ).size;

  const uniqueLocations = new Set(
    farms
      .map((farm) => farm.location?.trim().toLowerCase())
      .filter(Boolean)
  ).size;

  return (
    <div className="farm-page">
      <FarmerNavbar />

      <main className="container farm-container">
        {/* Page Header */}
        <section className="farm-header">
          <div className="farm-header-top">
            <div>
              <span className="farm-eyebrow">
                {t('agritechFarmManagementCrumb')}
              </span>

              <span className="farm-workspace-label">
                {t('workspaceTitle')}
              </span>

              <h1>{t('myFarmsTitle')} 🌾</h1>

              <p>{t('myFarmsSubtitle')}</p>
            </div>

            <button
              type="button"
              className="farm-outline-btn"
              onClick={() => navigate('/dashboard/farmer')}
            >
              ← {t('dashboardNavBtn')}
            </button>
          </div>
        </section>

        {/* Statistics */}
        <section className="row g-3 farm-stats">
          <div className="col-12 col-sm-6 col-lg-4">
            <article className="farm-stat">
              <div className="farm-stat-top">
                <span>{t('registeredFarmsLabel')}</span>
                <span className="farm-stat-icon">🏡</span>
              </div>

              <h2>{farms.length}</h2>
              <p>{t('farmPortfolioNote')}</p>
            </article>
          </div>

          <div className="col-12 col-sm-6 col-lg-4">
            <article className="farm-stat">
              <div className="farm-stat-top">
                <span>{t('soilCategoriesLabel')}</span>
                <span className="farm-stat-icon">🌱</span>
              </div>

              <h2>{uniqueSoilTypes}</h2>
              <p>{t('typesRepresentedNote')}</p>
            </article>
          </div>

          <div className="col-12 col-sm-6 col-lg-4">
            <article className="farm-stat">
              <div className="farm-stat-top">
                <span>{t('farmLocationsStatLabel')}</span>
                <span className="farm-stat-icon">📍</span>
              </div>

              <h2>{uniqueLocations}</h2>
              <p>{t('uniqueLocationsNote')}</p>
            </article>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger farm-alert" role="alert">
            {error}
          </div>
        )}

        {/* Register Farm */}
        <section className="farm-panel">
          <div className="farm-section-heading">
            <div className="farm-heading-icon">＋</div>

            <div>
              <h2>{t('registerNewFarmHeading')}</h2>
              <p>{t('registerNewFarmSub')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-3">
                <label className="farm-label" htmlFor="farmName">
                  {t('farmNameLabel')}
                </label>

                <input
                  id="farmName"
                  name="farmName"
                  className="form-control farm-input"
                  placeholder={t('farmNamePlaceholder')}
                  value={form.farmName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <label className="farm-label" htmlFor="farmLocation">
                  {t('locationLabel')}
                </label>

                <input
                  id="farmLocation"
                  name="location"
                  className="form-control farm-input"
                  placeholder={t('locationPlaceholder')}
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <label className="farm-label" htmlFor="farmSize">
                  {t('farmSizeLabel')}
                </label>

                <input
                  id="farmSize"
                  name="size"
                  className="form-control farm-input"
                  placeholder={t('farmSizePlaceholder')}
                  value={form.size}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <label className="farm-label" htmlFor="farmSoil">
                  {t('soilTypeLabel')}
                </label>

                <select
                  id="farmSoil"
                  name="soilType"
                  className="form-select farm-input"
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

              <div className="col-12">
                <button
                  type="submit"
                  className="farm-primary-btn w-100"
                >
                  ＋ {t('addFarmBtn')}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Farm Overview */}
        <section className="farm-overview">
          <div className="farm-overview-heading">
            <div>
              <span className="farm-eyebrow">
                {t('yourLandHeader')}
              </span>

              <h2>{t('farmOverviewTitle')}</h2>
              <p>{t('farmOverviewSub')}</p>
            </div>

            <span className="farm-count">
              {farms.length}{' '}
              {farms.length === 1
                ? t('farmCountSuffix')
                : t('farmsCountSuffix')}
            </span>
          </div>

          {loading && (
            <div className="farm-empty">
              <p>{t('loading') || 'Loading farms...'}</p>
            </div>
          )}

          {!loading && farms.length === 0 && !error && (
            <div className="farm-empty">
              <div className="farm-empty-icon">🌱</div>
              <h3>{t('emptyFarmJourneyTitle')}</h3>
              <p>{t('emptyFarmJourneyDesc')}</p>
            </div>
          )}

          <div className="row g-3">
            {farms.map((farm) => (
              <div
                className="col-12 col-md-6 col-xl-4"
                key={farm._id || farm.id}
              >
                <article className="farm-card">
                  <div className="farm-card-heading">
                    <div className="farm-card-title">
                      <div className="farm-card-icon">🌾</div>

                      <div className="farm-card-name">
                        <h3>{farm.farmName}</h3>
                        <span>
                          {t('registeredFarmlandBadge')}
                        </span>
                      </div>
                    </div>

                    <span className="farm-soil-badge">
                      {farm.soilType}
                    </span>
                  </div>

                  <div className="farm-details">
                    <div className="farm-meta">
                      <span className="farm-meta-icon">📍</span>

                      <div>
                        <span>{t('locationMetaLabel')}</span>
                        <strong>{farm.location}</strong>
                      </div>
                    </div>

                    <div className="farm-meta">
                      <span className="farm-meta-icon">📐</span>

                      <div>
                        <span>{t('landAreaMetaLabel')}</span>
                        <strong>{farm.size}</strong>
                      </div>
                    </div>

                    <div className="farm-meta">
                      <span className="farm-meta-icon">🪴</span>

                      <div>
                        <span>{t('soilCategoryMetaLabel')}</span>
                        <strong>
                          {farm.soilType} {t('soilSuffixLabel')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="farm-card-footer">
                    <span>{t('farmDetailsFooter')}</span>

                    <button
                      type="button"
                      className="farm-delete-btn"
                      onClick={() =>
                        handleDelete(farm._id || farm.id)
                      }
                    >
                      {t('deleteFarmBtn')}
                    </button>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>

        <footer className="farm-footer">
          {t('farmFooterSlogan')}
        </footer>
      </main>

      <style>{`
        .farm-page {
          min-height: 100vh;
          color: var(--ag-text, #243b2b);
          background: var(--ag-bg, #f3f7f3);
          font-family: Inter, "Segoe UI", sans-serif;
        }

        .farm-container {
          padding-top: 28px;
          padding-bottom: 50px;
        }

        .farm-header {
          margin-bottom: 24px;
          padding: 28px;
          background: #fff;
          border: 1px solid #dce9de;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(31,75,42,.07);
        }

        .farm-header-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .farm-eyebrow {
          display: block;
          margin-bottom: 10px;
          color: #176b38;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .farm-workspace-label {
          display: block;
          margin-bottom: 5px;
          color: #647568;
          font-size: 13px;
          font-weight: 600;
        }

        .farm-header h1 {
          margin: 0 0 10px;
          color: #176b38;
          font-size: clamp(27px, 4vw, 36px);
          font-weight: 800;
        }

        .farm-header p {
          max-width: 600px;
          margin: 0;
          color: #647568;
          line-height: 1.7;
        }

        .farm-outline-btn {
          flex-shrink: 0;
          padding: 9px 14px;
          color: #176b38;
          background: #fff;
          border: 1px solid #bdd5c2;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
        }

        .farm-outline-btn:hover {
          color: #fff;
          background: #176b38;
        }

        .farm-stats {
          margin-bottom: 24px;
        }

        .farm-stat {
          height: 100%;
          padding: 22px;
          background: #fff;
          border: 1px solid #dce9de;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(31,75,42,.05);
          transition: transform .2s, border-color .2s;
        }

        .farm-stat:hover {
          transform: translateY(-3px);
          border-color: #a8cdb0;
        }

        .farm-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #647568;
          font-size: 14px;
        }

        .farm-stat-icon {
          display: grid;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          place-items: center;
          background: #e8f5e9;
          border-radius: 12px;
          font-size: 21px;
        }

        .farm-stat h2 {
          margin: 14px 0 4px;
          color: #176b38;
          font-size: 30px;
          font-weight: 800;
        }

        .farm-stat p {
          margin: 0;
          color: #647568;
          font-size: 13px;
        }

        .farm-alert {
          margin-bottom: 20px;
        }

        .farm-panel {
          margin-bottom: 38px;
          padding: 26px;
          background: #fff;
          border: 1px solid #dce9de;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(31,75,42,.06);
        }

        .farm-section-heading {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .farm-heading-icon {
          display: grid;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          place-items: center;
          color: #176b38;
          background: #e8f5e9;
          border-radius: 12px;
          font-size: 27px;
          font-weight: 500;
        }

        .farm-section-heading h2 {
          margin: 0 0 4px;
          color: #176b38;
          font-size: 20px;
          font-weight: 800;
        }

        .farm-section-heading p {
          margin: 0;
          color: #647568;
          font-size: 13px;
        }

        .farm-label {
          display: block;
          margin-bottom: 7px;
          color: #344b39;
          font-size: 13px;
          font-weight: 700;
        }

        .farm-input {
          min-height: 45px;
          padding: 10px 12px;
          color: #243b2b !important;
          background: #fff !important;
          border: 1px solid #cbdccf !important;
          border-radius: 9px !important;
          box-shadow: none !important;
        }

        .farm-input::placeholder {
          color: #829184 !important;
        }

        .farm-input:focus {
          border-color: #32834a !important;
          box-shadow: 0 0 0 3px rgba(50,131,74,.12) !important;
        }

        .farm-input option {
          color: #243b2b;
          background: #fff;
        }

        .farm-primary-btn {
          min-height: 44px;
          padding: 11px 20px;
          color: #fff;
          background: #176b38;
          border: 1px solid #176b38;
          border-radius: 9px;
          font-weight: 700;
          transition: background .2s;
        }

        .farm-primary-btn:hover {
          color: #fff;
          background: #124d2b;
        }

        .farm-overview {
          margin-top: 8px;
        }

        .farm-overview-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .farm-overview-heading .farm-eyebrow {
          margin-bottom: 6px;
        }

        .farm-overview-heading h2 {
          margin: 0 0 6px;
          color: #243b2b;
          font-size: 24px;
          font-weight: 800;
        }

        .farm-overview-heading p {
          margin: 0;
          color: #647568;
          font-size: 13px;
        }

        .farm-count {
          flex-shrink: 0;
          padding: 7px 13px;
          color: #176b38;
          background: #e8f5e9;
          border: 1px solid #d0e6d3;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 800;
        }

        .farm-empty {
          margin-bottom: 20px;
          padding: 38px 20px;
          background: #fff;
          border: 1px dashed #bdd5c2;
          border-radius: 16px;
          text-align: center;
        }

        .farm-empty-icon {
          display: grid;
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          place-items: center;
          background: #e8f5e9;
          border-radius: 20px;
          font-size: 35px;
        }

        .farm-empty h3 {
          margin-bottom: 8px;
          color: #176b38;
          font-size: 19px;
          font-weight: 800;
        }

        .farm-empty p {
          margin: 0;
          color: #647568;
        }

        .farm-card {
          height: 100%;
          padding: 21px;
          background: #fff;
          border: 1px solid #dce9de;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(31,75,42,.05);
          transition: transform .2s, border-color .2s;
        }

        .farm-card:hover {
          transform: translateY(-3px);
          border-color: #a8cdb0;
        }

        .farm-card-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .farm-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .farm-card-icon {
          display: grid;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          place-items: center;
          background: #e8f5e9;
          border-radius: 12px;
          font-size: 23px;
        }

        .farm-card-name {
          min-width: 0;
        }

        .farm-card-name h3 {
          overflow-wrap: anywhere;
          margin: 0 0 5px;
          color: #176b38;
          font-size: 17px;
          font-weight: 800;
        }

        .farm-card-name span {
          color: #647568;
          font-size: 12px;
        }

        .farm-soil-badge {
          flex-shrink: 0;
          max-width: 100px;
          padding: 6px 10px;
          color: #176b38;
          background: #e8f5e9;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .farm-details {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 20px;
        }

        .farm-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 12px;
          background: #f7faf7;
          border: 1px solid #e5eee6;
          border-radius: 10px;
        }

        .farm-meta-icon {
          flex-shrink: 0;
          font-size: 20px;
        }

        .farm-meta div {
          min-width: 0;
        }

        .farm-meta div span {
          display: block;
          margin-bottom: 4px;
          color: #647568;
          font-size: 12px;
        }

        .farm-meta strong {
          display: block;
          overflow-wrap: anywhere;
          color: #243b2b;
          font-size: 14px;
          font-weight: 700;
        }

        .farm-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 15px;
          border-top: 1px solid #dce9de;
        }

        .farm-card-footer > span {
          color: #647568;
          font-size: 12px;
        }

        .farm-delete-btn {
          padding: 8px 12px;
          color: #b42318;
          background: #fff3f3;
          border: 1px solid #f0caca;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .farm-delete-btn:hover {
          color: #fff;
          background: #b42318;
        }

        .farm-footer {
          padding-top: 30px;
          color: #647568;
          font-size: 12px;
          text-align: center;
        }

        @media (max-width: 576px) {
          .farm-container {
            padding-top: 18px;
            padding-bottom: 35px;
          }

          .farm-header {
            padding: 20px;
          }

          .farm-header-top {
            flex-direction: column;
          }

          .farm-panel {
            padding: 18px;
          }

          .farm-stat {
            padding: 17px;
          }

          .farm-card {
            padding: 17px;
          }

          .farm-overview-heading {
            align-items: flex-start;
          }

          .farm-overview-heading h2 {
            font-size: 21px;
          }
        }
      `}</style>
    </div>
  );
}

export default Farms;
