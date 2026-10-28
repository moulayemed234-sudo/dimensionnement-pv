import { ENGINE_VERSION } from './engine/constants';
import { LoadTable } from './features/loads/LoadTable';
import { SystemParametersPanel } from './features/parameters/SystemParametersPanel';
import { ProjectHeader } from './features/project/ProjectHeader';
import { ExecutiveSummary } from './features/summary/ExecutiveSummary';
import { ResultsBar } from './features/summary/ResultsBar';
import { useSizing } from './state/sizing';

export default function App() {
  const { outcome, totals } = useSizing();
  const recommendedVoltage = totals && totals.peakPowerW > 0 ? totals.recommendedVoltage : null;

  return (
    <div className="app">
      <ProjectHeader />
      <main className="layout">
        <div className="layout__inputs">
          <LoadTable issues={outcome.issues} totals={totals} />
          <SystemParametersPanel issues={outcome.issues} recommendedVoltage={recommendedVoltage} />
        </div>
        <aside className="layout__summary" id="summary" aria-label="Résultats">
          <ExecutiveSummary outcome={outcome} />
        </aside>
      </main>
      <ResultsBar outcome={outcome} />
      <footer className="app-footer">
        Moteur de calcul v{ENGINE_VERSION}. Les résultats se mettent à jour pendant la saisie&nbsp;; le brouillon
        est enregistré dans ce navigateur.
      </footer>
    </div>
  );
}
