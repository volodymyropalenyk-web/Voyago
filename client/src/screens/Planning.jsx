import { useState } from 'react';
import { useI18n } from '../i18n';
import WorldMap from '../components/WorldMap';
import CityModal from '../components/CityModal';

export default function Planning({ cities, setCities, onGeneratePlan, onBack }) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = (r) => {
    const name = r.display_name.split(',')[0].trim();
    const countryCode = r.address?.country_code?.toUpperCase() || 'US';
    const newCity = {
      id: Date.now(),
      name,
      fullName: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      countryCode,
      transport: { mode: 'plane', fuelPrice: 1.7, consumption: 8 },
    };
    setCities((prev) => [...prev, newCity]);
    setQuery('');
    setResults([]);
  };

  const handleRemove = (id) => setCities((prev) => prev.filter((c) => c.id !== id));

  const handleUpdateCity = (updated) =>
    setCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  return (
    <div className="planning">
      {/* Header */}
      <header className="planning__header">
        <button className="btn btn--ghost" onClick={onBack}>← {t('back')}</button>
        <div className="logo logo--sm">
          <span className="logo__globe">🌍</span>
          <span className="logo__name">Voy<span>ago</span></span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text3)', padding: '4px 10px', background: 'var(--bg3)', borderRadius: 8 }}>
          {lang === 'uk' ? 'UA' : 'EN'}
        </div>
      </header>

      <div className="planning__body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar__search">
            <div className="search-row">
              <input
                className="search-input"
                placeholder={t('searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn--primary" onClick={handleSearch} disabled={searching}>
                {searching ? '…' : t('addCity')}
              </button>
            </div>

            {results.length > 0 && (
              <div className="search-results">
                {results.map((r, i) => (
                  <div key={i} className="search-result" onClick={() => handleAdd(r)}>
                    📍 {r.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar__cities">
            <div className="sidebar__cities-title">{t('yourDestinations')}</div>
            {cities.length === 0 ? (
              <p className="city-empty">{t('noDestinations')}</p>
            ) : (
              <div className="city-list-mobile">
                {cities.map((city, i) => (
                  <div key={city.id} className="city-item">
                    <div className="city-item__num">{i + 1}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div className="city-item__name">{city.name}</div>
                      <div className="city-item__country">{city.countryCode}</div>
                    </div>
                    <button className="city-item__remove" onClick={() => handleRemove(city.id)}>
                      {t('remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cities.length >= 1 && (
            <div className="sidebar__generate">
              <button
                className="btn btn--gold btn--full"
                onClick={() => onGeneratePlan({ cities })}
              >
                🗺️ {t('generatePlan')}
              </button>
            </div>
          )}
        </aside>

        {/* Map */}
        <main className="planning__map">
          <WorldMap cities={cities} onMarkerClick={setSelectedCity} />
          {cities.length > 0 && (
            <div className="map-hint">📍 {t('tapMarkerHint')}</div>
          )}
        </main>
      </div>

      {selectedCity && (
        <CityModal
          city={selectedCity}
          cities={cities}
          onClose={() => setSelectedCity(null)}
          onUpdateCity={handleUpdateCity}
        />
      )}
    </div>
  );
}
