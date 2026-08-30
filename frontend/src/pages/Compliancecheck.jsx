import { COLORS } from "../theme";
import OCRResultDisplay from "../components/OCRResultDisplay";
import ComplianceResultPage from "../components/ComplianceResultPage";

export default function ComplianceCheck({ scan, onGoToScan }) {
const { result, report, selectedField } = scan;

return (
<div style={{ padding: "32px 36px" }}>
    <h1 style={{ fontSize: 20, color: COLORS.navy, margin: "0 0 4px" }}>Compliance Check</h1>
    <p style={{ fontSize: 13.5, color: COLORS.slate, margin: "0 0 24px" }}>
    Detailed compliance breakdown for the most recently scanned product.
    </p>

    {!result ? (
    <div
        style={{
        background: COLORS.white,
        borderRadius: 14,
        padding: 28,
        textAlign: "center",
        color: COLORS.slate,
        fontSize: 13.5,
        maxWidth: 480,
        }}
    >
        No scan yet. Upload and scan a product first to see its compliance check here.
        <div style={{ marginTop: 16 }}>
        <button
            onClick={onGoToScan}
            style={{
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontWeight: 600,
            fontSize: 13.5,
            cursor: "pointer",
            background: COLORS.navy,
            color: COLORS.white,
            }}
        >
            Go to Scan Product
        </button>
        </div>
    </div>
    ) : (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 }}>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(18,53,91,0.08)" }}>
        <OCRResultDisplay fields={result.fields} selectedField={selectedField} onSelectField={() => {}} />
        </div>
        <ComplianceResultPage score={report.score} violations={report.violations} />
    </div>
    )}
</div>
);
}