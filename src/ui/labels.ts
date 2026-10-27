import type { BatteryChemistry } from '../engine/types';

/** Display names for battery technologies, in menu order. */
export const CHEMISTRY_LABELS: Readonly<Record<BatteryChemistry, string>> = {
  lifepo4: 'Lithium (LiFePO4)',
  'lead-acid': 'Plomb-acide',
  gel: 'Plomb-acide gel',
  agm: 'Plomb-acide AGM',
  flooded: 'Plomb-acide ouvert',
  custom: 'DoD personnalisée',
};
