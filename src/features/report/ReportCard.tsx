import { useState } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import type { SizingOutcome } from '../../engine/types';
import type { StringKey } from '../../i18n/strings';
import { useI18n } from '../../i18n/useI18n';
import { downloadProject } from '../../services/projectFile';
import { snapshotProject, useProjectStore } from '../../state/projectStore';
import { assumptionRows, detailRows, engineeringNotes, summaryRows, type ReportRow } from './reportRows';

type Tab = 'summary' | 'details' | 'assumptions';

const TABS: readonly { id: Tab; label: StringKey; icon: IconName }[] = [
  { id: 'summary', label: 'report.tab.summary', icon: 'file' },
  { id: 'details', label: 'report.tab.details', icon: 'calculator' },
  { id: 'assumptions', label: 'report.tab.assumptions', icon: 'info' },
];

/** Calculation report with tabs, engineering notes, and save / print / PDF actions. */
export function ReportCard({ outcome }: { outcome: SizingOutcome }) {
  const i18n = useI18n();
  const { t, text } = i18n;
  const [tab, setTab] = useState<Tab>('summary');
  // Selected separately: a selector returning a new object each time would re-render forever.
  const info = useProjectStore((state) => state.info);
  const locationId = useProjectStore((state) => state.locationId);
  const input = useProjectStore((state) => state.input);
  const project = { info, locationId, input };
  const results = outcome.ok ? outcome.results : null;

  return (
    <section className="card report" aria-labelledby="report-title">
      <h2 id="report-title" className="visually-hidden">
        {t('report.tab.summary')}
      </h2>
      <div className="report__tabs" role="tablist" aria-label={t('report.tab.summary')}>
        {TABS.map((item) => (
          <button
            key={item.id}
            id={`report-tab-${item.id}`}
            type="button"
            role="tab"
            className="report__tab"
            aria-selected={tab === item.id}
            aria-controls="report-panel"
            onClick={() => setTab(item.id)}
          >
            <Icon name={item.icon} size={18} />
            {t(item.label)}
          </button>
        ))}
      </div>

      <div className="report__panel" id="report-panel" role="tabpanel" aria-labelledby={`report-tab-${tab}`}>
        {tab === 'summary' ? (
          <div className="report__summary">
            <div className="notes">
              <h3 className="notes__title">{t('report.notesTitle')}</h3>
              <ul className="notes__list">
                {engineeringNotes(project, i18n).map((note) => (
                  <li key={note}>
                    <span className="notes__check" aria-hidden="true">
                      <Icon name="check" size={14} />
                    </span>
                    {text(note)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="report__short">
              <h3 className="report__short-title">{t('report.shortTitle')}</h3>
              {results ? <KeyValues rows={summaryRows(results, i18n)} /> : <p className="empty-state">{t('report.unavailable')}</p>}
            </div>
          </div>
        ) : null}
        {tab === 'details' ? (
          results ? <FormulaTable rows={detailRows(results, i18n)} /> : <p className="empty-state">{t('report.unavailable')}</p>
        ) : null}
        {tab === 'assumptions' ? <KeyValues rows={assumptionRows(project, i18n)} /> : null}
      </div>

      <div className="report__actions">
        <button type="button" className="button" onClick={() => downloadProject(snapshotProject())}>
          <Icon name="save" size={18} />
          {t('report.save')}
        </button>
        <button type="button" className="button" onClick={() => window.print()}>
          <Icon name="printer" size={18} />
          {t('report.print')}
        </button>
        <button type="button" className="button button--primary" onClick={() => window.print()}>
          <Icon name="file" size={18} />
          {t('report.pdf')}
        </button>
      </div>
    </section>
  );
}

function KeyValues({ rows }: { rows: readonly ReportRow[] }) {
  return (
    <dl className="kv">
      {rows.map((row) => (
        <div key={row.label} className="kv__row">
          <dt>{row.label}</dt>
          <dd className="num">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FormulaTable({ rows }: { rows: readonly ReportRow[] }) {
  const { t } = useI18n();
  return (
    <div className="table-scroll">
      <table className="formula-table">
        <thead>
          <tr>
            <th scope="col">{t('report.item')}</th>
            <th scope="col">{t('report.value')}</th>
            <th scope="col">{t('report.formula')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td className="num">{row.value}</td>
              <td className="formula" dir="ltr">
                {row.formula}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
