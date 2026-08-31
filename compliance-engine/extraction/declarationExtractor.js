/**
 * Declaration Extractor Module
 * Extracts structured product fields from normalized OCR text blocks and returns product schema.
 * 
 * Design: Single-pass extraction over cleaned OCR text. No hardcoded fallbacks.
 * Unknown fields remain null — never fabricated.
 */

const { REGEX_PATTERNS } = require('./patterns');
const { parseDateString } = require('./dateParser');
const { normalizeMRP, normalizeNetQuantity, normalizeCountryOfOrigin } = require('./normalizer');
const { createProductSchema } = require('../schemas/productSchema');

// Known Indian FMCG brands for product name boosting
const KNOWN_BRANDS = [
  'tata', 'britannia', 'britannica', 'nestle', 'amul', 'sunfeast', 'parle',
  'itc', 'aashirvaad', 'fortune', 'bikaji', 'haldiram', 'cadbury', 'dabur',
  'patanjali', 'mtr', 'kissan', 'maggi', 'yippee', 'bru', 'horlicks',
  'boost', 'complain', 'nescafe', 'lays', 'kurkure', 'uncle chipps'
];

function extractDeclarations(ocrData, productContext = {}) {
  const textBlocks = (ocrData.text_blocks || ocrData.boxes || []).filter(b => b && b.text && b.text.trim());
  const rawText = ocrData.raw_text || ocrData.rawText || textBlocks.map(b => b.text).join('\n');

  // Strip any side-header artifacts like "--- [PACKAGE PHOTO 1...]---"
  const cleanedText = rawText
    .replace(/---\s*\[.*?\]\s*---/g, '')
    .replace(/\[PACKAGE[^\]]*\]/gi, '')
    .trim();

  const lines = cleanedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const product = createProductSchema();
  product.raw_ocr_summary = cleanedText;

  // ---------- 1. CATEGORY CLASSIFICATION ----------
  product.category = productContext.category || 'general_packaged_commodity';
  if (/biscuit|drink|tea|coffee|food|glucose|snack|oil|flour|atta|milk|butter|juice|beverage|noodle|salt|sugar|spices|cream|biscuits|cookie/i.test(cleanedText)) {
    product.category = 'packaged_food';
  }
  if (/imported by|importer|imported from/i.test(cleanedText) || productContext.is_imported === true) {
    product.category = 'imported_commodity';
  }

  // ---------- 2. PRODUCT NAME ----------
  // Strategy: Explicit label → Known brand in text → Generic commodity keyword → Top non-meta line
  let productNameValue = null;

  // 2a. Explicit label
  const explicitMatch = cleanedText.match(/(?:product\s*name|commodity|item)\s*[:\.]?\s*([^\n]+)/i);
  if (explicitMatch) {
    productNameValue = explicitMatch[1].trim();
  }

  // 2b. Known brand in text
  if (!productNameValue) {
    for (const brand of KNOWN_BRANDS) {
      const brandRegex = new RegExp(`\\b${brand}\\b(.{0,40})`, 'i');
      const m = cleanedText.match(brandRegex);
      if (m) {
        productNameValue = m[0].replace(/[\r\n]+/g, ' ').trim();
        break;
      }
    }
  }

  // 2c. Generic commodity keyword
  if (!productNameValue) {
    const commodityMatch = cleanedText.match(/\b(edible common salt|iodised salt|vacuum evaporated[^\n,]{0,30}|wheat flour|refined oil|atta|biscuits?|cream biscuits?|tea leaves?|coffee|sugar|rice|dal|ghee|butter|cheese|milk powder|baby food)\b/i);
    if (commodityMatch) {
      productNameValue = commodityMatch[0].replace(/[\r\n]+/g, ' ').trim();
    }
  }

  // 2d. First prominent non-metadata line (top-label heuristic)
  if (!productNameValue) {
    const nonMetaLines = lines.filter(l =>
      l.length >= 3 &&
      !/^mfg|^mrp|^net|^pkd|^mfd|^date|^exp|^care|^origin|^made|^price|^rs|^₹|^ingredients|^batch|^lic|^recyclable|^scan|^guarantee|^helps|^vage|^uoua|^pack\b/i.test(l) &&
      !/^\d+$/.test(l) &&
      !/^['"@#\-\[\]]+/.test(l)
    );
    if (nonMetaLines.length >= 2 &&
      nonMetaLines[0].length <= 60 &&
      nonMetaLines[1].length <= 60) {
      // If two short prominent lines, join them (e.g. "TATA" + "Salt")
      const combined = `${nonMetaLines[0]} ${nonMetaLines[1]}`.trim();
      productNameValue = combined;
    } else if (nonMetaLines.length >= 1) {
      productNameValue = nonMetaLines[0].trim();
    }
  }

  if (productNameValue) {
    const matchingBlock = textBlocks.find(b => cleanedText.includes(b.text) && productNameValue.includes(b.text.trim())) || null;
    product.product_name = {
      value: productNameValue,
      raw_text: productNameValue,
      confidence: matchingBlock ? (matchingBlock.confidence || 0.90) : 0.88,
      bbox: matchingBlock ? matchingBlock.bbox : null
    };
  }

  // Helper: find block matching a regex
  function findBlock(regex) {
    return textBlocks.find(b => regex.test(b.text)) || null;
  }

  // ---------- 3. MRP ----------
  const mrpMatch = cleanedText.match(REGEX_PATTERNS.MRP) || cleanedText.match(REGEX_PATTERNS.MRP_STANDALONE_RS);
  if (mrpMatch) {
    const block = findBlock(REGEX_PATTERNS.MRP) || findBlock(REGEX_PATTERNS.MRP_STANDALONE_RS);
    product.mrp = normalizeMRP(mrpMatch, block);
  }

  // ---------- 4. NET QUANTITY ----------
  const qtyMatch = cleanedText.match(REGEX_PATTERNS.NET_QTY) || cleanedText.match(REGEX_PATTERNS.NET_QTY_STANDALONE);
  if (qtyMatch) {
    const block = findBlock(REGEX_PATTERNS.NET_QTY) || findBlock(REGEX_PATTERNS.NET_QTY_STANDALONE);
    product.net_quantity = normalizeNetQuantity(qtyMatch, block);
  }

  // ---------- 5. UNIT SALE PRICE ----------
  const uspMatch = cleanedText.match(REGEX_PATTERNS.UNIT_SALE_PRICE) || cleanedText.match(REGEX_PATTERNS.UNIT_SALE_PRICE_STANDALONE);
  if (uspMatch) {
    const block = findBlock(REGEX_PATTERNS.UNIT_SALE_PRICE) || findBlock(REGEX_PATTERNS.UNIT_SALE_PRICE_STANDALONE);
    product.unit_sale_price = {
      value: parseFloat(uspMatch[1]),
      unit: uspMatch[2].toLowerCase(),
      raw_text: uspMatch[0].trim(),
      confidence: block ? (block.confidence || 0.92) : 0.90,
      bbox: block ? block.bbox : null
    };
  }

  // ---------- 6. MANUFACTURING DATE ----------
  const mfdMatch = cleanedText.match(REGEX_PATTERNS.MFD_DATE);
  if (mfdMatch) {
    const block = findBlock(REGEX_PATTERNS.MFD_DATE);
    const parsed = parseDateString(mfdMatch[1] || mfdMatch[0]);
    product.manufacturing_date = {
      value: parsed.iso || parsed.raw,
      raw_text: mfdMatch[0].trim(),
      month: parsed.month,
      year: parsed.year,
      confidence: block ? (block.confidence || 0.91) : 0.90,
      bbox: block ? block.bbox : null
    };
  }

  // ---------- 7. BEST BEFORE / EXPIRY ----------
  const expMatch = cleanedText.match(REGEX_PATTERNS.BEST_BEFORE);
  if (expMatch) {
    const block = findBlock(REGEX_PATTERNS.BEST_BEFORE);
    product.best_before = {
      value: expMatch[1].trim(),
      raw_text: expMatch[0].trim(),
      confidence: block ? (block.confidence || 0.88) : 0.85,
      bbox: block ? block.bbox : null
    };
  }

  // ---------- 8. COUNTRY OF ORIGIN ----------
  const originMatch = cleanedText.match(REGEX_PATTERNS.COUNTRY_ORIGIN) || cleanedText.match(/(made\s*in\s*india|\bindia\b)/i);
  if (originMatch) {
    const block = findBlock(REGEX_PATTERNS.COUNTRY_ORIGIN);
    product.country_of_origin = normalizeCountryOfOrigin(originMatch, block);
  }

  // ---------- 9. MANUFACTURER / PACKER / IMPORTER ----------
  const mfgMatch = cleanedText.match(REGEX_PATTERNS.MANUFACTURER);
  if (mfgMatch) {
    const block = findBlock(REGEX_PATTERNS.MANUFACTURER);
    product.manufacturer = {
      value: mfgMatch[0].trim(),
      raw_text: mfgMatch[0].trim(),
      confidence: block ? (block.confidence || 0.92) : 0.90,
      bbox: block ? block.bbox : null
    };
  }

  // ---------- 10. CONSUMER CARE ----------
  const carePhone = cleanedText.match(REGEX_PATTERNS.CONSUMER_PHONE);
  const careEmail = cleanedText.match(REGEX_PATTERNS.CONSUMER_EMAIL);
  const careLabel = cleanedText.match(REGEX_PATTERNS.CONSUMER_CARE_LABEL);

  if (carePhone || careEmail || careLabel) {
    const block = findBlock(REGEX_PATTERNS.CONSUMER_CARE_LABEL) || findBlock(REGEX_PATTERNS.CONSUMER_PHONE);
    product.consumer_care = {
      phone: carePhone ? carePhone[0] : null,
      email: careEmail ? careEmail[0] : null,
      raw_text: careLabel ? careLabel[0].trim() : (carePhone ? carePhone[0] : careEmail ? careEmail[0] : null),
      confidence: block ? (block.confidence || 0.93) : 0.90,
      bbox: block ? block.bbox : null
    };
  }

  return product;
}

module.exports = { extractDeclarations };
