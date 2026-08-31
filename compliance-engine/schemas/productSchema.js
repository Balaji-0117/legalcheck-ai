/**
 * Product Declaration Schema Definition
 * Standardized extracted product structure adhering to Department of Consumer Affairs guidelines.
 */

function createProductSchema(initial = {}) {
  return {
    product_name: initial.product_name || null,
    category: initial.category || 'general_packaged_commodity',
    manufacturer: initial.manufacturer || null,
    packer: initial.packer || null,
    importer: initial.importer || null,
    country_of_origin: initial.country_of_origin || null,
    net_quantity: initial.net_quantity || null,
    mrp: initial.mrp || null,
    manufacturing_date: initial.manufacturing_date || null,
    packing_date: initial.packing_date || null,
    import_date: initial.import_date || null,
    best_before: initial.best_before || null,
    use_by: initial.use_by || null,
    consumer_care: initial.consumer_care || null,
    unit_sale_price: initial.unit_sale_price || null,
    dimensions: initial.dimensions || null,
    readability: initial.readability || { avg_font_px: 18, low_contrast: false },
    raw_ocr_summary: initial.raw_ocr_summary || ''
  };
}

module.exports = {
  createProductSchema
};
