import { useState, useRef } from "react";
import { COLORS } from "../theme";

// Covers both halves of "camera/image upload": a drag-and-drop / click-to-browse
// zone for gallery images, plus a camera-capture button for devices with one.
export default function CameraImageUpload({ onImageSelected }) {
const [isDragging, setIsDragging] = useState(false);
const fileInputRef = useRef(null);
const cameraInputRef = useRef(null);

function handleFiles(fileList) {
const file = fileList && fileList[0];
if (file) onImageSelected(file);
}

function handleDrop(e) {
e.preventDefault();
setIsDragging(false);
handleFiles(e.dataTransfer.files);
}

return (
<div>
    <div
    onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
    }}
    onDragLeave={() => setIsDragging(false)}
    onDrop={handleDrop}
    onClick={() => fileInputRef.current.click()}
    style={{
        border: `2px dashed ${isDragging ? COLORS.amber : "#CBD5E1"}`,
        borderRadius: 12,
        padding: "48px 24px",
        textAlign: "center",
        cursor: "pointer",
        background: isDragging ? "#FFFBEB" : COLORS.white,
        transition: "border-color 0.15s ease, background 0.15s ease",
    }}
    >
    <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
    />
    <div style={{ fontSize: 30, marginBottom: 8, color: COLORS.navy }}>⬆</div>
    <div style={{ fontWeight: 600, color: COLORS.navy, fontSize: 15 }}>Upload Image</div>
    <div style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 4 }}>or drag and drop</div>
    </div>

    <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
    <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
    />
    <button
        type="button"
        onClick={() => cameraInputRef.current.click()}
        style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: `1.5px solid ${COLORS.navy}`,
        background: COLORS.white,
        color: COLORS.navy,
        borderRadius: 8,
        padding: "9px 16px",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        }}
    >
        Use Camera
    </button>
    </div>
</div>
);
}
