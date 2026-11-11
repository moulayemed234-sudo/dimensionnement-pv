import { findLocation } from '../../data/locations';
import { placeName } from '../../i18n/places';
import { batteryHoursOf } from '../../engine/solarEngine';
import { useI18n } from '../../i18n/useI18n';
import type { SizingOutcome } from '../../engine/types';
import { useProjectStore } from '../../state/projectStore';
import { formatNumber } from '../../ui/numbers';
import { BrandMark } from '../layout/TopBar';
import { summaryRows } from './reportRows';

/** The paper / PDF report. Hidden on screen; the only thing printed. */
export function PrintReport({ outcome }: { outcome: SizingOutcome }) {
  const i18n = useI18n();
  const { t, text, locale } = i18n;
  const info = useProjectStore((state) => state.info);
  const locationId = useProjectStore((state) => state.locationId);
  const input = useProjectStore((state) => state.input);
  const location = findLocation(locationId);
  const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { dateStyle: 'long' }).format(new Date());
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
                site: info.site || (location ? placeName(location, locale) : '—'),
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
            <tbody>
              {summaryRows(outcome.results, i18n).map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="num"><span dir="ltr">{row.value}</span></td>
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
                <th>{t('col.batteryHours')}</th>
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
                    <td className="num">{appliance ? formatNumber(batteryHoursOf(appliance), 2) : '—'}</td>
                    <td className="num">{formatNumber(load.dailyEnergyWh, 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      <p className="print-report__footer">
        {t('brand.name')} · {t('brand.footer')} · {t('print.footer')}
      </p>
    </div>
  );
}
