/**
 * OCR Service Layer
 * LegalCheck AI - Packaged Commodity Inspection System
 * 
 * Multi-Tiered Architecture:
 *  1. Primary Engine: PaddleOCR (Baidu PP-OCR v4 via RapidOCR ONNX)
 *  2. Secondary Engine: EasyOCR (PyTorch-backed)
 *  3. Fallback Engine: Tesseract.js (Pure Node.js In-Memory OCR)
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { processImage } = require('../preprocessing/imageProcessor');
const { extractDeclarations } = require('../parser/declarationExtractor');

const SAMPLES_DIR = path.join(__dirname, '../../sample-data/ocr');
const PADDLEOCR_RUNNER = path.join(__dirname, '../paddleocr_runner.py');
const EASYOCR_RUNNER = path.join(__dirname, '../easyocr_runner.py');
const OCR_TIMEOUT_MS = 35000;

function getPythonExecutable() {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }

  const linuxVenvCandidates = [
    '/opt/render/project/src/.venv/bin/python',
    '/opt/render/project/src/.venv/bin/python3',
    '/opt/render/project/src/backend/.venv/bin/python',
    '/opt/render/project/.venv/bin/python'
  ];

  for (const p of linuxVenvCandidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // On Render Linux, 'python' points to the active virtual environment
  return 'python';
}

function runPythonScript(scriptPath, imagePath, timeoutMs) {
  const pythonCmd = getPythonExecutable();
  return new Promise((resolve) => {
    execFile(
      pythonCmd,
      [scriptPath, imagePath],
      { encoding: 'utf-8', timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err || !stdout || !stdout.trim()) {
          console.warn(`[OCR Warning] Python runner (${path.basename(scriptPath)}) error:`, err ? err.message : 'empty stdout');
          if (stderr) console.warn(`[OCR Warning] stderr:`, stderr.substring(0, 300));
          return resolve(null);
        }
        try {
          const jsonStart = stdout.indexOf('{');
          if (jsonStart === -1) {
            console.warn(`[OCR Warning] Non-JSON output:`, stdout.substring(0, 200));
            return resolve(null);
          }
          const result = JSON.parse(stdout.slice(jsonStart).trim());
          if (result && result.success && result.rawText && result.rawText.trim()) {
            return resolve(result);
          }
          if (result && result.error) {
            console.warn(`[OCR Warning] Python script returned error:`, result.error);
          }
          resolve(null);
        } catch (parseErr) {
          console.warn(`[OCR Warning] JSON parse error:`, parseErr.message);
          resolve(null);
        }
      }
    );
  });
}

function getTesseractModule() {
  const possibleRequires = [
    'tesseract.js',
    path.join(process.cwd(), 'node_modules/tesseract.js'),
    path.join(process.cwd(), '../node_modules/tesseract.js'),
    path.join(__dirname, '../../backend/node_modules/tesseract.js'),
    path.join(__dirname, '../../node_modules/tesseract.js')
  ];
  for (const p of possibleRequires) {
    try {
      return require(p);
    } catch (e) {}
  }
  return null;
}

async function runTesseractFallback(imagePath) {
  const Tesseract = getTesseractModule();
  if (!Tesseract) {
    console.warn('[OCR Fallback] Tesseract module could not be loaded');
    return null;
  }

  try {
    const { data: { text, words } } = await Tesseract.recognize(imagePath, 'eng');
    if (!text || !text.trim()) return null;

    const boxes = (words || []).map((w) => ({
      field: 'text_line',
      text: w.text,
      confidence: Math.round((w.confidence || 85)) / 100,
      bbox: [
        w.bbox ? w.bbox.x0 : 40,
        w.bbox ? w.bbox.y0 : 40,
        w.bbox ? Math.max(10, w.bbox.x1 - w.bbox.x0) : 100,
        w.bbox ? Math.max(10, w.bbox.y1 - w.bbox.y0) : 30
      ]
    }));

    return {
      rawText: text.trim(),
      confidence: 0.85,
      boxes: boxes,
      engine: 'Tesseract OCR (Cloud Fallback)'
    };
  } catch (err) {
    console.error('[OCR Error] Tesseract fallback error:', err.message);
    return null;
  }
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
      // Step 2b: Fallback to Secondary Engine (EasyOCR)
      console.warn(`[OCR Engine] PaddleOCR returned empty/failed. Triggering EasyOCR backup for ${path.basename(imageBufferOrPath)}`);
      const easyResult = await runPythonScript(EASYOCR_RUNNER, imageBufferOrPath, OCR_TIMEOUT_MS);
      if (easyResult && easyResult.rawText && easyResult.rawText.trim().length > 3) {
        extractedRawText = easyResult.rawText;
        ocrConfidence = easyResult.confidence || 0.80;
        extractedBoxes = easyResult.boxes || [];
        usedEngine = 'EasyOCR (Backup)';
        console.log(`[OCR Engine] Backup: EasyOCR processed ${path.basename(imageBufferOrPath)} (${extractedBoxes.length} text blocks)`);
      } else {
        // Step 2c: Fallback to Tertiary Engine (Tesseract.js)
        console.warn(`[OCR Engine] Running Node Tesseract OCR fallback for ${path.basename(imageBufferOrPath)}...`);
        const tessResult = await runTesseractFallback(imageBufferOrPath);
        if (tessResult && tessResult.rawText && tessResult.rawText.trim().length > 3) {
          extractedRawText = tessResult.rawText;
          ocrConfidence = tessResult.confidence || 0.82;
          extractedBoxes = tessResult.boxes || [];
          usedEngine = 'Tesseract OCR (Cloud Fallback)';
          console.log(`[OCR Engine] Cloud Fallback: Tesseract processed ${path.basename(imageBufferOrPath)} (${extractedBoxes.length} text blocks)`);
        }
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
