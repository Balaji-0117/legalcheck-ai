/**
 * Calculates weighted compliance score and status classification
 * for Legal Metrology Packaged Commodities inspection.
 */

const SEVERITY_WEIGHTS = {
  HIGH: 15,
  MEDIUM: 10,
  LOW: 5
};

function calculateComplianceScore(checkResults) {
  let totalPossibleScore = 0;
  let earnedScore = 0;
  let highViolationsCount = 0;
  let mediumViolationsCount = 0;
  let warningCount = 0;

  checkResults.forEach(check => {
    const weight = SEVERITY_WEIGHTS[check.rule.severity] || 10;
    totalPossibleScore += weight;

    if (check.validation.status === 'PASS') {
      earnedScore += weight;
    } else if (check.validation.status === 'WARNING') {
      earnedScore += weight * 0.5;
      warningCount++;
      if (check.rule.severity === 'HIGH') highViolationsCount++;
    } else if (check.validation.status === 'FAIL') {
      if (check.rule.severity === 'HIGH') {
        highViolationsCount++;
      } else {
        mediumViolationsCount++;
      }
    }
  });

  const percentageScore = totalPossibleScore > 0 ? Math.round((earnedScore / totalPossibleScore) * 100) : 0;

  let overallStatus = 'COMPLIANT';
  if (highViolationsCount > 0 || percentageScore < 75) {
    overallStatus = 'NON-COMPLIANT';
  } else if (percentageScore < 90 || warningCount > 0) {
    overallStatus = 'WARNING';
  }

  return {
    score: percentageScore,
    overallStatus,
    stats: {
      totalChecks: checkResults.length,
      passedChecks: checkResults.filter(c => c.validation.status === 'PASS').length,
      failedChecks: checkResults.filter(c => c.validation.status === 'FAIL').length,
      warningChecks: checkResults.filter(c => c.validation.status === 'WARNING').length,
      highSeverityViolations: highViolationsCount
    }
  };
}

module.exports = {
  calculateComplianceScore,
  SEVERITY_WEIGHTS
};
