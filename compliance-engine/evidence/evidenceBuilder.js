/**
 * Evidence Builder Module
 * Formats evidence items containing matched text, bounding box coordinates, image ID, and confidence.
 */

const { matchBoundingBox } = require('./bboxHandler');

function buildEvidence(ruleResults, product, ocrData) {
  const imageId = ocrData.image_id || 'IMG-001';
  const textBlocks = ocrData.text_blocks || [];

  return ruleResults.map(res => {
    const fieldValue = product[res.field];
    const bbox = matchBoundingBox(res.field, fieldValue, textBlocks);
    const matchedText = (fieldValue && typeof fieldValue === 'object') ? (fieldValue.raw_text || fieldValue.value) : (fieldValue || null);

    return {
      rule_id: res.rule_id,
      field: res.field,
      status: res.status,
      confidence: res.confidence || 0.85,
      matched_text: matchedText,
      bbox: bbox,
      image_id: imageId,
      reason: res.reason
    };
  });
}

module.exports = {
  buildEvidence
};
