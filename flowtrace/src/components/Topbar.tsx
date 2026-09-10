import React, { useState } from 'react';
import { Bell, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { NavigationPageId } from '../types';
import { resetDemoData } from '../services/api';

interface TopbarProps {
  activePage: NavigationPageId;
}

const pageMetadata: Record<NavigationPageId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Overview',
    subtitle: 'System health, active workflow risk, and production change intelligence'
  },
  workflows: {
    title: 'Workflows',
    subtitle: 'Build, monitor and understand production workflows and their dependencies.'
  },
  simulator: {
    title: 'Incident Analysis',
    subtitle: 'Autonomous impact prediction, dependency tracing & risk assessment'
  },
  risks: {
    title: 'Risk Events',
    subtitle: 'Production changes, dependency anomalies and workflow risks detected by FlowTrace.'
  },
  audit: {
    title: 'Audit Log',
    subtitle: 'Trace detections, analysis decisions, recommendations and operator actions across FlowTrace.'
  }
};

export const Topbar: React.FC<TopbarProps> = ({ activePage }) => {
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const currentMeta = pageMetadata[activePage] || {
    title: 'FLOWTRACE',
    subtitle: 'Process Intelligence & AI Workflow Reliability Engine'
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await resetDemoData();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      window.location.reload();
    } catch (err) {
      console.warn('Demo reset locally:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-7 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-16 right-8 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideLeft">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Demo scenario reset to canonical seed data</span>
        </div>
      )}

      {/* Left side: Context Title */}
      <div>
        <h1 className="text-sm font-bold text-slate-900 leading-none">
          {currentMeta.title}
        </h1>
        <p className="text-[11px] text-slate-500 hidden sm:block mt-1 font-medium">
          {currentMeta.subtitle}
        </p>
      </div>

      {/* Right side: Operational Badges & User */}
      <div className="flex items-center gap-3">
        {/* Reset Demo State Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
          title="Reset to canonical demo scenario"
        >
          <RotateCcw className={`w-3 h-3 text-slate-500 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Demo</span>
        </button>

        {/* Subtle System Status Indicator */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
          </span>
          <span>Continuous Intelligence Active</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200/80 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span>
        </button>

        {/* Small Avatar / User Placeholder */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="h-7 w-7 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shadow-2xs">
            FT
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-none">
              Enterprise SRE
            </span>
            <span className="text-[9px] text-slate-400 font-medium mt-0.5">
              Production Org
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

