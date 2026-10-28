import { Icon } from '../../components/Icon';
import { SoftText } from '../../components/SoftText';
import { iconForAppliance } from '../../data/appliancePresets';
import { useI18n } from '../../i18n/useI18n';
import type { LoadTotals } from '../../state/sizing';
import { formatNumber, formatUp } from '../../ui/numbers';
import { StepCard } from '../layout/StepCard';

/** Step 2: how the daily energy splits between the appliances. */
export function ConsumptionStep({ totals }: { totals: LoadTotals | null }) {
  const { t } = useI18n();
  const rows = totals ? [...totals.appliances].sort((a, b) => b.dailyEnergyWh - a.dailyEnergyWh) : [];

  return (
    <StepCard step={2} subtitle={t('consumption.subtitle')}>
      <dl className="stats">
        <div className="stat">
          <dt className="stat__label">{t('consumption.energy')}</dt>
          <dd className="stat__value num">
            <SoftText text={totals ? formatUp(totals.dailyEnergyWh) : '—'} />
            <span className="stat__unit">{t('unit.whDay')}</span>
          </dd>
          <dd className="stat__note num">
            {totals ? formatUp(totals.dailyEnergyKWh, 2) : '—'} {t('unit.kwhDay')}
          </dd>
        </div>
        <div className="stat">
          <dt className="stat__label">{t('consumption.peak')}</dt>
          <dd className="stat__value num">
            <SoftText text={totals ? formatUp(totals.peakPowerW) : '—'} />
            <span className="stat__unit">W</span>
          </dd>
          <dd className="stat__note">{t('consumption.peakNote')}</dd>
        </div>
      </dl>

      {rows.length === 0 ? (
        <p className="empty-state">{t('consumption.waiting')}</p>
      ) : (
        <ul className="share-list">
          {rows.map((row) => (
            <li key={row.applianceId} className="share-row">
              <span className="share-row__icon" aria-hidden="true">
                <Icon name={iconForAppliance(row.name)} size={18} />
              </span>
              <span className="share-row__name">{row.name}</span>
              <span className="share-row__bar" aria-hidden="true">
                <span style={{ inlineSize: `${Math.max(row.energyShare * 100, 1)}%` }} />
              </span>
              <span className="share-row__value num">
                {formatNumber(row.dailyEnergyWh, 1)} {t('unit.whDay')}
              </span>
              <span className="share-row__pct num">{formatNumber(row.energyShare * 100, 1)} %</span>
            </li>
          ))}
        </ul>
      )}
    </StepCard>
  );
}
