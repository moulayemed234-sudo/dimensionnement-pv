import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { IssueList } from '../../components/IssueList';
import { SoftText } from '../../components/SoftText';
import type { SizingOutcome } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { downloadProject } from '../../services/projectFile';
import { snapshotProject } from '../../state/projectStore';
import { formatNumber, formatPercent, formatUp } from '../../ui/numbers';

/** The sizing answer: panels, batteries, inverter and voltage, then save / PDF. */
export function ResultsCard({ outcome }: { outcome: SizingOutcome }) {
  const { t } = useI18n();
  const errors = outcome.issues.filter((issue) => issue.severity === 'error');
  const warnings = outcome.issues.filter((issue) => issue.severity === 'warning');

  return (
    <section className="card results" id="summary" aria-labelledby="results-title">
      <div className="results__head">
        <h2 id="results-title" className="card__title">
          <span className="card__title-icon card__title-icon--amber" aria-hidden="true">
            <Icon name="calculator" size={22} />
          </span>
          {t('results.title')}
        </h2>
        <StatusBadge errors={errors.length} warnings={warnings.length} />
      </div>

      {outcome.ok ? (
        <ResultList outcome={outcome} />
      ) : (
        <div className="pending">
          <p className="pending__title">{t('summary.pending')}</p>
          <p>{t('summary.fix')}</p>
          <IssueList messages={errors} />
        </div>
      )}

      {warnings.length > 0 ? (
        <div className="review">
          <h3 className="review__title">{t('summary.review')}</h3>
          <IssueList messages={warnings} />
        </div>
      ) : null}

      <div className="results__actions">
        <button type="button" className="button" onClick={() => downloadProject(snapshotProject())}>
          <Icon name="save" size={18} />
          {t('report.save')}
        </button>
        <button type="button" className="button button--primary" onClick={() => window.print()}>
          <Icon name="file" size={18} />
          {t('report.pdf')}
        </button>
      </div>
    </section>
  );
}

function ResultList({ outcome }: { outcome: Extract<SizingOutcome, { ok: true }> }) {
  const { t } = useI18n();
  const { pvArray, battery, inverter, systemVoltage } = outcome.results;
  const v = systemVoltage.voltage;

  return (
    <div className="result-list">
      <ResultRow
        tone="amber"
        icon="panel"
        label={t('summary.pv')}
        value={`${pvArray.panelCount} × ${formatNumber(pvArray.panelPowerW)} W`}
        sub={t('results.installedKw', { kw: formatNumber(pvArray.installedPowerW / 1000, 2) })}
      />
      <ResultRow
        tone="green"
        icon="battery"
        label={t('summary.battery')}
        value={`${formatUp(battery.capacityAh)} Ah`}
        sub={<span className="num">{`${v} V · ${formatUp(battery.nominalEnergyWh / 1000, 2)} kWh · DoD ${formatPercent(battery.depthOfDischarge)}`}</span>}
      />
      <ResultRow
        tone="teal"
        icon="inverter"
        label={t('summary.inverter')}
        value={`${formatUp(inverter.ratingW)} W`}
        sub={t('summary.inverterSub', { f: formatNumber(inverter.safetyFactor, 2) })}
      />
      <ResultRow
        tone="blue"
        icon="bolt"
        label={t('summary.voltage')}
        value={`${v} V`}
        sub={systemVoltage.source === 'auto' ? t('results.voltageAuto') : t('results.voltageManual')}
      />
    </div>
  );
}

interface ResultRowProps {
  tone: 'amber' | 'green' | 'teal' | 'blue';
  icon: IconName;
  label: string;
  value: string;
  sub: ReactNode;
}

function ResultRow({ tone, icon, label, value, sub }: ResultRowProps) {
  const { text } = useI18n();
  return (
    <div className={`result-row result-row--${tone}`}>
      <span className="result-row__icon" aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <div>
        <h3 className="result-row__label">{label}</h3>
        <p className="result-row__sub">{typeof sub === 'string' ? text(sub) : sub}</p>
      </div>
      <p className="result-row__value num">
        <SoftText text={value} />
      </p>
    </div>
  );
}

function StatusBadge({ errors, warnings }: { errors: number; warnings: number }) {
  const { t } = useI18n();
  const [tone, text] =
    errors > 0
      ? ['error', t('summary.errors', { n: errors })]
      : warnings > 0
        ? ['warning', t('summary.warnings', { n: warnings })]
        : ['ok', t('summary.ok')];
  return (
    <span className={`badge badge--${tone}`} role="status">
      {text}
    </span>
  );
}
