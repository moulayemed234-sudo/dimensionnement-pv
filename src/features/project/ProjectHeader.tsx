import { useId } from 'react';
import { Field } from '../../components/Field';
import { snapshotProject, useProjectStore } from '../../state/projectStore';
import { useToastStore } from '../../state/toastStore';

/** App title, project identification and project-level actions. */
export function ProjectHeader() {
  const info = useProjectStore((state) => state.info);
  const setInfo = useProjectStore((state) => state.setInfo);
  const newProject = useProjectStore((state) => state.newProject);
  const loadExample = useProjectStore((state) => state.loadExample);
  const showToast = useToastStore((state) => state.show);

  // Replacing is immediate and undoable, so no confirm dialog is needed.
  const replaceWith = (replace: () => void, message: string) => () => {
    const previous = snapshotProject();
    replace();
    showToast(message, previous);
  };

  return (
    <header className="app-header">
      <div className="brand">
        <svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="var(--primary)" />
          <circle cx="32" cy="32" r="10" fill="var(--accent)" />
          <path
            d="M32 9v7M32 48v7M9 32h7M48 32h7M15.7 15.7l5 5M43.3 43.3l5 5M48.3 15.7l-5 5M20.7 43.3l-5 5"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <div>
          <h1 className="brand__title">Dimensionnement PV hors réseau</h1>
          <p className="brand__subtitle">Charges, champ PV, onduleur et parc de batteries</p>
        </div>
      </div>

      <div className="project-fields">
        <TextField label="Projet" value={info.name} onChange={(name) => setInfo({ name })} />
        <TextField label="Site" value={info.site ?? ''} onChange={(site) => setInfo({ site })} />
        <TextField label="Ingénieur" value={info.engineer ?? ''} onChange={(engineer) => setInfo({ engineer })} />
      </div>

      <div className="header-actions">
        <button type="button" className="button" onClick={replaceWith(newProject, 'Nouveau projet créé.')}>
          Nouveau projet
        </button>
        <button type="button" className="button button--ghost" onClick={replaceWith(loadExample, 'Exemple chargé.')}>
          Charger l'exemple
        </button>
      </div>
    </header>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id}>
      <input id={id} className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
