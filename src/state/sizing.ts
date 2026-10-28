/** Derives validation and sizing results from the project input. */
import { useMemo } from 'react';
import { analyzeLoads, calculateSizing, recommendSystemVoltage } from '../engine/solarEngine';
import type { IssueField, SizingInput, SizingOutcome, SystemVoltage, ValidationIssue } from '../engine/types';
import { isBlankAppliance, useProjectStore } from './projectStore';

export { isBlankAppliance };

export interface LoadTotals {
  dailyEnergyWh: number;
  dailyEnergyKWh: number;
  peakPowerW: number;
  recommendedVoltage: SystemVoltage;
}

export interface Sizing {
  outcome: SizingOutcome;
  /** Load-table totals; null while any load row has an error. */
  totals: LoadTotals | null;
}

export function computeSizing(input: SizingInput): Sizing {
  const appliances = input.appliances.filter((appliance) => !isBlankAppliance(appliance));
  const outcome = calculateSizing({ ...input, appliances });

  // Totals only need valid rows, so they still show while e.g. PSH is being corrected.
  const rowsValid = !outcome.issues.some((issue) => issue.severity === 'error' && issue.field.startsWith('appliances.'));
  if (!rowsValid) return { outcome, totals: null };

  const { dailyEnergyWh, dailyEnergyKWh, peakPowerW } = analyzeLoads(appliances);
  return {
    outcome,
    totals: { dailyEnergyWh, dailyEnergyKWh, peakPowerW, recommendedVoltage: recommendSystemVoltage(peakPowerW) },
  };
}

/** Validation and sizing for the current project, recomputed only when the input changes. */
export function useSizing(): Sizing {
  const input = useProjectStore((state) => state.input);
  return useMemo(() => computeSizing(input), [input]);
}

/** Issues attached to one input; omit `applianceId` for system and battery fields. */
export function issuesFor(issues: readonly ValidationIssue[], field: IssueField, applianceId?: string): ValidationIssue[] {
  return issues.filter((issue) => issue.field === field && issue.applianceId === applianceId);
}
