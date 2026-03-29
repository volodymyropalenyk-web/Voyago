import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

export default function PlanSummary({ cities, onBack, onNewPlan }) {
  const { t } = useI18n();
  const [routes, setRoutes] = useState([]);
  const [holidays, setHolidays] = useState({});

  useEffect(() => {
    if (cities.length < 2) return;
    const fetchRoutes = async () => {
      const segments = [];
      for (let i = 1; i < cities.length; i++) {
        const from = cities[i - 1];
        const to = cities[i];
        try {
          const res = await fetch(
            `/api/route?from_lat=${from.lat}&from_lon=${from.lon}&to_lat=${to.lat}&to_lon=${to.lon}`
          );
          const data = await res.json();
          segments.push({ from: from.name, to: to.name, ...data });
        } catch {
          segments.push({ from: from.name, to: to.name, distance_km: '?', duration_h: '?' });
        }
      }
      setRoutes(segments);
    };
    fetchRoutes();
  }, [cities]);

  useEffect(() => {
    const year = new Date().getFullYear();
    const unique = [...new Set(cities.map((c) => c.countryCode))];
    unique.forEach(async (cc) => {
      try {
        const res = await fetch(`/api/holidays?countryCode=${cc}&year=${year}`);
        const data = await res.json();
        const today = new Date().toISOString().split('T')[0];
        const upcoming = data.filter((h) => h.date >= today).slice(0, 3);
        setHolidays((prev) => ({ ...prev, [cc]: upcoming }));
      } catch {}
    });
  }, [cities]);

  const totalKm = routes.reduce((sum, r) => sum + (parseFloat(r.distance_km) || 0), 0);
  const totalH = routes.reduce((sum, r) => sum + (parseFloat(r.duration_h) || 0), 0);
  const fuelPrice = cities[0]?.transport?.fuelPrice || 1.7;
  const consumption = cities[0]?.transport?.consumption || 8;
  const totalFuel = ((totalKm * consumption) / 100).toFixed(1);
  const totalFuelCost = ((totalKm * consumption * fuelPrice) / 100).toFixed(0);

  return (
    <div className="summary">
      <div className="summary__header">
        <button className="btn btn--ghost" onClick={onBack}>{t('backToPlanning')}</button>
        <div className="logo logo--sm">
          <span className="logo__globe">🌍</span>
          <span className="logo__name">Voy<span>ago</span></span>
        </div>
        <button className="btn btn--ghost" onClick={onNewPlan}>{t('newPlan')}</button>
      </div>

      <div className="summary__content">
        <div>
          <h1 className="summary__title">{t('planTitle')}</h1>
          <div className="summary__route">
            {cities.map((c, i) => (
              <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="summary__route-city">{c.name}</span>
                {i < cities.length - 1 && <span className="summary__route-arrow">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon">📏</div>
            <div className="stat-card__value">{totalKm.toFixed(0)} {t('km')}</div>
            <div className="stat-card__label">{t('totalDistance')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">⏱️</div>
            <div className="stat-card__value">{totalH.toFixed(1)} {t('h')}</div>
            <div className="stat-card__label">{t('totalDuration')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">⛽</div>
            <div className="stat-card__value">~€{totalFuelCost}</div>
            <div className="stat-card__label">{t('totalFuelCost')}</div>
          </div>
        </div>

        {/* Segments */}
        {routes.length > 0 && (
          <div>
            <div className="sidebar__cities-title" style={{ marginBottom: 12 }}>{t('totalRoute')}</div>
            <div className="city-summary-list">
              {routes.map((r, i) => (
                <div key={i} className="city-summary-card">
                  <div className="city-summary-card__num">{i + 1}</div>
                  <div className="city-summary-card__info">
                    <div className="city-summary-card__name">{r.from} → {r.to}</div>
                    <div className="city-summary-card__meta">
                      📏 {r.distance_km} {t('km')} &nbsp;·&nbsp; ⏱️ {r.duration_h} {t('h')}
                      {r.estimated && <span style={{ color: 'var(--text3)', marginLeft: 6 }}>({t('estimated')})</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Destinations detail */}
        <div>
          <div className="sidebar__cities-title" style={{ marginBottom: 12 }}>{t('yourDestinations')}</div>
          <div className="city-summary-list">
            {cities.map((city, i) => {
              const cityHolidays = holidays[city.countryCode] || [];
              return (
                <div key={city.id} className="city-summary-card">
                  <div className="city-summary-card__num">{i + 1}</div>
                  <div className="city-summary-card__info">
                    <div className="city-summary-card__name">
                      📍 {city.name}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text3)', marginLeft: 8 }}>
                        {city.countryCode}
                      </span>
                    </div>
                    {cityHolidays.length > 0 && (
                      <div className="city-summary-card__meta" style={{ marginTop: 6 }}>
                        🎉 {t('nextHolidays')}: {cityHolidays.map((h) => `${h.date} — ${h.localName}`).join(' · ')}
                      </div>
                    )}
                    <div className="city-summary-card__meta" style={{ marginTop: 4 }}>
                      🚗 {city.transport?.mode === 'car' ? `${t('byCar')}` :
                           city.transport?.mode === 'bus' ? `${t('byBus')}` :
                           `${t('byPlane')}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="summary__actions">
          <button className="btn btn--primary btn--lg" onClick={onBack}>{t('backToPlanning')}</button>
          <button className="btn btn--ghost btn--lg" onClick={onNewPlan}>{t('newPlan')}</button>
        </div>
      </div>
    </div>
  );
}
