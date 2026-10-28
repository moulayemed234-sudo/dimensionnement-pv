import type { ReactNode } from 'react';
import { IssueList } from '../../components/IssueList';
import { SoftText } from '../../components/SoftText';
import type { SizingOutcome, SizingResults } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { CHEMISTRY_LABELS } from '../../ui/labels';
import { formatNumber, formatPercent, formatUp } from '../../ui/numbers';
import { StepCard } from '../layout/StepCard';

/** Step 6: every result with its formula and the values used. */
export function ResultsStep({ outcome }: { outcome: SizingOutcome }) {
  const { t } = useI18n();
  const errors = outcome.issues.filter((issue) => issue.severity === 'error');
  const warnings = outcome.issues.filter((issue) => issue.severity === 'warning');

  return (
    <StepCard step={6} subtitle={t('results.subtitle')}>
      {outcome.ok ? (
        <ResultCards results={outcome.results} />
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
    </StepCard>
  );
}

function ResultCards({ results }: { results: SizingResults }) {
  const { t, locale } = useI18n();
  const { load, systemVoltage, inverter, pvArray, battery } = results;
  const voltage = systemVoltage.voltage;
  const chemistry = battery.chemistry === 'custom' ? t('results.custom') : CHEMISTRY_LABELS[locale][battery.chemistry];
  const days = battery.daysOfAutonomy;

  return (
    <div className="kpi-grid">
      <Kpi
        title={t('results.inverter')}
        value={formatUp(inverter.ratingW)}
        unit="W"
        formula={`P_inv = E_T ${formatNumber(load.dailyEnergyWh, 1)} × ${formatNumber(inverter.safetyFactor, 2)}`}
        notes={[t('results.inverterNote')]}
      />
      <Kpi
        title={t('results.voltage')}
        value={String(voltage)}
        unit="V"
        formula={`P_peak ${formatNumber(load.peakPowerW, 1)} W → ${systemVoltage.recommendedVoltage} V`}
        notes={[systemVoltage.source === 'auto' ? t('results.voltageAuto') : t('results.voltageManual')]}
      />
      <Kpi
        title={t('results.pv')}
        value={String(pvArray.panelCount)}
        unit={t('results.panels', { w: formatNumber(pvArray.panelPowerW) })}
        formula={`W_PV = ${formatNumber(load.dailyEnergyWh, 1)} Wh ÷ (${formatNumber(pvArray.deratingFactor, 3)} × ${formatNumber(pvArray.peakSunHours, 2)} h)`}
        notes={[
          t('results.required', { v: formatUp(pvArray.requiredPowerW) }),
          t('results.installed', { v: formatNumber(pvArray.installedPowerW) }),
        ]}
      />
      <Kpi
        title={t('results.battery')}
        value={formatUp(battery.capacityAh)}
        unit={t('results.batteryUnit', { v: voltage })}
        formula={`C = ${formatNumber(load.dailyEnergyWh, 1)} Wh × ${formatNumber(days, 2)} ÷ (${formatNumber(battery.efficiency, 3)} × ${formatNumber(battery.depthOfDischarge, 3)} × ${voltage} V)`}
        notes={[
          t('results.dod', { chem: chemistry, pct: formatPercent(battery.depthOfDischarge) }),
          t('results.autonomy', {
            days: formatNumber(days, 2),
            unit: days >= 2 ? t('results.dayPlural') : t('results.day'),
            kwh: formatUp(battery.nominalEnergyWh / 1000, 2),
          }),
        ]}
      />
    </div>
  );
}

interface KpiProps {
  title: string;
  value: string;
  unit: string;
  formula: ReactNode;
  notes: readonly string[];
}

function Kpi({ title, value, unit, formula, notes }: KpiProps) {
  const { text } = useI18n();
  return (
    <article className="kpi">
      <h3 className="kpi__title">{title}</h3>
      <p className="kpi__value">
        <span className="num">
          <SoftText text={value} />
        </span>
        <span className="kpi__unit">{unit}</span>
      </p>
      <p className="kpi__formula" dir="ltr">
        {formula}
      </p>
      <ul className="kpi__notes">
        {notes.map((note) => (
          <li key={note}>{text(note)}</li>
        ))}
      </ul>
    </article>
  );
}
