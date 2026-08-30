import { COLORS } from "../theme";

export default function ScanButton({ status, onClick, disabled }) {
const label = status === "scanning" ? "Scanning…" : status === "done" ? "Re-scan" : "Scan Package";

return (
<button
    onClick={onClick}
    disabled={disabled || status === "scanning"}
    style={{
    width: "100%",
    border: "none",
    borderRadius: 8,
    padding: "12px 20px",
    fontWeight: 600,
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    cursor: disabled || status === "scanning" ? "not-allowed" : "pointer",
    background: COLORS.navy,
    color: COLORS.white,
    opacity: disabled ? 0.5 : 1,
    transition: "opacity 0.12s ease",
    }}
>
    {label}
</button>
);
}
