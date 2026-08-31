import React from 'react';
import { BookOpen, ShieldCheck, FileText, CheckCircle2, Info } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="rules-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#12355B' }}>Legal Metrology Statutory Rule Guide</h2>
        <p style={{ color: '#475569', fontSize: '0.9rem' }}>
          Department of Consumer Affairs • Legal Metrology (Packaged Commodities) Rules, 2011 & Amendments
        </p>
      </div>

      {/* Rule 6 */}
      <div className="gov-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #12355B' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#12355B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} color="#F59E0B" /> Rule 6: Mandatory Declarations on Packaged Commodities
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1rem' }}>
          Every package containing a commodity shall bear thereon or on a label securely affixed thereto, a definite, plain and conspicuous declaration as to:
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#12355B' }}>Rule 6(1)(a): Manufacturer Details</strong>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>Name and address of manufacturer, packer, or importer.</p>
          </div>
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#12355B' }}>Rule 6(1)(b): Generic Name</strong>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>Common or generic name of commodity.</p>
          </div>
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#12355B' }}>Rule 6(1)(c): Net Quantity</strong>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>Declared in standard units of weight, measure or number.</p>
          </div>
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#12355B' }}>Rule 6(1)(e): Maximum Retail Price</strong>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>MRP ₹... (incl. of all taxes) in statutory format.</p>
          </div>
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#12355B' }}>Rule 6(1)(11): Unit Sale Price</strong>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>Mandatory unit price per g/kg/ml/l/unit for packages &gt; 1 unit/g.</p>
          </div>
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#12355B' }}>Rule 6(2): Consumer Care</strong>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>Contact details for complaints (phone, email, address).</p>
          </div>
        </div>
      </div>

      {/* Rule 7 & Font Height */}
      <div className="gov-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #F59E0B' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#12355B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} color="#F59E0B" /> Rule 7: Minimum Height of Numerals & Letters
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1rem' }}>
          Rule 7 specifies minimum font height for declarations based on principal display panel area (1mm, 2mm, 4mm, 6mm).
        </p>

        <div className="disclaimer-banner" style={{ background: '#FFFBEB', borderLeftColor: '#F59E0B' }}>
          <strong>Note on AI Screening:</strong> LegalCheck AI performs <em>Image-Based Font/Readability Screening</em> using bounding-box pixel heights and label area contrast ratio estimations, rather than laboratory millimeter gauge measurement.
        </div>
      </div>

      {/* 2026 Amendments */}
      <div className="gov-card" style={{ borderLeft: '4px solid #16A34A' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#12355B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={20} color="#16A34A" /> 2026 Amendments & Special Provisions
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#475569' }}>
          <strong>February 2026 Amendment (Effective July 1, 2026):</strong> E-commerce entities selling imported packaged commodities must provide a searchable and sortable Country of Origin filter tag on digital product listings and physical outer packaging declarations.
        </p>
      </div>
    </div>
  );
}
