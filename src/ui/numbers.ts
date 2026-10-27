/** Number display and entry helpers for the French UI. Pure functions, no React. */

const formatters = new Map<string, Intl.NumberFormat>();

function format(value: number, minDecimals: number, maxDecimals: number): string {
  const key = `${minDecimals}:${maxDecimals}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
    formatters.set(key, formatter);
  }
  // fr-FR groups thousands with a narrow no-break space; a plain one prints in every font, PDFs included.
  return formatter.format(value).replace(/ /g, ' ');
}

/** "1 234,5". Rounds to nearest; use for inputs and shares, never for equipment sizes. */
export function formatNumber(value: number, maxDecimals = 0): string {
  return format(value, 0, maxDecimals);
}

/**
 * Rounds UP to `decimals` places and shows exactly that many, so a displayed
 * size never understates what must be installed.
 * @example formatUp(293.21) // "294"
 */
export function formatUp(value: number, decimals = 0): string {
  const factor = 10 ** decimals;
  // toPrecision strips float noise first: 2.6 * 100 is 260.00000000000003, which must not ceil to 261.
  const roundedUp = Math.ceil(Number((value * factor).toPrecision(12))) / factor;
  return format(roundedUp, decimals, decimals);
}

/** 0.9 → "90 %". */
export function formatPercent(ratio: number): string {
  return `${formatNumber(ratio * 100, 1)} %`;
}

/** Text shown in an input for a stored value, with a decimal comma; empty for NaN or a missing value. */
export function toInputText(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value).replace('.', ',') : '';
}

export interface ParsedInput {
  /** NaN when the text is empty or unreadable. */
  value: number;
  /** Why the text was rejected, to show after "Label : ", or null. */
  problem: string | null;
}

const DECIMAL = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;
// Thousands separated by spaces, the French convention: "1 500" or "12 000,5".
const SPACE_GROUPED = /^[+-]?\d{1,3}(?:[   ]\d{3})+(?:[.,]\d+)?$/;
// "1,500" or "1.500" means 1500 to some engineers and 1.5 to others; refuse to guess.
const AMBIGUOUS_THOUSANDS = /^[+-]?[1-9]\d{0,2}[.,]\d{3}$/;

/**
 * Reads what an engineer typed. Accepts "," or "." as the decimal separator and
 * spaces between thousands. Empty text is NaN with no problem, so the engine's
 * own "saisissez un nombre" check applies once the value is required.
 */
export function parseDecimalInput(text: string): ParsedInput {
  let normalized = text.trim();
  if (normalized === '') return { value: Number.NaN, problem: null };
  if (SPACE_GROUPED.test(normalized)) normalized = normalized.replace(/[   ]/g, '');

  if (AMBIGUOUS_THOUSANDS.test(normalized)) {
    const asThousands = normalized.replace(/[.,]/, '');
    const asDecimal = toInputText(Number(normalized.replace(',', '.')));
    return { value: Number.NaN, problem: `valeur ambiguë, écrivez ${asThousands} ou ${asDecimal}.` };
  }
  if (!DECIMAL.test(normalized)) {
    return { value: Number.NaN, problem: 'saisissez un nombre (virgule ou point pour les décimales).' };
  }
  return { value: Number(normalized.replace(',', '.')), problem: null };
}
