/**
 * Formats compliance check results into actionable evidence items with bounding box coordinates
 * and legal recommendations for enforcement officers.
 */

function generateEvidenceReport(checkResults, boxes = []) {
  const violations = [];
  const passedDeclarations = [];

  checkResults.forEach(check => {
    const fieldKey = check.rule.field;
    const matchingBox = boxes.find(b => b.field === fieldKey) || null;

    const evidenceItem = {
      ruleId: check.rule.id,
      field: check.rule.field,
      name: check.rule.name,
      legalSource: check.rule.source,
      severity: check.rule.severity,
      status: check.validation.status,
      reason: check.validation.reason,
      confidence: check.validation.confidence || 0.85,
      bbox: matchingBox ? matchingBox.bbox : null,
      detectedText: matchingBox ? matchingBox.text : (check.fieldValue || null)
    };

    if (check.validation.status === 'FAIL' || check.validation.status === 'WARNING') {
      evidenceItem.officerAction = getOfficerRecommendation(check.rule, check.validation);
      violations.push(evidenceItem);
    } else {
      passedDeclarations.push(evidenceItem);
    }
  });

  return {
    violations,
    passedDeclarations
  };
}

function getOfficerRecommendation(rule, validation) {
  if (rule.severity === 'HIGH') {
    return `Issue statutory notice under Rule 6 of LMPC Rules 2011. Non-declaration of mandatory ${rule.name} constitutes a major offense.`;
  } else if (rule.severity === 'MEDIUM') {
    return `Formally advise packer/manufacturer to rectify ${rule.name} declaration formatting to comply with ${rule.source}.`;
  }
  return `Note minor deviation for inspection log.`;
}

module.exports = {
  generateEvidenceReport,
  getOfficerRecommendation
};
