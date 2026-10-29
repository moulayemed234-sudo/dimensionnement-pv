# Dimensionnement PV hors réseau

Application web de dimensionnement de systèmes photovoltaïques autonomes, pour les ingénieurs terrain :
bilan des charges, tension du système, onduleur, champ PV et parc de batteries.

**Application en ligne : https://moulayemed234-sudo.github.io/dimensionnement-pv/**

## Méthode de calcul

| Étape | Formule |
|---|---|
| Énergie journalière | E<sub>T</sub> = Σ (qté × P × h) |
| Puissance de pointe | P<sub>peak</sub> = Σ (qté × P) des charges simultanées |
| Tension du système | moins de 1 000 W → 12 V ; 1 000 à 2 000 W → 24 V ; plus de 2 000 W → 48 V (forçage possible) |
| Onduleur | P<sub>inv</sub> = Σ (qté × P) × 1,3, pour tous les appareils (simultanés ou non) |
| Champ PV | W<sub>PV</sub> = E<sub>T</sub> / (DF × PSH) ; N<sub>P</sub> = ⌈W<sub>PV</sub> / P<sub>panneau</sub>⌉ |
| Batteries | C<sub>Ah</sub> = E<sub>T</sub> × N<sub>j</sub> / (η × DoD × V<sub>syst</sub>) |

Heures de soleil crête (PSH) : Nouakchott 5,5 h, autres villes de Mauritanie 6 h.
Profondeur de décharge : lithium (LiFePO4) 90 %, plomb-acide 50 %, ou valeur personnalisée entre 0,3 et 0,9.

## Développement

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # vérification des types puis build dans dist/
```

Le moteur de calcul est dans `src/engine/`. Chaque push sur `main` est publié automatiquement sur GitHub Pages.
