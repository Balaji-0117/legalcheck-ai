import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import RulesPage from './pages/RulesPage';
import { apiUrl } from './config/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedScanData, setSelectedScanData] = useState(null);
  const [selectedScanId, setSelectedScanId] = useState(null);

  useEffect(() => {
    if (selectedScanId) {
      fetch(apiUrl(`/api/scans/${selectedScanId}`))
        .then(res => res.json())
        .then(resData => {
          if (resData.success) {
            setSelectedScanData(resData.data);
          }
        })
        .catch(err => console.error('Error fetching scan detail:', err));
    }
  }, [selectedScanId]);

  return (
    <div className="app-root">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            setSelectedScanId={(id) => {
              setSelectedScanId(id);
              setActiveTab('result');
            }}
          />
        )}

        {activeTab === 'scan' && (
          <ScanPage
            setActiveTab={setActiveTab}
            setSelectedScanData={setSelectedScanData}
          />
        )}

        {activeTab === 'result' && (
          <ResultPage
            scanData={selectedScanData}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            setActiveTab={setActiveTab}
            setSelectedScanData={(scan) => {
              setSelectedScanData(scan);
              setActiveTab('result');
            }}
          />
        )}

        {activeTab === 'rules' && (
          <RulesPage />
        )}
      </main>
    </div>
  );
}
