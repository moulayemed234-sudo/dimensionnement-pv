import { useState } from 'react';
import { parseDecimalInput, toInputText } from '../ui/numbers';

export interface NumberInputState {
  text: string;
  /** Why the text can't be read as a number, or null. */
  problem: string | null;
  setText: (text: string) => void;
}

/**
 * Keeps the text being typed ("5," mid-entry) apart from the stored number.
 * Each keystroke stores the parsed value (NaN while empty or unreadable). A
 * value changed from outside (location preset, new project) replaces the text,
 * unless the text already means that number.
 */
export function useNumberInput(value: number, onChange: (value: number) => void): NumberInputState {
  const [text, setTextState] = useState(() => toInputText(value));
  const [syncedValue, setSyncedValue] = useState(value);

  if (!Object.is(value, syncedValue)) {
    setSyncedValue(value);
    if (!sameNumber(parseDecimalInput(text).value, value)) setTextState(toInputText(value));
  }

  return {
    text,
    problem: parseDecimalInput(text).problem,
    setText: (next) => {
      setTextState(next);
      onChange(parseDecimalInput(next).value);
    },
  };
}

/** Equal numbers, or both "no number" (NaN, or null after a JSON round-trip). */
function sameNumber(a: number, b: number): boolean {
  const aMissing = !Number.isFinite(a);
  const bMissing = !Number.isFinite(b);
  return aMissing || bMissing ? aMissing && bMissing : a === b;
}
