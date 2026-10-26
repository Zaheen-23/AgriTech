
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FarmerNavbar from '../components/FarmerNavbar';
import { useLanguage } from '../context/LanguageContext';

const API = 'https://agritech-backend-qadd.onrender.com/api';

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
};

const formatPrice = (value) => {
  const number = Number(value);

  return value !== undefined &&
    value !== null &&
    value !== '' &&
    Number.isFinite(number)
    ? `₹${number.toLocaleString('en-IN')}`
    : 'Price unavailable';
};

// Get the farmer ID associated with a farm.
const getFarmOwnerId = (farm) => {
  const owner = farm?.farmer || farm?.user || farm?.owner;

  if (typeof owner === 'object' && owner !== null) {
    return String(owner._id || owner.id || '');
  }

  return String(owner || '');
};

// Convert Open-Meteo weather codes into readable descriptions.
const getWeatherDescription = (code) => {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Cloudy',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light rain showers',
    81: 'Rain showers',
    82: 'Heavy rain showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm with hail',
  };

  return descriptions[code] || 'Weather conditions unavailable';
};

function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [weather, setWeather] = useState(null);
  const [soilReports, setSoilReports] = useState([]);
  const [marketItems, setMarketItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  // Weather loading and error states.
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Temporary crop-photo records: no backend or cloud required.
  const [photoRecords, setPhotoRecords] = useState([]);
  const [cropName, setCropName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [cropNote, setCropNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [formMessage, setFormMessage] = useState('');

  const userId = String(user?.id || user?._id || '');

  // Load the existing dashboard data.
  useEffect(() => {
    const controller = new AbortController();

 async function fetchData(path) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Login token missing. Please log in again.');
  }

  const response = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');

    throw new Error(
      `${path} failed: HTTP ${response.status} ${message}`
    );
  }

  return response.json();
}

    async function loadDashboard() {
      const requests = [
        { key: 'farms', path: '/farms/all' },
        { key: 'crops', path: '/crops/all' },
        { key: 'soil', path: '/soil/all' },
        { key: 'orders', path: '/orders' },
        { key: 'market', path: '/products' },
      ];

      const results = await Promise.allSettled(
        requests.map((item) => fetchData(item.path))
      );

      if (controller.signal.aborted) return;

      const failed = [];

      results.forEach((result, index) => {
        const key = requests[index].key;

       if (result.status === 'rejected') {
  console.error(
    `Dashboard API failed: ${key}`,
    result.reason
  );

  failed.push(key);
  return;
}

        const data = result.value;

        if (key === 'farms') {
          setFarms(getList(data, ['farms', 'data']));
        }

        if (key === 'crops') {
          setCrops(getList(data, ['crops', 'data']));
        }

        if (key === 'soil') {
          setSoilReports(
            getList(data, ['reports', 'soilReports', 'data'])
          );
        }

        if (key === 'orders') {
          setOrders(getList(data, ['orders', 'data']));
        }

        if (key === 'market') {
          setMarketItems(getList(data, ['products', 'data']));
        }
      });

      setErrors(failed);
      setLoading(false);
    }

    loadDashboard().catch((error) => {
      if (!controller.signal.aborted) {
        console.error('Dashboard loading error:', error);
        setErrors(['dashboard']);
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, []);

  // Fetch real weather using the location saved for the farmer's farm.
  useEffect(() => {
    if (loading) return;

    const controller = new AbortController();

    async function loadFarmWeather() {
      setWeather(null);
      setWeatherError('');

      const savedFarm = farms.find((farm) => {
        const location =
          typeof farm?.location === 'string' ? farm.location.trim() : '';

        if (!location) return false;

        const farmOwnerId = getFarmOwnerId(farm);

        // If the farm has an owner ID, match it to the logged-in farmer.
        // Farms without an owner field may come from a farmer-scoped API.
        return (
          !farmOwnerId ||
          !userId ||
          farmOwnerId === userId
        );
      });

      if (!savedFarm) {
        setWeatherLoading(false);
        setWeatherError(
          'No farm location found. Please add a location to your registered farm.'
        );
        return;
      }

      const location = savedFarm.location.trim();

      try {
        setWeatherLoading(true);

        // Step 1: Find the coordinates of the saved farm location.
        const geocodingUrl =
          'https://geocoding-api.open-meteo.com/v1/search' +
          `?name=${encodeURIComponent(location)}` +
          '&count=1&language=en&format=json';

        const geocodingResponse = await fetch(geocodingUrl, {
          signal: controller.signal,
        });

        if (!geocodingResponse.ok) {
          throw new Error('Could not search for the farm location.');
        }

        const geocodingData = await geocodingResponse.json();
        const place = geocodingData.results?.[0];

        if (!place) {
          throw new Error(
            `Could not find "${location}". Please check your farm location.`
          );
        }

        // Step 2: Fetch current weather and today's forecast.
        const forecastUrl =
          'https://api.open-meteo.com/v1/forecast' +
          `?latitude=${place.latitude}` +
          `&longitude=${place.longitude}` +
          '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
          '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
          '&forecast_days=7&timezone=auto';

        const forecastResponse = await fetch(forecastUrl, {
          signal: controller.signal,
        });

        if (!forecastResponse.ok) {
          throw new Error('Could not fetch the latest weather data.');
        }

        const forecastData = await forecastResponse.json();
        const current = forecastData.current;
        const daily = forecastData.daily;

        if (!current) {
          throw new Error('Weather data is currently unavailable.');
        }

        if (controller.signal.aborted) return;

        // Store the API response in a simple format for the dashboard.
        setWeather({
          location: [
            place.name,
            place.admin1,
            place.country,
          ]
            .filter(Boolean)
            .join(', '),
          temperature: current.temperature_2m,
          description: getWeatherDescription(current.weather_code),
          humidity: current.relative_humidity_2m,
          wind: current.wind_speed_10m,
          isDay: current.is_day,
          high: daily?.temperature_2m_max?.[0] ?? null,
          low: daily?.temperature_2m_min?.[0] ?? null,
          rainChance:
            daily?.precipitation_probability_max?.[0] ?? null,
          updatedAt: current.time,
        });
      } catch (error) {
        if (error.name !== 'AbortError' && !controller.signal.aborted) {
          console.error('Farm weather loading error:', error);
          setWeather(null);
          setWeatherError(
            error.message || 'Unable to load weather at the moment.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setWeatherLoading(false);
        }
      }
    }

    loadFarmWeather();

    return () => controller.abort();
  }, [farms, userId, loading]);

  // Revoke temporary image URLs when records are removed or component unmounts.
  useEffect(() => {
    return () => {
      photoRecords.forEach((record) => {
        URL.revokeObjectURL(record.imageUrl);
      });
    };
  }, [photoRecords]);

  const temperature = weather?.temperature;
  const weatherDescription = weather?.description;
  const humidity = weather?.humidity;

  const latestSoil = soilReports[0];

  const soilValue = (key) => {
    const aliases = {
      ph: ['pHLevel', 'phLevel', 'ph', 'pH', 'soilPH'],
      nitrogen: ['nitrogen', 'nitrogenLevel', 'N'],
      phosphorus: ['phosphorus', 'phosphorusLevel', 'P'],
      potassium: ['potassium', 'potassiumLevel', 'K'],
    };

    const actualKey = aliases[key].find(
      (name) =>
        latestSoil?.[name] !== undefined &&
        latestSoil?.[name] !== null
    );

    return actualKey
      ? latestSoil[actualKey]
      : t('soilUnavailableText');
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    setFormMessage('');
    setPhoto(null);

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormMessage(t('selectImageError'));
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormMessage(t('imageSizeError'));
      event.target.value = '';
      return;
    }

    setPhoto(file);
  };

  const handleAddRecord = (event) => {
    event.preventDefault();
    setFormMessage('');

    if (!cropName.trim() || !photo) {
      setFormMessage(t('cropNamePhotoRequiredError'));
      return;
    }

    const record = {
      id: `${Date.now()}-${Math.random()}`,
      cropName: cropName.trim(),
      farmName: farmName.trim(),
      note: cropNote.trim(),
      imageUrl: URL.createObjectURL(photo),
      date: new Date().toLocaleDateString('en-IN'),
    };

    setPhotoRecords((previous) => [record, ...previous]);
    setCropName('');
    setFarmName('');
    setCropNote('');
    setPhoto(null);
    event.target.reset();

    setFormMessage(t('cropPhotoAddedMsg'));
  };

  const removeRecord = (id) => {
    setPhotoRecords((previous) => {
      const record = previous.find((item) => item.id === id);

      if (record) URL.revokeObjectURL(record.imageUrl);

      return previous.filter((item) => item.id !== id);
    });
  };

  const stats = useMemo(
    () => [
      {
        label: t('myFarmsStatLabel'),
        value: farms.length,
        icon: '🌾',
        to: '/farms',
      },
      {
        label: t('cropRecordsStatLabel'),
        value: crops.length,
        icon: '🌱',
        to: '/crops',
      },
      {
        label: t('soilReportsStatLabel'),
        value: soilReports.length,
        icon: '🧪',
        to: '/soil',
      },
      {
        label: t('recentOrdersStatLabel'),
        value: orders.length,
        icon: '📦',
        to: '/dashboard/farmer',
      },
    ],
    [farms, crops, soilReports, orders, t]
  );

  return (
    <div className="farmer-page">
      <style>{`
        .farmer-page {
          min-height: 100vh;
          background: #f5f8f3;
          color: #1f3528;
          font-family: Inter, system-ui, sans-serif;
        }
        .fd-container {
          max-width: 1250px;
          margin: auto;
          padding: 28px 20px 48px;
        }
        .fd-hero {
          padding: 30px;
          border-radius: 22px;
          background: linear-gradient(120deg, #174d32, #28784a);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .fd-hero h1 {
          margin: 0 0 8px;
          font-size: clamp(25px, 4vw, 36px);
        }
        .fd-hero p {
          margin: 0;
          opacity: .9;
          line-height: 1.6;
        }
        .fd-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .fd-card {
          background: white;
          border: 1px solid #e4ebe2;
          border-radius: 17px;
          padding: 21px;
          box-shadow: 0 4px 18px #183d2208;
          min-width: 0;
        }
        .fd-stat {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .fd-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #e9f5e9;
          display: grid;
          place-items: center;
          font-size: 23px;
          flex-shrink: 0;
        }
        .fd-stat strong {
          display: block;
          font-size: 26px;
          margin-top: 5px;
        }
        .fd-muted {
          color: #69796d;
          font-size: 13px;
          line-height: 1.6;
        }
        .fd-section {
          margin: 28px 0;
        }
        .fd-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .fd-section-heading h2 {
          margin: 0;
          font-size: 22px;
        }
        .fd-panels {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .fd-card h3 {
          margin: 0 0 12px;
          font-size: 18px;
        }
        .fd-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }
        .fd-button, .fd-link {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          border-radius: 10px;
          padding: 11px 15px;
          font-size: 14px;
          font-weight: 650;
          text-decoration: none;
          border: 1px solid #d5e3d5;
          cursor: pointer;
          background: #edf6ec;
          color: #205b35;
        }
        .fd-button-primary {
          background: #226b3e;
          color: white;
          border-color: #226b3e;
        }
        .fd-button-danger {
          background: #fff0ee;
          color: #9b3028;
          border-color: #f0d2ce;
        }
        .fd-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }
        .fd-list {
          display: grid;
          gap: 10px;
        }
        .fd-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #edf0eb;
        }
        .fd-list-item:last-child {
          border-bottom: 0;
        }
        .fd-form {
          display: grid;
          gap: 13px;
        }
        .fd-form label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 650;
        }
        .fd-form input, .fd-form textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d6e0d4;
          border-radius: 10px;
          padding: 11px 12px;
          font: inherit;
          background: #fff;
          color: #1f3528;
        }
        .fd-form textarea {
          min-height: 80px;
          resize: vertical;
        }
        .fd-gallery {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .fd-photo-card {
          overflow: hidden;
          padding: 0;
        }
        .fd-photo {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
          background: #edf2ea;
        }
        .fd-photo-content {
          padding: 16px;
        }
        .fd-photo-content h3 {
          margin-bottom: 7px;
        }
        .fd-message {
          padding: 11px 13px;
          border-radius: 10px;
          background: #f0f6ed;
          color: #315b38;
          font-size: 13px;
          line-height: 1.5;
        }
        .fd-warning {
          background: #fff6e5;
          color: #805717;
        }
        .fd-empty {
          border: 1px dashed #ccd9c9;
          background: #fbfdf9;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          color: #69796d;
          font-size: 14px;
        }
        .fd-price {
          font-weight: 700;
          color: #226b3e;
        }
        .fd-weather-location {
          color: #226b3e;
          font-size: 13px;
          margin: -4px 0 14px;
          line-height: 1.5;
        }
        .fd-weather-updated {
          margin-top: 12px;
        }
        @media (max-width: 900px) {
          .fd-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .fd-gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 600px) {
          .fd-container {
            padding: 18px 12px 32px;
          }
          .fd-hero {
            padding: 23px 19px;
          }
          .fd-grid, .fd-panels, .fd-gallery {
            grid-template-columns: 1fr;
          }
          .fd-card {
            padding: 17px;
          }
        }
      `}</style>

      <FarmerNavbar />

      <main className="fd-container">
        <section className="fd-hero">
          <div>
            <h1>Farmer Dashboard 🌱</h1>
            <p>
              {t('welcomeFarmerPrefix')}{' '}
              {user?.name || user?.email || t('welcomeFarmerDefault')}!
              <br />
              {t('farmerDashboardSub')}
            </p>
          </div>

          <Link className="fd-button" to="/farms">
            {t('registerYourFarmBtn')}
          </Link>
        </section>

        {errors.length > 0 && (
          <div
            className="fd-message fd-warning"
            style={{ marginBottom: 20 }}
          >
            {t('dataLoadErrorNotice')} {errors.join(', ')}.{' '}
            {t('backendCheckNotice')}
          </div>
        )}

        {loading && (
          <div className="fd-message" style={{ marginBottom: 20 }}>
            {t('loadingDashboardText')}
          </div>
        )}

        <section className="fd-grid" aria-label="Dashboard overview">
          {stats.map((stat) => (
            <Link
              to={stat.to}
              key={stat.label}
              className="fd-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="fd-stat">
                <div className="fd-stat-icon">{stat.icon}</div>
                <div>
                  <div className="fd-muted">{stat.label}</div>
                  <strong>{loading ? '—' : stat.value}</strong>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="fd-section">
          <div className="fd-section-heading">
            <h2>{t('farmAndCropPracticesHeading')}</h2>
            <span className="fd-muted">{t('quickActionsLabel')}</span>
          </div>

          <div className="fd-grid">
            <div className="fd-card">
              <div className="fd-stat-icon">🌾</div>
              <h3 style={{ marginTop: 14 }}>
                {t('registerFarmTitle')}
              </h3>
              <p className="fd-muted">{t('registerFarmDesc')}</p>
              <Link
                className="fd-button fd-button-primary"
                to="/farms"
              >
                {t('registerFarmActionBtn')}
              </Link>
            </div>

            <div className="fd-card">
              <div className="fd-stat-icon">🌱</div>
              <h3 style={{ marginTop: 14 }}>
                {t('addYourCropTitle')}
              </h3>
              <p className="fd-muted">{t('addYourCropDesc')}</p>
              <Link
                className="fd-button fd-button-primary"
                to="/crops"
              >
                {t('manageCropsActionBtn')}
              </Link>
            </div>

            <div className="fd-card">
              <div className="fd-stat-icon">🌦️</div>
              <h3 style={{ marginTop: 14 }}>
                {t('checkWeatherTitle')}
              </h3>
              <p className="fd-muted">{t('checkWeatherDesc')}</p>
              <Link
                className="fd-button"
                to="/dashboard/farmer#weather"
              >
                {t('viewWeatherActionBtn')}
              </Link>
            </div>

            <div className="fd-card">
              <div className="fd-stat-icon">🧪</div>
              <h3 style={{ marginTop: 14 }}>
                {t('checkSoilTitle')}
              </h3>
              <p className="fd-muted">{t('checkSoilDesc')}</p>
              <Link className="fd-button" to="/soil">
                {t('viewSoilReportsBtn')}
              </Link>
            </div>
          </div>
        </section>
        <section className="fd-section fd-panels" id="weather">
          <div className="fd-card">
            <h3>{t('weatherCardTitle')}</h3>

            {weatherLoading ? (
              <div className="fd-empty">
                Loading live weather for your farm...
              </div>
            ) : weather ? (
              <>
                <p className="fd-weather-location">
                  📍 {weather.location}
                </p>

                <div className="fd-list">
                  <div className="fd-list-item">
                    <span className="fd-muted">
                      {t('temperatureLabel')}
                    </span>
                    <strong>
                      {temperature !== undefined && temperature !== null
                        ? `${temperature}°C`
                        : t('weatherUnavailableText')}
                    </strong>
                  </div>

                  <div className="fd-list-item">
                    <span className="fd-muted">
                      {t('conditionsLabel')}
                    </span>
                    <strong>
                      {weatherDescription || t('weatherUnavailableText')}
                    </strong>
                  </div>

                  <div className="fd-list-item">
                    <span className="fd-muted">
                      {t('humidityLabel')}
                    </span>
                    <strong>
                      {humidity !== undefined && humidity !== null
                        ? `${humidity}%`
                        : t('weatherUnavailableText')}
                    </strong>
                  </div>

                  <div className="fd-list-item">
                    <span className="fd-muted">Wind speed</span>
                    <strong>
                      {weather.wind != null
                        ? `${weather.wind} km/h`
                        : 'Unavailable'}
                    </strong>
                  </div>

                  <div className="fd-list-item">
                    <span className="fd-muted">Today's high / low</span>
                    <strong>
                      {weather.high != null && weather.low != null
                        ? `${weather.high}°C / ${weather.low}°C`
                        : 'Unavailable'}
                    </strong>
                  </div>

                  <div className="fd-list-item">
                    <span className="fd-muted">Rain chance today</span>
                    <strong>
                      {weather.rainChance != null
                        ? `${weather.rainChance}%`
                        : 'Unavailable'}
                    </strong>
                  </div>
                </div>

                {weather.updatedAt && (
                  <p className="fd-muted fd-weather-updated">
                    Weather observation: {weather.updatedAt.replace('T', ' ')}
                  </p>
                )}
              </>
            ) : (
              <div className="fd-empty">
                {weatherError || t('weatherDataUnavailableNotice')}
                <div className="fd-actions" style={{ justifyContent: 'center' }}>
                  <Link className="fd-button" to="/farms">
                    Check farm location
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="fd-card" id="soil">
            <h3>{t('latestSoilReportTitle')}</h3>

            {latestSoil ? (
              <div className="fd-list">
                <div className="fd-list-item">
                  <span className="fd-muted">{t('phLabel')}</span>
                  <strong>{soilValue('ph')}</strong>
                </div>

                <div className="fd-list-item">
                  <span className="fd-muted">{t('nitrogenLabel')}</span>
                  <strong>{soilValue('nitrogen')}</strong>
                </div>

                <div className="fd-list-item">
                  <span className="fd-muted">{t('phosphorusLabel')}</span>
                  <strong>{soilValue('phosphorus')}</strong>
                </div>

                <div className="fd-list-item">
                  <span className="fd-muted">{t('potassiumLabel')}</span>
                  <strong>{soilValue('potassium')}</strong>
                </div>
              </div>
            ) : (
              <div className="fd-empty">
                {t('noSoilReportNotice')}
              </div>
            )}

            <div className="fd-actions">
              <Link className="fd-button" to="/soil">
                {t('openSoilSectionBtn')}
              </Link>
            </div>
          </div>
        </section>

        <section className="fd-section">
          <div className="fd-section-heading">
            <h2>{t('myCropRecordsHeading')}</h2>
            <span className="fd-muted">
              {t('temporaryPhotoGalleryLabel')}
            </span>
          </div>

          <div className="fd-panels">
            <div className="fd-card">
              <h3>{t('addCropPhotoTitle')}</h3>
              <p className="fd-muted">{t('addCropPhotoDesc')}</p>

              <form className="fd-form" onSubmit={handleAddRecord}>
                <label>
                  {t('cropNameLabel')}
                  <input
                    value={cropName}
                    onChange={(event) => setCropName(event.target.value)}
                    placeholder={t('cropNamePlaceholder')}
                    required
                  />
                </label>

                <label>
                  {t('farmNameOptionalLabel')}
                  <input
                    value={farmName}
                    onChange={(event) => setFarmName(event.target.value)}
                    placeholder={t('farmNamePlaceholder')}
                  />
                </label>

                <label>
                  {t('cropPhotoLabel')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    required
                  />
                  <span className="fd-muted">
                    {t('imageSizeNotice')}
                  </span>
                </label>

                {photo && (
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={t('selectedCropPreviewAlt')}
                    className="fd-photo"
                    style={{ borderRadius: 10 }}
                  />
                )}

                <label>
                  {t('notesOptionalLabel')}
                  <textarea
                    value={cropNote}
                    onChange={(event) => setCropNote(event.target.value)}
                    placeholder={t('notesPlaceholder')}
                  />
                </label>

                {formMessage && (
                  <div className="fd-message">{formMessage}</div>
                )}

                <button
                  type="submit"
                  className="fd-button fd-button-primary"
                >
                  {t('addToMyRecordsBtn')}
                </button>
              </form>
            </div>

            <div className="fd-card">
              <h3>{t('aboutCropRecordsTitle')}</h3>
              <p className="fd-muted">{t('aboutCropRecordsDesc')}</p>

              <div className="fd-empty">
                {photoRecords.length === 0
                  ? t('emptyPhotoRecordsNotice')
                  : `${photoRecords.length} ${t('photoRecordsCountSuffix')}`}
              </div>

              <p className="fd-muted" style={{ marginTop: 14 }}>
                {t('refreshNotice')}
              </p>
            </div>
          </div>

          {photoRecords.length > 0 && (
            <div className="fd-gallery" style={{ marginTop: 18 }}>
              {photoRecords.map((record) => (
                <article
                  className="fd-card fd-photo-card"
                  key={record.id}
                >
                  <img
                    src={record.imageUrl}
                    alt={record.cropName}
                    className="fd-photo"
                  />

                  <div className="fd-photo-content">
                    <h3>{record.cropName}</h3>

                    <p className="fd-muted">
                      {record.farmName || t('farmNotSpecifiedText')}
                    </p>

                    <p className="fd-muted">
                      {t('addedDatePrefix')} {record.date}
                    </p>

                    {record.note && <p>{record.note}</p>}

                    <button
                      type="button"
                      className="fd-button fd-button-danger"
                      onClick={() => removeRecord(record.id)}
                    >
                      {t('removePhotoBtn')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="fd-section fd-panels">
          <div className="fd-card">
            <h3>{t('recentOrdersCardTitle')}</h3>

            {orders.length > 0 ? (
              <div className="fd-list">
                {orders.slice(0, 5).map((order, index) => (
                  <div
                    className="fd-list-item"
                    key={order._id || order.id || index}
                  >
                    <div>
                      <strong>
                        {order.productName ||
                          order.cropName ||
                          order._id ||
                          'Order'}
                      </strong>

                      <div className="fd-muted">
                        {order.status ||
                          order.orderStatus ||
                          t('orderStatusUnavailable')}
                      </div>
                    </div>

                    <strong>
                      {order.totalAmount != null
                        ? formatPrice(order.totalAmount)
                        : order.price != null
                          ? formatPrice(order.price)
                          : '—'}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="fd-empty">
                {t('noOrdersNotice')}
              </div>
            )}
          </div>

          <div className="fd-card">
            <h3>{t('marketPricesCardTitle')}</h3>
            <p className="fd-muted">{t('marketPricesDesc')}</p>

            {marketItems.length > 0 ? (
              <div className="fd-list">
                {marketItems.slice(0, 5).map((item, index) => (
                  <div
                    className="fd-list-item"
                    key={item._id || item.id || index}
                  >
                    <div>
                      <strong>
                        {item.name ||
                          item.cropName ||
                          item.title ||
                          'Product'}
                      </strong>

                      <div className="fd-muted">
                        {item.category || t('categoryUnavailableText')}
                      </div>
                    </div>

                    <span className="fd-price">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="fd-empty">
                {t('noMarketItemsNotice')}
              </div>
            )}

            <div className="fd-actions">
              <Link className="fd-button" to="/shop">
                {t('browseMarketplaceBtn')}
              </Link>
            </div>
          </div>
        </section>

        <section className="fd-section fd-card">
          <h2 style={{ marginTop: 0 }}>
            {t('askExpertHeading')}
          </h2>

          <p className="fd-muted">{t('askExpertDesc')}</p>

          <div className="fd-actions">
            <Link className="fd-button fd-button-primary" to="/expert">
              {t('askExpertBtn')}
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}

export default FarmerDashboard;
