/**
 * Bounding Box Handler Module
 * Associates extracted declaration fields with original OCR bounding boxes [x, y, w, h].
 */

function matchBoundingBox(fieldKey, fieldValue, textBlocks = []) {
  if (!textBlocks || textBlocks.length === 0) return null;

  if (fieldValue && typeof fieldValue === 'object' && fieldValue.bbox) {
    return fieldValue.bbox;
  }

  const rawVal = (fieldValue && typeof fieldValue === 'object') ? (fieldValue.raw_text || fieldValue.value) : fieldValue;
  if (!rawVal || typeof rawVal !== 'string') return null;

  const matchBlock = textBlocks.find(b => b.text && b.text.toLowerCase().includes(rawVal.toLowerCase()));
  return matchBlock ? matchBlock.bbox : null;
}

module.exports = {
  matchBoundingBox
};
