import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  Flame,
  GitFork,
  TrendingUp,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import type { NavigationPageId, WorkflowDefinition } from '../types';
import { fetchOverview, fetchWorkflows, type OverviewData } from '../services/api';

interface OverviewProps {
  onNavigate: (page: NavigationPageId) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const [ovData, wfData] = await Promise.all([fetchOverview(), fetchWorkflows()]);
      setOverview(ovData);
      setWorkflows(wfData);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData(false);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const atRiskWorkflows = workflows.filter(w => w.riskLevel === 'high');
  const healthyWorkflows = workflows.filter(w => w.riskLevel === 'low' || w.riskLevel === 'medium');

  return (
    <div className="space-y-5 pb-10 select-none">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
              </span>
              <span>Continuous monitoring active</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            System health, active workflow risk, and production change intelligence
          </p>
        </div>

        {/* Global Evaluation Posture */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Overview"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Last evaluated: Just now</span>
          </div>
        </div>
      </div>

      {/* 2. TOP-LEVEL KPI ROW (4 Meaningful Enterprise Metrics from Database) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Active Workflows */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Workflows
            </span>
            <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <GitFork className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {workflows.length || overview?.activeWorkflows || 4}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-semibold text-emerald-600">
                {healthyWorkflows.length} nominal
              </span>
              <span>•</span>
              <span className="text-amber-700 font-medium">
                {atRiskWorkflows.length} at risk
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Workflows at Risk */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              At Risk
            </span>
            <div className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-amber-600">
              {atRiskWorkflows.length || overview?.atRiskWorkflows || 1}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              <span>1 critical high risk</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Changes Analyzed */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Changes Analyzed
            </span>
            <div className="h-6 w-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {overview?.changesAnalyzed || 48}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <span>Last 24 hours</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Critical Events */}
        <div className="rounded-lg border border-red-200/80 bg-red-50/20 p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
              Critical Events
            </span>
            <div className="h-6 w-6 rounded bg-red-100 text-red-700 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-red-600">
              {overview?.criticalEvents || 3}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-red-700 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
              <span>Action recommended</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROMINENT ACTIVE PRODUCTION RISK CARD */}
      <div className="rounded-lg border border-red-300 bg-red-50/30 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2.5 flex-1">
            {/* Top Tag Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold tracking-wide flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                ACTIVE PRODUCTION RISK
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                API CONTRACT DRIFT
              </span>
              <span className="text-[11px] text-slate-400 font-mono">• Detected just now</span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                Customer Identity API schema change
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mt-0.5">
                <span>Workflow:</span>
                <span className="font-semibold text-slate-900">Customer Verification &amp; Approval</span>
                <code className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">WF-CVA-01</code>
              </div>
            </div>

            {/* Primary Consequence Summary */}
            <div className="rounded-md bg-white/90 border border-red-200/70 p-3 text-xs text-slate-700 leading-relaxed shadow-2xs">
              <span className="font-bold text-slate-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                Primary Consequence
              </span>
              <p className="text-slate-700 font-medium">
                &ldquo;Schema mismatch may cause verification failures and propagate invalid or incomplete data into downstream fraud assessment and approval systems.&rdquo;
              </p>
            </div>
          </div>

          {/* Right Metrics + Action CTA */}
          <div className="flex flex-col gap-2.5 shrink-0 lg:w-72">
            {/* Metric Strip */}
            <div className="grid grid-cols-2 gap-2 bg-white border border-red-200 p-3 rounded-lg text-center">
              <div className="p-0.5">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Risk</span>
                <div className="text-base font-bold font-mono text-red-600">
                  82 <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </div>
                <span className="text-[9px] font-bold text-red-700 bg-red-50 px-1 py-0.2 rounded inline-block">HIGH</span>
              </div>
              <div className="p-0.5 border-l border-slate-100">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Failure Prob.</span>
                <div className="text-base font-bold font-mono text-red-600">68%</div>
                <span className="text-[9px] text-slate-400 font-medium block">Elevated</span>
              </div>
              <div className="p-0.5 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Affected Components</span>
                <div className="text-xs font-bold font-mono text-slate-900">3 services</div>
              </div>
              <div className="p-0.5 pt-1.5 border-t border-l border-slate-100">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Dependencies Traced</span>
                <div className="text-xs font-bold font-mono text-slate-900">5 links</div>
              </div>
            </div>

            {/* Clear CTA to Incident Analysis */}
            <button
              onClick={() => onNavigate('simulator')}
              className="w-full py-2 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View Incident Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. TWO-COLUMN WORKFLOW HEALTH & RISK POSTURE / RECENT CHANGES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): WORKFLOW HEALTH */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Workflow Health
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Monitored production workflows and continuous risk posture
                </p>
              </div>
              <button
                onClick={() => onNavigate('workflows')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View all {workflows.length}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Dynamic Workflow Rows from API */}
            <div className="space-y-2">
              {workflows.map((wf) => {
                const isCritical = wf.riskLevel === 'high';
                return (
                  <div
                    key={wf.id}
                    onClick={() => onNavigate(isCritical ? 'simulator' : 'workflows')}
                    className={`p-3 rounded-md border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isCritical
                        ? 'border-red-200 bg-red-50/20 hover:bg-red-50/40'
                        : 'border-slate-200/80 bg-slate-50/30 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {wf.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isCritical
                              ? 'bg-red-100 border border-red-200 text-red-700'
                              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          }`}
                        >
                          {isCritical ? 'At Risk' : 'Healthy'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>{wf.code}</span>
                        <span>•</span>
                        <span>{wf.nodes.length} components</span>
                        <span>•</span>
                        <span className={isCritical ? 'text-red-700 font-semibold' : ''}>
                          {isCritical ? 'Evaluated: Just now' : 'Evaluated: Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">Risk Score</span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            isCritical ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {isCritical ? '82 / 100' : `${100 - wf.healthScore || 18} / 100`}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 flex items-center gap-0.5">
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): RISK POSTURE & RECENT PRODUCTION CHANGES */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* SECTION: RISK POSTURE */}
          <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Risk Posture
              </h3>
              <span className="text-xs font-bold font-mono text-emerald-600">
                {workflows.length} Monitored Workflows
              </span>
            </div>

            {/* Health Distribution Breakdown */}
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${Math.round((healthyWorkflows.length / (workflows.length || 1)) * 100)}%` }}
                  title={`${healthyWorkflows.length} Healthy`}
                />
                <div
                  className="bg-red-500 h-full"
                  style={{ width: `${Math.round((atRiskWorkflows.length / (workflows.length || 1)) * 100)}%` }}
                  title={`${atRiskWorkflows.length} At Risk`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Healthy</span>
                  <strong className="text-emerald-700 font-mono text-sm">
                    {healthyWorkflows.length}
                  </strong>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">At Risk</span>
                  <strong className="text-amber-700 font-mono text-sm">
                    {atRiskWorkflows.length}
                  </strong>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Critical</span>
                  <strong className="text-red-700 font-mono text-sm">
                    {atRiskWorkflows.length}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: RECENT PRODUCTION CHANGES */}
          <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Recent Production Changes
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Autonomous Tracing</span>
            </div>

            <div className="space-y-2 text-xs">
              {(overview?.recentChanges || []).map((chg, i) => (
                <div
                  key={i}
                  onClick={() => onNavigate('simulator')}
                  className={`p-2.5 rounded-md border transition-colors cursor-pointer space-y-1 ${
                    chg.severity === 'high'
                      ? 'border-red-200 bg-red-50/20 hover:bg-red-50/40'
                      : 'border-slate-200/80 bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          chg.severity === 'high' ? 'bg-red-600' : 'bg-emerald-500'
                        }`}
                      />
                      <span>{chg.component}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        chg.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {chg.risk}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">
                    {chg.summary}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>{chg.details}</span>
                    <span className={chg.severity === 'high' ? 'text-red-700 font-semibold' : ''}>
                      {chg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
