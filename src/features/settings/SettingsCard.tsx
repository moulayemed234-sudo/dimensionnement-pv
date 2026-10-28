import { useState } from 'react';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { IssueList } from '../../components/IssueList';
import { NumberField } from '../../components/NumberField';
import { NOUAKCHOTT, OTHER_CITIES, OTHER_SITE, findLocation } from '../../data/locations';
import { DEPTH_OF_DISCHARGE, NUMERIC_RULES, SYSTEM_VOLTAGES, VOLTAGE_THRESHOLDS_W } from '../../engine/constants';
import { isBatteryChemistry, resolveDepthOfDischarge } from '../../engine/solarEngine';
import type { BatteryChemistry, IssueField, SystemVoltage, ValidationIssue } from '../../engine/types';
import { placeName } from '../../i18n/places';
import { useI18n } from '../../i18n/useI18n';
import { useProjectStore } from '../../state/projectStore';
import { issuesFor } from '../../state/sizing';
import { CHEMISTRY_LABELS } from '../../ui/labels';
import { formatNumber, formatPercent } from '../../ui/numbers';

const CUSTOM_PSH = 'custom';
const DERATING_PRESETS = [0.9, 0.8, 0.7];
const CHEMISTRIES = Object.keys(CHEMISTRY_LABELS.fr) as BatteryChemistry[];
const ADVANCED_FIELDS: readonly IssueField[] = ['system.deratingFactor', 'battery.efficiency', 'system.inverterSafetyFactor'];

interface SettingsCardProps {
  issues: readonly ValidationIssue[];
  /** What the automatic rule gives for the current loads, or null when unknown. */
  recommendedVoltage: SystemVoltage | null;
}

/** Site, panel, battery and voltage; the rarely changed factors sit under "Advanced". */
export function SettingsCard({ issues, recommendedVoltage }: SettingsCardProps) {
  const { t, locale } = useI18n();
  const system = useProjectStore((state) => state.input.system);
  const battery = useProjectStore((state) => state.input.battery);
  const locationId = useProjectStore((state) => state.locationId);
  const selectLocation = useProjectStore((state) => state.selectLocation);
  const setSystem = useProjectStore((state) => state.setSystem);
  const setBattery = useProjectStore((state) => state.setBattery);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const at = (field: IssueField) => issuesFor(issues, field);
  const location = findLocation(locationId);
  const labels = CHEMISTRY_LABELS[locale];
  const customDod = NUMERIC_RULES.customDepthOfDischarge;
  const voltage = system.systemVoltageOverride;
  // A problem in a hidden field opens the advanced section so it can be seen.
  const advancedHasIssue = ADVANCED_FIELDS.some((field) => at(field).length > 0);

  const changeChemistry = (chemistry: BatteryChemistry) => {
    // Switching to custom starts from the DoD of the technology being left.
    if (chemistry === 'custom' && battery.chemistry !== 'custom' && battery.customDepthOfDischarge === undefined) {
      setBattery({ chemistry, customDepthOfDischarge: resolveDepthOfDischarge(battery) });
    } else {
      setBattery({ chemistry });
    }
  };

  return (
    <section className="card" aria-labelledby="settings-title">
      <h2 id="settings-title" className="card__title">
        <span className="card__title-icon" aria-hidden="true">
          <Icon name="panel" size={22} />
        </span>
        {t('settings.title')}
      </h2>

      <div className="form-grid">
        <Field
          label={t('pv.location')}
          htmlFor="param-location"
          hint={location ? t('settings.pshHint', { h: formatNumber(location.peakSunHours, 1) }) : undefined}
        >
          <select
            id="param-location"
            className="input"
            value={locationId ?? CUSTOM_PSH}
            onChange={(event) => selectLocation(event.target.value === CUSTOM_PSH ? null : event.target.value)}
          >
            <option value={NOUAKCHOTT.id}>
              {placeName(NOUAKCHOTT, locale)} : {formatNumber(NOUAKCHOTT.peakSunHours, 1)} h
            </option>
            <optgroup label={t('pv.otherCities', { h: formatNumber(OTHER_SITE.peakSunHours, 1) })}>
              {[...OTHER_CITIES, OTHER_SITE].map((city) => (
                <option key={city.id} value={city.id}>
                  {placeName(city, locale)}
                </option>
              ))}
            </optgroup>
            <option value={CUSTOM_PSH}>{t('pv.custom')}</option>
          </select>
        </Field>
        {location === null ? (
          <NumberField
            label={t('pv.psh')}
            unit={t('unit.hDay')}
            value={system.peakSunHours}
            issues={at('system.peakSunHours')}
            onChange={(peakSunHours) => setSystem({ peakSunHours })}
          />
        ) : null}
        <NumberField
          label={t('pv.panel')}
          unit="W"
          value={system.panelPowerW}
          issues={at('system.panelPowerW')}
          onChange={(panelPowerW) => setSystem({ panelPowerW })}
        />
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
        ) : null}
        <NumberField
          label={t('battery.days')}
          unit={t('unit.days')}
          value={battery.daysOfAutonomy}
          issues={at('battery.daysOfAutonomy')}
          onChange={(daysOfAutonomy) => setBattery({ daysOfAutonomy })}
        />
        <div className="field">
          <span className="field__label" id="voltage-label">
            {t('inverter.voltage')}
          </span>
          <div className="segmented" role="group" aria-labelledby="voltage-label">
            <button
              type="button"
              className="segmented__option"
              aria-pressed={voltage === null}
              onClick={() => setSystem({ systemVoltageOverride: null })}
            >
              {t('inverter.auto')}
              {recommendedVoltage === null ? '' : ` (${recommendedVoltage} V)`}
            </button>
            {SYSTEM_VOLTAGES.map((option) => (
              <button
                key={option}
                type="button"
                className="segmented__option"
                aria-pressed={voltage === option}
                onClick={() => setSystem({ systemVoltageOverride: option })}
              >
                <span className="num">{option} V</span>
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

      <details
        className="advanced"
        open={advancedOpen || advancedHasIssue}
        onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
      >
        <summary className="advanced__summary">
          {t('settings.advanced')}
          <Icon name="chevronDown" size={18} />
        </summary>
        <div className="form-grid">
          <NumberField
            label={t('pv.df')}
            value={system.deratingFactor}
            hint={
              <span className="chips">
                <span className="chips__group" role="group" aria-label={t('pv.dfPresets')}>
                  {DERATING_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="chip"
                      aria-pressed={system.deratingFactor === value}
                      onClick={() => setSystem({ deratingFactor: value })}
                    >
                      {formatNumber(value, 2)}
                    </button>
                  ))}
                </span>
                <span>{t('pv.dfCaption')}</span>
              </span>
            }
            issues={at('system.deratingFactor')}
            onChange={(deratingFactor) => setSystem({ deratingFactor })}
          />
          <NumberField
            label={t('battery.efficiency')}
            value={battery.efficiency}
            hint={Number.isFinite(battery.efficiency) ? `= ${formatPercent(battery.efficiency)}` : undefined}
            issues={at('battery.efficiency')}
            onChange={(efficiency) => setBattery({ efficiency })}
          />
          <NumberField
            label={t('inverter.factor')}
            value={system.inverterSafetyFactor}
            hint={t('inverter.factorHint')}
            issues={at('system.inverterSafetyFactor')}
            onChange={(inverterSafetyFactor) => setSystem({ inverterSafetyFactor })}
          />
        </div>
      </details>
    </section>
  );
}
