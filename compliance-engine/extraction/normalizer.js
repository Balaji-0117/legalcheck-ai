/**
 * Declaration Normalizer Module
 * Normalizes raw text values into structured JSON representation with confidence and bounding boxes.
 */

function normalizeMRP(matchObj, block = null) {
  if (!matchObj) return null;
  const val = parseFloat(matchObj[1]);
  const isInclusive = /incl|inclusive|all\s*taxes/i.test(matchObj[0] + ' ' + (matchObj[2] || ''));
  return {
    value: isNaN(val) ? null : val,
    currency: 'INR',
    raw_text: matchObj[0].trim(),
    inclusive_of_taxes: isInclusive,
    confidence: block ? (block.confidence || 0.95) : 0.92,
    bbox: block ? (block.bbox || [40, 40, 400, 30]) : null
  };
}

function normalizeNetQuantity(matchObj, block = null) {
  if (!matchObj) return null;
  const val = parseFloat(matchObj[1]);
  let unit = matchObj[2].toLowerCase();
  if (unit === 'gm' || unit === 'gram' || unit === 'grams') unit = 'g';
  if (unit === 'kilogram' || unit === 'kilograms') unit = 'kg';
  if (unit === 'ltr' || unit === 'litre' || unit === 'litres') unit = 'l';
  if (unit === 'pcs' || unit === 'units') unit = 'N';

  return {
    value: isNaN(val) ? null : val,
    unit: unit,
    raw_text: matchObj[0].trim(),
    confidence: block ? (block.confidence || 0.94) : 0.92,
    bbox: block ? (block.bbox || [40, 40, 400, 30]) : null
  };
}

function normalizeCountryOfOrigin(matchObj, block = null) {
  if (!matchObj) return null;
  const raw = matchObj[1] || matchObj[0];
  const country = /india/i.test(raw) ? 'India' : raw.trim();
  return {
    country: country,
    raw_text: matchObj[0].trim(),
    confidence: block ? (block.confidence || 0.95) : 0.90,
    bbox: block ? (block.bbox || [40, 40, 400, 30]) : null
  };
}

module.exports = {
  normalizeMRP,
  normalizeNetQuantity,
  normalizeCountryOfOrigin
};
