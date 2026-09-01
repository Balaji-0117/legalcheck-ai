import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, History, Download, RefreshCw } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function HistoryPage({ setActiveTab, setSelectedScanData }) {
  const [scans, setScans] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchScans = () => {
    setLoading(true);
    fetch(apiUrl('/api/scans'))
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setScans(resData.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching scans:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const filteredScans = scans.filter(scan => {
    const matchesSearch = scan.product_name.toLowerCase().includes(search.toLowerCase()) || scan.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || scan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectScan = (scan) => {
    setSelectedScanData(scan);
    setActiveTab('result');
  };

  return (
    <div className="history-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#12355B' }}>Legal Metrology Inspection Logs</h2>
          <p style={{ color: '#475569', fontSize: '0.9rem' }}>
            Historical audit logs of scanned packaged commodities under PCR Rules
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchScans}>
          <RefreshCw size={16} /> Refresh Log
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="gov-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="#64748B" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input
              type="text"
              placeholder="Search by Product Name or Scan ID (e.g. LM-2026-00124)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Status Filter buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'COMPLIANT', 'NON-COMPLIANT', 'WARNING'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: statusFilter === st ? '1px solid #12355B' : '1px solid #CBD5E1',
                  background: statusFilter === st ? '#12355B' : '#FFF',
                  color: statusFilter === st ? '#FFF' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inspection Log Table */}
      <div className="gov-card">
        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Scan ID</th>
                <th>Product Commodity</th>
                <th>Inspection Date</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No inspection records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredScans.map(scan => (
                  <tr key={scan.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#12355B' }}>{scan.id}</td>
                    <td style={{ fontWeight: 600 }}>{scan.product_name}</td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                      {new Date(scan.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: scan.score >= 90 ? '#16A34A' : scan.score >= 75 ? '#D97706' : '#DC2626' }}>
                        {scan.score}%
                      </span>
                    </td>
                    <td>
                      <span className={scan.status === 'COMPLIANT' ? 'badge-compliant' : scan.status === 'WARNING' ? 'badge-warning' : 'badge-violation'}>
                        {scan.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => handleSelectScan(scan)}
                      >
                        <Eye size={14} /> Details
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        onClick={() => window.open(apiUrl(`/api/reports/${scan.id}/pdf`), '_blank')}
                      >
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
