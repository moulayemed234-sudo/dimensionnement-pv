/**
 * solarEngine: the pure calculation core for off-grid PV system sizing.
 *
 *   Appliances ─► A. Load analysis   Eᵢ = n·P·h,  E_T = ΣEᵢ,  P_peak = Σ n·P (simultaneous loads)
 *              ─► B. System voltage  12 V (< 1 kW) · 24 V (1–2 kW) · 48 V (> 2 kW), overridable
 *              ─► C. Inverter        P_inv = ΣPᵢ × 1.3 (power column summed, quantities not counted)
 *              ─► D. PV array        W_PV = E_T / (DF × PSH),  N_P = ⌈W_PV / P_module⌉
 *              ─► E. Battery bank    C_Ah = E_T × N_j / (η × DoD × V_syst)
 *
 * Contract
 * - Pure: no I/O, clock, randomness or argument mutation. Same input, same output.
 * - TypeScript (plus schema validation at the JSON-import boundary) guarantees the
 *   shape of the input; this module never trusts its values. `calculateSizing`
 *   validates first and returns problems as data. The individual formulas throw
 *   SolarEngineError on out-of-domain arguments, so a direct call can never
 *   silently produce NaN, Infinity or a negative size.
 * - Results are not rounded for display (only float noise is stripped). The UI and
 *   reports round for presentation, and equipment sizes must always round UP.
 * - Issue messages are in French, the app's language; issue codes stay stable for
 *   tests, filtering and any later translation.
 */
import {
  DEFAULTS,
  DEPTH_OF_DISCHARGE,
  NUMERIC_RULES,
  SYSTEM_VOLTAGES,
  VOLTAGE_THRESHOLDS_W,
  type NumericRule,
} from './constants';
import { CATALOGS, type Locale, type MessageCatalog, type RuleKey } from './messages';
import type {
  Appliance,
  BatteryChemistry,
  BatteryConfig,
  BatterySizing,
  InverterSizing,
  IssueCode,
  IssueField,
  IssueSeverity,
  LoadAnalysis,
  PresetBatteryChemistry,
  PvArraySizing,
  SizingInput,
  SizingOutcome,
  SystemParameters,
  SystemVoltage,
  SystemVoltageSelection,
  ValidationIssue,
} from './types';

// ─── Errors & numeric helpers ────────────────────────────────────────────────

/**
 * Thrown by a formula function given an argument outside its domain (negative
 * energy, zero divisor, ratio above 1…). `calculateSizing` validates first, so
 * it never throws this for a well-typed input.
 */
export class SolarEngineError extends RangeError {
  /** Name of the offending argument. */
  readonly parameter: string;

  constructor(parameter: string, message: string) {
    super(message);
    this.name = 'SolarEngineError';
    this.parameter = parameter;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertFinite(parameter: string, value: number): void {
  if (!isFiniteNumber(value)) {
    throw new SolarEngineError(parameter, `${parameter} must be a finite number (received ${String(value)}).`);
  }
}

function assertAtLeast(parameter: string, value: number, min: number): void {
  assertFinite(parameter, value);
  if (value < min) throw new SolarEngineError(parameter, `${parameter} must be >= ${min} (received ${value}).`);
}

function assertPositive(parameter: string, value: number): void {
  assertFinite(parameter, value);
  if (value <= 0) throw new SolarEngineError(parameter, `${parameter} must be > 0 (received ${value}).`);
}

function assertWithin(parameter: string, value: number, min: number, max: number): void {
  assertFinite(parameter, value);
  if (value < min || value > max) {
    throw new SolarEngineError(parameter, `${parameter} must be between ${min} and ${max} (received ${value}).`);
  }
}

/** Efficiency, DoD and derating are decimal ratios in (0, 1]. */
function assertRatio(parameter: string, value: number): void {
  assertPositive(parameter, value);
  if (value > 1) {
    throw new SolarEngineError(
      parameter,
      `${parameter} must be a decimal ratio <= 1, e.g. 0.9 for 90 % (received ${value}).`,
    );
  }
}

/**
 * Rounds to 12 significant digits to strip IEEE-754 noise (0.1 + 0.2 gives 0.3,
 * 1260.0000000000002 gives 1260). Field data never carries more than ~6
 * significant digits, so this cannot change an engineering result, but it keeps
 * the 12/24/48 V thresholds and the panel-count ceiling exact.
 */
function normalize(value: number): number {
  return Number(value.toPrecision(12));
}

// ─── A. Equipment inventory & peak load ──────────────────────────────────────

/**
 * Combined rated power of one load-table row: n × P (W).
 * @example calculateApplianceTotalPowerW({ quantity: 4, powerW: 15 }) // 60
 */
export function calculateApplianceTotalPowerW({ quantity, powerW }: Pick<Appliance, 'quantity' | 'powerW'>): number {
  assertAtLeast('quantity', quantity, 0);
  assertAtLeast('powerW', powerW, 0);
  return normalize(quantity * powerW);
}

/**
 * Daily energy of one load-table row: E = n × P × h (Wh/day).
 * @example calculateApplianceDailyEnergyWh({ quantity: 4, powerW: 15, hoursPerDay: 6 }) // 360
 */
export function calculateApplianceDailyEnergyWh(
  appliance: Pick<Appliance, 'quantity' | 'powerW' | 'hoursPerDay'>,
): number {
  assertWithin('hoursPerDay', appliance.hoursPerDay, 0, 24);
  return normalize(calculateApplianceTotalPowerW(appliance) * appliance.hoursPerDay);
}

/** Total daily energy demand: E_T = Σ Eᵢ (Wh/day). */
export function calculateDailyEnergyWh(
  appliances: readonly Pick<Appliance, 'quantity' | 'powerW' | 'hoursPerDay'>[],
): number {
  return normalize(appliances.reduce((sum, appliance) => sum + calculateApplianceDailyEnergyWh(appliance), 0));
}

/** Peak power: P_peak = Σ nᵢ × Pᵢ over the loads flagged `isSimultaneous` (W). */
export function calculatePeakPowerW(
  appliances: readonly Pick<Appliance, 'quantity' | 'powerW' | 'isSimultaneous'>[],
): number {
  return normalize(
    appliances.reduce(
      (sum, appliance) => (appliance.isSimultaneous ? sum + calculateApplianceTotalPowerW(appliance) : sum),
      0,
    ),
  );
}

/** Sum of the power column: ΣPᵢ over every load, quantities not counted (W). */
export function calculatePowerSumW(appliances: readonly Pick<Appliance, 'powerW'>[]): number {
  return normalize(
    appliances.reduce((sum, appliance) => {
      assertAtLeast('powerW', appliance.powerW, 0);
      return sum + appliance.powerW;
    }, 0),
  );
}

/** E_T2 = E_T / 1000: converts Wh to kWh. */
export function whToKWh(energyWh: number): number {
  assertFinite('energyWh', energyWh);
  return normalize(energyWh / 1000);
}

/**
 * Step A for the whole table: per-row breakdown, E_T, E_T2, P_peak and ΣPᵢ.
 * @throws SolarEngineError if a row holds an out-of-domain value.
 */
export function analyzeLoads(appliances: readonly Appliance[]): LoadAnalysis {
  const dailyEnergyWh = calculateDailyEnergyWh(appliances);
  return {
    appliances: appliances.map((appliance) => {
      const rowEnergyWh = calculateApplianceDailyEnergyWh(appliance);
      return {
        applianceId: appliance.id,
        name: appliance.name,
        totalPowerW: calculateApplianceTotalPowerW(appliance),
        dailyEnergyWh: rowEnergyWh,
        energyShare: dailyEnergyWh > 0 ? normalize(rowEnergyWh / dailyEnergyWh) : 0,
        isSimultaneous: appliance.isSimultaneous,
      };
    }),
    dailyEnergyWh,
    dailyEnergyKWh: whToKWh(dailyEnergyWh),
    peakPowerW: calculatePeakPowerW(appliances),
    powerSumW: calculatePowerSumW(appliances),
  };
}

// ─── B. System voltage ───────────────────────────────────────────────────────

export function isSystemVoltage(value: unknown): value is SystemVoltage {
  return SYSTEM_VOLTAGES.some((voltage) => voltage === value);
}

/**
 * Automatic DC bus voltage for a peak load:
 * P_peak < 1000 W → 12 V; 1000 W ≤ P_peak ≤ 2000 W → 24 V; P_peak > 2000 W → 48 V.
 * @example recommendSystemVoltage(1000) // 24
 */
export function recommendSystemVoltage(peakPowerW: number): SystemVoltage {
  assertAtLeast('peakPowerW', peakPowerW, 0);
  if (peakPowerW < VOLTAGE_THRESHOLDS_W.min24V) return 12;
  if (peakPowerW <= VOLTAGE_THRESHOLDS_W.max24V) return 24;
  return 48;
}

/**
 * Step B: V_syst from the automatic rule, unless the engineer forced a voltage.
 * The recommendation is returned either way so an override stays reviewable.
 */
export function selectSystemVoltage(
  peakPowerW: number,
  override: SystemVoltage | null = null,
): SystemVoltageSelection {
  const recommendedVoltage = recommendSystemVoltage(peakPowerW);
  if (override === null) return { voltage: recommendedVoltage, recommendedVoltage, source: 'auto' };
  if (!isSystemVoltage(override)) {
    throw new SolarEngineError(
      'override',
      `System voltage override must be ${SYSTEM_VOLTAGES.join(', ')} V (received ${String(override)}).`,
    );
  }
  return { voltage: override, recommendedVoltage, source: 'override' };
}

// ─── C. Inverter ─────────────────────────────────────────────────────────────

/**
 * Inverter nominal rating: P_inv = ΣPᵢ × safety factor (W), where ΣPᵢ is the sum
 * of the power column (quantities not counted). The default 1.3 adds a 30 % margin.
 * @throws SolarEngineError if safetyFactor < 1.
 * @example calculateInverterRatingW(1125) // 1462.5
 */
export function calculateInverterRatingW(
  powerSumW: number,
  safetyFactor: number = DEFAULTS.inverterSafetyFactor,
): number {
  assertAtLeast('powerSumW', powerSumW, 0);
  assertAtLeast('safetyFactor', safetyFactor, 1);
  return normalize(powerSumW * safetyFactor);
}

/** Step C. */
export function sizeInverter(
  powerSumW: number,
  safetyFactor: number = DEFAULTS.inverterSafetyFactor,
): InverterSizing {
  return { safetyFactor, ratingW: calculateInverterRatingW(powerSumW, safetyFactor) };
}

// ─── D. PV array ─────────────────────────────────────────────────────────────

/**
 * Required PV array power: W_PV = E_T / (DF × PSH) (Wp).
 * @example calculateRequiredPvPowerW({ dailyEnergyWh: 5670, peakSunHours: 5 }) // 1260
 */
export function calculateRequiredPvPowerW({
  dailyEnergyWh,
  peakSunHours,
  deratingFactor = DEFAULTS.deratingFactor,
}: {
  dailyEnergyWh: number;
  peakSunHours: number;
  deratingFactor?: number;
}): number {
  assertAtLeast('dailyEnergyWh', dailyEnergyWh, 0);
  assertPositive('peakSunHours', peakSunHours);
  assertRatio('deratingFactor', deratingFactor);
  return normalize(dailyEnergyWh / (deratingFactor * peakSunHours));
}

/**
 * Module count: N_P = ⌈W_PV / P_module⌉, always rounded up so the installed
 * array is never smaller than required.
 * @example calculatePanelCount(1260, 630) // 2 (exact fit, not 3)
 * @example calculatePanelCount(1261, 630) // 3
 */
export function calculatePanelCount(requiredPowerW: number, panelPowerW: number): number {
  assertAtLeast('requiredPowerW', requiredPowerW, 0);
  assertPositive('panelPowerW', panelPowerW);
  return Math.ceil(normalize(requiredPowerW / panelPowerW));
}

/** Step D: required array power, module count and installed power. */
export function sizePvArray({
  dailyEnergyWh,
  peakSunHours,
  deratingFactor,
  panelPowerW,
}: { dailyEnergyWh: number } & Pick<SystemParameters, 'peakSunHours' | 'deratingFactor' | 'panelPowerW'>): PvArraySizing {
  const requiredPowerW = calculateRequiredPvPowerW({ dailyEnergyWh, peakSunHours, deratingFactor });
  const panelCount = calculatePanelCount(requiredPowerW, panelPowerW);
  return {
    peakSunHours,
    deratingFactor,
    requiredPowerW,
    panelPowerW,
    panelCount,
    installedPowerW: normalize(panelCount * panelPowerW),
  };
}

// ─── E. Battery bank ─────────────────────────────────────────────────────────

function isPresetChemistry(value: unknown): value is PresetBatteryChemistry {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DEPTH_OF_DISCHARGE, value);
}

export function isBatteryChemistry(value: unknown): value is BatteryChemistry {
  return value === 'custom' || isPresetChemistry(value);
}

/**
 * Depth of discharge for a battery configuration: the chemistry's standard
 * value (LiFePO4 0.9, lead-acid family 0.5) or the custom value (0.3–0.9).
 */
export function resolveDepthOfDischarge({
  chemistry,
  customDepthOfDischarge,
}: Pick<BatteryConfig, 'chemistry' | 'customDepthOfDischarge'>): number {
  if (chemistry === 'custom') {
    if (customDepthOfDischarge === undefined) {
      throw new SolarEngineError('customDepthOfDischarge', 'A custom battery chemistry needs customDepthOfDischarge.');
    }
    const { min, max } = NUMERIC_RULES.customDepthOfDischarge;
    assertWithin('customDepthOfDischarge', customDepthOfDischarge, min, max);
    return customDepthOfDischarge;
  }
  if (!isPresetChemistry(chemistry)) {
    throw new SolarEngineError('chemistry', `Unknown battery chemistry "${String(chemistry)}".`);
  }
  return DEPTH_OF_DISCHARGE[chemistry];
}

/**
 * Battery capacity: C_Ah = (E_T × N_j) / (η × DoD × V_syst), in Ah at V_syst.
 * @example
 * calculateBatteryCapacityAh({ dailyEnergyWh: 2400, daysOfAutonomy: 2, depthOfDischarge: 0.5, systemVoltage: 24 })
 * // 444.444… (η defaults to 0.9)
 */
export function calculateBatteryCapacityAh({
  dailyEnergyWh,
  daysOfAutonomy = DEFAULTS.daysOfAutonomy,
  efficiency = DEFAULTS.batteryEfficiency,
  depthOfDischarge,
  systemVoltage,
}: {
  dailyEnergyWh: number;
  daysOfAutonomy?: number;
  efficiency?: number;
  depthOfDischarge: number;
  systemVoltage: number;
}): number {
  assertAtLeast('dailyEnergyWh', dailyEnergyWh, 0);
  assertPositive('daysOfAutonomy', daysOfAutonomy);
  assertRatio('efficiency', efficiency);
  assertRatio('depthOfDischarge', depthOfDischarge);
  assertPositive('systemVoltage', systemVoltage);
  return normalize((dailyEnergyWh * daysOfAutonomy) / (efficiency * depthOfDischarge * systemVoltage));
}

/** Step E: resolves the DoD and sizes the bank at V_syst. */
export function sizeBatteryBank({
  dailyEnergyWh,
  systemVoltage,
  battery,
}: {
  dailyEnergyWh: number;
  systemVoltage: SystemVoltage;
  battery: BatteryConfig;
}): BatterySizing {
  const depthOfDischarge = resolveDepthOfDischarge(battery);
  const capacityAh = calculateBatteryCapacityAh({
    dailyEnergyWh,
    daysOfAutonomy: battery.daysOfAutonomy,
    efficiency: battery.efficiency,
    depthOfDischarge,
    systemVoltage,
  });
  return {
    chemistry: battery.chemistry,
    depthOfDischarge,
    efficiency: battery.efficiency,
    daysOfAutonomy: battery.daysOfAutonomy,
    capacityAh,
    nominalEnergyWh: normalize(capacityAh * systemVoltage),
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

interface IssueTarget {
  field: IssueField;
  applianceId?: string;
}

const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 });

/** Formats a value for messages: "1 500 W", "0,85", "5 jours". */
function formatValue(value: number, unit = ''): string {
  // fr-FR groups thousands with a narrow no-break space; a plain one prints in every font, PDFs included.
  const text = numberFormat.format(value).replace(/ /g, ' ');
  return unit ? `${text} ${unit}` : text;
}

/** Collects issues worded in one language. */
class IssueCollector {
  readonly issues: ValidationIssue[] = [];
  readonly text: MessageCatalog;

  constructor(locale: Locale) {
    this.text = CATALOGS[locale];
  }

  add(severity: IssueSeverity, code: IssueCode, target: IssueTarget, message: string): void {
    this.issues.push({ severity, code, ...target, message: this.text.finalize(message) });
  }
}

function applianceName(appliance: Appliance): string {
  return typeof appliance.name === 'string' ? appliance.name.trim() : '';
}

/**
 * How messages name a load-table row: « Réfrigérateur », or "Charge n° 3" when
 * unnamed. Exported so UI-side messages name rows exactly like the engine does.
 */
export function describeAppliance(appliance: Appliance, index: number, locale: Locale = 'fr'): string {
  const name = applianceName(appliance);
  const text = CATALOGS[locale];
  return name ? text.namedRow(name) : text.unnamedRow(index + 1);
}

/**
 * Checks one numeric input against its rule and records at most one issue.
 * Returns false when the value is unusable (an error was recorded).
 */
function checkNumber(
  out: IssueCollector,
  value: unknown,
  ruleKey: RuleKey,
  target: IssueTarget,
  label: string = out.text.rules[ruleKey].label,
): boolean {
  const rule: NumericRule = NUMERIC_RULES[ruleKey];
  const { unit, hint = '' } = out.text.rules[ruleKey];
  const t = out.text;
  const fail = (code: IssueCode, message: string): false => {
    out.add('error', code, target, message);
    return false;
  };
  const { min, max, typical } = rule;

  if (!isFiniteNumber(value)) return fail('INVALID_NUMBER', t.invalidNumber(label));
  if (rule.integer && !Number.isInteger(value)) return fail('NOT_INTEGER', t.notInteger(label));
  if (min !== undefined && rule.exclusiveMin && value <= min) {
    return fail('OUT_OF_RANGE', t.greaterThan(label, formatValue(min, unit)));
  }
  if (min !== undefined && value < min) {
    return fail('OUT_OF_RANGE', min === 0 ? t.notNegative(label) : t.atLeast(label, formatValue(min, unit)));
  }
  if (max !== undefined && value > max) {
    return fail('OUT_OF_RANGE', t.notExceed(label, formatValue(max, unit)));
  }

  if (typical && (value < typical.min || value > typical.max)) {
    out.add(
      'warning',
      'NON_STANDARD_VALUE',
      target,
      t.outsideTypical(label, formatValue(value, unit), formatValue(typical.min), formatValue(typical.max, unit), hint),
    );
  }
  return true;
}

function validateAppliances(out: IssueCollector, appliances: readonly Appliance[]): void {
  const t = out.text;
  if (appliances.length === 0) {
    out.add('error', 'NO_APPLIANCES', { field: 'appliances' }, t.noAppliances);
    return;
  }

  const seenIds = new Set<string>();
  appliances.forEach((appliance, index) => {
    const { id } = appliance;
    const row = rowName(t, appliance, index);
    const at = (field: keyof Appliance): IssueTarget => ({ field: `appliances.${field}`, applianceId: id });
    const checkRowNumber = (field: 'quantity' | 'powerW' | 'hoursPerDay'): boolean =>
      checkNumber(out, appliance[field], field, at(field), t.rowField(row, t.rules[field].label));

    if (typeof id !== 'string' || id.trim() === '') {
      out.add('error', 'MISSING_ID', { field: 'appliances.id' }, t.missingId(row));
    } else if (seenIds.has(id)) {
      out.add('error', 'DUPLICATE_ID', at('id'), t.duplicateId(row));
    } else {
      seenIds.add(id);
    }

    if (!applianceName(appliance)) out.add('warning', 'MISSING_NAME', at('name'), t.missingName(row));

    checkRowNumber('quantity');
    checkRowNumber('powerW');
    if (checkRowNumber('hoursPerDay') && appliance.hoursPerDay === 0) {
      out.add('warning', 'ZERO_USAGE', at('hoursPerDay'), t.zeroUsage(row));
    }

    if (typeof appliance.isSimultaneous !== 'boolean') {
      out.add('error', 'INVALID_OPTION', at('isSimultaneous'), t.simultaneousInvalid(row));
    }
  });
}

function validateSystemParameters(out: IssueCollector, system: SystemParameters): void {
  const numericFields = ['peakSunHours', 'deratingFactor', 'panelPowerW', 'inverterSafetyFactor'] as const;
  for (const field of numericFields) {
    checkNumber(out, system[field], field, { field: `system.${field}` });
  }

  const override = system.systemVoltageOverride ?? null;
  if (override !== null && !isSystemVoltage(override)) {
    out.add(
      'error',
      'INVALID_OPTION',
      { field: 'system.systemVoltageOverride' },
      out.text.voltageInvalid(SYSTEM_VOLTAGES.join(' / ')),
    );
  }
}

function validateBatteryConfig(out: IssueCollector, battery: BatteryConfig): void {
  if (!isBatteryChemistry(battery.chemistry)) {
    out.add('error', 'INVALID_OPTION', { field: 'battery.chemistry' }, out.text.chemistryInvalid);
  } else if (battery.chemistry === 'custom') {
    const rule = NUMERIC_RULES.customDepthOfDischarge;
    const target: IssueTarget = { field: 'battery.customDepthOfDischarge' };
    if (battery.customDepthOfDischarge === undefined) {
      out.add('error', 'REQUIRED', target, out.text.customDodRequired(formatValue(rule.min), formatValue(rule.max)));
    } else {
      checkNumber(out, battery.customDepthOfDischarge, 'customDepthOfDischarge', target);
    }
  }
  checkNumber(out, battery.efficiency, 'batteryEfficiency', { field: 'battery.efficiency' });
  checkNumber(out, battery.daysOfAutonomy, 'daysOfAutonomy', { field: 'battery.daysOfAutonomy' });
}

/** Whole-table checks; they assume every row is individually valid. */
function validateLoadProfile(out: IssueCollector, appliances: readonly Appliance[], system: SystemParameters): void {
  const t = out.text;
  const peakPowerW = calculatePeakPowerW(appliances);
  const dailyEnergyWh = calculateDailyEnergyWh(appliances);

  if (dailyEnergyWh === 0) out.add('error', 'NO_ENERGY_DEMAND', { field: 'appliances' }, t.noEnergy);
  if (peakPowerW === 0) {
    out.add('error', 'NO_SIMULTANEOUS_LOAD', { field: 'appliances' }, t.noSimultaneous);
    return;
  }

  // P_peak only sums simultaneous loads, but an excluded load still runs on its own.
  appliances.forEach((appliance, index) => {
    if (appliance.isSimultaneous) return;
    const totalPowerW = calculateApplianceTotalPowerW(appliance);
    if (totalPowerW > peakPowerW) {
      out.add(
        'warning',
        'EXCLUDED_LOAD_EXCEEDS_PEAK',
        { field: 'appliances.isSimultaneous', applianceId: appliance.id },
        t.excludedLoad(rowName(t, appliance, index), formatValue(totalPowerW, 'W'), formatValue(peakPowerW, 'W')),
      );
    }
  });

  const override = system.systemVoltageOverride ?? null;
  if (override !== null && isSystemVoltage(override)) {
    const recommended = recommendSystemVoltage(peakPowerW);
    if (override < recommended) {
      out.add(
        'warning',
        'VOLTAGE_BELOW_RECOMMENDED',
        { field: 'system.systemVoltageOverride' },
        t.voltageBelow(
          override,
          recommended,
          formatValue(peakPowerW, 'W'),
          formatValue(Math.round(peakPowerW / override), 'A'),
        ),
      );
    }
  }
}

function rowName(t: MessageCatalog, appliance: Appliance, index: number): string {
  const name = applianceName(appliance);
  return name ? t.namedRow(name) : t.unnamedRow(index + 1);
}

/** True when at least one issue blocks the calculation. */
export function hasErrors(issues: readonly ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}

/**
 * Validates a sizing input. Errors mark impossible or unusable values and block
 * the calculation; warnings mark non-standard values an engineer should confirm.
 * `locale` only changes the wording of the messages.
 */
export function validateSizingInput(input: SizingInput, locale: Locale = 'fr'): ValidationIssue[] {
  const out = new IssueCollector(locale);
  validateAppliances(out, input.appliances);
  const rowsHaveErrors = hasErrors(out.issues);
  validateSystemParameters(out, input.system);
  validateBatteryConfig(out, input.battery);
  if (!rowsHaveErrors) validateLoadProfile(out, input.appliances, input.system);
  return out.issues;
}

// ─── Orchestration ───────────────────────────────────────────────────────────

/**
 * Validates the input and, when nothing blocks, runs steps A–E. Never throws
 * for a well-typed input: every problem comes back in `issues`.
 */
export function calculateSizing(input: SizingInput, locale: Locale = 'fr'): SizingOutcome {
  const issues = validateSizingInput(input, locale);
  if (hasErrors(issues)) return { ok: false, results: null, issues };

  const { appliances, system, battery } = input;
  const load = analyzeLoads(appliances);
  const systemVoltage = selectSystemVoltage(load.peakPowerW, system.systemVoltageOverride ?? null);

  return {
    ok: true,
    results: {
      load,
      systemVoltage,
      inverter: sizeInverter(load.powerSumW, system.inverterSafetyFactor),
      pvArray: sizePvArray({
        dailyEnergyWh: load.dailyEnergyWh,
        peakSunHours: system.peakSunHours,
        deratingFactor: system.deratingFactor,
        panelPowerW: system.panelPowerW,
      }),
      battery: sizeBatteryBank({ dailyEnergyWh: load.dailyEnergyWh, systemVoltage: systemVoltage.voltage, battery }),
    },
    issues,
  };
}
