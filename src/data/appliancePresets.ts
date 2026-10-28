/** Common loads for the quick-add buttons: typical ratings the engineer then adjusts. */
import type { Locale } from '../engine/messages';

export type ApplianceIcon = 'bulb' | 'fan' | 'fridge' | 'snowflake' | 'tv' | 'laptop' | 'phone' | 'pump' | 'ac' | 'washer' | 'plug';

export interface AppliancePreset {
  names: Readonly<Record<Locale, string>>;
  icon: ApplianceIcon;
  powerW: number;
  hoursPerDay: number;
}

export const APPLIANCE_PRESETS: readonly AppliancePreset[] = [
  { names: { fr: 'Lampe LED', ar: 'مصباح LED' }, icon: 'bulb', powerW: 10, hoursPerDay: 6 },
  { names: { fr: 'Ventilateur', ar: 'مروحة' }, icon: 'fan', powerW: 60, hoursPerDay: 8 },
  { names: { fr: 'Réfrigérateur', ar: 'ثلاجة' }, icon: 'fridge', powerW: 150, hoursPerDay: 10 },
  { names: { fr: 'Congélateur', ar: 'مجمد' }, icon: 'snowflake', powerW: 200, hoursPerDay: 10 },
  { names: { fr: 'Téléviseur', ar: 'تلفاز' }, icon: 'tv', powerW: 80, hoursPerDay: 5 },
  { names: { fr: 'Ordinateur portable', ar: 'حاسوب محمول' }, icon: 'laptop', powerW: 65, hoursPerDay: 4 },
  { names: { fr: 'Chargeur de téléphone', ar: 'شاحن هاتف' }, icon: 'phone', powerW: 10, hoursPerDay: 3 },
  { names: { fr: 'Pompe à eau', ar: 'مضخة ماء' }, icon: 'pump', powerW: 750, hoursPerDay: 2 },
  { names: { fr: 'Climatiseur', ar: 'مكيف هواء' }, icon: 'ac', powerW: 1200, hoursPerDay: 6 },
  { names: { fr: 'Machine à laver', ar: 'غسالة' }, icon: 'washer', powerW: 500, hoursPerDay: 1 },
];

const KEYWORDS: readonly [RegExp, ApplianceIcon][] = [
  [/lamp|led|lumi|éclair|eclair|مصباح|مصابيح|إنارة|انارة|ضوء/i, 'bulb'],
  [/r[ée]frig|frigo|ثلاج/i, 'fridge'],
  [/cong[ée]l|مجمد|فريزر/i, 'snowflake'],
  [/climat|clim|مكيف|تكييف/i, 'ac'],
  [/ventil|مروح|مراوح/i, 'fan'],
  [/t[ée]l[ée]|tv|تلفاز|تلفزيون|شاشة/i, 'tv'],
  [/ordinat|laptop|pc|حاسوب|كمبيوتر/i, 'laptop'],
  [/charg|t[ée]l[ée]phone|شاحن|هاتف/i, 'phone'],
  [/pompe|مضخ/i, 'pump'],
  [/lav|غسال/i, 'washer'],
];

/** Icon for a load, guessed from its name in either language. */
export function iconForAppliance(name: string): ApplianceIcon {
  return KEYWORDS.find(([pattern]) => pattern.test(name))?.[1] ?? 'plug';
}
