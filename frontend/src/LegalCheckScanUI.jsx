import { useState, useRef, useEffect } from "react";
// ---- Design tokens (from brief) ----
const COLORS = {
  navy: "#12355B",
  amber: "#F59E0B",
  white: "#FFFFFF",
  bg: "#F1F5F9",
  green: "#16A34A",
  red: "#DC2626",
  slate: "#475569",
};

const REQUIRED_FIELDS = ["mrp", "net_weight", "manufacturer"];

const FIELD_LABELS = {
  mrp: "MRP",
  net_weight: "Net Quantity",
  manufacturer: "Manufacturer",
};

// ---- Mock scan results, matching the /api/scan contract ----
const SCENARIOS = {
  compliant: {
    label: "Compliant sample",
    rawText: "ABC Biscuits Pvt Ltd  MRP ₹120  Net Wt 250g",
    fields: {
      mrp: { value: "₹120", bbox: [235, 205, 355, 235], confidence: 0.97 },
      net_weight: { value: "250 g", bbox: [235, 245, 355, 275], confidence: 0.95 },
      manufacturer: { value: "ABC Biscuits Pvt Ltd", bbox: [40, 60, 340, 90], confidence: 0.91 },
    },
  },
  low_confidence: {
    label: "Low-confidence sample",
    rawText: "ABC Biscuits Pvt Ltd  MRP ₹??0  Net Wt 250g",
    fields: {
      mrp: { value: "₹?20", bbox: [235, 205, 355, 235], confidence: 0.41 },
      net_weight: { value: "250 g", bbox: [235, 245, 355, 275], confidence: 0.88 },
      manufacturer: { value: "ABC Biscuits Pvt Ltd", bbox: [40, 60, 340, 90], confidence: 0.85 },
    },
  },
  missing_field: {
    label: "Missing-field sample",
    rawText: "ABC Biscuits Pvt Ltd  Net Wt 250g",
    fields: {
      net_weight: { value: "250 g", bbox: [235, 245, 355, 275], confidence: 0.9 },
      manufacturer: { value: "ABC Biscuits Pvt Ltd", bbox: [40, 60, 340, 90], confidence: 0.89 },
    },
  },
};

const NATURAL_W = 400;
const NATURAL_H = 320;

const STATUS = {
  IDLE: "idle",
  SCANNING: "scanning",
  DONE: "done",
};

function confidenceColor(c) {
  if (c >= 0.85) return COLORS.green;
  if (c >= 0.6) return COLORS.amber;
  return COLORS.red;
}

function computeReport(fields) {
  const violations = [];
  REQUIRED_FIELDS.forEach((key) => {
    const f = fields[key];
    if (!f) {
      violations.push({ field: key, message: `${FIELD_LABELS[key]} not detected on package — required declaration missing.` });
    } else if (f.confidence < 0.6) {
      violations.push({ field: key, message: `${FIELD_LABELS[key]} detected with low confidence — verify manually.` });
    }
  });
  const passCount = REQUIRED_FIELDS.filter((k) => fields[k] && fields[k].confidence >= 0.6).length;
  const score = Math.round((passCount / REQUIRED_FIELDS.length) * 100);
  return { violations, score };
}

// Mock product label, drawn so its coordinates line up exactly with the
// mock bbox values above. Swap for a real uploaded photo once /api/scan is live.
function MockLabelArt() {
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

function ViewfinderBox({ bbox, scaleX, scaleY, active, color, onClick }) {
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
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        cursor: "pointer",
        overflow: "visible",
      }}
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

export default function LegalCheckScanUI() {
  const [scenarioKey, setScenarioKey] = useState("compliant");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [selectedField, setSelectedField] = useState(null);
  const [displaySize, setDisplaySize] = useState({ w: NATURAL_W, h: NATURAL_H });
  const stageRef = useRef(null);

  const scenario = SCENARIOS[scenarioKey];
  const result = status === STATUS.DONE ? scenario : null;
  const report = result ? computeReport(result.fields) : null;

  function handleScan() {
    setSelectedField(null);
    setStatus(STATUS.SCANNING);
    setTimeout(() => setStatus(STATUS.DONE), 900);
  }
  
    useEffect(() => {
    function updateSize() {
      const node = stageRef.current;
      if (!node) return;
      const w = node.clientWidth;
      const h = (w * NATURAL_H) / NATURAL_W;
      setDisplaySize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const scaleX = displaySize.w / NATURAL_W;
  const scaleY = displaySize.h / NATURAL_H;

  return (
    <div style={{ minHeight: "100%", background: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        .lc-btn {
          border: none; border-radius: 8px; padding: 12px 20px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          cursor: pointer; transition: transform 0.12s ease, opacity 0.12s ease;
        }
        .lc-btn:active { transform: scale(0.97); }
        .lc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .lc-pill {
          display: inline-flex; align-items: center; gap: 6px;
          border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 600;
        }
        .lc-field-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 14px; border-radius: 10px; cursor: pointer;
          border: 1.5px solid transparent; transition: border-color 0.12s ease, background 0.12s ease;
        }
        .lc-field-row:hover { background: #F8FAFC; }
        .lc-scenario-tab {
          border: none; background: transparent; padding: 8px 12px; font-size: 12.5px;
          font-weight: 600; border-radius: 7px; cursor: pointer; font-family: Inter, sans-serif;
        }
        @keyframes lc-sweep {
          0% { top: 0%; opacity: 0.9; }
          100% { top: 100%; opacity: 0.2; }
        }
      `}</style>

      {/* Top bar */}
      <header
        style={{
          background: COLORS.navy,
          color: COLORS.white,
          padding: "18px 28px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: COLORS.amber,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700,
            color: COLORS.navy,
            fontSize: 16,
          }}
        >
          LC
        </div>
        <div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: 0.2 }}>
            LegalCheck AI
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: -2 }}>Legal Metrology Inspection Console</div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 60px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
        {/* Left: scan stage */}
        <section
          style={{
            background: COLORS.white,
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 1px 3px rgba(18,53,91,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: COLORS.navy }}>
              Product Scan
            </h2>
            <div style={{ display: "flex", gap: 4, background: COLORS.bg, borderRadius: 8, padding: 3 }}>
              {Object.entries(SCENARIOS).map(([key, s]) => (
                <button
                  key={key}
                  className="lc-scenario-tab"
                  onClick={() => {
                    setScenarioKey(key);
                    setStatus(STATUS.IDLE);
                    setSelectedField(null);
                  }}
                  style={{
                    background: scenarioKey === key ? COLORS.white : "transparent",
                    color: scenarioKey === key ? COLORS.navy : COLORS.slate,
                    boxShadow: scenarioKey === key ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

            <div
      ref={stageRef}
      style={{
              position: "relative",
              width: "100%",
              aspectRatio: `${NATURAL_W} / ${NATURAL_H}`,
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${COLORS.bg}`,
            }}
          >
            <MockLabelArt />

            {status === STATUS.SCANNING && (
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

            {result &&
              Object.entries(result.fields).map(([name, field]) => (
                <ViewfinderBox
                  key={name}
                  bbox={field.bbox}
                  scaleX={scaleX}
                  scaleY={scaleY}
                  active={selectedField === name}
                  color={confidenceColor(field.confidence)}
                  onClick={() => setSelectedField(name)}
                />
              ))}
          </div>

          <button
            className="lc-btn"
            onClick={handleScan}
            disabled={status === STATUS.SCANNING}
            style={{
              marginTop: 16,
              width: "100%",
              background: COLORS.navy,
              color: COLORS.white,
            }}
          >
            {status === STATUS.SCANNING ? "Scanning…" : status === STATUS.DONE ? "Re-scan" : "Scan Package"}
          </button>

          <p style={{ fontSize: 12, color: COLORS.slate, marginTop: 10, lineHeight: 1.5 }}>
            Demo uses a mock label and sample OCR responses shaped like the real{" "}
            <code style={{ fontFamily: "IBM Plex Mono, monospace" }}>/api/scan</code> contract. Swap{" "}
            <code style={{ fontFamily: "IBM Plex Mono, monospace" }}>SCENARIOS</code> for the live response once the OCR endpoint is ready.
          </p>
        </section>

        {/* Right: inspection report */}
        <section
          style={{
            background: COLORS.white,
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 1px 3px rgba(18,53,91,0.08)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: COLORS.navy }}>
            Inspection Report
          </h2>

          {!result && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.slate, fontSize: 13.5, textAlign: "center", padding: 20 }}>
              Run a scan to see extracted declarations, confidence, and compliance status here.
            </div>
          )}

          {result && (
            <>
              {/* Compliance score */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: 16,
                  borderRadius: 12,
                  background: COLORS.bg,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Space Grotesk, sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: COLORS.white,
                    background: report.score >= 80 ? COLORS.green : report.score >= 50 ? COLORS.amber : COLORS.red,
                    flexShrink: 0,
                  }}
                >
                  {report.score}%
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}>
                    {report.violations.length === 0 ? "No violations detected" : `${report.violations.length} issue${report.violations.length > 1 ? "s" : ""} found`}
                  </div>
                  <div style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 2 }}>
                    Based on {REQUIRED_FIELDS.length} required declarations
                  </div>
                </div>
              </div>

              {/* Detected fields */}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.slate, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Detected Fields
              </div>
              <div style={{ marginBottom: 18 }}>
                {REQUIRED_FIELDS.map((key) => {
                  const field = result.fields[key];
                  const isSelected = selectedField === key;
                  return (
                    <div
                      key={key}
                      className="lc-field-row"
                      onClick={() => field && setSelectedField(key)}
                      style={{
                        borderColor: isSelected ? COLORS.navy : "transparent",
                        opacity: field ? 1 : 0.6,
                        cursor: field ? "pointer" : "default",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1E293B" }}>{FIELD_LABELS[key]}</div>
                        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: COLORS.slate, marginTop: 2 }}>
                          {field ? field.value : "— not detected —"}
                        </div>
                      </div>
                      {field && (
                        <span
                          className="lc-pill"
                          style={{
                            background: `${confidenceColor(field.confidence)}1A`,
                            color: confidenceColor(field.confidence),
                          }}
                        >
                          {Math.round(field.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Violations */}
              {report.violations.length > 0 && (
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.slate, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Violations
                  </div>
                  {report.violations.map((v, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedField(v.field)}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#FEF2F2",
                        marginBottom: 8,
                        cursor: "pointer",
                        border: selectedField === v.field ? `1.5px solid ${COLORS.red}` : "1.5px solid transparent",
                      }}
                    >
                      <div style={{ width: 6, borderRadius: 3, background: COLORS.red, flexShrink: 0 }} />
                      <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.4 }}>{v.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
