/**
 * Scan Controller
 * Handles multi-image upload, multi-side OCR aggregation,
 * full-dataset declaration extraction, and comprehensive rule compliance checking.
 */

const db = require('../models/db');
const { performOCRScan } = require('../../../ocr/service/ocrService');
const { extractDeclarations } = require('../../../ocr/parser/declarationExtractor');
const { runComplianceInspection } = require('../../../compliance');

async function handleScan(req, res) {
  try {
    const { sampleId } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    let imagePaths = [];
    if (files.length > 0) {
      imagePaths = files.map(f => `/uploads/${f.filename}`);
    } else if (sampleId) {
      if (sampleId === '06_multiside_packaged_tea') {
        imagePaths = [
          '/sample-images/01_compliant_biscuits.jpg',
          '/sample-images/02_missing_country_origin.jpg',
          '/sample-images/03_missing_unit_sale_price.jpg'
        ];
      } else {
        imagePaths = [`/sample-images/${sampleId}.jpg`];
      }
    } else {
      imagePaths = ['/sample-images/default.jpg'];
    }

    // =========================================================================
    // STEP 1: OCR PROCESSING ACROSS ALL UPLOADED IMAGES
    // =========================================================================
    let allSideTexts = [];
    let allSideBoxes = [];
    let confidenceSum = 0;
    let confidenceCount = 0;
    let perSideFields = {};
    let detectedEngine = 'PaddleOCR (Primary)';

    if (files.length > 0) {
      console.log(`[ScanController] Processing ${files.length} uploaded image(s) through OCR...`);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sideLabel = `Photo ${i + 1}`;
        const ocrRes = await performOCRScan(file.path, null, file.originalname);

        if (ocrRes.ocrEngine) {
          detectedEngine = ocrRes.ocrEngine;
        }

        if (ocrRes.rawText && ocrRes.rawText.trim()) {
          allSideTexts.push(`--- [PACKAGE ${sideLabel.toUpperCase()} - ${file.originalname}] ---\n${ocrRes.rawText.trim()}`);
        }

        confidenceSum += (ocrRes.confidence || 0.85);
        confidenceCount++;

        // Tag and aggregate bounding boxes with side label
        (ocrRes.boxes || []).forEach(b => {
          allSideBoxes.push({
            ...b,
            side: sideLabel,
            text: b.text.startsWith('[Photo') ? b.text : `[${sideLabel}] ${b.text}`
          });
        });

        // Merge any per-side detected fields
        Object.entries(ocrRes.fields || {}).forEach(([k, v]) => {
          if (v && !perSideFields[k]) {
            perSideFields[k] = v;
          }
        });
      }
    } else {
      // Preset sample dataset processing
      const ocrResult = await performOCRScan(null, sampleId);
      allSideTexts.push(ocrResult.rawText || '');
      allSideBoxes = ocrResult.boxes || [];
      confidenceSum = ocrResult.confidence || 0.88;
      confidenceCount = 1;
      perSideFields = ocrResult.fields || {};
      detectedEngine = ocrResult.ocrEngine || 'Preset Sample';
    }

    const overallConfidence = confidenceCount > 0
      ? Math.round((confidenceSum / confidenceCount) * 100) / 100
      : 0.88;

    // Combined raw text across ALL photographed package panels
    const fullAggregatedRawText = allSideTexts.join('\n\n');

    // =========================================================================
    // STEP 2: UNIFIED DECLARATION EXTRACTION ON THE COMPLETE AGGREGATED TEXT
    // =========================================================================
    const fullTextExtraction = extractDeclarations(fullAggregatedRawText, allSideBoxes);

    // Merge full-text extraction with per-side detections for maximum completeness
    const finalMergedFields = { ...perSideFields, ...fullTextExtraction.fields };

    // Brand heuristic to pick the most accurate product name
    const isBrand = (str) => /(sunfeast|britannia|tata|nestle|amul|parle|cadbury|bikaji|haldiram|itc|aashirvaad|fortune|dark\s*fantasy)/i.test(str);
    let finalProductName = finalMergedFields.product_name || 'Packaged Commodity Item';
    
    // If perSide detected a known brand, ensure it takes precedence
    if (perSideFields.product_name && isBrand(perSideFields.product_name) && !isBrand(finalProductName)) {
      finalProductName = perSideFields.product_name;
      finalMergedFields.product_name = finalProductName;
    }

    const aggregatedOcrData = {
      rawText: fullAggregatedRawText,
      fields: finalMergedFields,
      boxes: allSideBoxes,
      confidence: overallConfidence,
      productName: finalProductName,
      ocrEngine: detectedEngine,
      readability: {
        avgTextHeightPx: 20,
        confidence: overallConfidence,
        lowContrast: false
      }
    };

    // =========================================================================
    // STEP 3: RUN COMPLIANCE RULE ENGINE ON THE FULL AGGREGATED DATASET
    // =========================================================================
    console.log(`[ScanController] Running Compliance Rule Engine on complete aggregated dataset (${Object.keys(finalMergedFields).length} fields, ${allSideBoxes.length} text blocks)...`);
    const inspectionResult = runComplianceInspection(aggregatedOcrData);

    // =========================================================================
    // STEP 4: CONSTRUCT AND PERSIST INSPECTION RECORD
    // =========================================================================
    const scanId = `LM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newScanRecord = {
      id: scanId,
      product_name: finalProductName,
      image_url: imagePaths[0],
      image_urls: imagePaths,
      photo_count: imagePaths.length,
      score: inspectionResult.score,
      status: inspectionResult.overallStatus,
      created_at: new Date().toISOString(),
      rawText: aggregatedOcrData.rawText,
      confidence: aggregatedOcrData.confidence,
      ocrEngine: detectedEngine,
      fields: aggregatedOcrData.fields,
      boxes: aggregatedOcrData.boxes,
      readability: aggregatedOcrData.readability,
      violations: inspectionResult.violations,
      passedDeclarations: inspectionResult.passedDeclarations,
      stats: inspectionResult.stats
    };

    db.addScan(newScanRecord);

    console.log(`[ScanController] Inspection complete for "${finalProductName}": Score = ${inspectionResult.score}%, Status = ${inspectionResult.overallStatus}, Passed = ${inspectionResult.passedDeclarations.length}, Violations = ${inspectionResult.violations.length}`);

    return res.status(200).json({
      success: true,
      data: newScanRecord
    });

  } catch (error) {
    console.error('Multi-image scan process error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process multi-image product scan: ' + error.message
    });
  }
}

function getScans(req, res) {
  try {
    const scans = db.getAllScans();
    return res.status(200).json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

function getScanById(req, res) {
  try {
    const scan = db.getScanById(req.params.id);
    if (!scan) {
      return res.status(404).json({ success: false, error: 'Scan ID not found' });
    }
    return res.status(200).json({
      success: true,
      data: scan
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

function getDashboardStats(req, res) {
  try {
    const stats = db.getStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  handleScan,
  getScans,
  getScanById,
  getDashboardStats
};
