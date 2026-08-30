export const NATURAL_W = 400;
export const NATURAL_H = 320;

export const REQUIRED_FIELDS = ["mrp", "net_weight", "manufacturer"];

export const FIELD_LABELS = {
mrp: "MRP",
net_weight: "Net Quantity",
manufacturer: "Manufacturer",
};

// Mock /api/scan responses. Swap for the real fetch call once Siddhi's
// PaddleOCR endpoint is live — the shape (fields.<key>.{value,bbox,confidence})
// is the locked contract, so downstream components don't need to change.
export const SCENARIOS = {
compliant: {
label: "Compliant sample",
rawText: "ABC Biscuits Pvt Ltd  MRP ₹120  Net Wt 250g",
fields: {
    mrp: { value: "₹120", bbox: [235, 205, 355, 235], confidence: 0.97 },
    net_weight: { value: "250 g", bbox: [235, 245, 355, 275], confidence: 0.95 },
    manufacturer: { value: "ABC Biscuits Pvt Ltd", bbox: [40, 60, 340, 90], confidence: 0.91 },
},
},
low_confidence: {
label: "Low-confidence sample",
rawText: "ABC Biscuits Pvt Ltd  MRP ₹??0  Net Wt 250g",
fields: {
    mrp: { value: "₹?20", bbox: [235, 205, 355, 235], confidence: 0.41 },
    net_weight: { value: "250 g", bbox: [235, 245, 355, 275], confidence: 0.88 },
    manufacturer: { value: "ABC Biscuits Pvt Ltd", bbox: [40, 60, 340, 90], confidence: 0.85 },
},
},
missing_field: {
label: "Missing-field sample",
rawText: "ABC Biscuits Pvt Ltd  Net Wt 250g",
fields: {
    net_weight: { value: "250 g", bbox: [235, 245, 355, 275], confidence: 0.9 },
    manufacturer: { value: "ABC Biscuits Pvt Ltd", bbox: [40, 60, 340, 90], confidence: 0.89 },
},
},
};

// Placeholder compliance logic — replace with whatever the compliance
// teammate's legal-rule engine actually returns once it exists.
// threshold is configurable from the Settings page (default 0.6).
export function computeReport(fields, threshold = 0.6) {
const violations = [];
REQUIRED_FIELDS.forEach((key) => {
const f = fields[key];
if (!f) {
    violations.push({
    field: key,
    message: `${FIELD_LABELS[key]} not detected on package — required declaration missing.`,
    });
} else if (f.confidence < threshold) {
    violations.push({
    field: key,
    message: `${FIELD_LABELS[key]} detected with low confidence — verify manually.`,
    });
}
});
const passCount = REQUIRED_FIELDS.filter((k) => fields[k] && fields[k].confidence >= threshold).length;
const score = Math.round((passCount / REQUIRED_FIELDS.length) * 100);
return { violations, score };
}