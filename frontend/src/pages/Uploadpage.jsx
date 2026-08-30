import { COLORS } from "../theme";
import CameraImageUpload from "../components/CameraImageUpload";
import ComplianceResultPage from "../components/ComplianceResultPage";

export default function UploadPage({ scan, onImageSelected, onViewDetails }) {
const { result, report } = scan;

return (
<div style={{ padding: "32px 36px" }}>
    <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: 22, color: COLORS.navy, margin: "0 0 4px" }}>
    Ensure Compliance. Protect Consumers.
    </h1>
    <p style={{ fontSize: 13.5, color: COLORS.slate, margin: "0 0 28px" }}>
    Verify product labels as per Legal Metrology (Packaged Commodities) Rules, 2011.
    </p>

    <div style={{ display: "grid", gridTemplateColumns: result ? "1.3fr 1fr" : "1fr", gap: 24, maxWidth: 760 }}>
    <CameraImageUpload onImageSelected={onImageSelected} />
    {result && (
        <ComplianceResultPage compact score={report.score} violations={report.violations} onViewDetails={onViewDetails} />
    )}
    </div>
</div>
);
}
