import { useEffect, useState } from 'react';
import { useProjectStore } from '../state/projectStore';
import { useToastStore } from '../state/toastStore';
import { useI18n } from '../i18n/useI18n';

const VISIBLE_MS = 10_000;

/** Bottom message with an optional "Annuler"; it stays mounted so it can animate in and out. */
export function UndoToast() {
  const message = useToastStore((state) => state.message);
  const undo = useToastStore((state) => state.undo);
  const id = useToastStore((state) => state.id);
  const hide = useToastStore((state) => state.hide);
  const restoreProject = useProjectStore((state) => state.restoreProject);
  const { t, text } = useI18n();
  // Keep the last text on screen while the toast slides out.
  const [shown, setShown] = useState({ message: '', canUndo: false });

  useEffect(() => {
    if (!message) return;
    setShown({ message, canUndo: undo !== null });
    const timer = window.setTimeout(hide, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [id, message, undo, hide]);

  const open = message !== null;
  return (
    <div className={open ? 'toast t-toast is-open' : 'toast t-toast'} role="status" aria-hidden={!open} inert={!open}>
      <span>{text(shown.message)}</span>
      {shown.canUndo ? (
        <button
          type="button"
          className="button"
          onClick={() => {
            if (undo) restoreProject(undo);
            hide();
          }}
        >
          {t('toast.undo')}
        </button>
      ) : null}
    </div>
  );
}
