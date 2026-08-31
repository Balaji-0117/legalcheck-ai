/**
 * Deterministic Validators Module
 * Performs deterministic pattern, unit, MRP, date, and contact detail validation.
 * Returns { status: 'PASS'|'FAIL'|'WARNING'|'NOT_APPLICABLE'|'UNVERIFIABLE', reason: string, confidence: number }
 */

const { REGEX_PATTERNS } = require('../extraction/patterns');

function evaluateRule(rule, product = {}, ocrData = {}) {
  const fieldKey = rule.field;
  const fieldValue = product[fieldKey];
  // Use explicit check — don't default 0.0 to 0.85 (0 means OCR genuinely failed)
  const ocrConfidence = (ocrData.confidence !== undefined && ocrData.confidence !== null)
    ? ocrData.confidence
    : 0.85;
  const ocrHasText = ocrData.raw_text && ocrData.raw_text.trim().length > 10;

  // If OCR produced no text at all OR confidence is very low → UNVERIFIABLE (not FAIL)
  if ((!ocrHasText || ocrConfidence < 0.20) && (!fieldValue || !fieldValue.value)) {
    return {
      status: 'UNVERIFIABLE',
      reason: `OCR returned insufficient text to verify "${rule.name}" declaration. Image may be blurry, partially obscured, or only one panel was scanned.`,
      confidence: ocrConfidence
    };
  }

  // Low confidence warning threshold (0.20–0.45) — warn but don't auto-fail
  if (ocrConfidence < 0.45 && (!fieldValue || !fieldValue.value)) {
    return {
      status: 'UNVERIFIABLE',
      reason: 'OCR confidence is too low to conclusively verify presence or absence of this declaration.',
      confidence: ocrConfidence
    };
  }


  switch (rule.rule_id) {
    case 'LM-001': // Manufacturer / Packer / Importer
      if (!fieldValue || !fieldValue.value || String(fieldValue.value).trim().length < 4) {
        return {
          status: 'FAIL',
          reason: 'Name and complete address of Manufacturer, Packer, or Importer missing as required under Rule 6(1)(a).',
          confidence: 0.92
        };
      }
      return {
        status: 'PASS',
        reason: `Manufacturer/Packer declared: "${String(fieldValue.value).substring(0, 45)}..."`,
        confidence: fieldValue.confidence || 0.94
      };

    case 'LM-002': // Common / Generic Name
      if (!fieldValue || !fieldValue.value || String(fieldValue.value).trim().length === 0) {
        return {
          status: 'FAIL',
          reason: 'Common or generic name of packaged commodity missing as required under Rule 6(1)(b).',
          confidence: 0.94
        };
      }
      return {
        status: 'PASS',
        reason: `Generic product name declared: "${fieldValue.value}"`,
        confidence: fieldValue.confidence || 0.96
      };

    case 'LM-003': // Net Quantity
      if (!fieldValue || !fieldValue.value) {
        return {
          status: 'FAIL',
          reason: 'Net quantity declaration missing on package as required under Rule 6(1)(c).',
          confidence: 0.93
        };
      }
      if (!fieldValue.unit || !['g', 'kg', 'ml', 'l', 'n', 'pcs'].includes(String(fieldValue.unit).toLowerCase())) {
        return {
          status: 'WARNING',
          reason: `Net quantity declared ("${fieldValue.raw_text || fieldValue.value}") uses non-standard SI unit notation.`,
          confidence: 0.78
        };
      }
      return {
        status: 'PASS',
        reason: `Valid Net Quantity declared in SI units: "${fieldValue.raw_text || fieldValue.value + ' ' + fieldValue.unit}"`,
        confidence: fieldValue.confidence || 0.95
      };

    case 'LM-004': // MRP
      if (!fieldValue || fieldValue.value === null || fieldValue.value === undefined) {
        return {
          status: 'FAIL',
          reason: 'Maximum Retail Price (MRP) declaration missing on package as required under Rule 6(1)(e).',
          confidence: 0.95
        };
      }
      if (fieldValue.inclusive_of_taxes === false) {
        return {
          status: 'WARNING',
          reason: `MRP declared ("${fieldValue.raw_text || ('₹' + fieldValue.value)}") is missing mandatory statutory phrase "incl. of all taxes".`,
          confidence: 0.85
        };
      }
      return {
        status: 'PASS',
        reason: `MRP follows prescribed statutory format: "${fieldValue.raw_text || ('₹' + fieldValue.value)}"`,
        confidence: fieldValue.confidence || 0.96
      };

    case 'LM-005': // Manufacturing Date
      if (!fieldValue || (!fieldValue.value && !fieldValue.raw_text)) {
        return {
          status: 'FAIL',
          reason: 'Month & Year of manufacture / packing date missing as required under Rule 6(1)(d).',
          confidence: 0.91
        };
      }
      return {
        status: 'PASS',
        reason: `Manufacturing / Packing Date declared: "${fieldValue.raw_text || fieldValue.value}"`,
        confidence: fieldValue.confidence || 0.93
      };

    case 'LM-006': // Consumer Care
      if (!fieldValue || (!fieldValue.phone && !fieldValue.email && !fieldValue.raw_text)) {
        return {
          status: 'FAIL',
          reason: 'Consumer care contact details (phone number, email address, or office address) missing under Rule 6(2).',
          confidence: 0.93
        };
      }
      return {
        status: 'PASS',
        reason: `Consumer Care details declared: "${fieldValue.raw_text || fieldValue.phone || fieldValue.email}"`,
        confidence: fieldValue.confidence || 0.94
      };

    case 'LM-007': // Country of Origin
      if (!fieldValue || !fieldValue.country) {
        return {
          status: 'FAIL',
          reason: 'Country of origin declaration missing on imported packaged commodity as required under Rule 6(1)(aa).',
          confidence: 0.92
        };
      }
      return {
        status: 'PASS',
        reason: `Country of origin declared: "${fieldValue.country}"`,
        confidence: fieldValue.confidence || 0.95
      };

    case 'LM-008': // Best Before / Expiry
      if (!fieldValue || (!fieldValue.value && !fieldValue.raw_text)) {
        return {
          status: 'FAIL',
          reason: 'Best Before / Expiry declaration missing for consumable packaged product.',
          confidence: 0.88
        };
      }
      return {
        status: 'PASS',
        reason: `Best Before / Expiry declared: "${fieldValue.raw_text || fieldValue.value}"`,
        confidence: fieldValue.confidence || 0.90
      };

    case 'LM-009': // Unit Sale Price
      if (!fieldValue || (!fieldValue.value && !fieldValue.raw_text)) {
        return {
          status: 'FAIL',
          reason: 'Unit Sale Price declaration (e.g. ₹0.10/ml or ₹100/kg) missing as mandated under Rule 6(1)(11).',
          confidence: 0.91
        };
      }
      return {
        status: 'PASS',
        reason: `Unit Sale Price declared: "${fieldValue.raw_text || fieldValue.value}"`,
        confidence: fieldValue.confidence || 0.93
      };

    default:
      if (!fieldValue) {
        return {
          status: 'FAIL',
          reason: `Mandatory declaration ${rule.name} not found.`,
          confidence: 0.85
        };
      }
      const textVal = (fieldValue && typeof fieldValue === 'object') ? (fieldValue.raw_text || fieldValue.value) : fieldValue;
      return {
        status: 'PASS',
        reason: `Declaration detected: "${textVal}"`,
        confidence: 0.90
      };
  }
}

module.exports = {
  evaluateRule
};
