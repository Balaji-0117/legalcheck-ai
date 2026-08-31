/**
 * OCR Adapter Module
 * Adapts raw OCR output from PaddleOCR, EasyOCR, or raw JSON text blocks into normalized ocrSchema.
 */

const { validateOCRSchema } = require('../schemas/ocrSchema');

function adaptOCRInput(input) {
  if (!input) {
    return validateOCRSchema({
      image_id: 'IMG-EMPTY',
      rawText: '',
      confidence: 0.0,
      text_blocks: []
    }).data;
  }

  // Case A: Input already conforms to standard schema
  if (input.image_id && Array.isArray(input.text_blocks)) {
    return validateOCRSchema(input).data;
  }

  // Case B: EasyOCR / PaddleOCR service format { rawText, boxes, confidence }
  const imageId = input.scan_id || input.id || input.image_id || 'IMG-001';
  const textBlocks = [];

  if (Array.isArray(input.text_blocks)) {
    input.text_blocks.forEach(b => {
      textBlocks.push({
        text: b.text || '',
        confidence: b.confidence || 0.85,
        bbox: b.bbox || [40, 40, 400, 30]
      });
    });
  } else if (Array.isArray(input.boxes)) {
    input.boxes.forEach(b => {
      textBlocks.push({
        text: b.text || '',
        confidence: b.confidence || 0.85,
        bbox: b.bbox || [40, 40, 400, 30]
      });
    });
  } else if (typeof input.rawText === 'string') {
    input.rawText.split(/\r?\n/).forEach(line => {
      if (line.trim()) {
        textBlocks.push({
          text: line.trim(),
          confidence: input.confidence || 0.85,
          bbox: [40, 40, 400, 30]
        });
      }
    });
  }

  const rawText = input.raw_text || input.rawText || textBlocks.map(b => b.text).join('\n');

  return validateOCRSchema({
    image_id: imageId,
    rawText: rawText,
    confidence: input.confidence || 0.85,
    text_blocks: textBlocks
  }).data;
}

module.exports = {
  adaptOCRInput
};
