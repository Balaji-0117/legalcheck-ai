/**
 * Applicability Evaluator Module
 * Evaluates rule applicability based on product category, context flags (is_imported, is_consumable), and exceptions.
 * Returns { isApplicable: boolean, status: 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNVERIFIABLE', reason: string }
 */

function checkApplicability(rule, product = {}, productContext = {}) {
  const category = product.category || productContext.category || 'general_packaged_commodity';
  const isImportedContext = productContext.is_imported;

  // 1. Country of Origin Applicability (LM-007)
  if (rule.rule_id === 'LM-007') {
    if (isImportedContext === true) {
      return {
        isApplicable: true,
        status: 'APPLICABLE',
        reason: 'Country of Origin is mandatory for imported packaged commodities.'
      };
    } else if (isImportedContext === false) {
      return {
        isApplicable: false,
        status: 'NOT_APPLICABLE',
        reason: 'Country of origin requirement is exempt for verified domestic products.'
      };
    } else {
      // Import status is unknown: Check if OCR mentions import
      if (product.country_of_origin && product.country_of_origin.country && product.country_of_origin.country !== 'India') {
        return {
          isApplicable: true,
          status: 'APPLICABLE',
          reason: 'Product detected as imported from OCR text.'
        };
      }
      return {
        isApplicable: false,
        status: 'UNVERIFIABLE',
        reason: 'Imported vs Domestic status is unknown. Cannot conclusively enforce origin violation.'
      };
    }
  }

  // 2. Best Before / Expiry Applicability (LM-008)
  if (rule.rule_id === 'LM-008' || rule.applicability === 'consumable') {
    if (category === 'packaged_food' || /food|biscuit|drink|snack|oil|juice|tea|coffee/i.test(product.raw_ocr_summary || '')) {
      return {
        isApplicable: true,
        status: 'APPLICABLE',
        reason: 'Best Before / Use By declaration is mandatory for packaged food & consumable commodities.'
      };
    } else {
      return {
        isApplicable: false,
        status: 'NOT_APPLICABLE',
        reason: 'Best Before / Use By date declaration is not applicable for non-perishable general commodities.'
      };
    }
  }

  // 3. Dimensions Applicability (LM-010)
  if (rule.rule_id === 'LM-010' || rule.applicability === 'size_relevant') {
    if (/dimensions|size|cm|mm|length|width|height|area/i.test(product.raw_ocr_summary || '')) {
      return {
        isApplicable: true,
        status: 'APPLICABLE',
        reason: 'Dimensions declared on label.'
      };
    } else {
      return {
        isApplicable: false,
        status: 'NOT_APPLICABLE',
        reason: 'Dimensions declaration is not mandatory for standard non-sized packaged items.'
      };
    }
  }

  return {
    isApplicable: true,
    status: 'APPLICABLE',
    reason: 'Rule generally applies to all packaged commodities under Legal Metrology Rules.'
  };
}

module.exports = {
  checkApplicability
};
