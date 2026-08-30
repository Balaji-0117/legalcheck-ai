import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, Download, Eye, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ResultPage({ scanData, setActiveTab }) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [selectedSideIndex, setSelectedSideIndex] = useState(0);

  if (!scanData) {
    return (
      <div className="gov-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>No inspection scan selected</h3>
        <p style={{ color: '#64748B', marginTop: 8 }}>Please initiate a product scan from the scan menu.</p>
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('scan')}>
          Go to Scan Page
        </button>
      </div>
    );
  }

  const {
    id,
    product_name,
    score,
    status,
    created_at,
    violations = [],
    passedDeclarations = [],
    fields = {},
    boxes = [],
    image_url,
    image_urls = [],
    photo_count = 1
  } = scanData;

  const allImages = image_urls && image_urls.length > 0 ? image_urls : [image_url || '/sample-images/01_compliant_biscuits.jpg'];

  const handleDownloadPdf = () => {
    window.open(`/api/reports/${id}/pdf`, '_blank');
  };

  // Filter boxes by selected side if multi-side
  const filteredBoxes = boxes.filter(b => {
    if (selectedSideIndex === 0) return true; // All sides
    const targetSide = `Photo ${selectedSideIndex}`;
    return !b.side || b.side.toLowerCase() === targetSide.toLowerCase() || (b.text && b.text.toLowerCase().includes(targetSide.toLowerCase()));
  });

  return (
    <div className="result-page">
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn-secondary" onClick={() => setActiveTab('scan')}>
          <ArrowLeft size={16} /> Back to Scanner
        </button>
        <button className="btn-saffron" onClick={handleDownloadPdf}>
          <Download size={18} /> Download Official PDF Report
        </button>
      </div>

      {/* Header Result Summary Card */}
      <div className="gov-card" style={{ marginBottom: '1.5rem', borderTop: `5px solid ${status === 'COMPLIANT' ? '#16A34A' : '#DC2626'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>INSPECTION SCAN ID: <strong style={{ color: '#12355B' }}>{id}</strong></span>
              <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                📷 {allImages.length} {allImages.length > 1 ? 'Package Sides Scanned' : 'Photo Scanned'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.7rem', color: '#12355B', margin: '4px 0' }}>{product_name || 'Packaged Commodity Item'}</h2>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>
              Inspected on: {new Date(created_at).toLocaleString()} • Legal Metrology Act 2009 & PCR 2011 Rules
            </p>
          </div>

          {/* Compliance Badge / Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#F8FAFC', padding: '12px 20px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: score >= 90 ? '#16A34A' : score >= 75 ? '#D97706' : '#DC2626', fontFamily: 'Outfit' }}>
                {score}%
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>COMPLIANCE SCORE</div>
            </div>

            <div>
              <span className={status === 'COMPLIANT' ? 'badge-compliant' : status === 'WARNING' ? 'badge-warning' : 'badge-violation'} style={{ fontSize: '1rem', padding: '6px 16px' }}>
                {status === 'COMPLIANT' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} {status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Violations & Declarations vs Bounding Box Image Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Violations & Declarations */}
        <div>
          {/* Violations Section */}
          <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#12355B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={22} color="#DC2626" /> Statutory Violations ({violations.length})
            </h3>

            {violations.length === 0 ? (
              <div style={{ padding: '1rem', background: '#DCFCE7', color: '#16A34A', borderRadius: 8, fontWeight: 600 }}>
                ✓ No violations detected. All mandatory declarations comply with Legal Metrology Rules.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {violations.map((vio, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#DC2626', fontSize: '0.95rem' }}>
                        {idx + 1}. {vio.name || vio.field}
                      </span>
                      <span style={{ background: '#DC2626', color: '#FFF', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                        {vio.severity || 'HIGH'} SEVERITY
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#12355B', fontWeight: 600, marginTop: 4 }}>
                      Rule Reference: {vio.legalSource || vio.ruleId || 'LMPC Rule 6'}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: 6 }}>
                      <strong>Evidence Reason:</strong> {vio.reason}
                    </p>

                    {vio.officerAction && (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: '#FFF', borderRadius: 6, fontSize: '0.8rem', color: '#12355B', borderLeft: '3px solid #F59E0B' }}>
                        <strong>Officer Recommendation:</strong> {vio.officerAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Passed Declarations Aggregated across all package sides */}
          <div className="gov-card">
            <h3 style={{ fontSize: '1.1rem', color: '#12355B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} color="#16A34A" /> Extracted Mandatory Declarations (Combined Multi-Side OCR)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1rem' }}>
              Statutory attributes combined from {allImages.length} uploaded product side photo(s)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {Object.entries(fields).map(([key, val]) => (
                <div key={key} style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: val ? '#0F172A' : '#DC2626', marginTop: 2 }}>
                    {val || 'Not Detected ✗'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Side Photo Selector & OCR Bounding Box Overlay */}
        <div>
          <div className="gov-card" style={{ position: 'sticky', top: '90px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#12355B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={18} color="#12355B" /> Label OCR & BBox Overlay
              </h3>
              <button
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => setShowBoxes(!showBoxes)}
              >
                {showBoxes ? 'Hide BBoxes' : 'Show BBoxes'}
              </button>
            </div>

            {/* Photo Side Selector Tabs if multiple sides exist */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSideIndex(0)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    background: selectedSideIndex === 0 ? '#12355B' : '#E2E8F0',
                    color: selectedSideIndex === 0 ? '#FFF' : '#334155'
                  }}
                >
                  All Sides ({boxes.length})
                </button>
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSideIndex(idx + 1)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      background: selectedSideIndex === idx + 1 ? '#12355B' : '#E2E8F0',
                      color: selectedSideIndex === idx + 1 ? '#FFF' : '#334155'
                    }}
                  >
                    Photo {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Bounding Box Canvas Container */}
            <div style={{ position: 'relative', width: '100%', minHeight: '360px', background: '#0F172A', borderRadius: 8, overflow: 'hidden', padding: '1rem', color: '#FFF' }}>
              <div style={{ opacity: 0.25, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(#38BDF8 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>OCR TEXT & REGIONS ({selectedSideIndex === 0 ? 'ALL SIDES' : `PHOTO ${selectedSideIndex}`}):</span>
                  <span>{filteredBoxes.length} Bounding Boxes</span>
                </div>

                {filteredBoxes.length === 0 ? (
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem 0' }}>
                    No bounding boxes found for this photo side view.
                  </div>
                ) : (
                  filteredBoxes.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        margin: '6px 0',
                        padding: '6px 10px',
                        border: showBoxes ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                        background: showBoxes ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{b.text}</span>
                      {showBoxes && (
                        <span style={{ fontSize: '0.65rem', background: '#F59E0B', color: '#0F172A', fontWeight: 700, padding: '1px 4px', borderRadius: 2, marginLeft: 8 }}>
                          {b.field}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

