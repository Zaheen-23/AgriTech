// src/pages/BuyerDashboard.jsx

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import FarmerNavbar from '../components/FarmerNavbar';

const API = 'http://localhost:5000/api/products';

const CATEGORY_ICONS = {
  vegetables: '🥦',
  fruits: '🍎',
  grains: '🌾',
  pulses: '🫘',
  seeds: '🌱',
  default: '🌿',
};

const CATEGORY_TRANSLATION_KEYS = {
  vegetables: 'vegetables',
  fruits: 'fruits',
  grains: 'grains',
  pulses: 'pulses',
  seeds: 'seeds',
};

function BuyerDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [crops, setCrops] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadCrops() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(API, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Could not fetch crops');
        }

        const data = await response.json();
        setCrops(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('loadCropsError');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCrops();

    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    const values = crops.map((crop) => crop.category).filter(Boolean);
    return ['all', ...new Set(values)];
  }, [crops]);

  const filteredCrops = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = crops.filter((crop) => {
      const matchesCategory =
        category === 'all' || crop.category === category;

      const searchableText = [
        crop.name,
        crop.location,
        crop.category,
        crop.farmer?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesCategory && searchableText.includes(term);
    });

    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [crops, search, category, sortBy]);

  const farmerCount = useMemo(() => {
    return new Set(
      crops
        .map((crop) => {
          const farmer = crop.farmer;
          return farmer?._id || farmer?.id || farmer;
        })
        .filter(Boolean)
        .map(String)
    ).size;
  }, [crops]);

  const locationCount = useMemo(() => {
    return new Set(
      crops
        .map((crop) => crop.location?.trim().toLowerCase())
        .filter(Boolean)
    ).size;
  }, [crops]);

  const formatPrice = (price) => {
    const value = Number(price);

    return Number.isFinite(value)
      ? value.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')
      : '—';
  };

  const getCategoryIcon = (value) => {
    const key = String(value || '').toLowerCase();
    return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
  };

  const getCategoryLabel = (value) => {
    const key = String(value || '').toLowerCase();
    const translationKey = CATEGORY_TRANSLATION_KEYS[key];

    return translationKey ? t(translationKey) : value;
  };

  return (
    <div className="buyer-page">
      <style>{`
        .buyer-page {
          min-height: 100vh;
          background: #f5f8f2;
          color: #1e3025;
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }

        .buyer-page * { box-sizing: border-box; }

        .buyer-container {
          width: min(1240px, calc(100% - 40px));
          margin: 0 auto;
          padding: 32px 0 56px;
        }

        .buyer-hero {
          position: relative;
          overflow: hidden;
          padding: 34px;
          border-radius: 24px;
          background: linear-gradient(125deg, #173d2b, #285c3d);
          color: #fff;
          margin-bottom: 24px;
        }

        .buyer-hero::after {
          content: '🌾';
          position: absolute;
          right: 30px;
          bottom: -30px;
          font-size: 140px;
          opacity: .13;
          pointer-events: none;
        }

        .buyer-eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #c4ed9c;
          margin-bottom: 12px;
        }

        .buyer-hero h1 {
          font-size: clamp(27px, 4vw, 40px);
          line-height: 1.15;
          margin: 0 0 12px;
          max-width: 700px;
          color: #fff;
        }

        .buyer-hero p {
          color: #d8e8db;
          max-width: 620px;
          line-height: 1.7;
          font-size: 14px;
          margin: 0;
        }

        .buyer-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .buyer-stat {
          padding: 20px;
          border: 1px solid #e3eadd;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(29, 56, 36, .035);
        }

        .buyer-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #637566;
          font-size: 13px;
        }

        .buyer-stat-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #eef7e8;
          font-size: 19px;
        }

        .buyer-stat-number {
          margin-top: 12px;
          font-size: 29px;
          line-height: 1.1;
          font-weight: 800;
          color: #204b31;
        }

        .buyer-section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 17px;
        }

        .buyer-section-heading h2 {
          font-size: 23px;
          margin: 0 0 5px;
          color: #1f3928;
        }

        .buyer-muted {
          font-size: 13px;
          color: #718073;
          line-height: 1.6;
        }

        .buyer-count {
          font-size: 12px;
          font-weight: 700;
          padding: 7px 12px;
          border-radius: 30px;
          background: #e7f2df;
          color: #285b37;
        }

        .buyer-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 210px;
          gap: 12px;
          margin-bottom: 16px;
        }

        .buyer-search-wrap { position: relative; }

        .buyer-search-icon {
          position: absolute;
          top: 50%;
          left: 15px;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .buyer-control {
          width: 100%;
          min-height: 47px;
          padding: 12px 14px;
          border: 1px solid #dce5d7;
          border-radius: 12px;
          background: #fff;
          color: #233c2b;
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .buyer-search { padding-left: 42px; }

        .buyer-control:focus {
          border-color: #5e965c;
          box-shadow: 0 0 0 3px rgba(91, 147, 81, .12);
        }

        .buyer-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }

        .buyer-category {
          padding: 9px 15px;
          border: 1px solid #dce6d7;
          border-radius: 30px;
          background: #fff;
          color: #536a57;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
          cursor: pointer;
          transition: .2s ease;
        }

        .buyer-category:hover { border-color: #659b5c; }

        .buyer-category.active {
          color: #fff;
          background: #285b37;
          border-color: #285b37;
        }

        .buyer-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .buyer-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding: 21px;
          border: 1px solid #e3eadd;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(29, 56, 36, .035);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .buyer-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(29, 56, 36, .08);
        }

        .buyer-crop-top {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 10px;
        }

        .buyer-crop-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: #eef7e8;
          font-size: 25px;
          flex-shrink: 0;
        }

        .buyer-tag {
          max-width: 58%;
          overflow-wrap: anywhere;
          padding: 6px 9px;
          border-radius: 8px;
          background: #f0f5ec;
          color: #53714f;
          font-size: 10px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .buyer-crop-name {
          font-size: 19px;
          font-weight: 800;
          color: #24472e;
          margin: 17px 0 5px;
          overflow-wrap: anywhere;
        }

        .buyer-price-row {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 5px;
          margin: 12px 0 17px;
        }

        .buyer-price {
          color: #2b713d;
          font-size: 25px;
          font-weight: 850;
        }

        .buyer-price-unit {
          color: #758275;
          font-size: 11px;
        }

        .buyer-details {
          display: grid;
          gap: 11px;
          padding: 14px 0;
          border-top: 1px solid #edf0e9;
          border-bottom: 1px solid #edf0e9;
        }

        .buyer-detail {
          display: flex;
          align-items: start;
          gap: 9px;
          font-size: 12px;
          color: #536757;
          overflow-wrap: anywhere;
        }

        .buyer-farmer {
          display: flex;
          align-items: center;
          gap: 11px;
          padding-top: 15px;
          margin-top: auto;
        }

        .buyer-avatar {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 50%;
          background: #e9f2e3;
          color: #2d6038;
          font-size: 17px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .buyer-farmer-name {
          color: #2c4632;
          font-size: 12px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .buyer-farmer-contact {
          margin-top: 4px;
          color: #738175;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .buyer-state {
          padding: 35px 20px;
          text-align: center;
          background: #fff;
          border: 1px solid #e3eadd;
          border-radius: 17px;
          color: #526854;
        }

        .buyer-state-icon {
          font-size: 34px;
          margin-bottom: 10px;
        }

        .buyer-state h3 {
          margin: 0 0 8px;
          color: #284b31;
          font-size: 18px;
        }

        .buyer-retry {
          margin-top: 14px;
          padding: 10px 17px;
          border: 0;
          border-radius: 9px;
          background: #285b37;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 950px) {
          .buyer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .buyer-container {
            width: min(100% - 24px, 1240px);
            padding-top: 20px;
          }

          .buyer-hero {
            padding: 25px 20px;
            border-radius: 18px;
          }

          .buyer-hero::after {
            right: 4px;
            font-size: 95px;
          }

          .buyer-stats { gap: 9px; }

          .buyer-stat {
            padding: 13px 11px;
            border-radius: 13px;
          }

          .buyer-stat-top {
            align-items: start;
            flex-direction: column-reverse;
            gap: 7px;
            font-size: 11px;
          }

          .buyer-stat-icon {
            width: 30px;
            height: 30px;
            font-size: 15px;
          }

          .buyer-stat-number { font-size: 23px; }

          .buyer-toolbar { grid-template-columns: 1fr; }

          .buyer-grid { grid-template-columns: 1fr; }

          .buyer-card { padding: 18px; }

          .buyer-section-heading h2 { font-size: 21px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .buyer-card, .buyer-category { transition: none; }
        }
      `}</style>

      <FarmerNavbar />

      <main className="buyer-container">
        <header className="buyer-hero">
          <div className="buyer-eyebrow">{t('buyerPortal')}</div>

          <h1>
            {t('welcomeMarketplace')}
            {user?.name ? `, ${user.name}` : ''} 👋
          </h1>

          <p>{t('marketplaceIntro')}</p>
        </header>

        <section
          className="buyer-stats"
          aria-label={t('marketplaceStats')}
        >
          <div className="buyer-stat">
            <div className="buyer-stat-top">
              <span>{t('cropsListed')}</span>
              <span className="buyer-stat-icon">🌾</span>
            </div>
            <div className="buyer-stat-number">
              {loading ? '—' : crops.length}
            </div>
          </div>

          <div className="buyer-stat">
            <div className="buyer-stat-top">
              <span>{t('farmersListed')}</span>
              <span className="buyer-stat-icon">👨‍🌾</span>
            </div>
            <div className="buyer-stat-number">
              {loading ? '—' : farmerCount}
            </div>
          </div>

          <div className="buyer-stat">
            <div className="buyer-stat-top">
              <span>{t('locations')}</span>
              <span className="buyer-stat-icon">📍</span>
            </div>
            <div className="buyer-stat-number">
              {loading ? '—' : locationCount}
            </div>
          </div>
        </section>

        <section>
          <div className="buyer-section-heading">
            <div>
              <h2>{t('exploreProduce')}</h2>
              <div className="buyer-muted">
                {t('searchListingsIntro')}
              </div>
            </div>

            {!loading && !error && (
              <span className="buyer-count">
                {filteredCrops.length} {t('results')}
              </span>
            )}
          </div>

          <div className="buyer-toolbar">
            <div className="buyer-search-wrap">
              <span className="buyer-search-icon">🔎</span>

              <input
                className="buyer-control buyer-search"
                type="search"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchCrops')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="buyer-control"
              aria-label={t('sortCrops')}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="newest">{t('defaultOrder')}</option>
              <option value="price-low">{t('priceLowHigh')}</option>
              <option value="price-high">{t('priceHighLow')}</option>
              <option value="name">{t('nameAToZ')}</option>
            </select>
          </div>

          <div
            className="buyer-categories"
            aria-label={t('cropCategories')}
          >
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={`buyer-category ${
                  category === item ? 'active' : ''
                }`}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item === 'all'
                  ? `🌿 ${t('allCrops')}`
                  : `${getCategoryIcon(item)} ${getCategoryLabel(item)}`}
              </button>
            ))}
          </div>

          {loading && (
            <div className="buyer-state" role="status">
              <div className="buyer-state-icon">🌱</div>
              <h3>{t('loadingCrops')}</h3>
              <div className="buyer-muted">
                {t('loadingDescription')}
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="buyer-state" role="alert">
              <div className="buyer-state-icon">⚠️</div>
              <h3>{t('marketplaceLoadError')}</h3>
              <div className="buyer-muted">{t(error)}</div>

              <button
                className="buyer-retry"
                type="button"
                onClick={() => window.location.reload()}
              >
                {t('tryAgain')}
              </button>
            </div>
          )}

          {!loading && !error && filteredCrops.length === 0 && (
            <div className="buyer-state">
              <div className="buyer-state-icon">🔎</div>
              <h3>{t('noMatchingCrops')}</h3>
              <div className="buyer-muted">
                {t('noMatchingCropsDescription')}
              </div>

              <button
                type="button"
                className="buyer-retry"
                onClick={() => {
                  setSearch('');
                  setCategory('all');
                }}
              >
                {t('clearFilters')}
              </button>
            </div>
          )}

          {!loading && !error && filteredCrops.length > 0 && (
            <div className="buyer-grid">
              {filteredCrops.map((crop) => (
                <article className="buyer-card" key={crop._id}>
                  <div className="buyer-crop-top">
                    <div className="buyer-crop-icon">
                      {getCategoryIcon(crop.category)}
                    </div>

                    {crop.category && (
                      <span className="buyer-tag">
                        {getCategoryLabel(crop.category)}
                      </span>
                    )}
                  </div>

                  <h3 className="buyer-crop-name">
                    {crop.name || t('unnamedCrop')}
                  </h3>

                  <div className="buyer-price-row">
                    <span className="buyer-price">
                      ₹{formatPrice(crop.price)}
                    </span>
                    <span className="buyer-price-unit">
                      {t('listedPrice')}
                    </span>
                  </div>

                  <div className="buyer-details">
                    <div className="buyer-detail">
                      <span>📦</span>
                      <span>
                        <strong>{t('quantity')}:</strong>{' '}
                        {crop.quantity ?? t('notSpecified')}
                      </span>
                    </div>

                    <div className="buyer-detail">
                      <span>📍</span>
                      <span>
                        <strong>{t('location')}:</strong>{' '}
                        {crop.location || t('notSpecified')}
                      </span>
                    </div>
                  </div>

                  <div className="buyer-farmer">
                    <div className="buyer-avatar">
                      {(crop.farmer?.name || 'F')
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="buyer-farmer-name">
                        {crop.farmer?.name || t('farmer')}
                      </div>

                      <div className="buyer-farmer-contact">
                        {crop.farmer?.email || t('farmerContactMissing')}
                      </div>

                      {crop.farmer?.phone && (
                        <div className="buyer-farmer-contact">
                          📞 {crop.farmer.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default BuyerDashboard;