import { COLORS, confidenceColor } from "../theme";
import { REQUIRED_FIELDS, FIELD_LABELS } from "../mocks/Mockscandata";

export default function OCRResultDisplay({ fields, selectedField, onSelectField }) {
return (
<div>
    <div
    style={{
        fontSize: 12.5,
        fontWeight: 600,
        color: COLORS.slate,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    }}
    >
    Detected Fields
    </div>

    {REQUIRED_FIELDS.map((key) => {
    const field = fields[key];
    const isSelected = selectedField === key;
    return (
        <div
        key={key}
        onClick={() => field && onSelectField(key)}
        style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px",
            borderRadius: 10,
            cursor: field ? "pointer" : "default",
            border: isSelected ? `1.5px solid ${COLORS.navy}` : "1.5px solid transparent",
            opacity: field ? 1 : 0.6,
            marginBottom: 6,
        }}
        >
        <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1E293B" }}>{FIELD_LABELS[key]}</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: COLORS.slate, marginTop: 2 }}>
            {field ? field.value : "— not detected —"}
            </div>
        </div>
        {field && (
            <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
                background: `${confidenceColor(field.confidence)}1A`,
                color: confidenceColor(field.confidence),
            }}
            >
            {Math.round(field.confidence * 100)}%
            </span>
        )}
        </div>
    );
    })}
</div>
);
}
