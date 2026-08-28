/**
 * Converts a number into its corresponding English ordinal word (e.g., 1 -> "1st", 2 -> "2nd").
 * @param {number} placement - The number to convert to an ordinal word.
 * @returns {string} The English ordinal word.
 */
export function getOrdinalWord(placement) {
  if (typeof placement !== 'number' || !Number.isInteger(placement) || placement < 1) {
    return String(placement); // Or throw an error, depending on desired behavior for invalid input
  }

  const s = placement % 10;
  const t = placement % 100;

  if (s === 1 && t !== 11) {
    return placement + "st";
  }
  if (s === 2 && t !== 12) {
    return placement + "nd";
  }
  if (s === 3 && t !== 13) {
    return placement + "rd";
  }
  return placement + "th";
}
