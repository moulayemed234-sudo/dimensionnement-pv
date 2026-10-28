import type { Locale } from '../engine/messages';
import type { BatteryChemistry } from '../engine/types';

/** Display names for battery technologies, in menu order. */
export const CHEMISTRY_LABELS: Readonly<Record<Locale, Readonly<Record<BatteryChemistry, string>>>> = {
  fr: {
    lifepo4: 'Lithium (LiFePO4)',
    'lead-acid': 'Plomb-acide',
    gel: 'Plomb-acide gel',
    agm: 'Plomb-acide AGM',
    flooded: 'Plomb-acide ouvert',
    custom: 'DoD personnalisée',
  },
  ar: {
    lifepo4: 'ليثيوم (LiFePO4)',
    'lead-acid': 'رصاص حمضي',
    gel: 'رصاص جل',
    agm: 'رصاص AGM',
    flooded: 'رصاص مفتوح (سائل)',
    custom: 'عمق تفريغ مخصص',
  },
};
