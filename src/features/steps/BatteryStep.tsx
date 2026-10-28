import { Field } from '../../components/Field';
import { NumberField } from '../../components/NumberField';
import { DEPTH_OF_DISCHARGE, NUMERIC_RULES } from '../../engine/constants';
import { isBatteryChemistry, resolveDepthOfDischarge } from '../../engine/solarEngine';
import type { BatteryChemistry, IssueField, ValidationIssue } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { useProjectStore } from '../../state/projectStore';
import { issuesFor } from '../../state/sizing';
import { CHEMISTRY_LABELS } from '../../ui/labels';
import { formatNumber, formatPercent } from '../../ui/numbers';
import { StepCard } from '../layout/StepCard';

const CHEMISTRIES = Object.keys(CHEMISTRY_LABELS.fr) as BatteryChemistry[];

/** Step 4: battery technology, depth of discharge, autonomy and efficiency. */
export function BatteryStep({ issues }: { issues: readonly ValidationIssue[] }) {
  const { t, locale } = useI18n();
  const battery = useProjectStore((state) => state.input.battery);
  const setBattery = useProjectStore((state) => state.setBattery);
  const at = (field: IssueField) => issuesFor(issues, field);
  const labels = CHEMISTRY_LABELS[locale];
  const customDod = NUMERIC_RULES.customDepthOfDischarge;

  const changeChemistry = (chemistry: BatteryChemistry) => {
    // Switching to custom starts from the DoD of the technology being left.
    if (chemistry === 'custom' && battery.chemistry !== 'custom' && battery.customDepthOfDischarge === undefined) {
      setBattery({ chemistry, customDepthOfDischarge: resolveDepthOfDischarge(battery) });
    } else {
      setBattery({ chemistry });
    }
  };

  return (
    <StepCard step={4} subtitle={t('battery.subtitle')}>
      <div className="form-grid">
        <Field label={t('battery.technology')} htmlFor="param-chemistry">
          <select
            id="param-chemistry"
            className="input"
            value={battery.chemistry}
            onChange={(event) => {
              if (isBatteryChemistry(event.target.value)) changeChemistry(event.target.value);
            }}
          >
            {CHEMISTRIES.map((chemistry) => (
              <option key={chemistry} value={chemistry}>
                {chemistry === 'custom' ? labels.custom : `${labels[chemistry]} — DoD ${formatPercent(DEPTH_OF_DISCHARGE[chemistry])}`}
              </option>
            ))}
          </select>
        </Field>
        {battery.chemistry === 'custom' ? (
          <NumberField
            label={t('battery.dod')}
            value={battery.customDepthOfDischarge ?? Number.NaN}
            hint={t('battery.dodHint', { min: formatNumber(customDod.min, 1), max: formatNumber(customDod.max, 1) })}
            issues={at('battery.customDepthOfDischarge')}
            onChange={(customDepthOfDischarge) => setBattery({ customDepthOfDischarge })}
          />
        ) : (
          <div className="field">
            <span className="field__label">{t('battery.dod')}</span>
            <p className="static-value">
              <strong className="num">{formatPercent(DEPTH_OF_DISCHARGE[battery.chemistry])}</strong>
            </p>
          </div>
        )}
        <NumberField
          label={t('battery.days')}
          unit={t('unit.days')}
          value={battery.daysOfAutonomy}
          issues={at('battery.daysOfAutonomy')}
          onChange={(daysOfAutonomy) => setBattery({ daysOfAutonomy })}
        />
        <NumberField
          label={t('battery.efficiency')}
          value={battery.efficiency}
          hint={Number.isFinite(battery.efficiency) ? `= ${formatPercent(battery.efficiency)}` : undefined}
          issues={at('battery.efficiency')}
          onChange={(efficiency) => setBattery({ efficiency })}
        />
      </div>
    </StepCard>
  );
}
