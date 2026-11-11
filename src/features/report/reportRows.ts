/** Rows of the printed report: only the equipment to install, no formulas. */
import type { SizingResults } from '../../engine/types';
import { deyeOptions } from '../../data/deyeBatteries';
import type { I18n } from '../../i18n/useI18n';
import { formatNumber, formatUp } from '../../ui/numbers';

export interface ReportRow {
  label: string;
  value: string;
}

/** Daily consumption, then panels, Deye batteries, inverter and voltage. */
export function summaryRows(results: SizingResults, { t }: I18n): ReportRow[] {
  const { load, systemVoltage, inverter, pvArray, battery } = results;
  const deye = deyeOptions(battery.nominalEnergyWh).find((option) => option.best)!;
  return [
    { label: t('report.daily'), value: `${formatUp(load.dailyEnergyKWh, 2)} kWh` },
    {
      label: t('summary.pv'),
      value: `${pvArray.panelCount} × ${formatNumber(pvArray.panelPowerW)} W (${formatNumber(pvArray.installedPowerW / 1000, 2)} kW)`,
    },
    {
      label: t('report.deye'),
      value: `${deye.count} × ${deye.battery.model} (${formatNumber(deye.installedWh / 1000, 2)} kWh)`,
    },
    { label: t('summary.inverter'), value: `${formatUp(inverter.ratingW)} W` },
    { label: t('summary.voltage'), value: `${systemVoltage.voltage} V` },
  ];
}
