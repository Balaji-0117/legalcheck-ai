import { useState, useRef, useEffect } from "react";
import { COLORS, confidenceColor } from "../theme";
import { NATURAL_W, NATURAL_H } from "../mocks/Mockscandata";
import MockLabelArt from "./MockLabelArt";
import ViolationHighlighting from "./ViolationHighlighting";

export default function ImagePreview({ imageUrl, fields, selectedField, onSelectField, isScanning }) {
const stageRef = useRef(null);
// "natural" = the real pixel size the bbox coordinates were measured against.
// Defaults to the mock label's fixed size; updates to the real photo's size on load.
const [natural, setNatural] = useState({ w: NATURAL_W, h: NATURAL_H });
const [display, setDisplay] = useState({ w: NATURAL_W, h: NATURAL_H });

useEffect(() => {
function updateDisplaySize() {
    const node = stageRef.current;
    if (!node) return;
    const w = node.clientWidth;
    const h = (w * natural.h) / natural.w;
    setDisplay((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
}
updateDisplaySize();
window.addEventListener("resize", updateDisplaySize);
return () => window.removeEventListener("resize", updateDisplaySize);
}, [natural]);

function handleImgLoad(e) {
const img = e.target;
setNatural({ w: img.naturalWidth, h: img.naturalHeight });
}

const scaleX = display.w / natural.w;
const scaleY = display.h / natural.h;

return (
<div
    ref={stageRef}
    style={{
    position: "relative",
    width: "100%",
    aspectRatio: `${natural.w} / ${natural.h}`,
    borderRadius: 12,
    overflow: "hidden",
    border: `1px solid ${COLORS.bg}`,
    background: COLORS.white,
    }}
>
    {imageUrl ? (
    <img
        src={imageUrl}
        alt="Uploaded product"
        onLoad={handleImgLoad}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
    />
    ) : (
    <MockLabelArt />
    )}

    {isScanning && (
    <div
        style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, transparent, ${COLORS.amber}, transparent)`,
        animation: "lc-sweep 0.9s linear infinite",
        }}
    />
    )}

    {fields &&
    Object.entries(fields).map(([name, field]) => (
        <ViolationHighlighting
        key={name}
        bbox={field.bbox}
        scaleX={scaleX}
        scaleY={scaleY}
        active={selectedField === name}
        color={confidenceColor(field.confidence)}
        onClick={() => onSelectField(name)}
        />
    ))}
</div>
);
}
