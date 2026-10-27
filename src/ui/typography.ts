/**
 * French typography: a no-break space before ":", ";", "!", "?", "%" and inside
 * « guillemets », so a wrapped line never starts with punctuation. Safe to apply twice.
 */
export function frenchSpacing(text: string): string {
  return text.replace(/ ([:;!?%»])/g, ' $1').replace(/« /g, '« ');
}
