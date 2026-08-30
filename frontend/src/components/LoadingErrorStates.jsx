import { COLORS } from "../theme";

export function LoadingState({ label = "Scanning package…" }) {
return (
<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px", color: COLORS.slate, fontSize: 13.5 }}>
    <span
    style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: `2.5px solid ${COLORS.bg}`,
        borderTopColor: COLORS.navy,
        animation: "lc-spin 0.7s linear infinite",
        display: "inline-block",
    }}
    />
    {label}
</div>
);
}

export function ErrorState({ message = "Something went wrong. Please try again.", onRetry }) {
return (
<div
    style={{
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 16,
    background: "#FEF2F2",
    borderRadius: 10,
    color: "#7F1D1D",
    fontSize: 13.5,
    marginTop: 12,
    }}
>
    <div>{message}</div>
    {onRetry && (
    <button
        onClick={onRetry}
        style={{
        alignSelf: "flex-start",
        border: "none",
        borderRadius: 8,
        padding: "8px 14px",
        fontWeight: 600,
        fontSize: 13,
        fontFamily: "Inter, sans-serif",
        cursor: "pointer",
        background: COLORS.red,
        color: COLORS.white,
        }}
    >
        Retry
    </button>
    )}
</div>
);
}
