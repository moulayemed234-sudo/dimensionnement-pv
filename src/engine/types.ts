/**
 * Domain data models for the off-grid PV sizing engine.
 *
 * Conventions
 * - Every quantity carries its unit in its name (powerW, dailyEnergyWh,
 *   capacityAh, hoursPerDay…), so a call site can never mix up W and kW.
 * - Ratios (efficiency, depth of discharge, derating) are decimals in (0, 1],
 *   never percentages: 90 % is written 0.9.
 * - Models are plain JSON-serialisable data (no classes, no Dates), so a sizing
 *   job can be saved, exported and re-imported losslessly.
 */

// ─── Inputs ──────────────────────────────────────────────────────────────────

/** One row of the equipment load table. */
export interface Appliance {
  /** Stable unique id (e.g. `crypto.randomUUID()`); keys UI rows and validation issues. */
  id: string;
  /** Free-text label, e.g. "LED lamp" or "Chest freezer". */
  name: string;
  /** Number of identical units, integer ≥ 1. */
  quantity: number;
  /** Rated power of ONE unit, in watts. */
  powerW: number;
  /** Average operating time of ONE unit per day, in hours (0–24). */
  hoursPerDay: number;
  /**
   * `true` when this load can run at the same time as the other simultaneous
   * loads. Only simultaneous loads are summed into the peak power P_peak.
   */
  isSimultaneous: boolean;
}

/** A location preset providing the design peak sun hours of a site. */
export interface LocationPSH {
  /** Stable key, e.g. "ma-ouarzazate". */
  id: string;
  city: string;
  country: string;
  /**
   * Peak sun hours PSH in h/day: numerically equal to the daily in-plane
   * irradiation in kWh/m²/day (hours at the 1 kW/m² STC reference).
   */
  peakSunHours: number;
  /**
   * Statistic behind `peakSunHours`, when known. Off-grid systems are normally
   * sized on the worst month so the battery is not drained in the low-sun season.
   */
  basis?: 'worst-month' | 'annual-average';
  /** Data provenance, e.g. "PVGIS-SARAH3, 30° tilt, December". */
  source?: string;
}

/** Nominal DC bus voltages supported by the sizing rules. */
export type SystemVoltage = 12 | 24 | 48;

/** Battery technologies with a fixed standard depth of discharge. */
export type PresetBatteryChemistry = 'lifepo4' | 'lead-acid' | 'gel' | 'agm' | 'flooded';

/** Battery technology; `'custom'` takes an engineer-supplied depth of discharge. */
export type BatteryChemistry = PresetBatteryChemistry | 'custom';

/** Battery bank design parameters. */
export interface BatteryConfig {
  chemistry: BatteryChemistry;
  /** DoD applied when `chemistry` is `'custom'` (0.3–0.9). Ignored otherwise. */
  customDepthOfDischarge?: number;
  /** Battery system efficiency η (decimal); default 0.9. */
  efficiency: number;
  /** Days of autonomy N_j; default 1. Fractions are allowed (0.5 = night only). */
  daysOfAutonomy: number;
}

/** Site and equipment parameters for the PV array, inverter and DC bus. */
export interface SystemParameters {
  /** Design peak sun hours PSH (h/day), normally taken from a {@link LocationPSH}. */
  peakSunHours: number;
  /** Lumped PV system derating factor (decimal); default 0.9, down to 0.7 for high-loss systems. */
  deratingFactor: number;
  /** STC rating of one PV module, in watts (e.g. 630). */
  panelPowerW: number;
  /** Inverter margin over ΣPᵢ; default 1.3 (+30 %). */
  inverterSafetyFactor: number;
  /** Forces V_syst; `null` applies the automatic peak-power rule. */
  systemVoltageOverride: SystemVoltage | null;
}

/** Everything the engine needs for one sizing run. */
export interface SizingInput {
  appliances: readonly Appliance[];
  system: SystemParameters;
  battery: BatteryConfig;
}

// ─── Results ─────────────────────────────────────────────────────────────────

/** Energy breakdown of one load-table row. */
export interface ApplianceLoad {
  applianceId: string;
  name: string;
  /** quantity × powerW (W). */
  totalPowerW: number;
  /** quantity × powerW × hoursPerDay (Wh/day). */
  dailyEnergyWh: number;
  /** This row's fraction of E_T (0–1). */
  energyShare: number;
  isSimultaneous: boolean;
}

/** A. Equipment inventory and peak load. */
export interface LoadAnalysis {
  appliances: ApplianceLoad[];
  /** E_T: total daily energy demand (Wh/day). */
  dailyEnergyWh: number;
  /** E_T2 = E_T / 1000 (kWh/day). */
  dailyEnergyKWh: number;
  /** P_peak: sum of the simultaneous loads (W). */
  peakPowerW: number;
  /** ΣPᵢ: sum of the power column, quantities not counted (W). Sizes the inverter. */
  powerSumW: number;
}

/** B. DC bus voltage decision. */
export interface SystemVoltageSelection {
  /** V_syst used for every downstream calculation. */
  voltage: SystemVoltage;
  /** What the automatic rule gives for P_peak, kept so an override can be reviewed. */
  recommendedVoltage: SystemVoltage;
  source: 'auto' | 'override';
}

/** C. Inverter. */
export interface InverterSizing {
  safetyFactor: number;
  /** P_inv = ΣPᵢ × safetyFactor (W). */
  ratingW: number;
}

/** D. PV array. */
export interface PvArraySizing {
  peakSunHours: number;
  deratingFactor: number;
  /** W_PV = E_T / (DF × PSH): minimum array power (Wp). */
  requiredPowerW: number;
  panelPowerW: number;
  /** N_P = ⌈W_PV / panelPowerW⌉. */
  panelCount: number;
  /** N_P × panelPowerW (Wp); always ≥ requiredPowerW. */
  installedPowerW: number;
}

/** E. Battery bank. */
export interface BatterySizing {
  chemistry: BatteryChemistry;
  /** DoD applied (decimal): the chemistry's standard value or the custom one. */
  depthOfDischarge: number;
  efficiency: number;
  daysOfAutonomy: number;
  /** C_Ah = E_T × N_j / (η × DoD × V_syst), in Ah at V_syst. */
  capacityAh: number;
  /** C_Ah × V_syst: nominal energy of the bank (Wh). */
  nominalEnergyWh: number;
}

/** Complete output of a successful sizing run. */
export interface SizingResults {
  load: LoadAnalysis;
  systemVoltage: SystemVoltageSelection;
  inverter: InverterSizing;
  pvArray: PvArraySizing;
  battery: BatterySizing;
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** `error` blocks the calculation; `warning` flags a non-standard but computable input. */
export type IssueSeverity = 'error' | 'warning';

/** Stable machine-readable issue codes (for tests, filtering and translation). */
export type IssueCode =
  | 'INVALID_NUMBER' // NaN, ±Infinity or not a number at all
  | 'NOT_INTEGER'
  | 'OUT_OF_RANGE' // outside a hard physical/mathematical bound
  | 'NON_STANDARD_VALUE' // valid, but outside the usual engineering band
  | 'INVALID_OPTION' // not one of the allowed choices
  | 'REQUIRED'
  | 'MISSING_ID'
  | 'DUPLICATE_ID'
  | 'MISSING_NAME'
  | 'ZERO_USAGE' // a load running 0 h/day
  | 'NO_APPLIANCES'
  | 'NO_ENERGY_DEMAND' // E_T = 0
  | 'NO_SIMULTANEOUS_LOAD' // P_peak = 0
  | 'EXCLUDED_LOAD_EXCEEDS_PEAK' // a non-simultaneous load larger than P_peak
  | 'VOLTAGE_BELOW_RECOMMENDED'; // override lower than the automatic rule

/** The input an issue points at, so the UI can show it next to that control. */
export type IssueField =
  | 'appliances'
  | `appliances.${keyof Appliance}`
  | `system.${keyof SystemParameters}`
  | `battery.${keyof BatteryConfig}`;

export interface ValidationIssue {
  severity: IssueSeverity;
  code: IssueCode;
  field: IssueField;
  /** Set when the issue belongs to one load-table row. */
  applianceId?: string;
  /** Human-readable explanation, ready to display. */
  message: string;
}

/**
 * Result of `calculateSizing`: results plus any warnings, or no results and at
 * least one error. `results` exists on both branches so UI code can read
 * `outcome.results?.…` without narrowing first.
 */
export type SizingOutcome =
  | { ok: true; results: SizingResults; issues: ValidationIssue[] }
  | { ok: false; results: null; issues: ValidationIssue[] };

// ─── Persistence ─────────────────────────────────────────────────────────────

/** Project identification printed on reports. */
export interface ProjectInfo {
  name: string;
  site?: string;
  engineer?: string;
  notes?: string;
}

/**
 * Self-contained, versioned snapshot of a sizing job: the JSON export format
 * and the source of the PDF report. On import, `results` is recomputed from
 * `input`, never trusted.
 */
export interface SizingReport {
  schemaVersion: 1;
  /** Version of the engine that produced `results` (see ENGINE_VERSION). */
  engineVersion: string;
  /** ISO-8601 timestamp. */
  generatedAt: string;
  project: ProjectInfo;
  location: LocationPSH | null;
  input: SizingInput;
  results: SizingResults;
  warnings: ValidationIssue[];
}
