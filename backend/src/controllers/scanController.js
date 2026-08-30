/**
 * Scan Controller
 * Handles multi-image upload, multi-side OCR aggregation, rule compliance checking, and database persistence.
 */

const db = require('../models/db');
const { performOCRScan } = require('../../../ocr/service/ocrService');
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

    // Process all uploaded side images and aggregate declarations
    let mergedFields = {};
    let mergedBoxes = [];
    let aggregatedRawText = '';
    let overallConfidence = 0.88;
    let productNameDetected = '';

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sideLabel = `Photo ${i + 1}`;
        const ocrRes = await performOCRScan(file.path, null, file.originalname);

        aggregatedRawText += `\n--- [PACKAGE ${sideLabel.toUpperCase()} - ${file.originalname}] ---\n${ocrRes.rawText}\n`;

        // Merge extracted fields from each side (prioritizing recognized brand names for product_name)
        Object.entries(ocrRes.fields || {}).forEach(([k, v]) => {
          if (v) {
            if (!mergedFields[k]) {
              mergedFields[k] = v;
            } else if (k === 'product_name') {
              const isBrand = (str) => /(sunfeast|britannia|tata|nestle|amul|parle|cadbury|bikaji|haldiram|itc|aashirvaad|fortune|dark\s*fantasy)/i.test(str);
              if (!isBrand(mergedFields[k]) && isBrand(v)) {
                mergedFields[k] = v;
              }
            }
          }
        });

        if (ocrRes.productName) {
          const isBrand = (str) => /(sunfeast|britannia|tata|nestle|amul|parle|cadbury|bikaji|haldiram|itc|aashirvaad|fortune|dark\s*fantasy)/i.test(str);
          if (!productNameDetected || (isBrand(ocrRes.productName) && !isBrand(productNameDetected))) {
            productNameDetected = ocrRes.productName;
          }
        }

        // Add bounding boxes with side label tag
        (ocrRes.boxes || []).forEach(b => {
          mergedBoxes.push({
            ...b,
            side: sideLabel,
            text: `[${sideLabel}] ${b.text}`
          });
        });
      }
    } else {
      // Preset sample processing
      const ocrResult = await performOCRScan(null, sampleId);
      mergedFields = ocrResult.fields;
      mergedBoxes = ocrResult.boxes;
      aggregatedRawText = ocrResult.rawText;
      overallConfidence = ocrResult.confidence;
      productNameDetected = ocrResult.productName;
    }

    const aggregatedOcrResult = {
      rawText: aggregatedRawText,
      fields: mergedFields,
      boxes: mergedBoxes,
      confidence: overallConfidence,
      productName: productNameDetected || mergedFields.product_name || 'Packaged Commodity Item',
      readability: {
        avgTextHeightPx: 20,
        confidence: overallConfidence,
        lowContrast: false
      }
    };

    // 2. Run Compliance Rule Engine on combined multi-side data
    const inspectionResult = runComplianceInspection(aggregatedOcrResult);

    // 3. Construct Scan record
    const scanId = `LM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const productName = aggregatedOcrResult.productName;

    const newScanRecord = {
      id: scanId,
      product_name: productName,
      image_url: imagePaths[0],
      image_urls: imagePaths,
      photo_count: imagePaths.length,
      score: inspectionResult.score,
      status: inspectionResult.overallStatus,
      created_at: new Date().toISOString(),
      rawText: aggregatedOcrResult.rawText,
      confidence: aggregatedOcrResult.confidence,
      fields: aggregatedOcrResult.fields,
      boxes: aggregatedOcrResult.boxes,
      readability: aggregatedOcrResult.readability,
      violations: inspectionResult.violations,
      passedDeclarations: inspectionResult.passedDeclarations,
      stats: inspectionResult.stats
    };

    // 4. Save to Database
    db.addScan(newScanRecord);

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

module.exports = {
  handleScan,
  getScans,
  getScanById
};
