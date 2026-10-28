import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { IssueList } from '../../components/IssueList';
import { SoftText } from '../../components/SoftText';
import { useNumberInput, type NumberInputState } from '../../components/useNumberInput';
import { APPLIANCE_PRESETS, iconForAppliance } from '../../data/appliancePresets';
import { CATALOGS } from '../../engine/messages';
import { calculateApplianceDailyEnergyWh, describeAppliance } from '../../engine/solarEngine';
import type { Appliance, ValidationIssue } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { snapshotProject, useProjectStore } from '../../state/projectStore';
import { isBlankAppliance, type LoadTotals } from '../../state/sizing';
import { useToastStore } from '../../state/toastStore';
import { severityOf, type Message } from '../../ui/messages';
import { formatNumber, formatUp } from '../../ui/numbers';

type NumericColumn = 'quantity' | 'powerW' | 'hoursPerDay';

const NUMERIC_COLUMNS: readonly NumericColumn[] = ['quantity', 'powerW', 'hoursPerDay'];
const INPUT_MODE: Record<NumericColumn, 'numeric' | 'decimal'> = { quantity: 'numeric', powerW: 'decimal', hoursPerDay: 'decimal' };
const SUGGESTIONS_ID = 'appliance-suggestions';

interface LoadTableProps {
  issues: readonly ValidationIssue[];
  totals: LoadTotals | null;
}

/** The equipment inventory, with per-row energy and the daily total. */
export function LoadTable({ issues, totals }: LoadTableProps) {
  const { t, locale } = useI18n();
  const appliances = useProjectStore((state) => state.input.appliances);
  const addAppliance = useProjectStore((state) => state.addAppliance);
  // The row to animate in, and the row whose name field takes focus.
  const [newId, setNewId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const addEmpty = () => {
    const id = addAppliance();
    setNewId(id);
    setFocusId(id);
  };

  return (
    <section className="card" aria-labelledby="loads-title">
      <div className="card__header">
        <div>
          <h2 id="loads-title" className="card__title">
            <span className="card__title-icon" aria-hidden="true">
              <Icon name="plug" size={22} />
            </span>
            {t('loads.title')}
          </h2>
          <p className="card__subtitle">{t('loads.subtitle')}</p>
        </div>
        <button type="button" className="button button--primary" onClick={addEmpty}>
          <Icon name="plus" size={18} />
          {t('loads.add')}
        </button>
      </div>

      <datalist id={SUGGESTIONS_ID}>
        {APPLIANCE_PRESETS.map((preset) => (
          <option key={preset.names.fr} value={preset.names[locale]} />
        ))}
      </datalist>

      <div className="table-scroll">
        <table className="load-table">
          <thead>
            <tr>
              <th scope="col" className="col-index">
                {t('col.index')}
              </th>
              <th scope="col" className="col-name">
                {t('col.device')}
              </th>
              <th scope="col" className="col-num">
                {t('col.qty')}
              </th>
              <th scope="col" className="col-num">
                {t('col.power')}
              </th>
              <th scope="col" className="col-num">
                {t('col.hours')}
              </th>
              <th scope="col" className="col-check">
                {t('col.simultaneous')}
              </th>
              <th scope="col" className="col-energy">
                {t('col.energy')}
              </th>
              <th scope="col" className="col-action">
                <span className="visually-hidden">{t('col.remove')}</span>
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
                isNew={appliance.id === newId}
                autoFocus={appliance.id === focusId}
              />
            ))}
          </tbody>
        </table>
        {appliances.length === 0 ? <p className="empty-state">{t('loads.empty')}</p> : null}
      </div>

      <p className="field__hint">{t('loads.simultaneousHint')}</p>

      <div className="total-bar">
        <span className="total-bar__icon" aria-hidden="true">
          <Icon name="calculator" size={26} />
        </span>
        <div>
          <p className="total-bar__label">{t('loads.total')}</p>
          <p className="total-bar__value num">
            <SoftText text={totals ? formatUp(totals.dailyEnergyWh) : '—'} />
            <span className="total-bar__unit">{t('unit.whDay')}</span>
          </p>
        </div>
        <p className="total-bar__kwh num">
          = <SoftText text={totals ? formatUp(totals.dailyEnergyKWh, 2) : '—'} /> {t('unit.kwhDay')}
        </p>
      </div>
      <IssueList messages={issues.filter((issue) => issue.field === 'appliances')} />
    </section>
  );
}

interface LoadRowProps {
  appliance: Appliance;
  index: number;
  issues: readonly ValidationIssue[];
  isNew: boolean;
  autoFocus: boolean;
}

function LoadRow({ appliance, index, issues, isNew, autoFocus }: LoadRowProps) {
  const { t, locale, labelled, problemText } = useI18n();
  const updateAppliance = useProjectStore((state) => state.updateAppliance);
  const removeAppliance = useProjectStore((state) => state.removeAppliance);
  const showToast = useToastStore((state) => state.show);
  const update = (patch: Partial<Omit<Appliance, 'id'>>) => updateAppliance(appliance.id, patch);
  const inputs: Record<NumericColumn, NumberInputState> = {
    quantity: useNumberInput(appliance.quantity, (quantity) => update({ quantity })),
    powerW: useNumberInput(appliance.powerW, (powerW) => update({ powerW })),
    hoursPerDay: useNumberInput(appliance.hoursPerDay, (hoursPerDay) => update({ hoursPerDay })),
  };
  const [touched, setTouched] = useState<ReadonlySet<NumericColumn>>(() => new Set());

  const n = index + 1;
  const label = describeAppliance(appliance, index, locale);
  const rules = CATALOGS[locale].rules;
  const columnLabel: Record<NumericColumn, string> = { quantity: t('col.qty'), powerW: t('col.powerShort'), hoursPerDay: t('col.hours') };
  const ariaLabel: Record<NumericColumn, string> = {
    quantity: t('aria.rowQty', { n }),
    powerW: t('aria.rowPower', { n }),
    hoursPerDay: t('aria.rowHours', { n }),
  };

  // A parse problem replaces the engine's "enter a number"; an empty cell is
  // only flagged once the engineer has left it.
  const columnMessages = (column: NumericColumn): Message[] => {
    const { text, problem } = inputs[column];
    if (problem) {
      const fieldLabel = CATALOGS[locale].rowField(label, rules[column].label);
      return [{ severity: 'error', message: labelled(fieldLabel, problemText(problem)) }];
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

  const remove = () => {
    const previous = snapshotProject();
    removeAppliance(appliance.id);
    showToast(blank ? t('toast.blankDeleted') : t('toast.deleted', { row: label }), previous);
  };

  const rowClass = ['load-row', blank ? 'load-row--blank' : '', isNew ? 'load-row--new' : ''].filter(Boolean).join(' ');

  return (
    <>
      <tr className={rowClass}>
        <td className="col-index">{n}</td>
        <td className="col-name">
          <div className="device-input">
            <span className="device-input__icon" aria-hidden="true">
              <Icon name={iconForAppliance(appliance.name)} size={18} />
            </span>
            <input
              className="input"
              value={appliance.name}
              list={SUGGESTIONS_ID}
              placeholder={t('loads.namePlaceholder')}
              aria-label={t('aria.rowName', { n })}
              aria-describedby={describedBy}
              autoFocus={autoFocus}
              onChange={(event) => update({ name: event.target.value })}
            />
          </div>
        </td>
        {NUMERIC_COLUMNS.map((column) => {
          const severity = severityOf(byColumn[column]);
          return (
            <td key={column} className={`col-num col-${column}`} data-label={columnLabel[column]}>
              <input
                className={severity ? `input input--number input--${severity}` : 'input input--number'}
                type="text"
                inputMode={INPUT_MODE[column]}
                autoComplete="off"
                spellCheck={false}
                value={inputs[column].text}
                aria-label={ariaLabel[column]}
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
              aria-label={t('aria.rowSimultaneous', { n })}
              onChange={(event) => update({ isSimultaneous: event.target.checked })}
            />
            <span className="check-label__text" aria-hidden="true">
              {t('col.simultaneous')}
            </span>
          </label>
        </td>
        <td className="col-energy" data-label={t('col.energy')}>
          <span className="energy-cell num">{energyWh === null ? '—' : formatNumber(energyWh, 1)}</span>
        </td>
        <td className="col-action">
          <button type="button" className="icon-button" aria-label={t('aria.remove', { row: label })} title={t('col.remove')} onClick={remove}>
            <Icon name="trash" size={18} />
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
