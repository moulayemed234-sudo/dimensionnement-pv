/**
 * Deye low-voltage (48 V class, 51.2 V nominal) LiFePO4 battery modules, used to
 * express the battery result as "how many Deye batteries". This is a display
 * layer only: the sizing formula C = E_T × N_j / (η × DoD × V_syst) is unchanged.
 *
 * Values from the Deye battery brochure (global, English, 2026-07-10):
 * all 51.2 V, recommended DoD 90 %, up to 32 modules in parallel.
 */

export interface DeyeBattery {
  id: string;
  model: string;
  capacityAh: number;
  /** Nominal energy as Deye states it (Wh). */
  energyWh: number;
}

export const DEYE_NOMINAL_VOLTAGE = 51.2;
export const DEYE_MAX_PARALLEL = 32;

export const DEYE_BATTERIES: readonly DeyeBattery[] = [
  { id: 'se-g5.1-pro', model: 'SE-G5.1 Pro', capacityAh: 100, energyWh: 5120 },
  { id: 'rw-f10.2', model: 'RW-F10.2', capacityAh: 200, energyWh: 10240 },
  { id: 'se-f12', model: 'SE-F12', capacityAh: 230, energyWh: 11800 },
  { id: 'se-f16', model: 'SE-F16', capacityAh: 314, energyWh: 16000 },
];

export interface DeyeOption {
  battery: DeyeBattery;
  /** Modules needed: ⌈required / module⌉, at least 1. */
  count: number;
  installedWh: number;
  /** Lowest installed energy that covers the need (fewest modules on a tie). */
  best: boolean;
  /** More modules than Deye allows in parallel. */
  overLimit: boolean;
}

/**
 * Module count for each Deye model, given the bank's nominal energy from the
 * engine (C_Ah × V_syst, which already includes autonomy, η and DoD).
 */
export function deyeOptions(requiredWh: number): DeyeOption[] {
  const rows = DEYE_BATTERIES.map((battery) => {
    const count = Math.max(1, Math.ceil(Number((requiredWh / battery.energyWh).toPrecision(12))));
    return { battery, count, installedWh: count * battery.energyWh, best: false, overLimit: count > DEYE_MAX_PARALLEL };
  });
  const candidates = rows.filter((row) => !row.overLimit);
  const pool = candidates.length > 0 ? candidates : rows;
  const best = pool.reduce((a, b) =>
    b.installedWh < a.installedWh || (b.installedWh === a.installedWh && b.count < a.count) ? b : a,
  );
  best.best = true;
  return rows;
}
