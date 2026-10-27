import type { Message } from '../ui/messages';
import { frenchSpacing } from '../ui/typography';

interface IssueListProps {
  messages: readonly Message[];
  id?: string | undefined;
}

/** Validation messages; severity is conveyed by icon and hidden text, not colour alone. */
export function IssueList({ messages, id }: IssueListProps) {
  if (messages.length === 0) return null;
  return (
    <ul className="issues" id={id}>
      {messages.map((m, index) => (
        <li key={`${index}-${m.message}`} className={`issue issue--${m.severity}`}>
          <span className="issue__icon" aria-hidden="true">
            {m.severity === 'error' ? '×' : '!'}
          </span>
          <span>
            <span className="visually-hidden">{m.severity === 'error' ? 'Erreur : ' : 'Avertissement : '}</span>
            {frenchSpacing(m.message)}
          </span>
        </li>
      ))}
    </ul>
  );
}
