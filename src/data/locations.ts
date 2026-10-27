/**
 * Peak-sun-hour presets for Mauritanian sites, using the field design values:
 * Nouakchott 5.5 h, every other city 6 h.
 */
import type { LocationPSH } from '../engine/types';

const NOUAKCHOTT_PSH = 5.5;
const OTHER_CITIES_PSH = 6;
const SOURCE = 'Valeur de conception terrain pour la Mauritanie (Nouakchott 5,5 h, autres sites 6 h)';

function site(id: string, city: string, peakSunHours: number): LocationPSH {
  return { id: `mr-${id}`, city, country: 'Mauritanie', peakSunHours, source: SOURCE };
}

export const NOUAKCHOTT = site('nouakchott', 'Nouakchott', NOUAKCHOTT_PSH);

/** Regional capitals, alphabetical. */
export const OTHER_CITIES: readonly LocationPSH[] = [
  site('aioun', 'Aïoun el Atrouss', OTHER_CITIES_PSH),
  site('akjoujt', 'Akjoujt', OTHER_CITIES_PSH),
  site('aleg', 'Aleg', OTHER_CITIES_PSH),
  site('atar', 'Atar', OTHER_CITIES_PSH),
  site('kaedi', 'Kaédi', OTHER_CITIES_PSH),
  site('kiffa', 'Kiffa', OTHER_CITIES_PSH),
  site('nema', 'Néma', OTHER_CITIES_PSH),
  site('nouadhibou', 'Nouadhibou', OTHER_CITIES_PSH),
  site('rosso', 'Rosso', OTHER_CITIES_PSH),
  site('selibaby', 'Sélibaby', OTHER_CITIES_PSH),
  site('tidjikja', 'Tidjikja', OTHER_CITIES_PSH),
  site('zouerat', 'Zouérat', OTHER_CITIES_PSH),
];

/** Any town or village outside Nouakchott that is not listed above. */
export const OTHER_SITE = site('other', 'Autre site en Mauritanie', OTHER_CITIES_PSH);

export const LOCATIONS: readonly LocationPSH[] = [NOUAKCHOTT, ...OTHER_CITIES, OTHER_SITE];

export function findLocation(id: string | null): LocationPSH | null {
  return LOCATIONS.find((location) => location.id === id) ?? null;
}
