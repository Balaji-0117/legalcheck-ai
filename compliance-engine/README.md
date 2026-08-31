# LegalCheck AI — Standalone Legal Metrology Compliance Engine

**SIH 2026 Problem Statement ID:** SIH26034  
**Title:** Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels.  
**Organization:** Ministry of Consumer Affairs, Food & Public Distribution  
**Department:** Department of Consumer Affairs (DoCA), Govt. of India  

---

## 🏛️ Overview

The **LegalCheck AI Compliance Engine** is a high-performance, modular, data-driven compliance checking system. It processes raw OCR output from packaged commodity labels, normalizes product declarations into a structured schema, and deterministically evaluates compliance against the **Legal Metrology (Packaged Commodities) Rules, 2011**.

### 🌟 Key Features
- **PaddleOCR & OCR Provider Independent**: Works seamlessly with PaddleOCR, EasyOCR, or raw JSON text blocks using an adapter pattern ([`ocrAdapter.js`](file:///c:/Users/BALAJI/OneDrive/Desktop/legalcheck-ai/compliance-engine/adapter/ocrAdapter.js)).
- **Five Evaluation States**: `PASS`, `FAIL`, `WARNING`, `NOT_APPLICABLE`, `UNVERIFIABLE`.
- **Zero Paid AI Dependency**: 100% deterministic logic using regex, unit parsers, date normalizers, and weighted applicability scoring.
- **Evidence Traceability**: Links every violation to exact matched text, confidence scores, and bounding box coordinates `[x, y, w, h]`.
- **Explainable Violations**: Provides statutory legal references (`Rule 6(1)(a)-(g)`, `Rule 6(11)`, `Rule 6(2)`, etc.) and actionable recommendations for enforcement officers.

---

## 🏗️ Architecture

```text
compliance-engine/
│
├── rules/
│   ├── rules.json             # Data-driven Legal Metrology Rule Dataset
│   └── ruleLoader.js          # Dynamic Rule Configurator & Loader
│
├── extraction/
│   ├── patterns.js            # Centralized Regex Patterns & Keywords
│   ├── dateParser.js          # ISO Date Normalizer & MFD/EXP Separator
│   ├── normalizer.js          # MRP, Net Qty & Country Normalizer
│   └── declarationExtractor.js# Structured Product Declaration Parser
│
├── engine/
│   ├── applicability.js       # Context & Category Exemption Filter
│   ├── validators.js          # Deterministic Rule Evaluators
│   ├── scoring.js             # Weighted Compliance Score Calculator
│   └── ruleEngine.js          # Core Rule Evaluation Pipeline
│
├── violations/
│   ├── severity.js            # Centralized Severity Mappings (HIGH/MEDIUM/LOW)
│   ├── explanations.js        # Statutory Recommendations for Officers
│   └── violationAnalyzer.js   # Human-Readable Violation Generator
│
├── evidence/
│   ├── bboxHandler.js         # Bounding Box Coordinate Matcher [x, y, w, h]
│   └── evidenceBuilder.js     # Evidence Traceability Builder
│
├── schemas/
│   ├── ocrSchema.js           # Standardized OCR Input Contract
│   ├── productSchema.js       # Extracted Product JSON Contract
│   └── violationSchema.js     # Violation & Warning Schema
│
├── adapter/
│   └── ocrAdapter.js          # Multi-OCR Provider Adapter
│
├── tests/
│   └── complianceEngine.test.js # 13+ Automated Unit Scenarios
│
├── index.js                   # Main Programmatic Export analyzeCompliance()
└── README.md                  # Integration & System Documentation
```

---

## 📡 API Contract & Usage

### 1. HTTP Endpoint: `POST /api/compliance/analyze`

#### Sample Input Payload:
```json
{
  "scan_id": "SCAN-2026-9901",
  "product_context": {
    "is_imported": true,
    "category": "packaged_food"
  },
  "ocr": {
    "image_id": "IMG-001",
    "text_blocks": [
      {
        "text": "TATA GLUCOSE DRINK",
        "confidence": 0.98,
        "bbox": [10, 10, 200, 30]
      },
      {
        "text": "Mfg by: Tata Consumer Products Ltd, Kolkata 700020",
        "confidence": 0.95,
        "bbox": [10, 50, 400, 30]
      },
      {
        "text": "Net Qty: 200 ml",
        "confidence": 0.96,
        "bbox": [10, 90, 150, 30]
      },
      {
        "text": "MRP ₹20.00 incl. of all taxes",
        "confidence": 0.98,
        "bbox": [10, 130, 250, 30]
      },
      {
        "text": "MFD: 06/2026",
        "confidence": 0.94,
        "bbox": [10, 170, 150, 30]
      },
      {
        "text": "Consumer Care: 1800-209-5000",
        "confidence": 0.96,
        "bbox": [10, 250, 350, 30]
      }
    ]
  }
}
```

#### Sample Output Response:
```json
{
  "success": true,
  "data": {
    "scan_id": "SCAN-2026-9901",
    "disclaimer": "SIH 2026 Legal Metrology Inspection Assistance Tool. Automated findings must be verified by an authorized enforcement officer under Legal Metrology Rules, 2011.",
    "product": {
      "product_name": { "value": "TATA GLUCOSE DRINK", "confidence": 0.95, "bbox": [10, 10, 200, 30] },
      "category": "packaged_food",
      "net_quantity": { "value": 200, "unit": "ml", "raw_text": "Net Qty: 200 ml", "confidence": 0.96 },
      "mrp": { "value": 20, "currency": "INR", "raw_text": "MRP ₹20.00 incl. of all taxes", "inclusive_of_taxes": true }
    },
    "compliance": {
      "score": 92,
      "status": "PARTIALLY_COMPLIANT",
      "passed_rules": 6,
      "failed_rules": 1,
      "warnings": 0,
      "not_applicable": 1,
      "unverifiable": 0
    },
    "violations": [
      {
        "violation_id": "V-0001",
        "rule_id": "LM-007",
        "legal_reference": "Rule 6(1)(aa)",
        "field": "country_of_origin",
        "status": "FAIL",
        "title": "Country of Origin Declaration Non-Compliant",
        "reason": "Country of origin declaration missing on imported packaged commodity as required under Rule 6(1)(aa).",
        "severity": "HIGH",
        "recommendation": "Issue statutory enforcement notice under Rule 6(1)(aa) of Legal Metrology (Packaged Commodities) Rules, 2011."
      }
    ]
  }
}
```

---

### 2. Programmatic Direct API: `analyzeCompliance(input)`

```javascript
const { analyzeCompliance } = require('./compliance-engine');

const result = analyzeCompliance({
  scan_id: 'SCAN-LOCAL-100',
  ocr: {
    rawText: 'TATA GLUCOSE DRINK\nMfg by: Tata Consumer Products Ltd\nNet Qty: 200 ml\nMRP ₹20.00 incl. of all taxes'
  }
});

console.log('Score:', result.compliance.score);
console.log('Violations:', result.violations);
```

---

## 🧪 Unit Test Suite

Run the automated test suite covering 13 core Legal Metrology scenarios:

```bash
node compliance-engine/tests/complianceEngine.test.js
```

### Output:
```text
=======================================================
   RUNNING LEGALCHECK AI COMPLIANCE ENGINE TEST SUITE 
=======================================================

✓ PASS: Test 1: Fully Compliant Food Packet
✓ PASS: Test 2: Missing MRP Declaration
✓ PASS: Test 3: Missing Manufacturer Details
✓ PASS: Test 4: Missing Net Quantity Declaration
✓ PASS: Test 5: Missing Consumer Care Details
✓ PASS: Test 6: Imported Product Without Country of Origin
✓ PASS: Test 7: Domestic Product Without Country of Origin
✓ PASS: Test 8: Missing Best Before on Packaged Food
✓ PASS: Test 9: Invalid MRP Format (Missing Taxes Mention)
✓ PASS: Test 10: Quantity Recognition (100g vs 100 g)
✓ PASS: Test 11: MRP Format Recognition (M.R.P. ₹50/-)
✓ PASS: Test 12: Manufacturing Date vs Expiry Date Parsing
✓ PASS: Test 13: Low OCR Confidence Item Flagged as UNVERIFIABLE

=======================================================
   TEST SUITE COMPLETE: 13/13 TESTS PASSED
=======================================================
```

---

## ⚖️ SIH 2026 Prototype Disclaimer

This software system is developed as an **SIH 2026 MVP/Prototype assistance tool** for the Department of Consumer Affairs (DoCA). Automated compliance scans provide preliminary inspection assistance and evidence extraction for enforcement officers. Final legal determinations must be confirmed by an authorized Legal Metrology Inspector in accordance with the Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011.
