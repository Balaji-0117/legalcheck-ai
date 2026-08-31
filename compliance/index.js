/**
 * Compliance Rule Engine Entry Point
 * LegalCheck AI - Packaged Commodity Inspector
 */

const rules = require('./rules/rules.json');
const { validateDeclaration } = require('./validators/declarationValidator');
const { calculateComplianceScore } = require('./scoring/scoreCalculator');
const { generateEvidenceReport } = require('./evidence/evidenceProcessor');

function runComplianceInspection(extractedData) {
  const { fields = {}, rawText = '', boxes = [], readability = {} } = extractedData;

  const checkResults = rules.map(rule => {
    const validation = validateDeclaration(rule, fields, rawText, readability);
    return {
      rule,
      fieldValue: fields[rule.field] || null,
      validation
    };
  });

  const scoreData = calculateComplianceScore(checkResults);
  const evidenceData = generateEvidenceReport(checkResults, boxes);

  return {
    score: scoreData.score,
    overallStatus: scoreData.overallStatus,
    stats: scoreData.stats,
    violations: evidenceData.violations,
    passedDeclarations: evidenceData.passedDeclarations,
    allChecks: checkResults
  };
}

module.exports = {
  runComplianceInspection,
  rules
};
