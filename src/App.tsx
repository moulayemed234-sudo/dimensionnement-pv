import { useEffect } from 'react';
import { UndoToast } from './components/UndoToast';
import { TopBar } from './features/layout/TopBar';
import { LoadTable } from './features/loads/LoadTable';
import { ProjectBar } from './features/project/ProjectBar';
import { PrintReport } from './features/report/PrintReport';
import { SettingsCard } from './features/settings/SettingsCard';
import { ResultsBar } from './features/summary/ResultsBar';
import { ResultsCard } from './features/summary/ResultsCard';
import { useSettingsStore } from './i18n/settings';
import { useI18n } from './i18n/useI18n';
import { useSizing } from './state/sizing';

export default function App() {
  const { outcome, totals } = useSizing();
  const { t, locale, dir } = useI18n();
  const theme = useSettingsStore((state) => state.theme);
  const issues = outcome.issues;
  const recommendedVoltage = totals && totals.peakPowerW > 0 ? totals.recommendedVoltage : null;

  // Language, reading direction and theme apply to the whole page.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    root.dataset.theme = theme;
    document.title = `${t('brand.name')} — ${t('brand.tagline')}`;
  }, [locale, dir, theme, t]);

  return (
    <>
      <div className="app">
        <TopBar />
        <main className="workspace">
          <div className="area-project">
            <ProjectBar />
          </div>
          <div className="area-loads">
            <LoadTable issues={issues} totals={totals} />
          </div>
          <div className="area-results">
            <ResultsCard outcome={outcome} />
          </div>
          <div className="area-settings">
            <SettingsCard issues={issues} recommendedVoltage={recommendedVoltage} />
          </div>
        </main>
      </div>
      <ResultsBar outcome={outcome} />
      <UndoToast />
      <PrintReport outcome={outcome} />
    </>
  );
}
