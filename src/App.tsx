import { useEffect, useState } from 'react';
import { UndoToast } from './components/UndoToast';
import { SystemDiagram } from './features/diagram/SystemDiagram';
import { Sidebar } from './features/layout/Sidebar';
import { TopBar, BrandMark } from './features/layout/TopBar';
import { LoadTable } from './features/loads/LoadTable';
import { PrintReport } from './features/report/PrintReport';
import { ReportCard } from './features/report/ReportCard';
import { BatteryStep } from './features/steps/BatteryStep';
import { ConsumptionStep } from './features/steps/ConsumptionStep';
import { InverterStep } from './features/steps/InverterStep';
import { PvStep } from './features/steps/PvStep';
import { ResultsStep } from './features/steps/ResultsStep';
import { ResultsBar } from './features/summary/ResultsBar';
import { SummaryColumn } from './features/summary/SummaryColumn';
import { useSettingsStore } from './i18n/settings';
import { useI18n } from './i18n/useI18n';
import { useProjectStore } from './state/projectStore';
import { useSizing } from './state/sizing';
import { useUiStore } from './state/uiStore';

export default function App() {
  const { outcome, totals } = useSizing();
  const { t, locale, dir } = useI18n();
  const theme = useSettingsStore((state) => state.theme);
  const step = useUiStore((state) => state.step);
  const input = useProjectStore((state) => state.input);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
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

  useEffect(() => setUpdatedAt(new Date()), [input]);

  const time = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(updatedAt);

  return (
    <>
      <div className="app">
        <TopBar />
        <div className="workspace">
          <Sidebar issues={issues} />
          <main className="area-main">
            {step === 1 ? <LoadTable issues={issues} totals={totals} /> : null}
            {step === 2 ? <ConsumptionStep totals={totals} /> : null}
            {step === 3 ? <PvStep issues={issues} /> : null}
            {step === 4 ? <BatteryStep issues={issues} /> : null}
            {step === 5 ? <InverterStep issues={issues} recommendedVoltage={recommendedVoltage} /> : null}
            {step === 6 ? <ResultsStep outcome={outcome} /> : null}
          </main>
          <div className="area-summary">
            <SummaryColumn outcome={outcome} />
          </div>
          <div className="area-diagram">
            <SystemDiagram outcome={outcome} />
          </div>
          <div className="area-report">
            <ReportCard outcome={outcome} />
          </div>
        </div>
        <footer className="app-footer">
          <span className="app-footer__brand">
            <BrandMark size={26} />
            {t('brand.name')} <span aria-hidden="true">|</span> {t('brand.footer')}
          </span>
          <span>{t('footer.updated', { time })}</span>
        </footer>
      </div>
      <ResultsBar outcome={outcome} />
      <UndoToast />
      <PrintReport outcome={outcome} />
    </>
  );
}
