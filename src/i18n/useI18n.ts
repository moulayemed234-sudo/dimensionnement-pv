import { useMemo } from 'react';
import type { Locale } from '../engine/messages';
import type { ParseProblem } from '../ui/numbers';
import { frenchSpacing } from '../ui/typography';
import { useSettingsStore } from './settings';
import { STRINGS, type StringKey } from './strings';

export type Vars = Record<string, string | number>;

export interface I18n {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  /** Translated text with {placeholders} filled in. */
  t: (key: StringKey, vars?: Vars) => string;
  /** "Label : message" in French, "Label: message" in Arabic. */
  labelled: (label: string, message: string) => string;
  /** Final typography pass for display (French no-break spaces). */
  text: (value: string) => string;
  /** Why typed text can't be read as a number. */
  problemText: (problem: ParseProblem) => string;
}

export function makeI18n(locale: Locale): I18n {
  const dict = STRINGS[locale];
  const t = (key: StringKey, vars?: Vars) =>
    dict[key].replace(/\{(\w+)\}/g, (match, name: string) => (vars && name in vars ? String(vars[name]) : match));
  return {
    locale,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    t,
    labelled: (label, message) => (locale === 'fr' ? `${label} : ${message}` : `${label}: ${message}`),
    text: (value) => (locale === 'fr' ? frenchSpacing(value) : value),
    problemText: (problem) =>
      problem.kind === 'ambiguous' ? t('parse.ambiguous', { a: problem.asThousands, b: problem.asDecimal }) : t('parse.notNumber'),
  };
}

/** The interface language, re-rendering when the engineer switches it. */
export function useI18n(): I18n {
  const locale = useSettingsStore((state) => state.locale);
  return useMemo(() => makeI18n(locale), [locale]);
}
