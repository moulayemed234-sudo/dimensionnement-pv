import { Icon, type IconName } from '../../components/Icon';
import { IssueList } from '../../components/IssueList';
import { SoftText } from '../../components/SoftText';
import type { SizingOutcome } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { useUiStore } from '../../state/uiStore';
import { formatNumber, formatPercent, formatUp } from '../../ui/numbers';

/** "Résumé des calculs": the four headline results as coloured cards. */
export function SummaryColumn({ outcome }: { outcome: SizingOutcome }) {
  const { t } = useI18n();
  const setStep = useUiStore((state) => state.setStep);
  const errors = outcome.issues.filter((issue) => issue.severity === 'error');
  const warnings = outcome.issues.filter((issue) => issue.severity === 'warning');

  return (
    <section className="card summary" id="summary" aria-labelledby="summary-title">
      <div className="summary__head">
        <h2 id="summary-title" className="card__title">
          <span className="card__title-icon card__title-icon--amber" aria-hidden="true">
            <Icon name="calculator" size={22} />
          </span>
          {t('summary.title')}
        </h2>
        <StatusBadge errors={errors.length} warnings={warnings.length} />
      </div>

      {outcome.ok ? (
        <SummaryCards outcome={outcome} />
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

      {outcome.ok ? (
        <button type="button" className="button button--ghost summary__details" onClick={() => setStep(6)}>
          {t('summary.details')}
          <Icon name="chevronEnd" size={18} className="icon--flip-rtl" />
        </button>
      ) : null}
    </section>
  );
}

function SummaryCards({ outcome }: { outcome: Extract<SizingOutcome, { ok: true }> }) {
  const { t } = useI18n();
  const { pvArray, battery, inverter, systemVoltage } = outcome.results;
  const v = systemVoltage.voltage;

  return (
    <div className="sum-cards">
      <SummaryCard
        tone="amber"
        icon="panel"
        title={t('summary.pv')}
        value={formatNumber(pvArray.installedPowerW / 1000, 2)}
        unit="kW"
        sub={t('summary.pvSub', { n: pvArray.panelCount, w: formatNumber(pvArray.panelPowerW) })}
        side={String(pvArray.panelCount)}
        sideLabel={t('summary.pvSide')}
      />
      <SummaryCard
        tone="green"
        icon="battery"
        title={t('summary.battery')}
        value={formatUp(battery.nominalEnergyWh / 1000, 2)}
        unit="kWh"
        sub={t('summary.batterySub', { ah: formatUp(battery.capacityAh), v, pct: formatPercent(battery.depthOfDischarge) })}
        side={`${v} V`}
        sideLabel={t('summary.batterySide')}
      />
      <SummaryCard
        tone="teal"
        icon="inverter"
        title={t('summary.inverter')}
        value={formatUp(inverter.ratingW / 1000, 2)}
        unit="kW"
        sub={t('summary.inverterSub', { f: formatNumber(inverter.safetyFactor, 2) })}
        side={`${formatUp(inverter.ratingW)} W`}
        sideLabel={t('summary.inverterSide')}
      />
      <SummaryCard
        tone="amber"
        icon="bolt"
        title={t('summary.voltage')}
        value={String(v)}
        unit="V"
        sub={t('summary.voltageSub', {
          v,
          mode: systemVoltage.source === 'auto' ? t('summary.voltageAuto') : t('summary.voltageManual'),
        })}
        side="DC"
        sideLabel={t('summary.voltageSide')}
      />
    </div>
  );
}

interface SummaryCardProps {
  tone: 'amber' | 'green' | 'teal';
  icon: IconName;
  title: string;
  value: string;
  unit: string;
  sub: string;
  side: string;
  sideLabel: string;
}

function SummaryCard({ tone, icon, title, value, unit, sub, side, sideLabel }: SummaryCardProps) {
  const { text } = useI18n();
  return (
    <article className={`sum-card sum-card--${tone}`}>
      <div className="sum-card__side">
        <span className="sum-card__side-value num">
          <SoftText text={side} />
        </span>
        <span className="sum-card__side-label">{sideLabel}</span>
      </div>
      <div className="sum-card__body">
        <h3 className="sum-card__title">{title}</h3>
        <p className="sum-card__value">
          <span className="num">
            <SoftText text={value} />
          </span>
          <span className="sum-card__unit">{unit}</span>
        </p>
        <p className="sum-card__sub">{text(sub)}</p>
      </div>
      <span className="sum-card__icon" aria-hidden="true">
        <Icon name={icon} size={30} />
      </span>
    </article>
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
