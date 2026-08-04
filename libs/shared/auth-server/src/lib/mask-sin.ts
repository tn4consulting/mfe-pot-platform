const VISIBLE_DIGIT_COUNT = 3;
const MASK_CHAR = '•';

/**
 * Masks all but the last 3 digits of a SIN, preserving any separators
 * (dashes/spaces) so the shape stays readable -- never render a full SIN in
 * any UI or log line. Works regardless of whether the SIN is formatted with
 * separators (`123-456-789`) or not (`123456789`).
 */
export function maskSin(sin: string): string {
  const digitIndexes = [...sin].reduce<number[]>((acc, ch, i) => {
    if (/\d/.test(ch)) {
      acc.push(i);
    }
    return acc;
  }, []);

  const visibleFromIndex =
    digitIndexes.length > VISIBLE_DIGIT_COUNT
      ? digitIndexes[digitIndexes.length - VISIBLE_DIGIT_COUNT]
      : digitIndexes[0];

  return [...sin]
    .map((ch, i) => (/\d/.test(ch) && i < visibleFromIndex ? MASK_CHAR : ch))
    .join('');
}
