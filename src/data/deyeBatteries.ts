/**
 * Deye low-voltage (48 V class, 51.2 V nominal) LiFePO4 battery modules, used to
 * express the battery result as "how many Deye batteries", from the engine's
 * bank energy C × V_syst = E_batt × N_j / (η × DoD).
 *
 * Values from the Deye battery brochure (global, English, 2026-07-10):
 * all 51.2 V, recommended DoD 90 %, up to 32 modules in parallel. Maximum
 * continuous discharge current: SE-G5.1 Pro 100 A, RW-F10.2 240 A,
 * SE-F12 1C (230 A), SE-F16 0.7C (220 A).
 */

export interface DeyeBattery {
  id: string;
  model: string;
  capacityAh: number;
  /** Nominal energy as Deye states it (Wh). */
  energyWh: number;
  /** Maximum continuous discharge current of one module (A). */
  maxDischargeA: number;
}

export const DEYE_NOMINAL_VOLTAGE = 51.2;
export const DEYE_MAX_PARALLEL = 32;
/** Low end of the bank voltage under load, used for the current check (conservative vs 51.2 V). */
export const DEYE_MIN_VOLTAGE = 48;

export const DEYE_BATTERIES: readonly DeyeBattery[] = [
  { id: 'se-g5.1-pro', model: 'SE-G5.1 Pro', capacityAh: 100, energyWh: 5120, maxDischargeA: 100 },
  { id: 'rw-f10.2', model: 'RW-F10.2', capacityAh: 200, energyWh: 10240, maxDischargeA: 240 },
  { id: 'se-f12', model: 'SE-F12', capacityAh: 230, energyWh: 11800, maxDischargeA: 230 },
  { id: 'se-f16', model: 'SE-F16', capacityAh: 314, energyWh: 16000, maxDischargeA: 220 },
];

export interface DeyeOption {
  battery: DeyeBattery;
  /** Modules needed: the larger of the energy count and the power count, at least 1. */
  count: number;
  /** True when the inverter's power, not the energy, sets the count. */
  powerLimited: boolean;
  installedWh: number;
  /** Lowest installed energy that covers the need (fewest modules on a tie). */
  best: boolean;
  /** More modules than Deye allows in parallel. */
  overLimit: boolean;
}

const ceil = (value: number) => Math.ceil(Number(value.toPrecision(12)));

/**
 * Module count for each Deye model.
 * - Energy: ⌈required / module⌉, where `requiredWh` is the engine's bank energy
 *   (C_Ah × V_syst, which already includes autonomy, η and DoD).
 * - Power: the bank must deliver the inverter's rating, so
 *   ⌈P_inv / (48 V × I_max)⌉ modules at least.
 */
export function deyeOptions(requiredWh: number, inverterW = 0): DeyeOption[] {
  const rows = DEYE_BATTERIES.map((battery) => {
    const byEnergy = Math.max(1, ceil(requiredWh / battery.energyWh));
    const byPower = ceil(inverterW / (DEYE_MIN_VOLTAGE * battery.maxDischargeA));
    const count = Math.max(byEnergy, byPower);
    return {
      battery,
      count,
      powerLimited: byPower > byEnergy,
      installedWh: count * battery.energyWh,
      best: false,
      overLimit: count > DEYE_MAX_PARALLEL,
    };
  });
  const candidates = rows.filter((row) => !row.overLimit);
  const pool = candidates.length > 0 ? candidates : rows;
  const best = pool.reduce((a, b) =>
    b.installedWh < a.installedWh || (b.installedWh === a.installedWh && b.count < a.count) ? b : a,
  );
  best.best = true;
  return rows;
}
