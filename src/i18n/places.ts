/** Display names of the location presets in each language (ids from data/locations.ts). */
import type { Locale } from '../engine/messages';
import type { LocationPSH } from '../engine/types';

const ARABIC_NAMES: Readonly<Record<string, string>> = {
  'mr-nouakchott': 'نواكشوط',
  'mr-aioun': 'العيون',
  'mr-akjoujt': 'أكجوجت',
  'mr-aleg': 'ألاك',
  'mr-atar': 'أطار',
  'mr-kaedi': 'كيهيدي',
  'mr-kiffa': 'كيفة',
  'mr-nema': 'النعمة',
  'mr-nouadhibou': 'نواذيبو',
  'mr-rosso': 'روصو',
  'mr-selibaby': 'سيلبابي',
  'mr-tidjikja': 'تجكجة',
  'mr-zouerat': 'الزويرات',
  'mr-other': 'موقع آخر في موريتانيا',
};

export function placeName(location: LocationPSH, locale: Locale): string {
  return locale === 'ar' ? (ARABIC_NAMES[location.id] ?? location.city) : location.city;
}
