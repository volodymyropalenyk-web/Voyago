import { useI18n } from '../i18n';

export default function Welcome({ onCreatePlan }) {
  const { t } = useI18n();

  const features = [
    { icon: '🗺️', key: 'feature1' },
    { icon: '✈️', key: 'feature2' },
    { icon: '🎉', key: 'feature3' },
    { icon: '🌤️', key: 'feature4' },
  ];

  return (
    <div className="screen welcome">
      <div className="welcome__orb welcome__orb--1" />
      <div className="welcome__orb welcome__orb--2" />

      <div className="welcome__content">
        <div className="logo" style={{ fontSize: '2rem' }}>
          <span className="logo__globe">🌍</span>
          <span className="logo__name">Voy<span>ago</span></span>
        </div>

        <h1 className="welcome__title">{t('welcomeTitle')}</h1>
        <p className="welcome__subtitle">{t('welcomeSubtitle')}</p>

        <div className="welcome__features">
          {features.map((f) => (
            <div key={f.key} className="welcome__feature">
              <span>{f.icon}</span>
              <span>{t(f.key)}</span>
            </div>
          ))}
        </div>

        <button className="btn btn--primary btn--lg" onClick={onCreatePlan}>
          {t('createPlan')} →
        </button>
      </div>
    </div>
  );
}
