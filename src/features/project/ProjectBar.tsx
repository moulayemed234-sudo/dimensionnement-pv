import { useId, useRef } from 'react';
import { Icon } from '../../components/Icon';
import { useI18n } from '../../i18n/useI18n';
import { readProjectFile } from '../../services/projectFile';
import { snapshotProject, useProjectStore } from '../../state/projectStore';
import { useToastStore } from '../../state/toastStore';

/** Project name and engineer, plus new / example / open. */
export function ProjectBar() {
  const { t, locale } = useI18n();
  const info = useProjectStore((state) => state.info);
  const setInfo = useProjectStore((state) => state.setInfo);
  const newProject = useProjectStore((state) => state.newProject);
  const loadExample = useProjectStore((state) => state.loadExample);
  const restoreProject = useProjectStore((state) => state.restoreProject);
  const showToast = useToastStore((state) => state.show);
  const fileInput = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const engineerId = useId();

  // Replacing is immediate and undoable, so no confirm dialog is needed.
  const replaceWith = (replace: () => void, message: string) => () => {
    const previous = snapshotProject();
    replace();
    showToast(message, previous);
  };

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    const project = await readProjectFile(file);
    if (!project) {
      showToast(t('toast.importFailed'));
      return;
    }
    const previous = snapshotProject();
    restoreProject(project);
    showToast(t('toast.imported', { name: project.info.name || file.name }), previous);
  };

  return (
    <section className="card project-bar" aria-label={t('project.title')}>
      <div className="project-bar__fields">
        <div className="field">
          <label className="field__label" htmlFor={nameId}>
            {t('project.name')}
          </label>
          <input
            id={nameId}
            className="input"
            value={info.name}
            placeholder={t('project.untitled')}
            onChange={(event) => setInfo({ name: event.target.value })}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={engineerId}>
            {t('project.engineer')}
          </label>
          <input
            id={engineerId}
            className="input"
            value={info.engineer ?? ''}
            onChange={(event) => setInfo({ engineer: event.target.value })}
          />
        </div>
      </div>
      <div className="project-bar__actions">
        <button type="button" className="button" onClick={replaceWith(() => newProject(locale), t('toast.newProject'))}>
          <Icon name="plus" size={18} />
          {t('project.new')}
        </button>
        <button type="button" className="button" onClick={() => fileInput.current?.click()}>
          <Icon name="upload" size={18} />
          {t('project.open')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            void openFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <button type="button" className="button button--ghost" onClick={replaceWith(() => loadExample(locale), t('toast.example'))}>
          {t('project.example')}
        </button>
      </div>
    </section>
  );
}
