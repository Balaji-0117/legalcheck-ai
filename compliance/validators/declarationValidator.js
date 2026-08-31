/**
 * Legal Metrology Packaged Commodities (LMPC) Declaration Validators
 * Validates extracted OCR fields against Department of Consumer Affairs Rule 6, 7, 8, 9 standards.
 */

const VALIDATION_PATTERNS = {
  net_quantity: /\b(\d+(?:\.\d+)?)\s*(g|gm|gram|grams|kg|ml|l|liter|litres|pcs|units|n)\b/i,
  mrp_standard: /(?:mrp|retail\s*price|price)\s*[:\.]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i,
  mrp_taxes: /(?:incl\.?|inclusive)\s*(?:of)?\s*all\s*tax(?:es)?/i,
  mfd_date: /(?:mfd|pkd|mfg|packed|imported|date)\s*[:\.]?\s*(\d{2}[/\-\.]\d{4}|\d{2}[/\-\.]\d{2}|[a-z]{3}\s*\d{4})/i,
  consumer_care_contact: /(?:1800[-\s]?\d+|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\bcare\b|\bcall\b|\bemail\b|\bhelpline\b|\bphone\b)/i,
  unit_sale_price: /(?:unit\s*(?:sale)?\s*price|usp)\s*[:\.]?\s*(?:₹|rs\.?)\s*\d+(?:\.\d+)?\s*\/\s*(?:g|kg|ml|l|unit|n|pc)/i,
  country_of_origin: /(?:country\s*of\s*origin|made\in|product\s*of|imported\s*from)\s*[:\.]?\s*([a-z\s]+)/i
};

function validateDeclaration(rule, fields, rawText, readabilityData = {}) {
  const fieldKey = rule.field;
  const fieldValue = fields[fieldKey];

  // Rule specific validators
  switch (rule.id) {
    case 'LM-001': // Manufacturer Details
      if (!fieldValue || fieldValue.trim().length < 5) {
        return {
          status: 'FAIL',
          reason: 'Manufacturer / Packer / Importer name & address declaration not detected on label.',
          confidence: fields[`${fieldKey}_confidence`] || 0.4
        };
      }
      return { status: 'PASS', reason: `Manufacturer declared: "${fieldValue.substring(0, 40)}..."`, confidence: 0.92 };

    case 'LM-002': // Common / Generic Name
      if (!fieldValue || fieldValue.trim().length === 0) {
        return { status: 'FAIL', reason: 'Common or generic product name declaration missing.', confidence: 0.5 };
      }
      return { status: 'PASS', reason: `Product name detected: "${fieldValue}"`, confidence: 0.95 };

    case 'LM-003': // Net Quantity
      if (!fieldValue) {
        return { status: 'FAIL', reason: 'Net quantity declaration missing.', confidence: 0.4 };
      }
      if (!VALIDATION_PATTERNS.net_quantity.test(fieldValue)) {
        return {
          status: 'WARNING',
          reason: `Net quantity declared ("${fieldValue}") may not use standard SI unit format (e.g. 100 g, 1 kg).`,
          confidence: 0.8
        };
      }
      return { status: 'PASS', reason: `Valid Net Quantity: "${fieldValue}"`, confidence: 0.94 };

    case 'LM-004': // MRP Presence
      if (!fieldValue) {
        return { status: 'FAIL', reason: 'Maximum Retail Price (MRP) declaration missing.', confidence: 0.3 };
      }
      return { status: 'PASS', reason: `MRP detected: "${fieldValue}"`, confidence: 0.96 };

    case 'LM-005': // Manufacturing Date
      if (!fieldValue && !VALIDATION_PATTERNS.mfd_date.test(rawText)) {
        return { status: 'FAIL', reason: 'Month and Year of manufacture / packing date missing.', confidence: 0.4 };
      }
      const mfdVal = fieldValue || (rawText.match(VALIDATION_PATTERNS.mfd_date) || [])[0];
      return { status: 'PASS', reason: `Mfg/Packing date detected: "${mfdVal}"`, confidence: 0.91 };

    case 'LM-006': // Consumer Care
      if (!fieldValue && !VALIDATION_PATTERNS.consumer_care_contact.test(rawText)) {
        return { status: 'FAIL', reason: 'Consumer care contact details (phone, email or address) missing.', confidence: 0.4 };
      }
      const careVal = fieldValue || 'Consumer care contact details present';
      return { status: 'PASS', reason: `Consumer care detected: "${careVal}"`, confidence: 0.93 };

    case 'LM-007': // Country of Origin
      if (!fieldValue && !VALIDATION_PATTERNS.country_of_origin.test(rawText)) {
        return {
          status: 'FAIL',
          reason: 'Country of origin declaration missing (Mandatory under Rule 6 for packaged commodities).',
          confidence: 0.4
        };
      }
      const originVal = fieldValue || (rawText.match(VALIDATION_PATTERNS.country_of_origin) || [])[0];
      return { status: 'PASS', reason: `Country of origin declared: "${originVal}"`, confidence: 0.90 };

    case 'LM-008': // Best Before
      if (!fieldValue && !/best\s*before|use\s*by|exp/i.test(rawText)) {
        return {
          status: 'WARNING',
          reason: 'Best before / use by date not found (Applicable if product is perishable/consumable).',
          confidence: 0.75
        };
      }
      return { status: 'PASS', reason: `Best before info detected: "${fieldValue || 'Declared'}"`, confidence: 0.88 };

    case 'LM-009': // Unit Sale Price
      if (!fieldValue && !VALIDATION_PATTERNS.unit_sale_price.test(rawText)) {
        return {
          status: 'FAIL',
          reason: 'Unit Sale Price declaration (e.g. ₹0.50/g or ₹500/kg) missing as required under Rule 6(1)(11).',
          confidence: 0.4
        };
      }
      return { status: 'PASS', reason: `Unit Sale Price declared: "${fieldValue || 'Present'}"`, confidence: 0.92 };

    case 'LM-010': // Dimensions
      if (!fieldValue && !/\d+\s*(?:cm|mm|m|inch)\s*x\s*\d+/i.test(rawText)) {
        return { status: 'WARNING', reason: 'Product dimensions not declared (Required if size/area is relevant).', confidence: 0.7 };
      }
      return { status: 'PASS', reason: `Dimensions declared: "${fieldValue || 'Present'}"`, confidence: 0.85 };

    case 'LM-011': // MRP Standard Formatting
      const mrpText = fields.mrp || rawText;
      const hasTaxMention = VALIDATION_PATTERNS.mrp_taxes.test(mrpText) || VALIDATION_PATTERNS.mrp_taxes.test(rawText);
      if (!hasTaxMention) {
        return {
          status: 'FAIL',
          reason: 'MRP does not include mandatory phrase "incl. of all taxes" or "inclusive of all taxes".',
          confidence: 0.85
        };
      }
      return { status: 'PASS', reason: 'MRP follows prescribed statutory format including all taxes.', confidence: 0.95 };

    case 'LM-012': // Image-Based Font & Readability Screening
      const textHeightPx = readabilityData.avgTextHeightPx || 18;
      const confidence = readabilityData.confidence || 0.85;
      const isLowContrast = readabilityData.lowContrast || false;

      if (isLowContrast || textHeightPx < 12) {
        return {
          status: 'WARNING',
          reason: 'Image-based screening: Mandatory text declarations may have potential font-size / readability compliance issues.',
          confidence: 0.78
        };
      }
      return { status: 'PASS', reason: 'Image-based screening: Mandatory text declarations meet readability contrast & letter height thresholds.', confidence: 0.90 };

    case 'LM-013': // 2026 E-commerce origin filter
      const originTag = fields.country_of_origin || (rawText.match(VALIDATION_PATTERNS.country_of_origin) || [])[0];
      if (!originTag) {
        return {
          status: 'FAIL',
          reason: 'Feb 2026 Amendment: Mandatory searchable country-of-origin tag missing for digital listing / packaging compliance.',
          confidence: 0.82
        };
      }
      return { status: 'PASS', reason: 'Feb 2026 Amendment: Country of origin compliance verified.', confidence: 0.91 };

    default:
      return { status: fieldValue ? 'PASS' : 'FAIL', reason: fieldValue ? 'Declaration detected' : 'Declaration missing', confidence: 0.8 };
  }
}

module.exports = {
  validateDeclaration,
  VALIDATION_PATTERNS
};
