/**
 * Compliance-Oriented Field Extractor
 * LegalCheck AI - Department of Consumer Affairs
 * 
 * Filters out raw OCR noise (ingredients, marketing copy, recipes, taglines)
 * and extracts ONLY legally required declarations for Legal Metrology compliance.
 */

function extractComplianceFields(rawText = '', rawBoxes = [], originalFilename = '') {
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const fields = {
    productName: null,
    category: 'general_packaged_commodity',
    netQuantity: null,
    mrp: null,
    unitSalePrice: null,
    manufacturingDate: null,
    expiryDate: null,
    bestBefore: null,
    countryOfOrigin: null,
    manufacturer: null,
    packer: null,
    importer: null,
    consumerCare: null
  };

  // 1. Smart Product Name & Brand Extraction from OCR Lines
  const explicitMatch = text.match(/(?:product|commodity|item|brand|name)\s*[:\.]?\s*([^\n]+)/i);

  if (explicitMatch) {
    fields.productName = explicitMatch[1].trim();
  } else {
    // Look for recognized brand names in text & nearby product terms
    const brandMatch = text.match(/\b(tata|britannia|nestle|amul|sunfeast|parle|itc|aashirvaad|fortune|bikaji|haldiram|cadbury)\b[\s\n]*([a-z0-9\s]{2,25})/i);
    if (brandMatch) {
      fields.productName = brandMatch[0].replace(/[\r\n]+/g, ' ').trim();
    } else {
      // Pick top prominent non-metadata OCR lines
      const nonMetaLines = lines.filter(l => 
        l.length >= 3 && 
        !/mfg|mrp|net|pkd|mfd|date|exp|care|origin|made\s*in|price|rs|₹|ingredients|batch|lic|recyclable|scan|guarantee|helps|vages|uouaton/i.test(l) &&
        !/^\d+$/.test(l)
      );

      if (nonMetaLines.length >= 2) {
        fields.productName = `${nonMetaLines[0]} ${nonMetaLines[1]}`.trim();
      } else if (nonMetaLines.length === 1) {
        fields.productName = nonMetaLines[0].trim();
      }
    }
  }

  // Clean fallback if filename is used as fallback (stripping timestamp & WhatsApp tags)
  if (!fields.productName || fields.productName.length < 3) {
    if (originalFilename) {
      let cleaned = originalFilename
        .replace(/^\d+[-_]/, '')
        .replace(/WhatsApp Image|\d{4}-\d{2}-\d{2}|at\s*[\d\.]+\s*(AM|PM)?|\.[^/.]+$/gi, '')
        .replace(/[-_]/g, ' ')
        .trim();
      fields.productName = cleaned.length > 2 ? (cleaned.charAt(0).toUpperCase() + cleaned.slice(1)) : 'Packaged Commodity Item';
    } else {
      fields.productName = 'Packaged Commodity Item';
    }
  }

  // 2. Category Classification
  if (/biscuit|drink|tea|coffee|food|glucose|snack|oil|flour|atta|milk|butter|juice|beverage|noodle|salt|sugar|spices/i.test(text + ' ' + fields.productName)) {
    fields.category = 'packaged_food';
  } else if (/imported|import|importer|country of origin\s*[:\.]?\s*(?!india)/i.test(text)) {
    fields.category = 'imported_commodity';
  } else if (/cream|lotion|soap|shampoo|cosmetic|perfume|oil|lipstick/i.test(text)) {
    fields.category = 'cosmetics';
  }

  // 3. MRP Detection & Parsing
  const mrpMatch = text.match(/(?:mrp|max(?:imum)?\s*retail\s*price|retail\s*price|price)\s*[:\.]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)(?:\s*([^\n,.]+))?/i) ||
                   text.match(/(?:₹|rs\.?)\s*(\d+(?:\.\d{1,2})?)/i);
  if (mrpMatch) {
    const val = parseFloat(mrpMatch[1]);
    const isInclusive = /incl|inclusive|all\s*taxes/i.test(mrpMatch[0] + ' ' + (mrpMatch[2] || ''));
    fields.mrp = {
      value: isNaN(val) ? null : val,
      currency: 'INR',
      rawText: mrpMatch[0].trim(),
      inclTaxes: isInclusive
    };
  }

  // 4. Net Quantity Extraction
  const netQtyMatch = text.match(/(?:net\s*wt|net\s*qty|net\s*quantity|net\s*weight|net\s*contents|net)\s*[:\.]?\s*(\d+(?:\.\d+)?)\s*(g|gm|kg|ml|l|ltr|litre|litres|pcs|units|n|g)\b/i) ||
                      text.match(/(\d+(?:\.\d+)?)\s*(g|gm|kg|ml|l|ltr|litre|litres|pcs|units|n)\b/i);
  if (netQtyMatch) {
    const val = parseFloat(netQtyMatch[1]);
    let unit = netQtyMatch[2].toLowerCase();
    if (unit === 'gm') unit = 'g';
    if (unit === 'ltr' || unit === 'litre' || unit === 'litres') unit = 'l';
    fields.netQuantity = {
      value: isNaN(val) ? null : val,
      unit: unit,
      rawText: netQtyMatch[0].trim()
    };
  }

  // 5. Unit Sale Price
  const uspMatch = text.match(/(?:unit\s*(?:sale)?\s*price|usp)\s*[:\.]?\s*(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)\s*\/\s*(g|kg|ml|l|unit|n|pc)/i) ||
                    text.match(/(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)\s*\/\s*(g|kg|ml|l|unit|n|pc)/i);
  if (uspMatch) {
    fields.unitSalePrice = {
      value: parseFloat(uspMatch[1]),
      unit: uspMatch[2].toLowerCase(),
      rawText: uspMatch[0].trim()
    };
  }

  // 6. Date of Manufacture / Packing
  const mfdMatch = text.match(/(?:mfd|pkd|mfg|packed|imported|date\s*of\s*mfg|date\s*of\s*packing)\s*[:\.]?\s*(\d{2}[/\-\.]\d{4}|\d{2}[/\-\.]\d{2}|[a-z]{3}\s*\d{4})/i) ||
                   text.match(/\b(\d{2}[/\-\.]\d{4})\b/);
  if (mfdMatch) {
    fields.manufacturingDate = {
      rawText: mfdMatch[0].trim(),
      dateStr: mfdMatch[1]
    };
  }

  // 7. Best Before / Expiry
  const expMatch = text.match(/(?:best\s*before|use\s*by|exp(?:iry)?\s*date|exp)\s*[:\.]?\s*([^\n,.]+)/i);
  if (expMatch) {
    fields.bestBefore = {
      rawText: expMatch[0].trim(),
      duration: expMatch[1].trim()
    };
  }

  // 8. Country of Origin
  const originMatch = text.match(/(?:country\s*of\s*origin|made\s*in|product\s*of|imported\s*from)\s*[:\.]?\s*([a-z\s]+)/i) ||
                      text.match(/(made\s*in\s*india|\bindia\b)/i);
  if (originMatch) {
    const rawVal = originMatch[1] || originMatch[0];
    const country = /india/i.test(rawVal) ? 'India' : rawVal.trim();
    fields.countryOfOrigin = {
      country: country,
      rawText: originMatch[0].trim()
    };
  }

  // 9. Manufacturer Details
  const mfgMatch = text.match(/(?:mfg\s*by|manufactured\s*by|packed\s*by|marketed\s*by|tata\s*consumer)\s*[:\.]?\s*([^\n]+)/i);
  if (mfgMatch) {
    fields.manufacturer = {
      nameAddress: mfgMatch[0].trim(),
      rawText: mfgMatch[0].trim()
    };
  }

  // 10. Consumer Care Details
  const carePhone = text.match(/(?:1800[-\s]?\d{3,4}[-\s]?\d{3,4}|\d{10}|\+91[-\s]?\d{10})/);
  const careEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const careMatch = text.match(/(?:consumer\s*care|customer\s*care|feedback|complaints|care\s*no|helpline)\s*[:\.]?\s*([^\n]+)/i);

  if (carePhone || careEmail || careMatch) {
    fields.consumerCare = {
      phone: carePhone ? carePhone[0] : null,
      email: careEmail ? careEmail[0] : null,
      rawText: careMatch ? careMatch[0].trim() : (carePhone ? carePhone[0] : careEmail[0])
    };
  }

  return fields;
}

module.exports = {
  extractComplianceFields
};
