import { useState } from 'react';
import { I18nContext, translations } from './i18n';
import LanguageSelect from './screens/LanguageSelect';
import Welcome from './screens/Welcome';
import Planning from './screens/Planning';
import PlanSummary from './screens/PlanSummary';

export default function App() {
  const [screen, setScreen] = useState('language');
  const [lang, setLang] = useState('en');
  const [cities, setCities] = useState([]);
  const [plan, setPlan] = useState(null);

  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  return (
    <I18nContext.Provider value={{ t, lang }}>
      {screen === 'language' && (
        <LanguageSelect onSelect={(l) => { setLang(l); setScreen('welcome'); }} />
      )}
      {screen === 'welcome' && (
        <Welcome onCreatePlan={() => setScreen('planning')} />
      )}
      {screen === 'planning' && (
        <Planning
          cities={cities}
          setCities={setCities}
          onGeneratePlan={(planData) => { setPlan(planData); setScreen('summary'); }}
          onBack={() => setScreen('welcome')}
        />
      )}
      {screen === 'summary' && (
        <PlanSummary
          plan={plan}
          cities={cities}
          onBack={() => setScreen('planning')}
          onNewPlan={() => { setCities([]); setPlan(null); setScreen('welcome'); }}
        />
      )}
    </I18nContext.Provider>
  );
}
