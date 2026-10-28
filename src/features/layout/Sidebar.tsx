import { useId } from 'react';
import { Icon } from '../../components/Icon';
import type { ValidationIssue } from '../../engine/types';
import { useI18n } from '../../i18n/useI18n';
import { snapshotProject, useProjectStore } from '../../state/projectStore';
import { useToastStore } from '../../state/toastStore';
import { STEPS, useUiStore, type StepNumber } from '../../state/uiStore';
import type { StringKey } from '../../i18n/strings';

/** Which inputs belong to which step, to flag a step that needs attention. */
const STEP_FIELDS: Readonly<Record<StepNumber, (field: string) => boolean>> = {
  1: (field) => field.startsWith('appliances'),
  2: () => false,
  3: (field) => ['system.peakSunHours', 'system.deratingFactor', 'system.panelPowerW'].includes(field),
  4: (field) => field.startsWith('battery.'),
  5: (field) => ['system.inverterSafetyFactor', 'system.systemVoltageOverride'].includes(field),
  6: () => false,
};

export function stepSeverity(step: StepNumber, issues: readonly ValidationIssue[]): 'error' | 'warning' | null {
  const own = issues.filter((issue) => STEP_FIELDS[step](issue.field));
  if (own.some((issue) => issue.severity === 'error')) return 'error';
  return own.length > 0 ? 'warning' : null;
}

/** Project card, the six design steps and the system type. */
export function Sidebar({ issues }: { issues: readonly ValidationIssue[] }) {
  const { t, locale } = useI18n();
  const step = useUiStore((state) => state.step);
  const setStep = useUiStore((state) => state.setStep);

  return (
    <aside className="sidebar" aria-label={t('step.navLabel')}>
      <ProjectCard />

      <nav className="steps" aria-label={t('step.navLabel')}>
        <ol className="steps__list">
          {STEPS.map((n) => {
            const severity = stepSeverity(n, issues);
            return (
              <li key={n}>
                <button
                  type="button"
                  className={n === step ? 'steps__item is-active' : 'steps__item'}
                  aria-current={n === step ? 'step' : undefined}
                  onClick={() => setStep(n)}
                >
                  <span className="steps__number">{n}</span>
                  <span className="steps__text">
                    <span className="steps__title">{t(`step.${n}.title` as StringKey)}</span>
                    <span className="steps__sub">{t(`step.${n}.sub` as StringKey)}</span>
                  </span>
                  {severity ? (
                    <span className={`steps__flag steps__flag--${severity}`} title={t('step.hasIssue')}>
                      <span className="visually-hidden">{t('step.hasIssue')}</span>
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="system-type">
        <span className="system-type__icon" aria-hidden="true">
          <Icon name="panel" size={26} />
        </span>
        <div>
          <p className="system-type__title">
            <Icon name="info" size={16} /> {t('systemType.title')}
          </p>
          <p className="system-type__value" lang="en">
            Off-Grid
          </p>
          <p className="system-type__desc" lang={locale}>
            {t('systemType.desc')}
          </p>
        </div>
      </div>
    </aside>
  );
}

function ProjectCard() {
  const { t, locale } = useI18n();
  const info = useProjectStore((state) => state.info);
  const setInfo = useProjectStore((state) => state.setInfo);
  const newProject = useProjectStore((state) => state.newProject);
  const loadExample = useProjectStore((state) => state.loadExample);
  const showToast = useToastStore((state) => state.show);
  const nameId = useId();
  const siteId = useId();
  const engineerId = useId();

  // Replacing is immediate and undoable, so no confirm dialog is needed.
  const replaceWith = (replace: () => void, message: string) => () => {
    const previous = snapshotProject();
    replace();
    showToast(message, previous);
  };

  return (
    <section className="project-card" aria-label={t('project.title')}>
      <div className="project-card__head">
        <span className="project-card__icon" aria-hidden="true">
          <Icon name="folder" size={20} />
        </span>
        <label className="visually-hidden" htmlFor={nameId}>
          {t('project.name')}
        </label>
        <input
          id={nameId}
          className="project-card__name"
          value={info.name}
          placeholder={t('project.untitled')}
          onChange={(event) => setInfo({ name: event.target.value })}
        />
        <span className="badge badge--ok" lang="en">
          {t('project.offGrid')}
        </span>
      </div>
      <div className="project-card__fields">
        <label className="project-card__label" htmlFor={siteId}>
          {t('project.site')}
        </label>
        <input id={siteId} className="input input--compact" value={info.site ?? ''} onChange={(event) => setInfo({ site: event.target.value })} />
        <label className="project-card__label" htmlFor={engineerId}>
          {t('project.engineer')}
        </label>
        <input
          id={engineerId}
          className="input input--compact"
          value={info.engineer ?? ''}
          onChange={(event) => setInfo({ engineer: event.target.value })}
        />
      </div>
      <div className="project-card__actions">
        <button type="button" className="button button--small" onClick={replaceWith(() => newProject(locale), t('toast.newProject'))}>
          {t('project.new')}
        </button>
        <button
          type="button"
          className="button button--small button--ghost"
          onClick={replaceWith(() => loadExample(locale), t('toast.example'))}
        >
          {t('project.example')}
        </button>
      </div>
    </section>
  );
}
