import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Camera, 
  History, 
  FileText, 
  UserCheck, 
  FileCheck2,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, selectedScanId }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & Analytics' },
    { id: 'scan', label: 'Scan Product', icon: Camera, desc: 'OCR & Inspection' },
    { id: 'history', label: 'Inspection Log', icon: History, desc: 'Audit History' },
    { id: 'rules', label: 'LMPC Rules', icon: FileText, desc: 'Legal Metrology Rules' },
  ];

  return (
    <aside className="sidebar-container">
      {/* Brand Section */}
      <div className="sidebar-brand">
        <div className="emblem-wrapper">
          <ShieldCheck size={28} className="brand-icon" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">LEGALCHECK AI</h1>
          <span className="brand-tag">Govt. of India • DCA</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">NAVIGATION</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-icon-box">
                <Icon size={20} />
              </div>
              <div className="nav-label-box">
                <span className="nav-label-text">{item.label}</span>
                <span className="nav-desc-text">{item.desc}</span>
              </div>
              {isActive && <ChevronRight size={16} className="active-arrow" />}
            </button>
          );
        })}

        {/* Dynamic Scan Result Tab if scan is selected */}
        {selectedScanId && (
          <>
            <div className="nav-section-title" style={{ marginTop: '1.5rem' }}>CURRENT REPORT</div>
            <button
              className={`sidebar-nav-btn ${activeTab === 'result' ? 'active' : ''}`}
              onClick={() => setActiveTab('result')}
            >
              <div className="nav-icon-box result-icon">
                <FileCheck2 size={20} />
              </div>
              <div className="nav-label-box">
                <span className="nav-label-text">Scan Result</span>
                <span className="nav-desc-text">{selectedScanId}</span>
              </div>
              {activeTab === 'result' && <ChevronRight size={16} className="active-arrow" />}
            </button>
          </>
        )}
      </nav>

      {/* Officer / Inspector Profile Badge */}
      <div className="sidebar-officer-badge">
        <div className="officer-avatar">
          <UserCheck size={20} color="#F59E0B" />
        </div>
        <div className="officer-details">
          <div className="officer-name">Insp. Vijay Kumar</div>
          <div className="officer-badge-id">Badge #LM-2026-884</div>
          <div className="officer-jurisdiction">Delhi Central Circle</div>
        </div>
      </div>
    </aside>
  );
}
