import { useState } from 'react';
import { IssueList } from '../../components/IssueList';
import { Stat } from '../../components/Stat';
import { useNumberInput, type NumberInputState } from '../../components/useNumberInput';
import { NUMERIC_RULES } from '../../engine/constants';
import { calculateApplianceDailyEnergyWh, describeAppliance } from '../../engine/solarEngine';
import type { Appliance, ValidationIssue } from '../../engine/types';
import { useProjectStore } from '../../state/projectStore';
import { isBlankAppliance, type LoadTotals } from '../../state/sizing';
import { severityOf, type Message } from '../../ui/messages';
import { formatNumber, formatUp } from '../../ui/numbers';

type NumericColumn = 'quantity' | 'powerW' | 'hoursPerDay';

const NUMERIC_COLUMNS: readonly NumericColumn[] = ['quantity', 'powerW', 'hoursPerDay'];

const COLUMNS: Record<
  NumericColumn,
  { header: string; ariaLabel: string; placeholder: string; inputMode: 'numeric' | 'decimal' }
> = {
  quantity: { header: 'Qté', ariaLabel: 'quantité', placeholder: '1', inputMode: 'numeric' },
  powerW: { header: 'Puissance (W)', ariaLabel: 'puissance en watts', placeholder: 'W', inputMode: 'decimal' },
  hoursPerDay: { header: 'Heures/jour', ariaLabel: 'heures par jour', placeholder: 'h', inputMode: 'decimal' },
};

interface LoadTableProps {
  issues: readonly ValidationIssue[];
  totals: LoadTotals | null;
}

/** Step A input: the equipment inventory, with per-row energy and table totals. */
export function LoadTable({ issues, totals }: LoadTableProps) {
  const appliances = useProjectStore((state) => state.input.appliances);
  const addAppliance = useProjectStore((state) => state.addAppliance);
  const [focusId, setFocusId] = useState<string | null>(null);

  return (
    <section className="card" aria-labelledby="loads-title">
      <div className="card__header">
        <div>
          <h2 id="loads-title" className="card__title">
            Bilan des charges
          </h2>
          <p className="card__subtitle">
            Énergie = qté × puissance × heures. Cochez <strong>Simultané</strong> pour les charges qui peuvent
            fonctionner en même temps&nbsp;: leur somme donne la puissance de pointe.
          </p>
        </div>
        <button type="button" className="button button--primary" onClick={() => setFocusId(addAppliance())}>
          + Ajouter une charge
        </button>
      </div>

      <div className="table-scroll">
        <table className="load-table">
          <thead>
            <tr>
              <th scope="col" className="col-index">
                #
              </th>
              <th scope="col" className="col-name">
                Équipement
              </th>
              {NUMERIC_COLUMNS.map((column) => (
                <th key={column} scope="col" className="col-num">
                  {COLUMNS[column].header}
                </th>
              ))}
              <th scope="col" className="col-check">
                Simultané
              </th>
              <th scope="col" className="col-energy">
                Énergie (Wh/j)
              </th>
              <th scope="col" className="col-action">
                <span className="visually-hidden">Supprimer</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {appliances.map((appliance, index) => (
              <LoadRow
                key={appliance.id}
                appliance={appliance}
                index={index}
                issues={issues.filter((issue) => issue.applianceId === appliance.id)}
                autoFocus={appliance.id === focusId}
              />
            ))}
          </tbody>
        </table>
        {appliances.length === 0 ? (
          <p className="empty-state">Aucune charge. Ajoutez les équipements utilisés sur le site.</p>
        ) : null}
      </div>

      <dl className="stats">
        <Stat
          label={
            <>
              Énergie journalière E<sub>T</sub>
            </>
          }
          value={totals ? formatUp(totals.dailyEnergyWh) : '—'}
          unit="Wh/j"
        />
        <Stat
          label={
            <>
              Énergie journalière E<sub>T2</sub>
            </>
          }
          value={totals ? formatUp(totals.dailyEnergyKWh, 2) : '—'}
          unit="kWh/j"
        />
        <Stat
          label={
            <>
              Puissance de pointe P<sub>peak</sub>
            </>
          }
          value={totals ? formatUp(totals.peakPowerW) : '—'}
          unit="W"
          note="Somme des charges simultanées"
        />
      </dl>
      <IssueList messages={issues.filter((issue) => issue.field === 'appliances')} />
    </section>
  );
}

interface LoadRowProps {
  appliance: Appliance;
  index: number;
  issues: readonly ValidationIssue[];
  autoFocus: boolean;
}

function LoadRow({ appliance, index, issues, autoFocus }: LoadRowProps) {
  const updateAppliance = useProjectStore((state) => state.updateAppliance);
  const removeAppliance = useProjectStore((state) => state.removeAppliance);
  const update = (patch: Partial<Omit<Appliance, 'id'>>) => updateAppliance(appliance.id, patch);
  const inputs: Record<NumericColumn, NumberInputState> = {
    quantity: useNumberInput(appliance.quantity, (quantity) => update({ quantity })),
    powerW: useNumberInput(appliance.powerW, (powerW) => update({ powerW })),
    hoursPerDay: useNumberInput(appliance.hoursPerDay, (hoursPerDay) => update({ hoursPerDay })),
  };
  const [touched, setTouched] = useState<ReadonlySet<NumericColumn>>(() => new Set());

  const rowNumber = index + 1;
  const label = describeAppliance(appliance, index);

  // A parse problem replaces the engine's "saisissez un nombre"; an empty cell
  // is only flagged once the engineer has left it.
  const columnMessages = (column: NumericColumn): Message[] => {
    const { text, problem } = inputs[column];
    if (problem) {
      return [{ severity: 'error', message: `${label}, ${NUMERIC_RULES[column].label.toLowerCase()} : ${problem}` }];
    }
    if (text.trim() === '' && !touched.has(column)) return [];
    return issues.filter((issue) => issue.field === `appliances.${column}`);
  };
  const byColumn: Record<NumericColumn, Message[]> = {
    quantity: columnMessages('quantity'),
    powerW: columnMessages('powerW'),
    hoursPerDay: columnMessages('hoursPerDay'),
  };
  const rowMessages = issues.filter((issue) => !NUMERIC_COLUMNS.some((column) => issue.field === `appliances.${column}`));
  const messages = [...NUMERIC_COLUMNS.flatMap((column) => byColumn[column]), ...rowMessages];
  const messagesId = `load-${appliance.id}-messages`;
  const describedBy = messages.length > 0 ? messagesId : undefined;

  const blank = isBlankAppliance(appliance);
  const energyWh = !blank && !issues.some((issue) => issue.severity === 'error') ? calculateApplianceDailyEnergyWh(appliance) : null;

  return (
    <>
      <tr className={blank ? 'load-row load-row--blank' : 'load-row'}>
        <td className="col-index">{rowNumber}</td>
        <td className="col-name">
          <input
            className="input"
            value={appliance.name}
            placeholder="ex. Réfrigérateur"
            aria-label={`Charge ${rowNumber} : nom`}
            aria-describedby={describedBy}
            autoFocus={autoFocus}
            onChange={(event) => update({ name: event.target.value })}
          />
        </td>
        {NUMERIC_COLUMNS.map((column) => {
          const severity = severityOf(byColumn[column]);
          const spec = COLUMNS[column];
          return (
            <td key={column} className={`col-num col-${column}`} data-label={spec.header}>
              <input
                className={severity ? `input input--${severity}` : 'input'}
                type="text"
                inputMode={spec.inputMode}
                autoComplete="off"
                spellCheck={false}
                value={inputs[column].text}
                placeholder={spec.placeholder}
                aria-label={`Charge ${rowNumber} : ${spec.ariaLabel}`}
                aria-invalid={severity === 'error'}
                aria-describedby={describedBy}
                onChange={(event) => inputs[column].setText(event.target.value)}
                onBlur={() => setTouched((prev) => (prev.has(column) ? prev : new Set(prev).add(column)))}
              />
            </td>
          );
        })}
        <td className="col-check">
          <label className="check-label">
            <input
              type="checkbox"
              checked={appliance.isSimultaneous}
              aria-label={`Charge ${rowNumber} : simultanée`}
              onChange={(event) => update({ isSimultaneous: event.target.checked })}
            />
            <span className="check-label__text" aria-hidden="true">
              Simultané
            </span>
          </label>
        </td>
        <td className="col-energy" data-label="Énergie (Wh/j)">
          {energyWh === null ? '—' : formatNumber(energyWh, 1)}
        </td>
        <td className="col-action">
          <button
            type="button"
            className="icon-button"
            aria-label={`Supprimer ${label}`}
            title="Supprimer la charge"
            onClick={() => removeAppliance(appliance.id)}
          >
            ×
          </button>
        </td>
      </tr>
      {messages.length > 0 ? (
        <tr className="load-row__messages">
          <td />
          <td colSpan={7}>
            <IssueList id={messagesId} messages={messages} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
