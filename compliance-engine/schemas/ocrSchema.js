/**
 * Standardized OCR Schema Validator & Normalizer
 * LegalCheck AI - Standalone Compliance Engine
 */

function validateOCRSchema(input) {
  if (!input) return { valid: false, error: 'OCR input is null or undefined' };

  const imageId = input.image_id || input.id || 'IMG-001';
  let textBlocks = [];

  if (Array.isArray(input.text_blocks)) {
    textBlocks = input.text_blocks;
  } else if (Array.isArray(input.boxes)) {
    textBlocks = input.boxes.map(b => ({
      text: b.text || '',
      confidence: b.confidence || 0.85,
      bbox: b.bbox || [40, 40, 400, 30],
      field: b.field || 'text_line'
    }));
  } else if (typeof input.rawText === 'string') {
    textBlocks = input.rawText.split('\n').filter(Boolean).map(line => ({
      text: line.trim(),
      confidence: input.confidence || 0.85,
      bbox: [40, 40, 400, 30]
    }));
  }

  const rawText = input.rawText || textBlocks.map(b => b.text).join('\n');
  const avgConfidence = input.confidence || (
    textBlocks.length > 0
      ? textBlocks.reduce((acc, b) => acc + (b.confidence || 0.85), 0) / textBlocks.length
      : 0.85
  );

  return {
    valid: true,
    data: {
      image_id: imageId,
      raw_text: rawText,
      confidence: Math.round(avgConfidence * 100) / 100,
      text_blocks: textBlocks
    }
  };
}

module.exports = {
  validateOCRSchema
};
