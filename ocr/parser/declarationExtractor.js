/**
 * Declaration Extractor
 * Parses raw OCR text lines and bounding boxes to extract structured LMPC declarations.
 */

function cleanNoise(str) {
  if (!str) return '';
  return str
    .replace(/[~`\\^_{}<>|]+/g, '')
    .replace(/^[^\w\s(]+|[^\w\s)]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNoiseLine(line) {
  if (!line) return true;
  const cleaned = line.replace(/[^a-zA-Z0-9]/g, '');
  if (cleaned.length < 3) return true;
  // If line is mostly symbols
  const symbolCount = (line.match(/[^a-zA-Z0-9\s.,()-]/g) || []).length;
  if (symbolCount > line.length * 0.4) return true;
  return false;
}

function extractDeclarations(rawText, rawBoxes = [], originalFilename = '') {
  const fields = {};
  const boxes = [...rawBoxes];
  const text = rawText || '';

  const cleanLines = text
    .split('\n')
    .map((l) => cleanNoise(l))
    .filter((l) => !isNoiseLine(l));

  // 1. Product Name / Brand Identification
  const explicitNameMatch = text.match(/(?:product|commodity|item|brand|name)\s*[:\.]?\s*([^\n]+)/i);

  if (explicitNameMatch && cleanNoise(explicitNameMatch[1]).length > 2) {
    fields.product_name = cleanNoise(explicitNameMatch[1]);
  } else {
    // Check for prominent brand words and join multi-line product titles
    const brandIdx = cleanLines.findIndex((l) =>
      /(sunfeast|britannia|tata|nestle|amul|parle|cadbury|bikaji|haldiram|itc|aashirvaad|fortune|dark\s*fantasy)/i.test(l)
    );

    if (brandIdx !== -1) {
      // Collect brand line and subsequent 1-2 lines if they look like product variant name (e.g. "Sunfeast" + "Fantastik" + "Super Stick")
      const titleParts = [cleanLines[brandIdx]];
      for (let i = brandIdx + 1; i < Math.min(brandIdx + 3, cleanLines.length); i++) {
        const nextLine = cleanLines[i];
        if (
          nextLine.length > 2 &&
          !/(mfg|mrp|net|batch|lic|address|ingredients|store|contains|useby|mfd)/i.test(nextLine)
        ) {
          titleParts.push(nextLine);
        } else {
          break;
        }
      }
      fields.product_name = titleParts.join(' ');
    } else {
      // Pick first prominent non-statutory clean line
      const titleCandidates = cleanLines.filter((l) => {
        const low = l.toLowerCase();
        return (
          l.length >= 3 &&
          !low.includes('mfg') &&
          !low.includes('mrp') &&
          !low.includes('net') &&
          !low.includes('batch') &&
          !low.includes('useby') &&
          !low.includes('lic') &&
          !low.includes('address') &&
          !low.includes('store') &&
          !low.includes('contains') &&
          !low.includes('flavour') &&
          !low.includes('oil') &&
          !low.includes('flour')
        );
      });

      if (titleCandidates.length > 0) {
        fields.product_name = titleCandidates[0];
      } else {
        fields.product_name = 'Packaged Commodity Item';
      }
    }
  }

  // 2. MRP
  const mrpMatch =
    text.match(/(?:mrp|retail\s*price|max\s*retail\s*price|price)\s*[:\.]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?(?:\s*\((?:incl\.?|inclusive)[^)]+\)|\s*(?:incl\.?|inclusive)[^\n,]+)?)/i) ||
    text.match(/(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)/i);
  if (mrpMatch) {
    fields.mrp = cleanNoise(mrpMatch[0]);
  }

  // 3. Net Quantity
  const qtyMatch =
    text.match(/(?:net\s*wt|net\s*qty|net\s*quantity|net\s*weight|net)\s*[:\.]?\s*(\d+(?:\.\d+)?\s*(?:g|gm|kg|ml|l|pcs|units|stick|n|g\b))/i) ||
    text.match(/(\d+(?:\.\d+)?\s*(?:g|gm|kg|ml|l|pcs|units|stick|n)\b)/i);
  if (qtyMatch) {
    fields.net_quantity = cleanNoise(qtyMatch[1] || qtyMatch[0]);
  }

  // 4. Manufacturing / Packing / Batch Date
  const mfdMatch =
    text.match(/(?:mfd|pkd|mfg|packed|imported|date|batch\s*no|batch)\s*[:\.]?\s*(\d{2}[/\-\.]\d{4}|\d{2}[/\-\.]\d{2}|[a-z]{3}\s*\d{4})/i) ||
    text.match(/(?:mfd|pkd|mfg|batch\s*no)\s*[:\.]?\s*([a-z0-9/\-\.]+)/i);
  if (mfdMatch) {
    fields.manufacturing_date = cleanNoise(mfdMatch[0]);
  }

  // 5. Country of Origin
  const originMatch =
    text.match(/(?:country\s*of\s*origin|made\s*in|product\s*of|imported\s*from)\s*[:\.]?\s*([a-z\s]+)/i) ||
    text.match(/(made\s*in\s*india|\bindia\b)/i);
  if (originMatch) {
    fields.country_of_origin = cleanNoise(originMatch[0]);
  }

  // 6. Consumer Care Details
  const careMatch =
    text.match(/(?:consumer\s*care|customer\s*care|feedback|complaints|care\s*no|helpline)\s*[:\.]?\s*([^\n]+)/i) ||
    text.match(/(?:1800[-\s]?\d{3,4}[-\s]?\d{3,4}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  if (careMatch) {
    fields.consumer_care = cleanNoise(careMatch[0]);
  }

  // 7. Unit Sale Price
  const unitPriceMatch =
    text.match(/(?:unit\s*(?:sale)?\s*price|usp)\s*[:\.]?\s*(?:₹|rs\.?)\s*\d+(?:\.\d+)?\s*\/\s*(?:g|kg|ml|l|unit|n|pc)/i) ||
    text.match(/(?:₹|rs\.?)\s*\d+(?:\.\d+)?\s*\/\s*(?:g|kg|ml|l|unit|n|pc)/i);
  if (unitPriceMatch) {
    fields.unit_sale_price = cleanNoise(unitPriceMatch[0]);
  }

  // 8. Manufacturer & Address
  const mfgMatch =
    text.match(/(?:mfg\s*by|manufactured\s*by|packed\s*by|marketed\s*by|importer|packer|brand\s*owner|mktd\s*by|address\s*panel)\s*[:\.]?\s*([^\n]+)/i) ||
    text.match(/(itc\s*ltd|tata\s*consumer|britannia\s*foods|nestle\s*india|amul|parle\s*products|hindustan\s*unilever)[^\n]*/i) ||
    text.match(/([a-z0-9\s.,&-]+(?:ltd|pvt\s*ltd|private\s*limited|limited|inc|corp)[^\n]*)/i);
  if (mfgMatch) {
    fields.manufacturer = cleanNoise(mfgMatch[0]);
  }

  // 9. Best Before / Expiry
  const bestBeforeMatch = text.match(/(?:best\s*before|use\s*by|exp\s*date|useby)\s*[:\.]?\s*([^\n]+)/i);
  if (bestBeforeMatch) {
    fields.best_before = cleanNoise(bestBeforeMatch[0]);
  }

  // 10. License / FSSAI Number
  const licMatch = text.match(/(?:fssai|lic\s*no|licence\s*no|lic\.\s*no)\s*[:\.]?\s*([0-9\s-]+)/i);
  if (licMatch) {
    fields.fssai_lic_no = cleanNoise(licMatch[0]);
  }

  // 11. Ingredients Declaration
  const ingMatch = text.match(/(?:ingredients|contains|palm\s*oil|flour)\s*[:\.]?\s*([^\n]+)/i);
  if (ingMatch) {
    fields.ingredients = cleanNoise(ingMatch[0]);
  }

  // 12. Dimensions Declaration
  const dimMatch = text.match(/(?:dimensions?|size)\s*[:\.]?\s*(\d+(?:\.\d+)?\s*(?:cm|mm|m|inch)\s*x\s*\d+(?:\.\d+)?(?:\s*(?:cm|mm|m|inch))?(?:\s*x\s*\d+(?:\.\d+)?\s*(?:cm|mm|m|inch))?)/i) ||
    text.match(/(\d+(?:\.\d+)?\s*(?:cm|mm|m|inch)\s*x\s*\d+(?:\.\d+)?(?:\s*(?:cm|mm|m|inch))?(?:\s*x\s*\d+(?:\.\d+)?\s*(?:cm|mm|m|inch))?)/i);
  if (dimMatch) {
    fields.dimensions = cleanNoise(dimMatch[0]);
  }

  // Auto-generate bounding boxes for visual overlay if not provided
  if (boxes.length === 0) {
    let topOffset = 40;
    Object.entries(fields).forEach(([k, v]) => {
      if (v) {
        boxes.push({
          field: k,
          text: `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`,
          bbox: [40, topOffset, 420, 35],
          confidence: 0.92
        });
        topOffset += 45;
      }
    });
  }

  return {
    fields,
    boxes
  };
}

module.exports = {
  extractDeclarations
};
