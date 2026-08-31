/**
 * Core Rule Evaluator Pipeline
 * Evaluates active rules against normalized product declarations using applicability & deterministic validators.
 */

const { loadRules } = require('../rules/ruleLoader');
const { checkApplicability } = require('./applicability');
const { evaluateRule } = require('./validators');

function evaluateRules(product = {}, ocrData = {}, productContext = {}) {
  const rules = loadRules();
  
  return rules.map(rule => {
    // 1. Applicability Check
    const appResult = checkApplicability(rule, product, productContext);

    if (appResult.status === 'NOT_APPLICABLE') {
      return {
        rule_id: rule.rule_id,
        legal_reference: rule.legal_reference,
        field: rule.field,
        name: rule.name,
        rule: rule,
        status: 'NOT_APPLICABLE',
        reason: appResult.reason,
        confidence: 1.0
      };
    }

    if (appResult.status === 'UNVERIFIABLE') {
      return {
        rule_id: rule.rule_id,
        legal_reference: rule.legal_reference,
        field: rule.field,
        name: rule.name,
        rule: rule,
        status: 'UNVERIFIABLE',
        reason: appResult.reason,
        confidence: 0.70
      };
    }

    // 2. Deterministic Rule Validation
    const valResult = evaluateRule(rule, product, ocrData);

    return {
      rule_id: rule.rule_id,
      legal_reference: rule.legal_reference,
      field: rule.field,
      name: rule.name,
      rule: rule,
      status: valResult.status,
      reason: valResult.reason,
      confidence: valResult.confidence
    };
  });
}

module.exports = {
  evaluateRules
};
