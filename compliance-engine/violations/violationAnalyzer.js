/**
 * Violation Analyzer Module
 * Extracts FAIL, WARNING, and UNVERIFIABLE items into human-readable violation objects.
 */

const { getRecommendation } = require('./explanations');

function analyzeViolations(ruleResults, evidenceList) {
  const violations = [];
  const warnings = [];
  let violationCounter = 1;

  ruleResults.forEach(res => {
    const status = res.status;
    const rule = res.rule;
    const ev = evidenceList.find(e => e.rule_id === res.rule_id) || {};

    if (status === 'FAIL') {
      violations.push({
        violation_id: `V-${String(violationCounter++).padStart(4, '0')}`,
        rule_id: res.rule_id,
        legal_reference: res.legal_reference || rule.legal_reference,
        field: res.field,
        status: 'FAIL',
        title: `${res.name} Non-Compliant`,
        reason: res.reason,
        severity: rule.severity || 'HIGH',
        confidence: res.confidence,
        evidence: {
          matched_text: ev.matched_text || null,
          bbox: ev.bbox || null,
          image_id: ev.image_id || 'IMG-001'
        },
        recommendation: getRecommendation(rule, 'FAIL', res.reason)
      });
    } else if (status === 'WARNING' || status === 'UNVERIFIABLE') {
      warnings.push({
        rule_id: res.rule_id,
        legal_reference: res.legal_reference || rule.legal_reference,
        field: res.field,
        status: status,
        title: `${res.name} (${status})`,
        reason: res.reason,
        severity: rule.severity || 'MEDIUM',
        confidence: res.confidence,
        evidence: {
          matched_text: ev.matched_text || null,
          bbox: ev.bbox || null,
          image_id: ev.image_id || 'IMG-001'
        },
        recommendation: getRecommendation(rule, status, res.reason)
      });
    }
  });

  return {
    violations,
    warnings
  };
}

module.exports = {
  analyzeViolations
};
