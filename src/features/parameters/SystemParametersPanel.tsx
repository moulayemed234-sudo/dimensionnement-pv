import { useEffect, useState, type ReactNode } from 'react';
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

/** Fields that live in "Paramètres avancés": rarely changed once the design rules are set. */
const ADVANCED_FIELDS: readonly IssueField[] = [
  'system.deratingFactor',
  'battery.efficiency',
  'system.inverterSafetyFactor',
  'system.systemVoltageOverride',
];

interface SystemParametersPanelProps {
  issues: readonly ValidationIssue[];
  /** What the automatic rule gives for the current loads, or null when unknown. */
  recommendedVoltage: SystemVoltage | null;
}

/** Step 2: site and battery choices up front, design constants behind "Paramètres avancés". */
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

  const advancedIssues = issues.filter((issue) => ADVANCED_FIELDS.includes(issue.field));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Open by itself when something inside needs attention.
  const advancedNeedsAttention = advancedIssues.length > 0;
  useEffect(() => {
    if (advancedNeedsAttention) setAdvancedOpen(true);
  }, [advancedNeedsAttention]);

  const changeChemistry = (chemistry: BatteryChemistry) => {
    // Switching to custom starts from the DoD of the technology being left.
    if (chemistry === 'custom' && battery.chemistry !== 'custom' && battery.customDepthOfDischarge === undefined) {
      setBattery({ chemistry, customDepthOfDischarge: resolveDepthOfDischarge(battery) });
    } else {
      setBattery({ chemistry });
    }
  };

  const voltageSummary = system.systemVoltageOverride === null ? 'tension auto' : `tension forcée ${system.systemVoltageOverride} V`;
  const advancedSummary = [
    `DF ${formatNumber(system.deratingFactor, 3)}`,
    `η ${Number.isFinite(battery.efficiency) ? formatPercent(battery.efficiency) : '—'}`,
    `onduleur × ${formatNumber(system.inverterSafetyFactor, 2)}`,
    voltageSummary,
  ].join(' · ');

  return (
    <section className="card" aria-labelledby="params-title">
      <div className="card__header">
        <div>
          <h2 id="params-title" className="card__title">
            <span className="step" aria-hidden="true">
              2
            </span>
            Site et batteries
          </h2>
          <p className="card__subtitle">Choisissez la ville et la batterie&nbsp;; le reste suit les règles de conception.</p>
        </div>
      </div>

      <div className="param-grid">
        <fieldset className="param-group">
          <legend>Site et panneaux</legend>
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
            label="Puissance du panneau"
            unit="W"
            value={system.panelPowerW}
            hint="Puissance crête (STC) d'un module."
            issues={at('system.panelPowerW')}
            onChange={(panelPowerW) => setSystem({ panelPowerW })}
          />
        </fieldset>

        <fieldset className="param-group">
          <legend>Batteries</legend>
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
        </fieldset>
      </div>

      <div className="advanced t-acc" data-open={String(advancedOpen)}>
        <button
          type="button"
          className="t-acc-head advanced__head"
          aria-expanded={advancedOpen}
          aria-controls="advanced-panel"
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          <span className="advanced__titles">
            <span className="advanced__title">Paramètres avancés</span>
            <span className="advanced__summary">{advancedSummary}</span>
          </span>
          {advancedIssues.length > 0 ? (
            <span
              className={`badge ${advancedIssues.some((issue) => issue.severity === 'error') ? 'badge--error' : 'badge--warning'}`}
            >
              {advancedIssues.length}&nbsp;!
            </span>
          ) : null}
          <span className="t-acc-chevron" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d="M4 6.5L8 10.5L12 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <div className="t-acc-panel" id="advanced-panel" inert={!advancedOpen}>
          <div className="t-acc-panel-inner">
            <div className="advanced__body">
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
                label="Rendement batterie (η)"
                value={battery.efficiency}
                hint={Number.isFinite(battery.efficiency) ? `= ${formatPercent(battery.efficiency)}` : undefined}
                issues={at('battery.efficiency')}
                onChange={(efficiency) => setBattery({ efficiency })}
              />
              <NumberField
                label="Coefficient de sécurité onduleur"
                value={system.inverterSafetyFactor}
                hint="Méthode de l'entreprise : P_inv = E_T × 1,3."
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
          </div>
        </div>
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
