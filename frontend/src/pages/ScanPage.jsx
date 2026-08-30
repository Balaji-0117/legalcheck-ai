import React, { useState } from 'react';
import { Upload, Camera, FileCheck, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const PRESET_SAMPLES = [
  {
    id: '06_multiside_packaged_tea',
    title: 'Tata Sampann Tea (Multi-Side 3-Photo Package)',
    description: 'Multi-Image OCR: Aggregates declarations across Front, Back (MRP/MFD) & Side panels',
    expectedScore: 100,
    status: 'COMPLIANT'
  },
  {
    id: '01_compliant_biscuits',
    title: 'Compliant Biscuits Packet',
    description: '100% Pass: All Rule 6 mandatory declarations present',
    expectedScore: 100,
    status: 'COMPLIANT'
  },
  {
    id: '02_missing_country_origin',
    title: 'Imported Chocolates',
    description: 'Violation: Missing Country of Origin declaration (Rule 6)',
    expectedScore: 82,
    status: 'NON-COMPLIANT'
  },
  {
    id: '03_missing_unit_sale_price',
    title: 'Wheat Atta (5 kg)',
    description: 'Violation: Missing Unit Sale Price (Rule 6(1)(11))',
    expectedScore: 85,
    status: 'NON-COMPLIANT'
  },
  {
    id: '04_missing_mrp_format',
    title: 'Detergent Powder',
    description: 'Violation: Non-standard MRP wording & missing Consumer Care',
    expectedScore: 72,
    status: 'NON-COMPLIANT'
  },
  {
    id: '05_font_readability_warning',
    title: 'NutriCrunch Cookies',
    description: 'Warning: Image-based font height & low contrast screening (Rule 7/9)',
    expectedScore: 88,
    status: 'WARNING'
  }
];

export default function ScanPage({ setActiveTab, setSelectedScanData }) {
  const [selectedSample, setSelectedSample] = useState(PRESET_SAMPLES[0].id);
  const [files, setFiles] = useState([]);
  const [scanning, setScanning] = useState(false);

  const handleFileChange = (e) => {
    const selectedList = Array.from(e.target.files);
    if (selectedList.length > 0) {
      const newFileItems = selectedList.map((f, idx) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        name: f.name,
        sideTag: `Side ${files.length + idx + 1}`
      }));
      setFiles((prev) => [...prev, ...newFileItems]);
      setSelectedSample(null);
    }
  };

  const handleRemoveFile = (idToRemove) => {
    setFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const handleScanSubmit = async () => {
    setScanning(true);

    try {
      const formData = new FormData();
      if (files.length > 0) {
        files.forEach((item) => {
          formData.append('images', item.file);
        });
      } else if (selectedSample) {
        formData.append('sampleId', selectedSample);
      } else {
        alert('Please upload at least one image or select a preset sample package.');
        setScanning(false);
        return;
      }

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      });

      const resData = await response.json();
      if (resData.success) {
        setSelectedScanData(resData.data);
        setActiveTab('result');
      } else {
        alert('Scan Error: ' + resData.error);
      }
    } catch (err) {
      console.error('Scan API failed:', err);
      alert('Failed to connect to LegalCheck backend server.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="scan-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#12355B' }}>Packaged Commodity Inspector</h2>
        <p style={{ color: '#475569', fontSize: '0.95rem' }}>
          Upload multiple photos of product sides (Front, Back, MRP/MFD, Ingredients) for combined Legal Metrology AI inspection
        </p>
      </div>

      {/* Main Upload / Preset Card */}
      <div className="gov-card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#12355B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Camera size={20} color="#F59E0B" /> Step 1: Upload Product Side Photos (Multi-Side Support)
        </h3>

        {/* Dropzone */}
        <label className="upload-dropzone" style={{ cursor: 'pointer', position: 'relative' }}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="multi-file-input"
          />
          <Upload size={42} color="#12355B" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.1rem', color: '#12355B' }}>Click to Upload Product Photos or Drag & Drop</h4>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
            Upload multiple photos (Front side, Back side with MRP/MFD, Side panel) — OCR will extract details across all sides!
          </p>
          <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', background: '#FEF3C7', color: '#B45309', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
            ✨ Multi-Image Extraction Enabled
          </span>
        </label>

        {/* Selected Image Thumbnails Gallery */}
        {files.length > 0 && (
          <div style={{ marginTop: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, color: '#12355B', fontSize: '0.95rem' }}>
                📸 Attached Product Photos ({files.length}):
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
              >
                Clear All
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '8px',
                    textAlign: 'center'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: '#12355B',
                      color: '#FFF',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12
                    }}
                  >
                    Photo {idx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: '#DC2626',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}
                    title="Remove Photo"
                  >
                    ✕
                  </button>

                  <img
                    src={item.previewUrl}
                    alt={`Side ${idx + 1}`}
                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: 6, marginTop: '1.5rem' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 6, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {item.name}
                  </div>
                </div>
              ))}

              {/* Add More Photos Card */}
              <label
                htmlFor="multi-file-input"
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '160px',
                  cursor: 'pointer',
                  background: '#FFFFFF',
                  color: '#12355B',
                  padding: '1rem'
                }}
              >
                <Upload size={24} color="#12355B" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: 6 }}>+ Add Another Side</span>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Back, Side or Top Label</span>
              </label>
            </div>
          </div>
        )}

        {/* Quick Sample Selector */}
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ fontSize: '0.95rem', color: '#12355B', marginBottom: '0.75rem', fontWeight: 600 }}>
            OR Select Demo Sample Package (Hackathon Preset):
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {PRESET_SAMPLES.map(sample => (
              <div
                key={sample.id}
                onClick={() => {
                  setSelectedSample(sample.id);
                  setFiles([]);
                }}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  border: selectedSample === sample.id ? '2px solid #F59E0B' : '1px solid #CBD5E1',
                  background: selectedSample === sample.id ? '#FFFBEB' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#12355B' }}>{sample.title}</span>
                  <span className={sample.status === 'COMPLIANT' ? 'badge-compliant' : sample.status === 'WARNING' ? 'badge-warning' : 'badge-violation'}>
                    {sample.expectedScore}%
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>{sample.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            className="btn-saffron"
            style={{ width: '100%', maxWidth: '340px', padding: '14px 24px', fontSize: '1.05rem', justifyContent: 'center' }}
            disabled={scanning}
            onClick={handleScanSubmit}
          >
            {scanning ? (
              <span>Running Multi-Side OCR & Engine...</span>
            ) : (
              <>
                <ShieldCheck size={20} /> Run Multi-Side AI Compliance Scan <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

