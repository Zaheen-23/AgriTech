
import { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import FarmerNavbar from '../components/FarmerNavbar';
import './Weather.css';

const API = 'https://agritech-backend-qadd.onrender.com/api';

const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️', theme: 'sunny' },
  1: { label: 'Mostly clear', icon: '🌤️', theme: 'sunny' },
  2: { label: 'Partly cloudy', icon: '⛅', theme: 'cloudy' },
  3: { label: 'Cloudy', icon: '☁️', theme: 'cloudy' },
  45: { label: 'Foggy', icon: '🌫️', theme: 'cloudy' },
  48: { label: 'Foggy', icon: '🌫️', theme: 'cloudy' },
  51: { label: 'Light drizzle', icon: '🌦️', theme: 'rainy' },
  53: { label: 'Drizzle', icon: '🌦️', theme: 'rainy' },
  55: { label: 'Heavy drizzle', icon: '🌧️', theme: 'rainy' },
  61: { label: 'Light rain', icon: '🌧️', theme: 'rainy' },
  63: { label: 'Rain', icon: '🌧️', theme: 'rainy' },
  65: { label: 'Heavy rain', icon: '🌧️', theme: 'rainy' },
  71: { label: 'Light snowfall', icon: '🌨️', theme: 'cloudy' },
  73: { label: 'Snowfall', icon: '❄️', theme: 'cloudy' },
  75: { label: 'Heavy snowfall', icon: '❄️', theme: 'cloudy' },
  80: { label: 'Rain showers', icon: '🌦️', theme: 'rainy' },
  81: { label: 'Rain showers', icon: '🌧️', theme: 'rainy' },
  82: { label: 'Heavy showers', icon: '⛈️', theme: 'rainy' },
  95: { label: 'Thunderstorm', icon: '⛈️', theme: 'rainy' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️', theme: 'rainy' },
  99: { label: 'Thunderstorm with hail', icon: '⛈️', theme: 'rainy' },
};

function getWeather(code) {
  return WEATHER_CODES[code] || {
    label: 'Mixed weather',
    icon: '🌤️',
    theme: 'cloudy',
  };
}

function buildAlerts(now, days) {
  const alerts = [];

  if (now.humidity >= 80 && now.temp >= 20 && now.temp <= 30) {
    alerts.push({
      type: 'Pest risk',
      icon: '🐛',
      text: 'Warm, humid conditions may increase fungal disease risk. Inspect leaves and follow crop-specific guidance.',
    });
  }

  if (now.humidity < 40 && now.temp >= 32) {
    alerts.push({
      type: 'Dry weather',
      icon: '🌱',
      text: 'Hot, dry conditions may stress crops. Check soil moisture and irrigate according to crop needs.',
    });
  }

  if (days.slice(0, 3).some((day) => day.rain >= 70)) {
    alerts.push({
      type: 'Rain alert',
      icon: '🌧️',
      text: 'A high chance of rain appears in the next three days. Check drainage and reconsider spraying before rainfall.',
    });
  }

  if (days.some((day) => day.max >= 38)) {
    alerts.push({
      type: 'Heat alert',
      icon: '🔥',
      text: 'Very hot weather is forecast. Monitor crop stress and consider irrigation during cooler hours.',
    });
  }

  if (days.some((day) => day.min <= 8)) {
    alerts.push({
      type: 'Cold alert',
      icon: '❄️',
      text: 'Cold nights are forecast. Check whether young or sensitive crops need protection.',
    });
  }

  if (now.wind >= 25) {
    alerts.push({
      type: 'Wind alert',
      icon: '💨',
      text: 'Winds are strong. Avoid pesticide spraying when wind conditions could cause spray drift.',
    });
  }

  return alerts;
}

function getFarmerId(farm) {
  const farmer = farm?.farmer;
  return String(
    farmer?._id || farmer?.id || farmer || ''
  );
}

function Weather() {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
 const { t, language } = useLanguage();
  const [farms, setFarms] = useState([]);
  const [city, setCity] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [error, setError] = useState('');

  const search = useCallback(async (name) => {
    const query = name.trim();

    if (!query) {
      setError('Please enter a village or city name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error('Location search failed.');
      }

      const geo = await geoResponse.json();
      const place = geo.results?.[0];

      if (!place) {
        setData(null);
        setError('Location not found. Try another nearby city or village.');
        return;
      }

      const weatherResponse = await fetch(
        'https://api.open-meteo.com/v1/forecast' +
        `?latitude=${place.latitude}` +
        `&longitude=${place.longitude}` +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
        '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
        '&forecast_days=7&timezone=auto'
      );

      if (!weatherResponse.ok) {
        throw new Error('Weather service is unavailable.');
      }

      const weather = await weatherResponse.json();

      if (!weather.current || !weather.daily?.time?.length) {
        throw new Error('Weather data is incomplete.');
      }

      const days = weather.daily.time.map((date, index) => ({
        date: new Date(`${date}T12:00:00`).toLocaleDateString(
          'en-IN',
          { day: 'numeric', month: 'short' }
        ),
        max: weather.daily.temperature_2m_max[index] ?? 0,
        min: weather.daily.temperature_2m_min[index] ?? 0,
        rain: weather.daily.precipitation_probability_max[index] ?? 0,
      }));

      const current = weather.current;
      const condition = getWeather(current.weather_code);

      const now = {
        temp: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        wind: Math.round(current.wind_speed_10m),
        isDay: current.is_day === 1,
        code: current.weather_code,
        text: condition.label,
        icon: condition.icon,
        theme: condition.theme,
      };

      setData({
        place: [
          place.name,
          place.admin1,
          place.country,
        ].filter(Boolean).join(', '),
        now,
        days,
        alerts: buildAlerts(now, days),
      });
    } catch (err) {
      setError(
        err.message || 'Could not load weather. Check your internet connection.'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setFarmsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadFarms() {
      try {
        const response = await fetch(`${API}/farms/all`);

        if (!response.ok) {
          throw new Error('Could not load farms');
        }

        const result = await response.json();
        const allFarms = Array.isArray(result) ? result : [];

        const mine = allFarms.filter(
          (farm) => getFarmerId(farm) === String(userId)
        );

        if (cancelled) return;

        setFarms(mine);

        const savedLocation = mine.find((farm) => farm.location)?.location;

        if (savedLocation) {
          setCity(savedLocation);
          search(savedLocation);
        }
      } catch {
        // City search still works if saved farms cannot be loaded.
      } finally {
        if (!cancelled) setFarmsLoading(false);
      }
    }

    loadFarms();

    return () => {
      cancelled = true;
    };
  }, [userId, search]);

  const theme = data?.now.theme || 'sunny';
  const currentTimeLabel = data?.now.isDay ? 'Daytime' : 'Nighttime';

  return (
    <div className={`weather-page weather-${theme}`}>
      <div className="weather-atmosphere" aria-hidden="true">
        {theme === 'rainy' && (
          <div className="weather-rain">
            {Array.from({ length: 28 }, (_, index) => (
              <span key={index} style={{ '--i': index }} />
            ))}
          </div>
        )}

        {theme === 'sunny' && <div className="weather-sun-glow" />}
        <div className="weather-orb weather-orb-one" />
        <div className="weather-orb weather-orb-two" />
      </div>

      <div className="weather-content">
        <FarmerNavbar />

        <main className="weather-container">
          <header className="weather-heading">
            <div className="weather-eyebrow">
              <span className="weather-live-dot" />
              AGRITECH ECOSYSTEM / WEATHER
            </div>

            <h1>
              Weather <span>&amp; Farm Insights</span>
            </h1>

            <p>
              Stay one step ahead of the weather. Make informed decisions
              for your farm with current conditions and a 7-day forecast.
            </p>
          </header>

          <section className="weather-search glass-card">
            <form
              className="weather-search-form"
              onSubmit={(event) => {
                event.preventDefault();
                search(city);
              }}
            >
              <label className="weather-search-field">
                <span>📍</span>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Search your village or city..."
                  aria-label="Search village or city"
                />
              </label>

              <button
                type="submit"
                className="weather-primary-button"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Get forecast ↗'}
              </button>
            </form>

            {farmsLoading && (
              <p className="weather-helper">Loading your saved farms...</p>
            )}

            {farms.length > 0 && (
              <div className="weather-farm-list">
                <span className="weather-helper">YOUR FARMS</span>
                {farms.map((farm) => (
                  <button
                    type="button"
                    key={farm._id}
                    className="weather-farm-chip"
                    onClick={() => {
                      setCity(farm.location || '');
                      search(farm.location || '');
                    }}
                    disabled={!farm.location || loading}
                  >
                    📍 {farm.farmName || 'My farm'}
                    {farm.location ? ` · ${farm.location}` : ''}
                  </button>
                ))}
              </div>
            )}
          </section>

          {error && (
            <div className="weather-error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {loading && !data && (
            <div className="weather-loading glass-card">
              <div className="weather-spinner" />
              <p>Reading the sky for you...</p>
            </div>
          )}

          {!data && !loading && !error && (
            <div className="weather-empty glass-card">
              <span className="weather-empty-icon">🌦️</span>
              <h2>Your farm weather starts here</h2>
              <p>
                Search a location above to see current conditions,
                farming alerts and the 7-day forecast.
              </p>
            </div>
          )}

          {data && (
            <>
              <section className="weather-hero glass-card">
                <div className="weather-hero-copy">
                  <span className="weather-kicker">
                    CURRENT CONDITIONS · {currentTimeLabel.toUpperCase()}
                  </span>

                  <h2>{data.place}</h2>
                  <p className="weather-condition">{data.now.text}</p>

                  <div className="weather-temperature">
                    {data.now.temp}
                    <span>°C</span>
                  </div>

                  <p className="weather-feels-note">
                    Live conditions for your selected location
                  </p>
                </div>

                <div className="weather-hero-icon" aria-hidden="true">
                  <span>{data.now.icon}</span>
                  <div className="weather-icon-ring" />
                </div>

                <div className="weather-hero-footer">
                  <div>
                    <span>💧</span>
                    <div>
                      <small>Humidity</small>
                      <strong>{data.now.humidity}%</strong>
                    </div>
                  </div>

                  <div>
                    <span>💨</span>
                    <div>
                      <small>Wind speed</small>
                      <strong>{data.now.wind} km/h</strong>
                    </div>
                  </div>

                  <div>
                    <span>🌱</span>
                    <div>
                      <small>Outlook</small>
                      <strong>{data.days[0]?.rain ?? 0}% rain chance</strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="weather-section">
                <div className="weather-section-heading">
                  <div>
                    <span className="weather-kicker">SMART FARMING</span>
                    <h2>Farm weather alerts</h2>
                  </div>
                  <span className="weather-count">
                    {data.alerts.length} {data.alerts.length === 1 ? 'alert' : 'alerts'}
                  </span>
                </div>

                {data.alerts.length === 0 ? (
                  <div className="weather-no-alert glass-card">
                    <span>🌿</span>
                    <div>
                      <strong>No weather-based alerts right now</strong>
                      <p>
                        Keep monitoring local conditions and your crops.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="weather-alert-grid">
                    {data.alerts.map((alert) => (
                      <article className="weather-alert glass-card" key={alert.type}>
                        <span className="weather-alert-icon">{alert.icon}</span>
                        <div>
                          <h3>{alert.type}</h3>
                          <p>{alert.text}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <p className="weather-disclaimer">
                  These are general weather-based reminders, not a crop
                  diagnosis. Confirm local conditions and crop-specific advice
                  before taking action.
                </p>
              </section>

              <section className="weather-forecast glass-card">
                <div className="weather-section-heading">
                  <div>
                    <span className="weather-kicker">PLAN AHEAD</span>
                    <h2>7-day forecast</h2>
                    <p>Temperature trends and daily rain probability</p>
                  </div>
                  <span className="weather-forecast-badge">NEXT 7 DAYS</span>
                </div>

                <div className="weather-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data.days}
                      margin={{ top: 15, right: 8, bottom: 4, left: -16 }}
                    >
                      <CartesianGrid
                        stroke="currentColor"
                        strokeOpacity={0.1}
                        strokeDasharray="4 5"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="currentColor"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="temperature"
                        stroke="currentColor"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        unit="°"
                      />
                      <YAxis
                        yAxisId="rain"
                        orientation="right"
                        stroke="currentColor"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(13, 34, 23, 0.94)',
                          border: '1px solid rgba(255,255,255,0.16)',
                          borderRadius: 14,
                          color: '#fff',
                        }}
                        labelStyle={{ color: '#d8f5df' }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="rain"
                        dataKey="rain"
                        name="Rain chance"
                        fill="#38bdf8"
                        fillOpacity={0.7}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={24}
                      />
                      <Line
                        yAxisId="temperature"
                        type="monotone"
                        dataKey="max"
                        name="High °C"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        yAxisId="temperature"
                        type="monotone"
                        dataKey="min"
                        name="Low °C"
                        stroke="#65a30d"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <footer className="weather-footer-note">
                <span>🌿</span>
                Weather-aware farming starts with better information.
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Weather;
