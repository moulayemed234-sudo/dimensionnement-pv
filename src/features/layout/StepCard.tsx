import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import type { StringKey } from '../../i18n/strings';
import { useI18n } from '../../i18n/useI18n';
import { STEPS, useUiStore, type StepNumber } from '../../state/uiStore';

const STEP_ICONS: Readonly<Record<StepNumber, IconName>> = {
  1: 'plug',
  2: 'calculator',
  3: 'panel',
  4: 'battery',
  5: 'inverter',
  6: 'check',
};

interface StepCardProps {
  step: StepNumber;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** The open design step: title, optional actions, content, then Previous / Next. */
export function StepCard({ step, subtitle, actions, children }: StepCardProps) {
  const { t, text } = useI18n();
  const setStep = useUiStore((state) => state.setStep);
  const index = STEPS.indexOf(step);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  return (
    <section className="card step-card" aria-labelledby={`step-${step}-title`}>
      <div className="card__header">
        <div>
          <h2 id={`step-${step}-title`} className="card__title">
            <span className="card__title-icon" aria-hidden="true">
              <Icon name={STEP_ICONS[step]} size={22} />
            </span>
            {t(`step.${step}.title` as StringKey)}
          </h2>
          <p className="card__subtitle">{text(subtitle)}</p>
        </div>
        {actions ? <div className="card__actions">{actions}</div> : null}
      </div>

      {children}

      <div className="step-card__nav">
        {previous ? (
          <button type="button" className="button" onClick={() => setStep(previous)}>
            <Icon name="chevronStart" size={18} className="icon--flip-rtl" />
            {t('nav.previous')}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button type="button" className="button button--primary" onClick={() => setStep(next)}>
            {t('nav.next')} · {t(`step.${next}.title` as StringKey)}
            <Icon name="chevronEnd" size={18} className="icon--flip-rtl" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
