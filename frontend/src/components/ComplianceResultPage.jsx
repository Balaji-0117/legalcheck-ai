import { COLORS } from "../theme";

export default function ComplianceResultPage({ score, violations, compact, onViewDetails }) {
const isCompliant = violations.length === 0;
const statusColor = isCompliant ? COLORS.green : COLORS.amber;
const statusLabel = isCompliant ? "COMPLIANT" : "NON-COMPLIANT";

if (compact) {
return (
    <div style={{ background: COLORS.white, borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(18,53,91,0.08)" }}>
    <div
        style={{
        fontSize: 12.5,
        fontWeight: 600,
        color: COLORS.slate,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        }}
    >
        Compliance Status
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span
        style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: statusColor,
            flexShrink: 0,
        }}
        />
        <span style={{ fontWeight: 700, color: statusColor, fontSize: 15 }}>{statusLabel}</span>
    </div>
    <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 16 }}>
        {isCompliant ? "No issues found" : `${violations.length} violation${violations.length > 1 ? "s" : ""} found`}
    </div>
    <button
        onClick={onViewDetails}
        style={{
        width: "100%",
        border: "none",
        borderRadius: 8,
        padding: "10px 16px",
        fontWeight: 600,
        fontSize: 13.5,
        fontFamily: "Inter, sans-serif",
        cursor: "pointer",
        background: COLORS.amber,
        color: COLORS.white,
        }}
    >
        View Details
    </button>
    </div>
);
}

return (
<div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(18,53,91,0.08)" }}>
    <div
    style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 16,
        borderRadius: 12,
        background: COLORS.bg,
        marginBottom: 18,
    }}
    >
    <div
        style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 16,
        color: COLORS.white,
        background: score >= 80 ? COLORS.green : score >= 50 ? COLORS.amber : COLORS.red,
        flexShrink: 0,
        }}
    >
        {score}%
    </div>
    <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}>
        {isCompliant ? "No violations detected" : `${violations.length} issue${violations.length > 1 ? "s" : ""} found`}
        </div>
    </div>
    </div>

    {violations.length > 0 && (
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
        Violations
        </div>
        {violations.map((v, i) => (
        <div
            key={i}
            style={{
            display: "flex",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#FEF2F2",
            marginBottom: 8,
            }}
        >
            <div style={{ width: 6, borderRadius: 3, background: COLORS.red, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.4 }}>{v.message}</div>
        </div>
        ))}
    </div>
    )}
</div>
);
}
