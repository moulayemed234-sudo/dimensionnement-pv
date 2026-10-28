import { useI18n } from '../../i18n/useI18n';
import type { SizingOutcome } from '../../engine/types';
import { useProjectStore } from '../../state/projectStore';
import { formatNumber } from '../../ui/numbers';
import { BrandMark } from '../layout/TopBar';
import { assumptionRows, detailRows, engineeringNotes } from './reportRows';

/** The paper / PDF report. Hidden on screen; the only thing printed. */
export function PrintReport({ outcome }: { outcome: SizingOutcome }) {
  const i18n = useI18n();
  const { t, text, locale } = i18n;
  const info = useProjectStore((state) => state.info);
  const locationId = useProjectStore((state) => state.locationId);
  const input = useProjectStore((state) => state.input);
  const project = { info, locationId, input };
  const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { dateStyle: 'long' }).format(new Date());
  const warnings = outcome.issues.filter((issue) => issue.severity === 'warning');
  const loads = outcome.ok ? outcome.results.load.appliances : [];

  return (
    <div className="print-report" aria-hidden="true">
      <header className="print-report__head">
        <BrandMark size={52} />
        <div>
          <p className="print-report__brand">{t('brand.name')}</p>
          <h1>{t('print.title')}</h1>
          <p className="print-report__meta">
            {text(
              t('print.meta', {
                name: info.name || '—',
                site: info.site || '—',
                engineer: info.engineer || '—',
                date,
              }),
            )}
          </p>
        </div>
      </header>

      {outcome.ok ? (
        <section>
          <h2>{t('print.results')}</h2>
          <table>
            <thead>
              <tr>
                <th>{t('report.item')}</th>
                <th>{t('report.value')}</th>
                <th>{t('report.formula')}</th>
              </tr>
            </thead>
            <tbody>
              {detailRows(outcome.results, i18n).map((row) => (
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
        </section>
      ) : (
        <section>
          <h2>{t('summary.pending')}</h2>
          <ul>
            {outcome.issues
              .filter((issue) => issue.severity === 'error')
              .map((issue) => (
                <li key={issue.message}>{text(issue.message)}</li>
              ))}
          </ul>
        </section>
      )}

      {loads.length > 0 ? (
        <section>
          <h2>{t('print.loads')}</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('col.device')}</th>
                <th>{t('col.qty')}</th>
                <th>{t('col.power')}</th>
                <th>{t('col.hours')}</th>
                <th>{t('col.simultaneous')}</th>
                <th>{t('col.energy')}</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load, index) => {
                const appliance = input.appliances.find((a) => a.id === load.applianceId);
                return (
                  <tr key={load.applianceId}>
                    <td>{index + 1}</td>
                    <td>{load.name || '—'}</td>
                    <td className="num">{appliance ? formatNumber(appliance.quantity) : '—'}</td>
                    <td className="num">{appliance ? formatNumber(appliance.powerW, 1) : '—'}</td>
                    <td className="num">{appliance ? formatNumber(appliance.hoursPerDay, 2) : '—'}</td>
                    <td>{load.isSimultaneous ? t('print.yes') : t('print.no')}</td>
                    <td className="num">{formatNumber(load.dailyEnergyWh, 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      <section>
        <h2>{t('report.tab.assumptions')}</h2>
        <table>
          <tbody>
            {assumptionRows(project, i18n).map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="num">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {warnings.length > 0 ? (
        <section>
          <h2>{t('print.warnings')}</h2>
          <ul>
            {warnings.map((warning) => (
              <li key={warning.message}>{text(warning.message)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2>{t('report.notesTitle')}</h2>
        <ul>
          {engineeringNotes(project, i18n).map((note) => (
            <li key={note}>{text(note)}</li>
          ))}
        </ul>
      </section>

      <p className="print-report__footer">
        {t('brand.name')} · {t('brand.footer')} · {t('print.footer')}
      </p>
    </div>
  );
}
