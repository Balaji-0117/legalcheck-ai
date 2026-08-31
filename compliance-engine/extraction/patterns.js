/**
 * Centralized Legal Metrology Regex & Keyword Patterns
 * Supports spelling variations, OCR noise, units, MRP variations, and dates.
 */

const REGEX_PATTERNS = {
  // MRP Variations: "MRP ₹50", "MRP Rs. 50", "M.R.P. ₹50/-", "Maximum Retail Price ₹50", "MRP: 50/-"
  MRP: /(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price|retail\s*price|price)\s*[:\.]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)(?:\s*([^\n,.]+))?/i,
  MRP_STANDALONE_RS: /(?:₹|rs\.?)\s*(\d+(?:\.\d{1,2})?)/i,
  MRP_TAXES: /(?:incl|inclusive)\s*(?:of)?\s*all\s*tax(?:es)?/i,

  // Net Quantity Variations: "Net Qty 100g", "Net Quantity: 100 g", "100 G", "Net Wt. 100 grams", "10 N", "10 units"
  NET_QTY: /(?:net\s*wt|net\s*qty|net\s*quantity|net\s*weight|net\s*contents|net)\s*[:\.]?\s*(\d+(?:\.\d+)?)\s*(g|gm|gram|grams|kg|kilogram|ml|l|ltr|litre|litres|pcs|units|n)\b/i,
  NET_QTY_STANDALONE: /(\d+(?:\.\d+)?)\s*(g|gm|gram|grams|kg|kilogram|ml|l|ltr|litre|litres|pcs|units|n)\b/i,

  // Unit Sale Price: "Unit Sale Price: ₹0.10/ml", "₹0.50/g", "USP Rs 100/kg"
  UNIT_SALE_PRICE: /(?:unit\s*(?:sale)?\s*price|usp)\s*[:\.]?\s*(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)\s*\/\s*(g|kg|ml|l|unit|n|pc)/i,
  UNIT_SALE_PRICE_STANDALONE: /(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)\s*\/\s*(g|kg|ml|l|unit|n|pc)/i,

  // Date Expressions: "MFD 06/2026", "MFG 06-2026", "Pkd 06/26", "Packed JUN 2026", "Date of Mfg: 06/2026"
  MFD_DATE: /(?:mfd|pkd|mfg|packed|imported|date\s*of\s*mfg|date\s*of\s*packing)\s*[:\.]?\s*(\d{2}[/\-\.]\d{4}|\d{2}[/\-\.]\d{2}|[a-z]{3}\s*\d{4})/i,
  GENERIC_DATE: /\b(\d{2}[/\-\.]\d{4})\b/,

  // Expiry / Best Before: "Best Before 6 Months", "Use By 06/2027", "EXP 06/2027"
  BEST_BEFORE: /(?:best\s*before|use\s*by|exp(?:iry)?\s*date|exp)\s*[:\.]?\s*([^\n,.]+)/i,

  // Country of Origin: "Made in India", "Country of Origin: India", "Product of India", "Made in China"
  COUNTRY_ORIGIN: /(?:country\s*of\s*origin|made\s*in|product\s*of|imported\s*from)\s*[:\.]?\s*([a-z\s]+)/i,

  // Manufacturer / Packer / Importer
  MANUFACTURER: /(?:mfg\s*by|manufactured\s*by|manufactured\s*&\s*marketed\s*by|packed\s*by|pkd\s*by|marketed\s*by|importer|imported\s*by)\s*[:\.]?\s*([^\n]+)/i,

  // Consumer Care Contact
  CONSUMER_PHONE: /(?:1800[-\s]?\d{3,4}[-\s]?\d{3,4}|\d{10}|\+91[-\s]?\d{10})/,
  CONSUMER_EMAIL: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
  CONSUMER_CARE_LABEL: /(?:consumer\s*care|customer\s*care|feedback|complaints|care\s*no|helpline)\s*[:\.]?\s*([^\n]+)/i
};

module.exports = {
  REGEX_PATTERNS
};
