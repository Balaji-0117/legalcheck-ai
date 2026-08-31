/**
 * Officer Recommendations & Explanations Module
 * Generates human-readable enforcement officer guidance for Legal Metrology violations.
 */

function getRecommendation(rule, status, reason) {
  if (status === 'FAIL') {
    if (rule.severity === 'HIGH') {
      return `Issue statutory enforcement notice under ${rule.legal_reference || 'Rule 6'} of Legal Metrology (Packaged Commodities) Rules, 2011. Non-declaration of mandatory ${rule.name} constitutes a major offense.`;
    } else if (rule.severity === 'MEDIUM') {
      return `Formally advise manufacturer/packer to rectify ${rule.name} formatting to comply with statutory standards under ${rule.legal_reference || 'Rule 6'}.`;
    }
    return `Note minor formatting deviation for enforcement record.`;
  }

  if (status === 'WARNING') {
    return `Re-inspect product label in optimal lighting or verify original packaging for potential ${rule.name} formatting issue.`;
  }

  if (status === 'UNVERIFIABLE') {
    return `Request manufacturer/importer documentation to verify ${rule.name} compliance.`;
  }

  return 'No action required.';
}

module.exports = {
  getRecommendation
};
