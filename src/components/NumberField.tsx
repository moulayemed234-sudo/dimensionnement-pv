import { useId, useState, type ReactNode } from 'react';
import type { ValidationIssue } from '../engine/types';
import { useI18n } from '../i18n/useI18n';
import { severityOf, type Message } from '../ui/messages';
import { toInputText } from '../ui/numbers';
import { Field } from './Field';
import { useNumberInput } from './useNumberInput';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string | undefined;
  hint?: ReactNode;
  issues?: readonly ValidationIssue[] | undefined;
  readOnly?: boolean | undefined;
}

/** Labelled number input with unit, hint and inline validation. Accepts "5,5" or "5.5". */
export function NumberField({ label, value, onChange, unit, hint, issues = [], readOnly = false }: NumberFieldProps) {
  const id = useId();
  const { labelled, problemText } = useI18n();
  const { text, problem, setText } = useNumberInput(value, onChange);
  const [touched, setTouched] = useState(false);

  // An empty field is only flagged once the engineer has left it.
  const messages: Message[] = problem
    ? [{ severity: 'error', message: labelled(label, problemText(problem)) }]
    : touched || text.trim() !== ''
      ? [...issues]
      : [];
  const severity = severityOf(messages);
  const hintId = `${id}-hint`;
  const messagesId = `${id}-messages`;
  const describedBy = [hint ? hintId : '', messages.length > 0 ? messagesId : ''].filter(Boolean).join(' ');

  return (
    <Field label={label} htmlFor={id} hint={hint} hintId={hintId} messages={messages} messagesId={messagesId}>
      <div className={severity ? `input-group input-group--${severity}` : 'input-group'}>
        <input
          id={id}
          className="input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          // A locked field shows the stored value as-is, not text typed earlier (e.g. "5,5").
          value={readOnly ? toInputText(value) : text}
          readOnly={readOnly}
          aria-invalid={severity === 'error'}
          aria-describedby={describedBy || undefined}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => setTouched(true)}
        />
        {unit ? <span className="input-group__unit">{unit}</span> : null}
      </div>
    </Field>
  );
}
