/**
 * Standalone Legal Metrology Compliance Engine
 * Department of Consumer Affairs - Legal Metrology (Packaged Commodities) Rules, 2011
 * 
 * Main Entry Point: Exports analyzeCompliance(input)
 */

const { adaptOCRInput } = require('./adapter/ocrAdapter');
const { extractDeclarations } = require('./extraction/declarationExtractor');
const { evaluateRules } = require('./engine/ruleEngine');
const { calculateComplianceScore } = require('./engine/scoring');
const { buildEvidence } = require('./evidence/evidenceBuilder');
const { analyzeViolations } = require('./violations/violationAnalyzer');

function analyzeCompliance(input = {}) {
  const scanId = input.scan_id || `SCAN-${Math.floor(1000 + Math.random() * 9000)}`;
  const productContext = input.product_context || {};
  const rawOcrInput = input.ocr || input;

  // 1. OCR Adapter Normalization
  const normalizedOcr = adaptOCRInput(rawOcrInput);

  // 2. Declaration Extraction & Normalization
  const product = extractDeclarations(normalizedOcr, productContext);

  // 3. Rule Evaluation with Applicability & 5 States (PASS, FAIL, WARNING, NOT_APPLICABLE, UNVERIFIABLE)
  const ruleResults = evaluateRules(product, normalizedOcr, productContext);

  // 4. Weighted Compliance Scoring
  const compliance = calculateComplianceScore(ruleResults);

  // 5. Evidence Building with Bounding Box Coordinates
  const evidenceList = buildEvidence(ruleResults, product, normalizedOcr);

  // 6. Violation & Warning Analysis
  const { violations, warnings } = analyzeViolations(ruleResults, evidenceList);

  return {
    scan_id: scanId,
    disclaimer: "SIH 2026 Legal Metrology Inspection Assistance Tool. Automated findings must be verified by an authorized enforcement officer under Legal Metrology Rules, 2011.",
    product: product,
    compliance: compliance,
    rule_results: ruleResults,
    violations: violations,
    warnings: warnings,
    evidence: evidenceList
  };
}

module.exports = {
  analyzeCompliance,
  adaptOCRInput,
  extractDeclarations,
  evaluateRules,
  calculateComplianceScore,
  analyzeViolations,
  buildEvidence
};
