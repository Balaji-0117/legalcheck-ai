import { COLORS } from "../theme";
import ImagePreview from "../components/ImagePreview";
import ScanButton from "../components/ScanButton";
import OCRResultDisplay from "../components/OCRResultDisplay";
import ComplianceResultPage from "../components/ComplianceResultPage";
import { LoadingState, ErrorState } from "../components/LoadingErrorStates";

export default function ScanProduct({ scan, onScan, onSelectField }) {
const { status, imageUrl, result, report, selectedField, error } = scan;

return (
<div style={{ padding: "32px 36px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
    <section style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(18,53,91,0.08)" }}>
    <h2 style={{ margin: "0 0 14px", fontSize: 16, color: COLORS.navy }}>Product Scan</h2>

    <ImagePreview
        imageUrl={imageUrl}
        fields={result ? result.fields : null}
        selectedField={selectedField}
        onSelectField={onSelectField}
        isScanning={status === "scanning"}
    />

    <div style={{ marginTop: 16 }}>
        <ScanButton status={status} onClick={onScan} disabled={!imageUrl} />
    </div>

    {status === "scanning" && <LoadingState />}
    {status === "error" && <ErrorState message={error} onRetry={onScan} />}
    </section>

    <section style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(18,53,91,0.08)" }}>
    {!result ? (
        <div style={{ color: COLORS.slate, fontSize: 13.5 }}>Upload an image and scan to see results here.</div>
    ) : (
        <>
        <OCRResultDisplay fields={result.fields} selectedField={selectedField} onSelectField={onSelectField} />
        <div style={{ marginTop: 20 }}>
            <ComplianceResultPage score={report.score} violations={report.violations} />
        </div>
        </>
    )}
    </section>
</div>
);
}