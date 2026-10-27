import type { ReactNode } from 'react';
import { IssueList } from '../../components/IssueList';
import { Stat } from '../../components/Stat';
import type { SizingOutcome, SizingResults } from '../../engine/types';
import { CHEMISTRY_LABELS } from '../../ui/labels';
import { formatNumber, formatPercent, formatUp } from '../../ui/numbers';
import { frenchSpacing } from '../../ui/typography';

/** Engineering executive summary: the four sizing results, or why they are on hold. */
export function ExecutiveSummary({ outcome }: { outcome: SizingOutcome }) {
  const errors = outcome.issues.filter((issue) => issue.severity === 'error');
  const warnings = outcome.issues.filter((issue) => issue.severity === 'warning');

  return (
    <section className="card summary" aria-labelledby="summary-title">
      <div className="card__header">
        <h2 id="summary-title" className="card__title">
          Synthèse du dimensionnement
        </h2>
        <StatusBadge errors={errors.length} warnings={warnings.length} />
      </div>

      {outcome.ok ? (
        <Results results={outcome.results} />
      ) : (
        <div className="summary__blocked">
          <p className="summary__blocked-title">Résultats en attente</p>
          <p>
            Corrigez {errors.length === 1 ? 'cette erreur' : `ces ${errors.length} erreurs`} pour dimensionner le
            système&nbsp;:
          </p>
          <IssueList messages={errors} />
        </div>
      )}

      {warnings.length > 0 ? (
        <div className="summary__warnings">
          <h3 className="summary__section-title">À vérifier</h3>
          <IssueList messages={warnings} />
        </div>
      ) : null}
    </section>
  );
}

const count = (n: number, singular: string, plural: string) => `${n} ${n > 1 ? plural : singular}`;

function StatusBadge({ errors, warnings }: { errors: number; warnings: number }) {
  const [tone, text] =
    errors > 0
      ? ['error', count(errors, 'erreur', 'erreurs')]
      : warnings > 0
        ? ['warning', count(warnings, 'avertissement', 'avertissements')]
        : ['ok', 'Aucune anomalie'];
  return (
    <span className={`badge badge--${tone}`} role="status">
      {text}
    </span>
  );
}

function Results({ results }: { results: SizingResults }) {
  const { load, systemVoltage, inverter, pvArray, battery } = results;
  const voltage = systemVoltage.voltage;
  const chemistry = battery.chemistry === 'custom' ? 'Batterie personnalisée' : CHEMISTRY_LABELS[battery.chemistry];
  const days = `${formatNumber(battery.daysOfAutonomy, 2)} jour${battery.daysOfAutonomy >= 2 ? 's' : ''}`;

  return (
    <>
      <dl className="stats">
        <Stat
          label={
            <>
              Énergie journalière E<sub>T</sub>
            </>
          }
          value={formatUp(load.dailyEnergyWh)}
          unit="Wh/j"
          note={`${formatUp(load.dailyEnergyKWh, 2)} kWh/j`}
        />
        <Stat
          label={
            <>
              Puissance de pointe P<sub>peak</sub>
            </>
          }
          value={formatUp(load.peakPowerW)}
          unit="W"
          note="Charges simultanées"
        />
      </dl>

      <div className="kpi-grid">
        <Kpi
          title="Puissance onduleur"
          value={formatUp(inverter.ratingW)}
          unit="W"
          formula={
            <>
              P<sub>inv</sub> = {formatNumber(load.peakPowerW, 1)} W × {formatNumber(inverter.safetyFactor, 2)}
            </>
          }
          notes={['Choisissez la taille standard immédiatement supérieure ; vérifiez sa tenue aux pointes des moteurs.']}
        />
        <Kpi
          title="Tension du système"
          value={String(voltage)}
          unit="V"
          formula={
            <>
              P<sub>peak</sub> {formatNumber(load.peakPowerW, 1)} W → {systemVoltage.recommendedVoltage} V (règle auto)
            </>
          }
          notes={[systemVoltage.source === 'auto' ? 'Sélection automatique.' : 'Forçage manuel.']}
        />
        <Kpi
          title="Champ PV"
          value={String(pvArray.panelCount)}
          unit={`× panneaux de ${formatNumber(pvArray.panelPowerW)} W`}
          formula={
            <>
              W<sub>PV</sub> = {formatNumber(load.dailyEnergyWh, 1)} Wh ÷ ({formatNumber(pvArray.deratingFactor, 3)} ×{' '}
              {formatNumber(pvArray.peakSunHours, 2)} h)
            </>
          }
          notes={[
            `Requis : ${formatUp(pvArray.requiredPowerW)} Wc`,
            `Installé : ${formatNumber(pvArray.installedPowerW)} Wc`,
          ]}
        />
        <Kpi
          title="Parc de batteries"
          value={formatUp(battery.capacityAh)}
          unit={`Ah sous ${voltage} V`}
          formula={
            <>
              C = {formatNumber(load.dailyEnergyWh, 1)} Wh × {formatNumber(battery.daysOfAutonomy, 2)} ÷ (
              {formatNumber(battery.efficiency, 3)} × {formatNumber(battery.depthOfDischarge, 3)} × {voltage} V)
            </>
          }
          notes={[
            `${chemistry}, DoD ${formatPercent(battery.depthOfDischarge)}`,
            `${days} d'autonomie, ${formatUp(battery.nominalEnergyWh / 1000, 2)} kWh nominal`,
          ]}
        />
      </div>
    </>
  );
}

interface KpiProps {
  title: string;
  value: string;
  unit: string;
  formula: ReactNode;
  notes: readonly string[];
}

function Kpi({ title, value, unit, formula, notes }: KpiProps) {
  return (
    <article className="kpi">
      <h3 className="kpi__title">{title}</h3>
      <p className="kpi__value">
        {value}
        <span className="kpi__unit">{unit}</span>
      </p>
      <p className="kpi__formula">{formula}</p>
      <ul className="kpi__notes">
        {notes.map((note) => (
          <li key={note}>{frenchSpacing(note)}</li>
        ))}
      </ul>
    </article>
  );
}
