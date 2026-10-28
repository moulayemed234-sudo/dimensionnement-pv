/** Rows shared by the on-screen report and the printed report. */
import type { ProjectData } from '../../state/projectStore';
import type { SizingResults } from '../../engine/types';
import { findLocation } from '../../data/locations';
import { DEPTH_OF_DISCHARGE } from '../../engine/constants';
import { placeName } from '../../i18n/places';
import type { I18n } from '../../i18n/useI18n';
import { CHEMISTRY_LABELS } from '../../ui/labels';
import { formatNumber, formatPercent, formatUp } from '../../ui/numbers';

export interface ReportRow {
  label: string;
  value: string;
  formula?: string;
}

/** The short report: one line per headline result. */
export function summaryRows(results: SizingResults, { t }: I18n): ReportRow[] {
  return [
    { label: t('report.dailyEnergy'), value: `${formatUp(results.load.dailyEnergyKWh, 2)} ${t('unit.kwhDay')}` },
    { label: t('report.pvPower'), value: `${formatNumber(results.pvArray.installedPowerW / 1000, 2)} kW` },
    { label: t('report.batteryCapacity'), value: `${formatUp(results.battery.nominalEnergyWh / 1000, 2)} kWh` },
    { label: t('report.inverterPower'), value: `${formatUp(results.inverter.ratingW / 1000, 2)} kW` },
    { label: t('report.systemVoltage'), value: `${results.systemVoltage.voltage} V` },
    { label: t('report.systemType'), value: 'Off-Grid' },
  ];
}

/** Every result with the formula that produced it. */
export function detailRows(results: SizingResults, { t }: I18n): ReportRow[] {
  const { load, systemVoltage, inverter, pvArray, battery } = results;
  const v = systemVoltage.voltage;
  return [
    {
      label: t('consumption.energy'),
      value: `${formatUp(load.dailyEnergyWh)} ${t('unit.whDay')} (${formatUp(load.dailyEnergyKWh, 2)} kWh)`,
      formula: 'E_T = Σ n · P · h',
    },
    { label: t('report.peak'), value: `${formatUp(load.peakPowerW)} W`, formula: 'P_peak = Σ n · P' },
    {
      label: t('report.systemVoltage'),
      value: `${v} V`,
      formula: '< 1 000 W → 12 V · ≤ 2 000 W → 24 V · > 2 000 W → 48 V',
    },
    {
      label: t('report.inverterPower'),
      value: `${formatUp(inverter.ratingW)} W`,
      formula: `P_inv = E_T × ${formatNumber(inverter.safetyFactor, 2)}`,
    },
    {
      label: t('report.pvPower'),
      value: `${formatUp(pvArray.requiredPowerW)} Wp`,
      formula: `W_PV = E_T / (${formatNumber(pvArray.deratingFactor, 3)} × ${formatNumber(pvArray.peakSunHours, 2)})`,
    },
    {
      label: t('report.panelCount'),
      value: `${pvArray.panelCount} × ${formatNumber(pvArray.panelPowerW)} W = ${formatNumber(pvArray.installedPowerW)} Wp`,
      formula: 'N_P = ⌈W_PV / P_panel⌉',
    },
    {
      label: t('report.batteryCapacity'),
      value: `${formatUp(battery.capacityAh)} Ah · ${v} V · ${formatUp(battery.nominalEnergyWh / 1000, 2)} kWh`,
      formula: `C = E_T × ${formatNumber(battery.daysOfAutonomy, 2)} / (${formatNumber(battery.efficiency, 3)} × ${formatNumber(battery.depthOfDischarge, 3)} × ${v})`,
    },
  ];
}

/** The design inputs, so a reader can reproduce the calculation. */
export function assumptionRows(project: ProjectData, i18n: I18n): ReportRow[] {
  const { t, locale } = i18n;
  const { system, battery } = project.input;
  const location = findLocation(project.locationId);
  const dod =
    battery.chemistry === 'custom'
      ? (battery.customDepthOfDischarge ?? Number.NaN)
      : DEPTH_OF_DISCHARGE[battery.chemistry];
  return [
    {
      label: t('report.assumption.psh'),
      value: `${formatNumber(system.peakSunHours, 2)} h${location ? ` — ${placeName(location, locale)}` : ''}`,
    },
    { label: t('report.assumption.df'), value: formatNumber(system.deratingFactor, 3) },
    { label: t('report.assumption.panel'), value: `${formatNumber(system.panelPowerW)} W` },
    { label: t('report.assumption.factor'), value: formatNumber(system.inverterSafetyFactor, 2) },
    {
      label: t('report.assumption.chemistry'),
      value: `${CHEMISTRY_LABELS[locale][battery.chemistry]} — ${Number.isFinite(dod) ? formatPercent(dod) : '—'}`,
    },
    {
      label: t('report.assumption.autonomy'),
      value: `${formatNumber(battery.daysOfAutonomy, 2)} / ${Number.isFinite(battery.efficiency) ? formatPercent(battery.efficiency) : '—'}`,
    },
  ];
}

export function engineeringNotes(project: ProjectData, { t }: I18n): string[] {
  return [
    t('report.note.psh', { psh: formatNumber(project.input.system.peakSunHours, 2) }),
    t('report.note.mppt'),
    t('report.note.temperature'),
    t('report.note.site'),
  ];
}
