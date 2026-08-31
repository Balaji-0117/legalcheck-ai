/**
 * OCR Service Layer
 * LegalCheck AI - Packaged Commodity Inspection System
 * 
 * Pipeline:
 *  1. Primary Engine: PaddleOCR (Baidu PP-OCR v4 / RapidOCR)
 *  2. Fallback Engine: EasyOCR (PyTorch-backed) if PaddleOCR fails or returns empty text
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { processImage } = require('../preprocessing/imageProcessor');
const { extractDeclarations } = require('../parser/declarationExtractor');

const SAMPLES_DIR = path.join(__dirname, '../../sample-data/ocr');
const PADDLEOCR_RUNNER = path.join(__dirname, '../paddleocr_runner.py');
const EASYOCR_RUNNER = path.join(__dirname, '../easyocr_runner.py');

const PYTHON_EXEC = process.platform === 'win32' ? 'python' : 'python3';
const OCR_TIMEOUT_MS = 25000;

function runPythonScript(scriptPath, imagePath, timeoutMs) {
  return new Promise((resolve) => {
    execFile(
      PYTHON_EXEC,
      [scriptPath, imagePath],
      { encoding: 'utf-8', timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err || !stdout || !stdout.trim()) {
          return resolve(null);
        }
        try {
          const jsonStart = stdout.indexOf('{');
          if (jsonStart === -1) return resolve(null);
          const result = JSON.parse(stdout.slice(jsonStart).trim());
          if (result && result.success && result.rawText && result.rawText.trim()) {
            return resolve(result);
          }
          resolve(null);
        } catch (parseErr) {
          resolve(null);
        }
      }
    );
  });
}

async function performOCRScan(imageBufferOrPath, sampleId = null, originalFilename = '') {
  // 1. Check if user requested a pre-loaded sample dataset
  if (sampleId) {
    const sampleFilePath = path.join(SAMPLES_DIR, `${sampleId}.json`);
    if (fs.existsSync(sampleFilePath)) {
      const sampleData = JSON.parse(fs.readFileSync(sampleFilePath, 'utf-8'));
      return {
        rawText: sampleData.rawText,
        fields: sampleData.fields,
        boxes: sampleData.boxes,
        confidence: sampleData.confidence,
        readability: sampleData.readability,
        sampleId: sampleData.sampleId,
        productName: sampleData.productName,
        ocrEngine: 'Preset Sample'
      };
    }
  }

  let extractedRawText = '';
  let ocrConfidence = 0.88;
  let extractedBoxes = [];
  let usedEngine = 'None';

  // 2. Perform OCR on Uploaded Image
  if (imageBufferOrPath && fs.existsSync(imageBufferOrPath)) {
    // Step 2a: Try Primary Engine (PaddleOCR)
    const paddleResult = await runPythonScript(PADDLEOCR_RUNNER, imageBufferOrPath, OCR_TIMEOUT_MS);
    if (paddleResult && paddleResult.rawText && paddleResult.rawText.trim().length > 3) {
      extractedRawText = paddleResult.rawText;
      ocrConfidence = paddleResult.confidence || 0.85;
      extractedBoxes = paddleResult.boxes || [];
      usedEngine = 'PaddleOCR (Primary)';
      console.log(`[OCR Engine] Primary: PaddleOCR processed ${path.basename(imageBufferOrPath)} (${extractedBoxes.length} text blocks)`);
    } else {
      // Step 2b: Fallback to Backup Engine (EasyOCR)
      console.warn(`[OCR Engine] PaddleOCR returned empty/failed. Triggering EasyOCR backup for ${path.basename(imageBufferOrPath)}`);
      const easyResult = await runPythonScript(EASYOCR_RUNNER, imageBufferOrPath, OCR_TIMEOUT_MS);
      if (easyResult && easyResult.rawText && easyResult.rawText.trim().length > 3) {
        extractedRawText = easyResult.rawText;
        ocrConfidence = easyResult.confidence || 0.80;
        extractedBoxes = easyResult.boxes || [];
        usedEngine = 'EasyOCR (Backup)';
        console.log(`[OCR Engine] Backup: EasyOCR processed ${path.basename(imageBufferOrPath)} (${extractedBoxes.length} text blocks)`);
      }
    }
  }

  // 3. Extract Declarations and visual properties
  const imageInfo = processImage(imageBufferOrPath);
  const extracted = extractDeclarations(extractedRawText, extractedBoxes, originalFilename);

  return {
    rawText: extractedRawText,
    fields: extracted.fields,
    boxes: extracted.boxes,
    confidence: ocrConfidence,
    productName: extracted.fields.product_name || 'Packaged Commodity Item',
    ocrEngine: usedEngine,
    readability: {
      avgTextHeightPx: imageInfo.avgTextHeightPx || 20,
      confidence: ocrConfidence,
      lowContrast: imageInfo.lowContrast || false
    }
  };
}

module.exports = {
  performOCRScan
};
