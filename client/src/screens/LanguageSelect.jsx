export default function LanguageSelect({ onSelect }) {
  const languages = [
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'uk', flag: '🇺🇦', name: 'Українська' },
  ];

  return (
    <div className="screen lang-select">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <div className="logo">
          <span className="logo__globe">🌍</span>
          <span className="logo__name">Voy<span>ago</span></span>
        </div>
        <p className="lang-select__title">Choose Your Language / Оберіть мову</p>
        <div className="lang-cards">
          {languages.map((l) => (
            <button key={l.code} className="lang-card" onClick={() => onSelect(l.code)}>
              <span className="lang-card__flag">{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
