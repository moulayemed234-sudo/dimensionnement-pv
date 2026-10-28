/**
 * Project state: what the engineer has entered, plus the actions that change it.
 * Results are not stored here; they are derived from `input` (see sizing.ts).
 * The draft is kept in localStorage so a page reload loses nothing.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULTS } from '../engine/constants';
import type { Appliance, BatteryConfig, ProjectInfo, SizingInput, SystemParameters } from '../engine/types';
import type { Locale } from '../engine/messages';
import { useSettingsStore } from '../i18n/settings';
import { NOUAKCHOTT, findLocation } from '../data/locations';

/** Everything that describes a sizing project. */
export interface ProjectData {
  info: ProjectInfo;
  /** Selected PSH preset, or null when the engineer entered PSH by hand. */
  locationId: string | null;
  input: SizingInput;
}

interface ProjectActions {
  setInfo: (patch: Partial<ProjectInfo>) => void;
  /**
   * Adds a load row and returns its id: empty, or filled from a preset. A preset
   * fills the last row instead when that row is still blank.
   */
  addAppliance: (preset?: LoadTemplate) => string;
  updateAppliance: (id: string, patch: Partial<Omit<Appliance, 'id'>>) => void;
  removeAppliance: (id: string) => void;
  /** Picks a location preset (copying its PSH), or null to enter PSH by hand. */
  selectLocation: (locationId: string | null) => void;
  setSystem: (patch: Partial<SystemParameters>) => void;
  setBattery: (patch: Partial<BatteryConfig>) => void;
  newProject: (locale: Locale) => void;
  loadExample: (locale: Locale) => void;
  /** Puts back a project replaced a moment ago (undo). */
  restoreProject: (project: ProjectData) => void;
}

export type ProjectStore = ProjectData & ProjectActions;

/** A load to add, already named in the interface language. */
export interface LoadTemplate {
  name: string;
  powerW: number;
  hoursPerDay: number;
}

/** crypto.randomUUID only exists in secure contexts; a field laptop may serve over plain http. */
function createId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** A row nobody has filled in yet. Like an empty spreadsheet row, the calculation skips it. */
export function isBlankAppliance(appliance: Appliance): boolean {
  return (
    appliance.name.trim() === '' && !Number.isFinite(appliance.powerW) && !Number.isFinite(appliance.hoursPerDay)
  );
}

/** The current project, for undo. */
export function snapshotProject(): ProjectData {
  const { info, locationId, input } = useProjectStore.getState();
  return { info, locationId, input };
}

function emptyAppliance(): Appliance {
  return { id: createId(), name: '', quantity: 1, powerW: Number.NaN, hoursPerDay: Number.NaN, isSimultaneous: true };
}

function defaultSystem(): SystemParameters {
  return {
    peakSunHours: NOUAKCHOTT.peakSunHours,
    deratingFactor: DEFAULTS.deratingFactor,
    panelPowerW: DEFAULTS.panelPowerW,
    inverterSafetyFactor: DEFAULTS.inverterSafetyFactor,
    systemVoltageOverride: null,
  };
}

function defaultBattery(): BatteryConfig {
  return { chemistry: 'lifepo4', efficiency: DEFAULTS.batteryEfficiency, daysOfAutonomy: DEFAULTS.daysOfAutonomy };
}

const PROJECT_NAMES: Readonly<Record<Locale, { blank: string; example: string; site: string }>> = {
  fr: { blank: 'Nouveau projet', example: 'Exemple : maison familiale', site: 'Nouakchott' },
  ar: { blank: 'مشروع جديد', example: 'مثال: منزل عائلي', site: 'نواكشوط' },
};

/** The example loads, named in each language; the values are the same. */
const EXAMPLE_LOADS: readonly [Readonly<Record<Locale, string>>, number, number, number][] = [
  [{ fr: 'Lampes LED', ar: 'مصابيح LED' }, 8, 10, 6],
  [{ fr: 'Ventilateurs de plafond', ar: 'مراوح سقف' }, 3, 60, 8],
  [{ fr: 'Réfrigérateur', ar: 'ثلاجة' }, 1, 150, 10],
  [{ fr: 'Téléviseur', ar: 'تلفاز' }, 1, 80, 5],
  [{ fr: 'Ordinateur portable', ar: 'حاسوب محمول' }, 1, 65, 4],
  [{ fr: 'Chargeurs de téléphone', ar: 'شواحن هواتف' }, 4, 10, 3],
  [{ fr: 'Pompe à eau', ar: 'مضخة ماء' }, 1, 750, 2],
];

function blankProject(locale: Locale): ProjectData {
  return {
    info: { name: PROJECT_NAMES[locale].blank },
    locationId: NOUAKCHOTT.id,
    input: { appliances: [emptyAppliance()], system: defaultSystem(), battery: defaultBattery() },
  };
}

function exampleProject(locale: Locale): ProjectData {
  return {
    info: { name: PROJECT_NAMES[locale].example, site: PROJECT_NAMES[locale].site },
    locationId: NOUAKCHOTT.id,
    input: {
      appliances: EXAMPLE_LOADS.map(([names, quantity, powerW, hoursPerDay]) => ({
        id: createId(),
        name: names[locale],
        quantity,
        powerW,
        hoursPerDay,
        isSimultaneous: true,
      })),
      system: defaultSystem(),
      battery: defaultBattery(),
    },
  };
}

/** Rejects a stored draft whose shape the engine can't read (old version, hand-edited storage). */
export function isProjectData(value: unknown): value is ProjectData {
  if (typeof value !== 'object' || value === null) return false;
  const { info, input } = value as Partial<ProjectData>;
  return (
    typeof info === 'object' &&
    info !== null &&
    typeof input === 'object' &&
    input !== null &&
    Array.isArray(input.appliances) &&
    input.appliances.every((a: unknown) => typeof a === 'object' && a !== null) &&
    typeof input.system === 'object' &&
    input.system !== null &&
    typeof input.battery === 'object' &&
    input.battery !== null
  );
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      ...exampleProject(useSettingsStore.getState().locale),

      setInfo: (patch) => set((state) => ({ info: { ...state.info, ...patch } })),

      addAppliance: (preset) => {
        const { appliances } = get().input;
        const last = appliances.at(-1);
        if (preset && last && isBlankAppliance(last)) {
          get().updateAppliance(last.id, { ...preset, quantity: 1, isSimultaneous: true });
          return last.id;
        }
        const appliance = preset ? { ...emptyAppliance(), ...preset } : emptyAppliance();
        set((state) => ({ input: { ...state.input, appliances: [...state.input.appliances, appliance] } }));
        return appliance.id;
      },

      updateAppliance: (id, patch) =>
        set((state) => ({
          input: {
            ...state.input,
            appliances: state.input.appliances.map((a) => (a.id === id ? { ...a, ...patch } : a)),
          },
        })),

      removeAppliance: (id) =>
        set((state) => ({
          input: { ...state.input, appliances: state.input.appliances.filter((a) => a.id !== id) },
        })),

      selectLocation: (locationId) =>
        set((state) => {
          const location = findLocation(locationId);
          if (!location) return { locationId: null };
          return {
            locationId: location.id,
            input: { ...state.input, system: { ...state.input.system, peakSunHours: location.peakSunHours } },
          };
        }),

      setSystem: (patch) => set((state) => ({ input: { ...state.input, system: { ...state.input.system, ...patch } } })),

      setBattery: (patch) =>
        set((state) => ({ input: { ...state.input, battery: { ...state.input.battery, ...patch } } })),

      newProject: (locale) => set(blankProject(locale)),

      loadExample: (locale) => set(exampleProject(locale)),

      restoreProject: (project) => set(project),
    }),
    {
      name: 'offgrid-pv-sizing:draft',
      version: 1,
      partialize: ({ info, locationId, input }) => ({ info, locationId, input }),
      merge: (persisted, current) => (isProjectData(persisted) ? { ...current, ...persisted } : current),
    },
  ),
);
