import { IssueList } from '../../components/IssueList';
import { NumberField } from '../../components/NumberField';
import { SYSTEM_VOLTAGES, VOLTAGE_THRESHOLDS_W } from '../../engine/constants';
import type { IssueField, SystemVoltage, ValidationIssue } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { useProjectStore } from '../../state/projectStore';
import { issuesFor } from '../../state/sizing';
import { formatNumber } from '../../ui/numbers';
import { StepCard } from '../layout/StepCard';

interface InverterStepProps {
  issues: readonly ValidationIssue[];
  /** What the automatic rule gives for the current loads, or null when unknown. */
  recommendedVoltage: SystemVoltage | null;
}

/** Step 5: inverter safety factor and DC bus voltage. */
export function InverterStep({ issues, recommendedVoltage }: InverterStepProps) {
  const { t } = useI18n();
  const system = useProjectStore((state) => state.input.system);
  const setSystem = useProjectStore((state) => state.setSystem);
  const at = (field: IssueField) => issuesFor(issues, field);
  const value = system.systemVoltageOverride;

  return (
    <StepCard step={5} subtitle={t('inverter.subtitle')}>
      <div className="form-grid">
        <NumberField
          label={t('inverter.factor')}
          value={system.inverterSafetyFactor}
          hint={t('inverter.factorHint')}
          issues={at('system.inverterSafetyFactor')}
          onChange={(inverterSafetyFactor) => setSystem({ inverterSafetyFactor })}
        />
        <div className="field">
          <span className="field__label" id="voltage-label">
            {t('inverter.voltage')}
          </span>
          <div className="segmented" role="group" aria-labelledby="voltage-label">
            <button
              type="button"
              className="segmented__option"
              aria-pressed={value === null}
              onClick={() => setSystem({ systemVoltageOverride: null })}
            >
              {t('inverter.auto')}
              {recommendedVoltage === null ? '' : ` (${recommendedVoltage} V)`}
            </button>
            {SYSTEM_VOLTAGES.map((voltage) => (
              <button
                key={voltage}
                type="button"
                className="segmented__option"
                aria-pressed={value === voltage}
                onClick={() => setSystem({ systemVoltageOverride: voltage })}
              >
                <span className="num">{voltage} V</span>
              </button>
            ))}
          </div>
          <p className="field__hint">
            {t('inverter.rule', {
              a: formatNumber(VOLTAGE_THRESHOLDS_W.min24V),
              b: formatNumber(VOLTAGE_THRESHOLDS_W.max24V),
            })}
          </p>
          <IssueList messages={at('system.systemVoltageOverride')} />
        </div>
      </div>
    </StepCard>
  );
}
