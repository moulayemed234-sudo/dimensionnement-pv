import type { ReactNode } from 'react';
import { Field } from '../../components/Field';
import { IssueList } from '../../components/IssueList';
import { NumberField } from '../../components/NumberField';
import { NOUAKCHOTT, OTHER_CITIES, OTHER_SITE, findLocation } from '../../data/locations';
import { DEPTH_OF_DISCHARGE, NUMERIC_RULES, SYSTEM_VOLTAGES, VOLTAGE_THRESHOLDS_W } from '../../engine/constants';
import { isBatteryChemistry, resolveDepthOfDischarge } from '../../engine/solarEngine';
import type { BatteryChemistry, IssueField, SystemVoltage, ValidationIssue } from '../../engine/types';
import { useProjectStore } from '../../state/projectStore';
import { issuesFor } from '../../state/sizing';
import { CHEMISTRY_LABELS } from '../../ui/labels';
import { formatNumber, formatPercent } from '../../ui/numbers';

const CUSTOM_PSH = 'custom';
const DERATING_PRESETS = [0.9, 0.8, 0.7];
const CHEMISTRIES = Object.keys(CHEMISTRY_LABELS) as BatteryChemistry[];

interface SystemParametersPanelProps {
  issues: readonly ValidationIssue[];
  /** What the automatic rule gives for the current loads, or null when unknown. */
  recommendedVoltage: SystemVoltage | null;
}

/** Site, PV, battery, inverter and DC bus parameters. */
export function SystemParametersPanel({ issues, recommendedVoltage }: SystemParametersPanelProps) {
  const system = useProjectStore((state) => state.input.system);
  const battery = useProjectStore((state) => state.input.battery);
  const locationId = useProjectStore((state) => state.locationId);
  const selectLocation = useProjectStore((state) => state.selectLocation);
  const setSystem = useProjectStore((state) => state.setSystem);
  const setBattery = useProjectStore((state) => state.setBattery);
  const at = (field: IssueField) => issuesFor(issues, field);
  const location = findLocation(locationId);
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
    <section className="card" aria-labelledby="params-title">
      <div className="card__header">
        <div>
          <h2 id="params-title" className="card__title">
            Paramètres du système
          </h2>
          <p className="card__subtitle">
            Les valeurs par défaut suivent les règles de conception. Les valeurs hors plage usuelle sont signalées.
          </p>
        </div>
      </div>

      <div className="param-grid">
        <fieldset className="param-group">
          <legend>Site et champ PV</legend>
          <Field label="Localité" htmlFor="param-location">
            <select
              id="param-location"
              className="input"
              value={locationId ?? CUSTOM_PSH}
              onChange={(event) => selectLocation(event.target.value === CUSTOM_PSH ? null : event.target.value)}
            >
              <option value={NOUAKCHOTT.id}>
                {NOUAKCHOTT.city} : {formatNumber(NOUAKCHOTT.peakSunHours, 1)} h
              </option>
              <optgroup label={`Autres villes : ${formatNumber(OTHER_SITE.peakSunHours, 1)} h`}>
                {[...OTHER_CITIES, OTHER_SITE].map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.city}
                  </option>
                ))}
              </optgroup>
              <option value={CUSTOM_PSH}>PSH personnalisé (saisie manuelle)</option>
            </select>
          </Field>
          <NumberField
            label="Heures de soleil crête (PSH)"
            unit="h/j"
            value={system.peakSunHours}
            readOnly={location !== null}
            hint={
              location
                ? `Valeur prédéfinie pour ${location.city}. Choisissez « PSH personnalisé » pour la modifier.`
                : 'Valeur saisie pour ce site.'
            }
            issues={at('system.peakSunHours')}
            onChange={(peakSunHours) => setSystem({ peakSunHours })}
          />
          <NumberField
            label="Coefficient de pertes (DF)"
            value={system.deratingFactor}
            hint={
              <PresetChips
                label="Valeurs types du coefficient de pertes"
                values={DERATING_PRESETS}
                current={system.deratingFactor}
                onPick={(deratingFactor) => setSystem({ deratingFactor })}
                caption="0,9 pertes faibles, 0,7 pertes élevées"
              />
            }
            issues={at('system.deratingFactor')}
            onChange={(deratingFactor) => setSystem({ deratingFactor })}
          />
          <NumberField
            label="Puissance du panneau"
            unit="W"
            value={system.panelPowerW}
            hint="Puissance crête (STC) d'un module."
            issues={at('system.panelPowerW')}
            onChange={(panelPowerW) => setSystem({ panelPowerW })}
          />
        </fieldset>

        <fieldset className="param-group">
          <legend>Parc de batteries</legend>
          <Field label="Technologie" htmlFor="param-chemistry">
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
                  {chemistry === 'custom'
                    ? CHEMISTRY_LABELS.custom
                    : `${CHEMISTRY_LABELS[chemistry]} : DoD ${formatPercent(DEPTH_OF_DISCHARGE[chemistry])}`}
                </option>
              ))}
            </select>
          </Field>
          {battery.chemistry === 'custom' ? (
            <NumberField
              label="Profondeur de décharge (DoD)"
              value={battery.customDepthOfDischarge ?? Number.NaN}
              hint={`Entre ${formatNumber(customDod.min, 1)} et ${formatNumber(customDod.max, 1)} ; 0,8 = 80 %.`}
              issues={at('battery.customDepthOfDischarge')}
              onChange={(customDepthOfDischarge) => setBattery({ customDepthOfDischarge })}
            />
          ) : (
            <p className="static-value">
              <span>Profondeur de décharge</span>
              <strong>{formatPercent(DEPTH_OF_DISCHARGE[battery.chemistry])}</strong>
            </p>
          )}
          <NumberField
            label="Jours d'autonomie (Nj)"
            unit="jours"
            value={battery.daysOfAutonomy}
            issues={at('battery.daysOfAutonomy')}
            onChange={(daysOfAutonomy) => setBattery({ daysOfAutonomy })}
          />
          <NumberField
            label="Rendement batterie (η)"
            value={battery.efficiency}
            hint={Number.isFinite(battery.efficiency) ? `= ${formatPercent(battery.efficiency)}` : undefined}
            issues={at('battery.efficiency')}
            onChange={(efficiency) => setBattery({ efficiency })}
          />
        </fieldset>

        <fieldset className="param-group param-group--wide">
          <legend>Onduleur et tension du système</legend>
          <div className="param-group__columns">
            <NumberField
              label="Coefficient de sécurité onduleur"
              value={system.inverterSafetyFactor}
              hint="1,3 ajoute la marge standard de 30 % pour les pointes et la sécurité."
              issues={at('system.inverterSafetyFactor')}
              onChange={(inverterSafetyFactor) => setSystem({ inverterSafetyFactor })}
            />
            <div className="field">
              <span className="field__label">Tension du système</span>
              <VoltagePicker
                value={system.systemVoltageOverride}
                recommended={recommendedVoltage}
                onChange={(systemVoltageOverride) => setSystem({ systemVoltageOverride })}
              />
              <p className="field__hint">
                Règle auto&nbsp;: moins de {formatNumber(VOLTAGE_THRESHOLDS_W.min24V)} W → 12 V, jusqu'à{' '}
                {formatNumber(VOLTAGE_THRESHOLDS_W.max24V)} W → 24 V, au-delà → 48 V.
              </p>
              <IssueList messages={at('system.systemVoltageOverride')} />
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  );
}

interface PresetChipsProps {
  label: string;
  values: readonly number[];
  current: number;
  onPick: (value: number) => void;
  caption: ReactNode;
}

function PresetChips({ label, values, current, onPick, caption }: PresetChipsProps) {
  return (
    <span className="chips">
      <span className="chips__group" role="group" aria-label={label}>
        {values.map((value) => (
          <button key={value} type="button" className="chip" aria-pressed={current === value} onClick={() => onPick(value)}>
            {formatNumber(value, 2)}
          </button>
        ))}
      </span>
      <span>{caption}</span>
    </span>
  );
}

interface VoltagePickerProps {
  value: SystemVoltage | null;
  recommended: SystemVoltage | null;
  onChange: (value: SystemVoltage | null) => void;
}

function VoltagePicker({ value, recommended, onChange }: VoltagePickerProps) {
  return (
    <div className="segmented" role="group" aria-label="Tension du système">
      <button type="button" className="segmented__option" aria-pressed={value === null} onClick={() => onChange(null)}>
        Auto{recommended === null ? '' : ` (${recommended} V)`}
      </button>
      {SYSTEM_VOLTAGES.map((voltage) => (
        <button
          key={voltage}
          type="button"
          className="segmented__option"
          aria-pressed={value === voltage}
          onClick={() => onChange(voltage)}
        >
          {voltage} V
        </button>
      ))}
    </div>
  );
}
