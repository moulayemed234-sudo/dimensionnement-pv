import { findLocation } from '../../data/locations';
import { placeName } from '../../i18n/places';
import { batteryHoursOf } from '../../engine/solarEngine';
import { useI18n } from '../../i18n/useI18n';
import type { SizingOutcome } from '../../engine/types';
import { useProjectStore } from '../../state/projectStore';
import { formatNumber } from '../../ui/numbers';
import letterhead from '../../assets/letterhead.jpg';
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

  const meta = [
    { label: t('print.project'), value: info.name || '—' },
    { label: t('print.site'), value: info.site || (location ? placeName(location, locale) : '—') },
    { label: t('print.engineer'), value: info.engineer || '—' },
    { label: t('print.date'), value: date },
  ];

  return (
    <div className="print-report" aria-hidden="true">
      {/* Plain document flow (no fixed or repeated elements): prints the same in every browser, iPhone included. */}
      {/* Only the logo band at the top of the letterhead is shown (cropped in CSS). */}
      <div className="print-report__logo">
        <img src={letterhead} alt="" />
      </div>
      <header className="print-report__head">
        <h1>{t('print.title')}</h1>
        <dl className="print-report__meta">
          {meta.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{text(item.value)}</dd>
            </div>
          ))}
        </dl>
      </header>

      {outcome.ok ? (
        <section className="print-report__results">
          <h2>{t('print.results')}</h2>
          <table className="print-report__table">
            <colgroup>
              <col style={{ width: '58%' }} />
              <col style={{ width: '42%' }} />
            </colgroup>
            <tbody>
              {summaryRows(outcome.results, i18n).map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="num print-report__value">{row.value}</td>
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

      {outcome.ok && loads.length > 0 ? (
        <section className="print-report__loads">
          <h2>{t('print.loads')}</h2>
          <table className="print-report__table print-report__table--loads">
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '32%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="num">#</th>
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
                    <td className="num">{index + 1}</td>
                    <td>{load.name || '—'}</td>
                    <td className="num">{appliance ? formatNumber(appliance.quantity) : '—'}</td>
                    <td className="num">{appliance ? formatNumber(appliance.powerW, 1) : '—'}</td>
                    <td className="num">{appliance ? formatNumber(appliance.hoursPerDay, 2) : '—'}</td>
                    <td className="num">{appliance ? formatNumber(batteryHoursOf(appliance), 2) : '—'}</td>
                    <td className="num">{formatNumber(load.dailyEnergyWh, 1)}</td>
                  </tr>
                );
              })}
              <tr className="print-report__total">
                <th scope="row" colSpan={6}>
                  {t('print.total')}
                </th>
                <td className="num">{formatNumber(outcome.results.load.dailyEnergyWh, 1)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}

      <p className="print-report__footer">{t('print.footer')}</p>
      <p className="print-report__contact">
        SHAMS EL WATANE FOR ENERGY (SWAT) · Tel: 0022220841700 / 0022248202020 · shameswatan@gmail.com · Îlot k 176, Nouakchott,
        Mauritanie
      </p>
    </div>
  );
}
