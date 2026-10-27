/**
 * Engineering rules and limits applied by the sizing engine.
 *
 * Every threshold the engine uses lives in this file, so a PV engineer can
 * review or tune the rule set without touching calculation code.
 */
import type { PresetBatteryChemistry, SystemVoltage } from './types';

/** Bump on any change that can alter a calculated result; stamped on every report. */
export const ENGINE_VERSION = '1.0.0';

/**
 * Design defaults. Peak sun hours has none on purpose: it must come from the
 * site. `panelPowerW` is only the UI's initial value.
 */
export const DEFAULTS = {
  deratingFactor: 0.9,
  inverterSafetyFactor: 1.3,
  panelPowerW: 630,
  batteryEfficiency: 0.9,
  daysOfAutonomy: 1,
} as const;

/** Nominal DC bus voltages, ascending. */
export const SYSTEM_VOLTAGES: readonly SystemVoltage[] = [12, 24, 48];

/**
 * Automatic V_syst rule on the peak power P_peak:
 * P_peak < 1000 W → 12 V; 1000 W ≤ P_peak ≤ 2000 W → 24 V; P_peak > 2000 W → 48 V.
 */
export const VOLTAGE_THRESHOLDS_W = {
  /** Lowest P_peak that needs 24 V. */
  min24V: 1000,
  /** Highest P_peak still served at 24 V. */
  max24V: 2000,
} as const;

/** Standard depth of discharge per preset battery chemistry (decimal). */
export const DEPTH_OF_DISCHARGE: Readonly<Record<PresetBatteryChemistry, number>> = {
  lifepo4: 0.9,
  'lead-acid': 0.5,
  gel: 0.5,
  agm: 0.5,
  flooded: 0.5,
};

/** Validation rule for one numeric input. */
export interface NumericRule {
  /** Name used in messages, e.g. "Heures de soleil crête (PSH)". */
  label: string;
  /** Unit appended to values in messages ('' for ratios and counts). */
  unit: string;
  /** Hard lower bound, inclusive unless `exclusiveMin`. A violation is an error. */
  min?: number;
  exclusiveMin?: boolean;
  /** Hard upper bound, inclusive. A violation is an error. */
  max?: number;
  integer?: boolean;
  /** Usual engineering band, inclusive. A value outside it raises a warning. */
  typical?: { min: number; max: number; hint: string };
}

/**
 * Hard bounds are physical or mathematical limits (they block the calculation).
 * Typical bands are engineering norms (they only warn).
 */
export const NUMERIC_RULES = {
  quantity: { label: 'Quantité', unit: '', min: 1, integer: true },
  powerW: { label: 'Puissance', unit: 'W', min: 0, exclusiveMin: true },
  hoursPerDay: { label: 'Heures par jour', unit: 'h', min: 0, max: 24 },
  peakSunHours: {
    label: 'Heures de soleil crête (PSH)',
    unit: 'h',
    min: 0,
    exclusiveMin: true,
    // Fixed-tilt arrays never receive 12 kWh/m²/day, so a larger value is a data-entry error.
    max: 12,
    typical: { min: 2, max: 7, hint: "Vérifiez les données d'irradiation du site et du mois de dimensionnement." },
  },
  deratingFactor: {
    label: 'Coefficient de pertes (DF)',
    unit: '',
    min: 0,
    exclusiveMin: true,
    max: 1,
    typical: {
      min: 0.7,
      max: 0.9,
      hint: "En dessous de 0,7, les pertes sont inhabituellement élevées ; au-dessus de 0,9, l'hypothèse est optimiste pour le terrain.",
    },
  },
  panelPowerW: {
    label: 'Puissance du panneau',
    unit: 'W',
    min: 0,
    exclusiveMin: true,
    typical: { min: 50, max: 800, hint: 'Vérifiez la puissance crête (STC) sur la fiche technique du module.' },
  },
  inverterSafetyFactor: {
    label: 'Coefficient de sécurité onduleur',
    unit: '',
    min: 1,
    typical: {
      min: 1.25,
      max: 2,
      hint: "La marge standard est de 1,3 ; en dessous de 1,25 la réserve pour les pointes est faible, au-dessus de 2 l'onduleur est surdimensionné.",
    },
  },
  batteryEfficiency: {
    label: 'Rendement batterie',
    unit: '',
    min: 0,
    exclusiveMin: true,
    max: 1,
    typical: { min: 0.8, max: 0.98, hint: 'Comptez environ 0,8 pour le plomb et 0,95 pour le lithium.' },
  },
  daysOfAutonomy: {
    label: "Jours d'autonomie",
    unit: 'jours',
    min: 0,
    exclusiveMin: true,
    typical: {
      min: 1,
      max: 5,
      hint: 'En dessous de 1 jour, le parc ne couvre pas une journée de consommation ; au-delà de 5 jours, sa taille et son coût augmentent vite.',
    },
  },
  customDepthOfDischarge: { label: 'Profondeur de décharge personnalisée', unit: '', min: 0.3, max: 0.9 },
} as const satisfies Record<string, NumericRule>;
