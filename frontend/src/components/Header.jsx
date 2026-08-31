import React from 'react';
import { ShieldCheck, LayoutDashboard, Camera, History, FileText, UserCheck } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <div className="emblem-icon">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="brand-title">LEGALCHECK AI</h1>
            <p className="brand-subtitle">Dept of Consumer Affairs • Legal Metrology Division</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            <Camera size={18} /> Scan Product
          </button>
          <button
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} /> Inspection Log
          </button>
          <button
            className={`nav-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <FileText size={18} /> LMPC Rules
          </button>
        </nav>

        <div className="officer-badge">
          <UserCheck size={18} color="#F59E0B" />
          <div>
            <div className="officer-name">Insp. Vijay Kumar</div>
            <div className="officer-role">Badge #LM-2026-884</div>
          </div>
        </div>
      </div>
    </header>
  );
}
