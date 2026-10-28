import type { SizingOutcome } from '../../engine/types';
import { formatNumber, formatUp } from '../../ui/numbers';

/** Phone-only bar (hidden by CSS on wide screens) that keeps the key sizes in view while editing. */
export function ResultsBar({ outcome }: { outcome: SizingOutcome }) {
  const errors = outcome.issues.filter((issue) => issue.severity === 'error').length;
  const warnings = outcome.issues.length - errors;

  return (
    <a className="results-bar" href="#summary" aria-label="Voir la synthèse du dimensionnement">
      {outcome.ok ? (
        <span className="results-bar__values">
          <span>Onduleur {formatUp(outcome.results.inverter.ratingW)} W</span>
          <span>
            {outcome.results.pvArray.panelCount} × {formatNumber(outcome.results.pvArray.panelPowerW)} W
          </span>
          <span>
            {formatUp(outcome.results.battery.capacityAh)} Ah sous {outcome.results.systemVoltage.voltage} V
          </span>
        </span>
      ) : (
        <span className="results-bar__values">Résultats en attente</span>
      )}
      {errors > 0 ? (
        <span className="badge badge--error">{errors > 1 ? `${errors} erreurs` : '1 erreur'}</span>
      ) : warnings > 0 ? (
        <span className="badge badge--warning">{warnings}&nbsp;!</span>
      ) : (
        <span aria-hidden="true">↓</span>
      )}
    </a>
  );
}
