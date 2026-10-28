import { useI18n } from '../i18n/useI18n';
import type { Message } from '../ui/messages';

interface IssueListProps {
  messages: readonly Message[];
  id?: string | undefined;
}

/** Validation messages; severity is conveyed by icon and hidden text, not colour alone. */
export function IssueList({ messages, id }: IssueListProps) {
  const { t, text } = useI18n();
  if (messages.length === 0) return null;
  return (
    <ul className="issues" id={id}>
      {messages.map((m, index) => (
        <li key={`${index}-${m.message}`} className={`issue issue--${m.severity}`}>
          <span className="issue__icon" aria-hidden="true">
            {m.severity === 'error' ? '×' : '!'}
          </span>
          <span>
            <span className="visually-hidden">{m.severity === 'error' ? t('issue.error') : t('issue.warning')}</span>
            {text(m.message)}
          </span>
        </li>
      ))}
    </ul>
  );
}
