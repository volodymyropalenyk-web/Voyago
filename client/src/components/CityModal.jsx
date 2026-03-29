import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';

// ── Attractions Tab ────────────────────────────────────────────────────────────
function AttractionsTab({ city, lang }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attractions?lat=${city.lat}&lon=${city.lon}&lang=${lang}`)
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [city.id]);

  if (loading) return <div className="tab-loading">⏳ {t('loading')}</div>;
  if (!items.length) return <div className="tab-empty">{t('errorData')}</div>;

  const icons = ['🏛️', '⛪', '🏰', '🗿', '🎭', '🌉', '🏟️', '🎨', '🌊', '🏔️', '🌿', '🎪'];

  return (
    <div className="attraction-list">
      {items.map((item, i) => (
        <a
          key={item.pageid}
          href={`https://${lang === 'uk' ? 'uk' : 'en'}.wikipedia.org/?curid=${item.pageid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="attraction-item"
        >
          <span className="attraction-item__icon">{icons[i % icons.length]}</span>
          <span className="attraction-item__name">{item.title}</span>
          <span className="attraction-item__arrow">↗ {t('openWiki')}</span>
        </a>
      ))}
    </div>
  );
}

// ── Transport Tab ──────────────────────────────────────────────────────────────
function TransportTab({ city, cities, onUpdateCity }) {
  const { t } = useI18n();
  const [mode, setMode] = useState(city.transport?.mode || 'plane');
  const [fuelPrice, setFuelPrice] = useState(city.transport?.fuelPrice || 1.7);
  const [consumption, setConsumption] = useState(city.transport?.consumption || 8);
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [departure, setDeparture] = useState('');

  const cityIndex = cities.findIndex((c) => c.id === city.id);
  const prevCity = cityIndex > 0 ? cities[cityIndex - 1] : null;

  useEffect(() => {
    if (!prevCity) return;
    setLoadingRoute(true);
    fetch(
      `/api/route?from_lat=${prevCity.lat}&from_lon=${prevCity.lon}&to_lat=${city.lat}&to_lon=${city.lon}`
    )
      .then((r) => r.json())
      .then(setRoute)
      .catch(() => setRoute(null))
      .finally(() => setLoadingRoute(false));
  }, [city.id, prevCity?.id]);

  const setModeAndSave = (m) => {
    setMode(m);
    onUpdateCity({ ...city, transport: { ...city.transport, mode: m } });
  };

  const fuelLiters = route ? ((parseFloat(route.distance_km) * consumption) / 100).toFixed(1) : null;
  const fuelCost = fuelLiters ? (fuelLiters * fuelPrice).toFixed(2) : null;

  const flixFrom = prevCity ? encodeURIComponent(prevCity.name) : '';
  const flixTo = encodeURIComponent(city.name);
  const gFlightsFrom = prevCity ? encodeURIComponent(prevCity.name) : encodeURIComponent(departure);
  const gFlightsTo = encodeURIComponent(city.name);

  return (
    <div className="transport-section">
      <div className="transport-modes">
        {[
          { key: 'car', icon: '🚗', label: t('byCar') },
          { key: 'bus', icon: '🚌', label: t('byBus') },
          { key: 'plane', icon: '✈️', label: t('byPlane') },
        ].map((m) => (
          <button
            key={m.key}
            className={`transport-mode-btn ${mode === m.key ? 'transport-mode-btn--active' : ''}`}
            onClick={() => setModeAndSave(m.key)}
          >
            <span className="transport-mode-btn__icon">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* CAR */}
      {mode === 'car' && (
        <>
          {!prevCity ? (
            <div className="tab-empty">{t('noPrevCity')}</div>
          ) : loadingRoute ? (
            <div className="tab-loading">⏳ {t('loading')}</div>
          ) : route ? (
            <>
              <div className="info-card">
                <div className="info-card__title">
                  {t('routeFrom')} {prevCity.name} → {city.name}
                  {route.estimated && <span style={{ color: 'var(--text3)', marginLeft: 6, textTransform: 'none' }}>({t('approxRoad')})</span>}
                </div>
                <div className="route-stats">
                  <div className="stat">
                    <div className="stat__value">{route.distance_km}</div>
                    <div className="stat__label">{t('km')}</div>
                  </div>
                  <div className="stat">
                    <div className="stat__value">{route.duration_h}</div>
                    <div className="stat__label">{t('h')}</div>
                  </div>
                  <div className="stat">
                    <div className="stat__value">{route.duration_min}</div>
                    <div className="stat__label">{t('min')}</div>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card__title">{t('estimatedCost')}</div>
                <div className="fuel-form">
                  <div className="field">
                    <label>{t('fuelPrice')}</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="5"
                      value={fuelPrice}
                      onChange={(e) => {
                        setFuelPrice(parseFloat(e.target.value));
                        onUpdateCity({ ...city, transport: { ...city.transport, fuelPrice: parseFloat(e.target.value) } });
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>{t('consumption')}</label>
                    <input
                      type="number"
                      step="0.5"
                      min="3"
                      max="30"
                      value={consumption}
                      onChange={(e) => {
                        setConsumption(parseFloat(e.target.value));
                        onUpdateCity({ ...city, transport: { ...city.transport, consumption: parseFloat(e.target.value) } });
                      }}
                    />
                  </div>
                </div>
                {fuelCost && (
                  <div className="fuel-result">
                    <span className="fuel-result__label">⛽ {fuelLiters} {t('liters')}</span>
                    <span className="fuel-result__value">€ {fuelCost}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="tab-empty">{t('errorData')}</div>
          )}
        </>
      )}

      {/* BUS */}
      {mode === 'bus' && (
        <div className="external-links">
          <div className="info-card" style={{ marginBottom: 0 }}>
            <div className="info-card__title">{t('bookBus')}</div>
          </div>
          <a
            href={`https://global.flixbus.com/bus-tickets?departureCity=${flixFrom}&arrivalCity=${flixTo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            <span className="external-link__icon">🟢</span>
            <div>
              <div className="external-link__label">FlixBus</div>
              {prevCity && <div className="external-link__sub">{prevCity.name} → {city.name}</div>}
            </div>
            <span className="external-link__arr">↗</span>
          </a>
          <a
            href={`https://www.blablacar.com/ride-posting/search?fn=${flixFrom}&tn=${flixTo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            <span className="external-link__icon">🔵</span>
            <div>
              <div className="external-link__label">BlaBlaCar</div>
              {prevCity && <div className="external-link__sub">{prevCity.name} → {city.name}</div>}
            </div>
            <span className="external-link__arr">↗</span>
          </a>
          <a
            href={`https://www.rome2rio.com/s/${flixFrom}/${flixTo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            <span className="external-link__icon">🔴</span>
            <div>
              <div className="external-link__label">Rome2Rio</div>
              <div className="external-link__sub">All bus routes comparison</div>
            </div>
            <span className="external-link__arr">↗</span>
          </a>
        </div>
      )}

      {/* PLANE */}
      {mode === 'plane' && (
        <>
          {!prevCity && (
            <div className="departure-form">
              <input
                placeholder={t('departureCity')}
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
              />
            </div>
          )}
          <div className="external-links">
            <div className="info-card" style={{ marginBottom: 0 }}>
              <div className="info-card__title">{t('searchFlights')}</div>
            </div>
            <a
              href={`https://www.google.com/travel/flights?q=flights+from+${gFlightsFrom}+to+${gFlightsTo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              <span className="external-link__icon">✈️</span>
              <div>
                <div className="external-link__label">Google Flights</div>
                <div className="external-link__sub">{prevCity ? prevCity.name : departure || '?'} → {city.name}</div>
              </div>
              <span className="external-link__arr">↗</span>
            </a>
            <a
              href={`https://www.skyscanner.net/transport/flights/${gFlightsFrom}/${gFlightsTo}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              <span className="external-link__icon">🔷</span>
              <div>
                <div className="external-link__label">Skyscanner</div>
                <div className="external-link__sub">Compare flight prices</div>
              </div>
              <span className="external-link__arr">↗</span>
            </a>
            <a
              href={`https://www.kiwi.com/en/search/results/${gFlightsFrom}/${gFlightsTo}/anytime/anytime`}
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              <span className="external-link__icon">🟠</span>
              <div>
                <div className="external-link__label">Kiwi.com</div>
                <div className="external-link__sub">Flexible date search</div>
              </div>
              <span className="external-link__arr">↗</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

// ── Holidays Tab ───────────────────────────────────────────────────────────────
function HolidaysTab({ city }) {
  const { t } = useI18n();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    setLoading(true);
    fetch(`/api/holidays?countryCode=${city.countryCode}&year=${year}`)
      .then((r) => r.json())
      .then(setHolidays)
      .catch(() => setHolidays([]))
      .finally(() => setLoading(false));
  }, [city.id]);

  if (loading) return <div className="tab-loading">⏳ {t('loading')}</div>;
  if (!holidays.length) return <div className="tab-empty">{t('noHolidays')}</div>;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="holiday-list">
      {holidays.map((h) => {
        const upcoming = h.date >= today;
        return (
          <div key={h.date + h.name} className={`holiday-item ${upcoming ? 'holiday-item--upcoming' : ''}`}>
            <div className="holiday-item__date">{h.date}</div>
            <div className="holiday-item__name">
              {h.localName}
              {h.localName !== h.name && (
                <span style={{ color: 'var(--text3)', marginLeft: 6, fontSize: '0.8rem' }}>
                  ({h.name})
                </span>
              )}
            </div>
            {upcoming && <div className="holiday-item__badge">🔔 soon</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Weather Tab ────────────────────────────────────────────────────────────────
function WeatherTab({ city }) {
  const { t } = useI18n();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/weather?city=${encodeURIComponent(city.name)}`)
      .then((r) => r.json())
      .then(setWeather)
      .catch(() => setWeather(null))
      .finally(() => setLoading(false));
  }, [city.id]);

  if (loading) return <div className="tab-loading">⏳ {t('loading')}</div>;
  if (!weather?.current_condition) return <div className="tab-empty">{t('errorData')}</div>;

  const cur = weather.current_condition[0];
  const temp = cur.temp_C;
  const feels = cur.FeelsLikeC;
  const desc = cur.weatherDesc?.[0]?.value || '';
  const humidity = cur.humidity;
  const wind = cur.windspeedKmph;

  const weatherIcon = (code) => {
    const c = parseInt(code);
    if (c === 113) return '☀️';
    if (c === 116) return '⛅';
    if ([119, 122].includes(c)) return '☁️';
    if ([143, 248, 260].includes(c)) return '🌫️';
    if ([176, 293, 296, 299, 302, 305, 308].includes(c)) return '🌧️';
    if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338].includes(c)) return '❄️';
    if ([200, 386, 389, 392, 395].includes(c)) return '⛈️';
    return '🌡️';
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast = weather.weather?.slice(0, 3) || [];

  return (
    <>
      <div className="weather-current">
        <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>
          {weatherIcon(cur.weatherCode)}
        </div>
        <div>
          <div className="weather-current__temp">{temp}°C</div>
          <div className="weather-current__desc">{desc}</div>
          <div className="weather-current__meta">
            <span>💧 {humidity}%</span>
            <span>💨 {wind} km/h</span>
            <span>🌡️ {t('feelsLike')} {feels}°C</span>
          </div>
        </div>
      </div>

      {forecast.length > 0 && (
        <>
          <div className="sidebar__cities-title" style={{ marginBottom: 10 }}>{t('forecast')}</div>
          <div className="weather-forecast">
            {forecast.map((day) => {
              const d = new Date(day.date);
              const hourly = day.hourly?.[4] || {};
              return (
                <div key={day.date} className="forecast-day">
                  <div className="forecast-day__name">{days[d.getDay()]}</div>
                  <div className="forecast-day__icon">{weatherIcon(hourly.weatherCode || 113)}</div>
                  <div className="forecast-day__temps">
                    <span className="forecast-day__max">{day.maxtempC}°</span>
                    {' / '}
                    <span className="forecast-day__min">{day.mintempC}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'attractions', icon: '🏛️' },
  { key: 'transport',   icon: '🚗' },
  { key: 'holidays',    icon: '🎉' },
  { key: 'weather',     icon: '🌤️' },
];

export default function CityModal({ city, cities, onClose, onUpdateCity }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('attractions');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">📍 {city.name}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <div className="modal__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {t(tab.key)}
            </button>
          ))}
        </div>

        <div className="modal__body">
          {activeTab === 'attractions' && (
            <AttractionsTab city={city} lang={t('chooseLanguage') === 'Оберіть мову' ? 'uk' : 'en'} />
          )}
          {activeTab === 'transport' && (
            <TransportTab city={city} cities={cities} onUpdateCity={onUpdateCity} />
          )}
          {activeTab === 'holidays' && <HolidaysTab city={city} />}
          {activeTab === 'weather' && <WeatherTab city={city} />}
        </div>
      </div>
    </div>
  );
}
