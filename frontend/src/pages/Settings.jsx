import { COLORS } from "../theme";

export default function Settings({ confidenceThreshold, onChangeThreshold }) {
return (
<div style={{ padding: "32px 36px" }}>
    <h1 style={{ fontSize: 20, color: COLORS.navy, margin: "0 0 4px" }}>Settings</h1>
    <p style={{ fontSize: 13.5, color: COLORS.slate, margin: "0 0 24px" }}>
    Adjust how the compliance engine evaluates scanned fields.
    </p>

    <div style={{ background: COLORS.white, borderRadius: 14, padding: 24, maxWidth: 480, boxShadow: "0 1px 3px rgba(18,53,91,0.08)" }}>
    <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#1E293B", marginBottom: 8 }}>
        Minimum confidence threshold
    </label>
    <p style={{ fontSize: 12.5, color: COLORS.slate, margin: "0 0 14px" }}>
        Fields detected below this confidence are flagged as violations needing manual verification.
    </p>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
        type="range"
        min="0.3"
        max="0.95"
        step="0.05"
        value={confidenceThreshold}
        onChange={(e) => onChangeThreshold(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: COLORS.navy }}
        />
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13.5, color: COLORS.navy, minWidth: 44 }}>
        {Math.round(confidenceThreshold * 100)}%
        </span>
    </div>
    </div>
</div>
);
}