import { COLORS } from "../theme";

const NAV_ITEMS = [
{ key: "dashboard", label: "Dashboard" },
{ key: "scan", label: "Scan Product" },
{ key: "compliance", label: "Compliance Check" },
{ key: "reports", label: "Reports" },
{ key: "history", label: "History" },
{ key: "settings", label: "Settings" },
];

export default function Sidebar({ activePage, onNavigate }) {
return (
<aside
    style={{
    width: 220,
    background: COLORS.navy,
    color: COLORS.white,
    minHeight: "100vh",
    padding: "20px 14px",
    flexShrink: 0,
    }}
>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px 24px" }}>
    <div
        style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: COLORS.amber,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        color: COLORS.navy,
        fontSize: 14,
        }}
    >
        LC
    </div>
    <div style={{ fontWeight: 700, fontSize: 15 }}>LegalCheck AI</div>
    </div>

    <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {NAV_ITEMS.map((item) => {
        const isActive = activePage === item.key;
        return (
        <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
            display: "flex",
            alignItems: "center",
            border: "none",
            borderRadius: 8,
            padding: "10px 12px",
            background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
            color: COLORS.white,
            fontSize: 13.5,
            fontFamily: "Inter, sans-serif",
            fontWeight: isActive ? 600 : 500,
            cursor: "pointer",
            textAlign: "left",
            }}
        >
            {item.label}
        </button>
        );
    })}
    </nav>
</aside>
);
}
