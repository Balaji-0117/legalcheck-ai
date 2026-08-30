import { NATURAL_W, NATURAL_H } from "../mocks/Mockscandata";

export default function MockLabelArt() {
return (
<svg viewBox={`0 0 ${NATURAL_W} ${NATURAL_H}`} width="100%" height="100%">
    <rect x="0" y="0" width={NATURAL_W} height={NATURAL_H} fill="#FDF6E9" />
    <rect x="0" y="0" width={NATURAL_W} height={NATURAL_H} fill="none" stroke="#D8CBA4" strokeWidth="6" />
    <text x="40" y="82" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="700" fill="#2A2A2A">
    ABC Biscuits Pvt Ltd
    </text>
    <line x1="40" y1="120" x2="360" y2="120" stroke="#D8CBA4" strokeWidth="2" />
    <text x="235" y="228" fontFamily="IBM Plex Mono, monospace" fontSize="20" fill="#2A2A2A">
    MRP ₹120
    </text>
    <text x="235" y="268" fontFamily="IBM Plex Mono, monospace" fontSize="18" fill="#2A2A2A">
    Net Wt 250g
    </text>
    <text x="40" y="290" fontFamily="Inter, sans-serif" fontSize="12" fill="#8A7F63">
    Mfd. in India · Consumer care: 1800-000-000
    </text>
</svg>
);
}
