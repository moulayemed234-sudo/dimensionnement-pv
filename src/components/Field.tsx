import type { ReactNode } from 'react';
import type { Message } from '../ui/messages';
import { frenchSpacing } from '../ui/typography';
import { IssueList } from './IssueList';

interface FieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: ReactNode;
  hintId?: string | undefined;
  messages?: readonly Message[] | undefined;
  messagesId?: string | undefined;
}

/** Label, control, optional hint and validation messages, stacked. */
export function Field({ label, htmlFor, children, hint, hintId, messages = [], messagesId }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? (
        <div className="field__hint" id={hintId}>
          {typeof hint === 'string' ? frenchSpacing(hint) : hint}
        </div>
      ) : null}
      <IssueList id={messagesId} messages={messages} />
    </div>
  );
}
