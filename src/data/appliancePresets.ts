/** Common loads for the quick-add buttons: typical ratings the engineer then adjusts. */
export interface AppliancePreset {
  name: string;
  powerW: number;
  hoursPerDay: number;
}

export const APPLIANCE_PRESETS: readonly AppliancePreset[] = [
  { name: 'Lampe LED', powerW: 10, hoursPerDay: 6 },
  { name: 'Ventilateur', powerW: 60, hoursPerDay: 8 },
  { name: 'Réfrigérateur', powerW: 150, hoursPerDay: 10 },
  { name: 'Congélateur', powerW: 200, hoursPerDay: 10 },
  { name: 'Téléviseur', powerW: 80, hoursPerDay: 5 },
  { name: 'Ordinateur portable', powerW: 65, hoursPerDay: 4 },
  { name: 'Chargeur de téléphone', powerW: 10, hoursPerDay: 3 },
  { name: 'Pompe à eau', powerW: 750, hoursPerDay: 2 },
  { name: 'Climatiseur', powerW: 1200, hoursPerDay: 6 },
];
