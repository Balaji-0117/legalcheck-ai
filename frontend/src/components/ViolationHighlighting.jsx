// Renders one field's bbox as camera-viewfinder-style corner brackets rather
// than a plain rectangle, colored by confidence (green/amber/red).
export default function ViolationHighlighting({ bbox, scaleX, scaleY, active, color, onClick }) {
const [x1, y1, x2, y2] = bbox;
const left = x1 * scaleX;
const top = y1 * scaleY;
const w = (x2 - x1) * scaleX;
const h = (y2 - y1) * scaleY;
const armLen = Math.min(w, h) * 0.28;

const corner = (cx, cy, dx, dy) => (
<path
    d={`M ${cx} ${cy + dy * armLen} L ${cx} ${cy} L ${cx + dx * armLen} ${cy}`}
    stroke={color}
    strokeWidth={active ? 3 : 2}
    fill="none"
    strokeLinecap="round"
/>
);

return (
<svg
    onClick={onClick}
    style={{ position: "absolute", left, top, width: w, height: h, cursor: "pointer", overflow: "visible" }}
    viewBox={`0 0 ${w} ${h}`}
>
    {active && <rect x="0" y="0" width={w} height={h} fill={color} opacity="0.08" />}
    {corner(0, 0, 1, 1)}
    {corner(w, 0, -1, 1)}
    {corner(0, h, 1, -1)}
    {corner(w, h, -1, -1)}
</svg>
);
}
