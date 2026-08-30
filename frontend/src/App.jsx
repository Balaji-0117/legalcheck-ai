import { useState } from "react";
import Sidebar from "./components/Sidebar";
import UploadPage from "./pages/UploadPage";
import ScanProduct from "./pages/ScanProduct";
import ComplianceCheck from "./pages/ComplianceCheck";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { SCENARIOS, computeReport } from "./mocks/Mockscandata";
import { COLORS } from "./theme";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("dashboard");

  // Change this to "low_confidence" or "missing_field" to demo other cases
  // until the real /api/scan endpoint is wired in.
  const [scenarioKey] = useState("compliant");

  const [status, setStatus] = useState("idle"); // idle | scanning | done | error
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);

  function handleImageSelected(file) {
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
    setSelectedField(null);
    setStatus("idle");
    setError(null);
    setPage("scan");
  }

  function handleScan() {
    setSelectedField(null);
    setStatus("scanning");
    setError(null);

    // Replace this block with a real fetch("/api/scan", { method: "POST", body: formData })
    // call once Siddhi's OCR endpoint is live.
    setTimeout(() => {
      const data = SCENARIOS[scenarioKey];
      if (data) {
        setResult(data);
        setStatus("done");

        const rep = computeReport(data.fields, confidenceThreshold);
        setHistory((prev) => [
          ...prev,
          {
            id: Date.now(),
            label: data.label,
            timestamp: new Date().toLocaleTimeString(),
            score: rep.score,
            violationCount: rep.violations.length,
          },
        ]);
      } else {
        setError("Scan failed. Please try again.");
        setStatus("error");
      }
    }, 900);
  }

  const report = result ? computeReport(result.fields, confidenceThreshold) : null;
  const scan = { status, imageUrl, result, report, selectedField, error };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <Sidebar activePage={page} onNavigate={setPage} />
      <main style={{ flex: 1 }}>
        {page === "dashboard" && (
          <UploadPage scan={scan} onImageSelected={handleImageSelected} onViewDetails={() => setPage("scan")} />
        )}
        {page === "scan" && <ScanProduct scan={scan} onScan={handleScan} onSelectField={setSelectedField} />}
        {page === "compliance" && <ComplianceCheck scan={scan} onGoToScan={() => setPage("scan")} />}
        {page === "reports" && <Reports history={history} />}
        {page === "history" && <History history={history} />}
        {page === "settings" && (
          <Settings confidenceThreshold={confidenceThreshold} onChangeThreshold={setConfidenceThreshold} />
        )}
      </main>
    </div>
  );
}