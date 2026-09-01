import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight, Eye, Camera, AlertCircle } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function Dashboard({ setActiveTab, setSelectedScanId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/dashboard/stats'))
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setStats(resData.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  const handleViewScan = (scanId) => {
    setSelectedScanId(scanId);
    setActiveTab('result');
  };

  return (
    <div className="dashboard-page">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#12355B' }}>Enforcement Officer Dashboard</h2>
          <p style={{ color: '#475569', fontSize: '0.9rem' }}>
            Packaged Commodities Compliance Monitoring • Legal Metrology Act & Rules
          </p>
        </div>
        <button className="btn-saffron" onClick={() => setActiveTab('scan')}>
          <Camera size={18} /> New Product Scan
        </button>
      </div>

      {/* Disclaimer Banner */}
      <div className="disclaimer-banner" style={{ marginBottom: '1.5rem' }}>
        <strong>Official Notice:</strong> Prototype-based automated compliance screening against selected applicable LMPC requirements (Rules 6, 7, 8, 9 & 2026 amendments).
      </div>

      {/* Stat Cards Grid */}
      <div className="stats-grid">
        <div className="gov-card" style={{ borderLeft: '4px solid #12355B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>TOTAL INSPECTIONS</span>
            <ShieldCheck size={20} color="#12355B" />
          </div>
          <div className="stat-number">{stats ? stats.totalScans : 127}</div>
          <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> +14% this month
          </div>
        </div>

        <div className="gov-card" style={{ borderLeft: '4px solid #16A34A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>COMPLIANT PACKAGES</span>
            <CheckCircle2 size={20} color="#16A34A" />
          </div>
          <div className="stat-number" style={{ color: '#16A34A' }}>{stats ? stats.compliantCount : 78}</div>
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
            {stats ? Math.round((stats.compliantCount / stats.totalScans) * 100) : 61}% Pass Rate
          </div>
        </div>

        <div className="gov-card" style={{ borderLeft: '4px solid #DC2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>NON-COMPLIANT</span>
            <AlertTriangle size={20} color="#DC2626" />
          </div>
          <div className="stat-number" style={{ color: '#DC2626' }}>{stats ? stats.nonCompliantCount : 49}</div>
          <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>
            Action Required
          </div>
        </div>

        <div className="gov-card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>AVERAGE COMPLIANCE SCORE</span>
            <ShieldCheck size={20} color="#F59E0B" />
          </div>
          <div className="stat-number" style={{ color: '#D97706' }}>{stats ? stats.avgScore : 81}%</div>
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
            Departmental Standard: &gt;90%
          </div>
        </div>
      </div>

      {/* Main Grid: Top Violations & Recent Scans */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Top Violations breakdown */}
        <div className="gov-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#12355B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} color="#DC2626" /> Top Legal Violations
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(stats ? stats.topViolations : []).map((vio, idx) => (
              <div key={idx} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>
                  <span>{vio.name}</span>
                  <span style={{ color: '#DC2626' }}>{vio.count} cases</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Rule Reference: {vio.rule}</span>
                  <span>{Math.round((vio.count / (stats ? stats.totalScans : 127)) * 100)}% of scans</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (vio.count / 30) * 100)}%`, height: '100%', background: '#DC2626' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inspections Table */}
        <div className="gov-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#12355B' }}>Recent Field Inspections</h3>
            <button className="btn-secondary" onClick={() => setActiveTab('history')}>
              View All History <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Product Commodity</th>
                  <th>Compliance Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(stats && stats.recentScans ? stats.recentScans : []).map((scan) => (
                  <tr key={scan.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{scan.id}</td>
                    <td>{scan.product_name}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: scan.score >= 90 ? '#16A34A' : scan.score >= 75 ? '#D97706' : '#DC2626' }}>
                        {scan.score}%
                      </span>
                    </td>
                    <td>
                      <span className={scan.status === 'COMPLIANT' ? 'badge-compliant' : scan.status === 'WARNING' ? 'badge-warning' : 'badge-violation'}>
                        {scan.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleViewScan(scan.id)}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
