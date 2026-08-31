/**
 * Transparent Compliance Scoring Module
 * Configurable weighted scoring excluding NOT_APPLICABLE & UNVERIFIABLE items from unfair penalties.
 */

const SEVERITY_WEIGHTS = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

function calculateComplianceScore(ruleResults) {
  let applicableWeightSum = 0;
  let earnedWeightSum = 0;

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  let notApplicableCount = 0;
  let unverifiableCount = 0;

  ruleResults.forEach(res => {
    const status = res.status;
    const weight = SEVERITY_WEIGHTS[res.rule.severity] || 2;

    if (status === 'NOT_APPLICABLE') {
      notApplicableCount++;
      return; // Exclude exempt rules from denominator
    }

    if (status === 'UNVERIFIABLE') {
      unverifiableCount++;
      // Neutral handling: do not count in weight penalty
      return;
    }

    applicableWeightSum += weight;

    if (status === 'PASS') {
      earnedWeightSum += weight;
      passCount++;
    } else if (status === 'WARNING') {
      earnedWeightSum += weight * 0.5; // Partial score
      warningCount++;
    } else if (status === 'FAIL') {
      failCount++;
    }
  });

  // When all non-exempt rules are UNVERIFIABLE, score is meaningless — return null/special state
  const percentageScore = applicableWeightSum > 0
    ? Math.round((earnedWeightSum / applicableWeightSum) * 100)
    : (unverifiableCount > 0 ? null : 100); // null = scan could not determine score (OCR failed)

  let overallStatus;
  if (percentageScore === null) {
    overallStatus = 'UNVERIFIABLE'; // OCR produced no usable text
  } else if (failCount > 0 || (percentageScore !== null && percentageScore < 75)) {
    overallStatus = 'NON_COMPLIANT';
  } else if (percentageScore < 90 || warningCount > 0 || unverifiableCount > 0) {
    overallStatus = 'PARTIALLY_COMPLIANT';
  } else {
    overallStatus = 'COMPLIANT';
  }

  return {
    score: percentageScore !== null ? percentageScore : 0,
    score_raw: percentageScore,
    status: overallStatus,
    passed_rules: passCount,
    failed_rules: failCount,
    warnings: warningCount,
    not_applicable: notApplicableCount,
    unverifiable: unverifiableCount
  };
}

module.exports = {
  calculateComplianceScore,
  SEVERITY_WEIGHTS
};
