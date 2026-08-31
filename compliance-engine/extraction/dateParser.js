/**
 * Date Parser & Validator Module
 * Differentiates Manufacturing/Packing Date vs Expiry/Best Before Date and formats to ISO standards.
 */

function parseDateString(rawStr) {
  if (!rawStr) return null;
  const str = rawStr.trim();

  // Pattern: MM/YYYY or MM-YYYY
  const m1 = str.match(/(\d{2})[/\-\.](\d{4})/);
  if (m1) {
    return {
      raw: str,
      month: parseInt(m1[1]),
      year: parseInt(m1[2]),
      iso: `${m1[2]}-${m1[1].padStart(2, '0')}`
    };
  }

  // Pattern: Month YYYY (e.g. JUN 2026)
  const m2 = str.match(/([a-z]{3})\s*(\d{4})/i);
  if (m2) {
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIdx = monthNames.indexOf(m2[1].toLowerCase()) + 1;
    if (monthIdx > 0) {
      return {
        raw: str,
        month: monthIdx,
        year: parseInt(m2[2]),
        iso: `${m2[2]}-${String(monthIdx).padStart(2, '0')}`
      };
    }
  }

  return { raw: str, month: null, year: null, iso: null };
}

module.exports = {
  parseDateString
};
