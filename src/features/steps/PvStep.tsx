import { Field } from '../../components/Field';
import { NumberField } from '../../components/NumberField';
import { NOUAKCHOTT, OTHER_CITIES, OTHER_SITE, findLocation } from '../../data/locations';
import type { IssueField, ValidationIssue } from '../../engine/types';
import { placeName } from '../../i18n/places';
import { useI18n } from '../../i18n/useI18n';
import { useProjectStore } from '../../state/projectStore';
import { issuesFor } from '../../state/sizing';
import { formatNumber } from '../../ui/numbers';
import { StepCard } from '../layout/StepCard';

const CUSTOM_PSH = 'custom';
const DERATING_PRESETS = [0.9, 0.8, 0.7];

/** Step 3: site sun hours, module rating and losses. */
export function PvStep({ issues }: { issues: readonly ValidationIssue[] }) {
  const { t, locale } = useI18n();
  const system = useProjectStore((state) => state.input.system);
  const locationId = useProjectStore((state) => state.locationId);
  const selectLocation = useProjectStore((state) => state.selectLocation);
  const setSystem = useProjectStore((state) => state.setSystem);
  const at = (field: IssueField) => issuesFor(issues, field);
  const location = findLocation(locationId);

  return (
    <StepCard step={3} subtitle={t('pv.subtitle')}>
      <div className="form-grid">
        <Field label={t('pv.location')} htmlFor="param-location">
          <select
            id="param-location"
            className="input"
            value={locationId ?? CUSTOM_PSH}
            onChange={(event) => selectLocation(event.target.value === CUSTOM_PSH ? null : event.target.value)}
          >
            <option value={NOUAKCHOTT.id}>
              {placeName(NOUAKCHOTT, locale)} : {formatNumber(NOUAKCHOTT.peakSunHours, 1)} h
            </option>
            <optgroup label={t('pv.otherCities', { h: formatNumber(OTHER_SITE.peakSunHours, 1) })}>
              {[...OTHER_CITIES, OTHER_SITE].map((city) => (
                <option key={city.id} value={city.id}>
                  {placeName(city, locale)}
                </option>
              ))}
            </optgroup>
            <option value={CUSTOM_PSH}>{t('pv.custom')}</option>
          </select>
        </Field>
        <NumberField
          label={t('pv.psh')}
          unit={t('unit.hDay')}
          value={system.peakSunHours}
          readOnly={location !== null}
          hint={location ? t('pv.pshPreset', { city: placeName(location, locale) }) : t('pv.pshCustom')}
          issues={at('system.peakSunHours')}
          onChange={(peakSunHours) => setSystem({ peakSunHours })}
        />
        <NumberField
          label={t('pv.panel')}
          unit="W"
          value={system.panelPowerW}
          hint={t('pv.panelHint')}
          issues={at('system.panelPowerW')}
          onChange={(panelPowerW) => setSystem({ panelPowerW })}
        />
        <NumberField
          label={t('pv.df')}
          value={system.deratingFactor}
          hint={
            <span className="chips">
              <span className="chips__group" role="group" aria-label={t('pv.dfPresets')}>
                {DERATING_PRESETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="chip"
                    aria-pressed={system.deratingFactor === value}
                    onClick={() => setSystem({ deratingFactor: value })}
                  >
                    {formatNumber(value, 2)}
                  </button>
                ))}
              </span>
              <span>{t('pv.dfCaption')}</span>
            </span>
          }
          issues={at('system.deratingFactor')}
          onChange={(deratingFactor) => setSystem({ deratingFactor })}
        />
      </div>
    </StepCard>
  );
}
