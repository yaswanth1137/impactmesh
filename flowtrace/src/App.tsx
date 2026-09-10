import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Overview } from './pages/Overview';
import { Workflows } from './pages/Workflows';
import { ImpactSimulator } from './pages/ImpactSimulator';
import { RiskEvents } from './pages/RiskEvents';
import { AuditLog } from './pages/AuditLog';
import type { NavigationPageId } from './types';

export function App() {
  const [activePage, setActivePage] = useState<NavigationPageId>('simulator');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Fixed Left Sidebar */}
      <Sidebar activePage={activePage} onSelectPage={(page) => setActivePage(page)} />

      {/* Main App Container */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        {/* Topbar */}
        <Topbar activePage={activePage} />

        {/* Scrollable Main Content Canvas */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* OVERVIEW COMMAND CENTER */}
            {activePage === 'overview' && (
              <Overview onNavigate={(page) => setActivePage(page)} />
            )}

            {/* REAL WORKFLOWS PAGE */}
            {activePage === 'workflows' && (
              <Workflows onNavigate={(page) => setActivePage(page)} />
            )}

            {/* REAL INCIDENT + IMPACT ANALYSIS EXPERIENCE */}
            {activePage === 'simulator' && (
              <ImpactSimulator onNavigate={(page) => setActivePage(page)} />
            )}

            {/* REAL RISK EVENTS LOG */}
            {activePage === 'risks' && (
              <RiskEvents onNavigate={(page) => setActivePage(page)} />
            )}

            {/* REAL AUDIT LOG TIMELINE */}
            {activePage === 'audit' && (
              <AuditLog onNavigate={(page) => setActivePage(page)} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
