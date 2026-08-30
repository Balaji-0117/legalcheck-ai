import { COLORS } from "../theme";

export default function History({ history, onSelectEntry }) {
return (
<div style={{ padding: "32px 36px" }}>
    <h1 style={{ fontSize: 20, color: COLORS.navy, margin: "0 0 4px" }}>History</h1>
    <p style={{ fontSize: 13.5, color: COLORS.slate, margin: "0 0 24px" }}>
    Every scan performed this session, most recent first.
    </p>

    {history.length === 0 ? (
    <div style={{ color: COLORS.slate, fontSize: 13.5 }}>No scans yet — run a scan to see it appear here.</div>
    ) : (
    <div style={{ background: COLORS.white, borderRadius: 14, overflow: "hidden", maxWidth: 720, boxShadow: "0 1px 3px rgba(18,53,91,0.08)" }}>
        {history
        .slice()
        .reverse()
        .map((entry, i) => {
            const isCompliant = entry.violationCount === 0;
            return (
            <div
                key={entry.id}
                onClick={() => onSelectEntry && onSelectEntry(entry)}
                style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                borderBottom: i === history.length - 1 ? "none" : `1px solid ${COLORS.bg}`,
                cursor: onSelectEntry ? "pointer" : "default",
                }}
            >
                <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1E293B" }}>{entry.label}</div>
                <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 2 }}>{entry.timestamp}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy }}>{entry.score}%</span>
                <span
                    style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    color: COLORS.white,
                    background: isCompliant ? COLORS.green : COLORS.amber,
                    }}
                >
                    {isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
                </span>
                </div>
            </div>
            );
        })}
    </div>
    )}
</div>
);
}