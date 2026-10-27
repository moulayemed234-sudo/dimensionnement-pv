import type { IssueSeverity } from '../engine/types';

/** Anything shown in an issue list: an engine ValidationIssue or a UI parse message. */
export interface Message {
  severity: IssueSeverity;
  message: string;
}

/** The most severe level among messages, used to colour the related control. */
export function severityOf(messages: readonly Message[]): IssueSeverity | null {
  if (messages.some((m) => m.severity === 'error')) return 'error';
  return messages.length > 0 ? 'warning' : null;
}
