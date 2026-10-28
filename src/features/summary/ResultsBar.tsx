import { SoftText } from '../../components/SoftText';
import type { SizingOutcome } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { formatNumber, formatUp } from '../../ui/numbers';

/** Phone-only bar (hidden by CSS on wide screens) that keeps the key sizes in view while editing. */
export function ResultsBar({ outcome }: { outcome: SizingOutcome }) {
  const { t } = useI18n();
  const errors = outcome.issues.filter((issue) => issue.severity === 'error').length;
  const warnings = outcome.issues.length - errors;

  return (
    <a className="results-bar" href="#summary" aria-label={t('results.bar')}>
      {outcome.ok ? (
        <span className="results-bar__values">
          <span>
            {t('summary.inverter')} <span className="num"><SoftText text={formatUp(outcome.results.inverter.ratingW)} /> W</span>
          </span>
          <span className="num">
            <SoftText text={String(outcome.results.pvArray.panelCount)} /> × {formatNumber(outcome.results.pvArray.panelPowerW)} W
          </span>
          <span className="num">
            <SoftText text={formatUp(outcome.results.battery.capacityAh)} /> Ah · {outcome.results.systemVoltage.voltage} V
          </span>
        </span>
      ) : (
        <span className="results-bar__values">{t('summary.pending')}</span>
      )}
      {errors > 0 ? (
        <span className="badge badge--error">{t('summary.errors', { n: errors })}</span>
      ) : warnings > 0 ? (
        <span className="badge badge--warning">{warnings}&nbsp;!</span>
      ) : null}
    </a>
  );
}
