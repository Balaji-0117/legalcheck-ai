import { COLORS } from "../theme";

export default function Reports({ history }) {
const total = history.length;
const compliantCount = history.filter((h) => h.violationCount === 0).length;
const nonCompliantCount = total - compliantCount;
const avgScore = total === 0 ? 0 : Math.round(history.reduce((sum, h) => sum + h.score, 0) / total);

const statCard = (label, value, color) => (
<div style={{ background: COLORS.white, borderRadius: 14, padding: 20, flex: 1, boxShadow: "0 1px 3px rgba(18,53,91,0.08)" }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
    {label}
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || COLORS.navy }}>{value}</div>
</div>
);

return (
<div style={{ padding: "32px 36px" }}>
    <h1 style={{ fontSize: 20, color: COLORS.navy, margin: "0 0 4px" }}>Reports</h1>
    <p style={{ fontSize: 13.5, color: COLORS.slate, margin: "0 0 24px" }}>
    Summary of all scans performed this session.
    </p>

    {total === 0 ? (
    <div style={{ color: COLORS.slate, fontSize: 13.5 }}>No data yet — run some scans to generate a report.</div>
    ) : (
    <div style={{ display: "flex", gap: 16, maxWidth: 900 }}>
        {statCard("Total Scans", total)}
        {statCard("Compliant", compliantCount, COLORS.green)}
        {statCard("Non-Compliant", nonCompliantCount, COLORS.red)}
        {statCard("Average Score", `${avgScore}%`)}
    </div>
    )}
</div>
);
}