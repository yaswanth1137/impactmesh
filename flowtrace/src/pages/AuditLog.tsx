import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  ArrowRight,
  FileCheck,
  Radio,
  X,
  Copy,
  Check,
  ChevronRight,
  GitFork,
  Activity,
  Zap,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import type { NavigationPageId, AuditEntry, AuditCategory } from '../types';
import { fetchAuditLogs } from '../services/api';

interface AuditLogProps {
  onNavigate: (page: NavigationPageId) => void;
}

const enterpriseAuditEntries: AuditEntry[] = [
  {
    id: 'AUD-89105',
    timestamp: '14:32:20 UTC',
    relativeTime: 'Just now',
    action: 'Operator Decision',
    category: 'operator_action',
    target: 'Production Approval Gate',
    affectedComponent: 'Approval API / Business System',
    workflow: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    actor: 'Enterprise SRE Operator',
    result: 'Awaiting operator decision (Advisory: PAUSE recommendation issued to mitigate 68% verification failure rate).',
    status: 'pending',
    severity: 'high',
    stepNumber: 6,
    details: 'FlowTrace presented autonomous risk assessment (Risk Score 82, Failure Probability 68%) and recommended pausing the approval workflow. Operator notification dispatched; awaiting manual decision in Incident Analysis.',
    evidence: {
      riskScore: 82,
      failureProbability: '68%',
      affectedComponentsCount: 3,
      dependenciesTracedCount: 5,
      recommendedAction: 'PAUSE WORKFLOW',
      operatorNote: 'Operator review in progress via FlowTrace Incident Analysis command console.'
    },
    isCurrentIncident: true
  },
  {
    id: 'AUD-89104',
    timestamp: '14:32:15 UTC',
    relativeTime: 'Just now',
    action: 'Recommendation Generated',
    category: 'recommendation',
    target: 'Approval Workflow Guardrail',
    affectedComponent: 'Customer Verification & Approval (WF-CVA-01)',
    workflow: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    actor: 'FlowTrace Engine',
    result: 'Recommendation: Pause affected approval workflow to prevent invalid risk score propagation.',
    status: 'recommended',
    severity: 'critical',
    stepNumber: 5,
    details: 'Autonomous policy rule triggered: Predicted failure probability (68%) exceeds critical safety threshold (30%). Generated advisory recommending temporary pause of automated underwriting gate.',
    evidence: {
      riskScore: 82,
      failureProbability: '68%',
      affectedComponentsCount: 3,
      dependenciesTracedCount: 5,
      recommendedAction: 'PAUSE WORKFLOW'
    },
    isCurrentIncident: true
  },
  {
    id: 'AUD-89103',
    timestamp: '14:32:09 UTC',
    relativeTime: 'Just now',
    action: 'Risk Assessment',
    category: 'analysis',
    target: 'Customer Verification & Approval',
    affectedComponent: 'Customer Identity API → Verification Chain',
    workflow: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    actor: 'FlowTrace Engine',
    result: 'Risk score calculated: 82/100. Failure probability: 68%. Severity: High Risk.',
    status: 'completed',
    severity: 'high',
    stepNumber: 4,
    details: 'Calculated composite risk score based on telemetry breach, downstream blast radius (3 services), and deserialization failure rates across verification reasoning agents.',
    evidence: {
      riskScore: 82,
      failureProbability: '68%',
      affectedComponentsCount: 3,
      dependenciesTracedCount: 5
    },
    isCurrentIncident: true
  },
  {
    id: 'AUD-89102',
    timestamp: '14:32:06 UTC',
    relativeTime: 'Just now',
    action: 'Impact Prediction',
    category: 'analysis',
    target: '3 Downstream Components',
    affectedComponent: 'Customer Verification Agent, Fraud Assessment Agent, Approval API',
    workflow: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    actor: 'FlowTrace Engine',
    result: '3 downstream components identified as potentially affected (68% failure rate predicted).',
    status: 'completed',
    severity: 'high',
    stepNumber: 3,
    details: 'Autonomous model identified direct deserialization impact on Customer Verification Agent (Groq-powered reasoning) cascading unverified fallback tokens into Fraud Assessment Agent and core Approval API.',
    evidence: {
      riskScore: 82,
      failureProbability: '68%',
      affectedComponentsCount: 3,
      dependenciesTracedCount: 5
    },
    isCurrentIncident: true
  },
  {
    id: 'AUD-89101',
    timestamp: '14:32:05 UTC',
    relativeTime: 'Just now',
    action: 'Dependency Analysis',
    category: 'analysis',
    target: '5 Workflow Dependency Links',
    affectedComponent: 'Identity → Verification → Fraud → Approval & Audit Sink',
    workflow: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    actor: 'FlowTrace Engine',
    result: 'FlowTrace traced downstream dependencies. 5 dependencies traced from identity service to core underwriting.',
    status: 'completed',
    severity: 'info',
    stepNumber: 2,
    details: 'Traversed live topology graph from Customer Identity API across REST, Agentic ToolCall, and gRPC protocol edges. Isolated 5 dependency paths.',
    evidence: {
      dependenciesTracedCount: 5,
      affectedComponentsCount: 3
    },
    isCurrentIncident: true
  },
  {
    id: 'AUD-89100',
    timestamp: '14:32:04 UTC',
    relativeTime: 'Just now',
    action: 'Change Detected',
    category: 'detection',
    target: 'Customer Identity API (v2.4 → v2.5)',
    affectedComponent: 'Customer Identity API',
    workflow: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    actor: 'Production telemetry',
    result: 'Customer Identity API schema change detected: customer.identity.status converted from string enum to nested object.',
    status: 'completed',
    severity: 'high',
    stepNumber: 1,
    details: 'Contract observation hook detected payload format alteration in GET /v2/identity/verify response. Status field converted from flat string enum to dictionary object without backward compatibility.',
    evidence: {
      schemaDiffSummary: 'customer.identity.status: string enum -> nested dictionary object',
      affectedComponentsCount: 3
    },
    isCurrentIncident: true
  },
  {
    id: 'AUD-89085',
    timestamp: '14:00:00 UTC',
    relativeTime: '32 min ago',
    action: 'Operator Decision',
    category: 'operator_action',
    target: 'Velocity & Pattern Scorer (Groq-Powered)',
    affectedComponent: 'Velocity & Pattern Scorer',
    workflow: 'Payment Fraud Detection',
    workflowCode: 'WF-PFD-02',
    actor: 'Enterprise SRE Operator',
    result: 'Workflow parameters updated by operator: enabled automated Unicode payload normalization hook.',
    status: 'action_taken',
    severity: 'normal',
    details: 'Operator reviewed minor token formatting anomaly and approved runtime schema sanitization hook. Telemetry error rate stabilized at 0.02%.',
    evidence: {
      operatorNote: 'Approved normalization filter for international merchant category codes.'
    }
  },
  {
    id: 'AUD-89052',
    timestamp: '13:30:00 UTC',
    relativeTime: '1 hour ago',
    action: 'Dependency Analysis',
    category: 'analysis',
    target: 'OpenAPI Spec Catalog',
    affectedComponent: 'Enterprise CRM Sync API',
    workflow: 'Customer Onboarding',
    workflowCode: 'WF-COB-03',
    actor: 'FlowTrace Engine',
    result: 'Synchronized latest API contracts across 18 microservice definitions. Backwards compatibility verified.',
    status: 'completed',
    severity: 'normal',
    details: 'Automated contract synchronization confirmed non-breaking additive field "crm_external_tenant_id" in CRM webhook synchronization spec.'
  },
  {
    id: 'AUD-89020',
    timestamp: '12:45:00 UTC',
    relativeTime: '1.8 hours ago',
    action: 'Recommendation Generated',
    category: 'recommendation',
    target: 'Redis Feature Store',
    affectedComponent: 'Redis Cluster (v7.2.4)',
    workflow: 'Payment Fraud Detection',
    workflowCode: 'WF-PFD-02',
    actor: 'FlowTrace Engine',
    result: 'Recommendation: ALLOW with active monitoring. Partition rebalance completed in 45s.',
    status: 'recommended',
    severity: 'info',
    details: 'High-risk partition rebalance evaluated. Autonomous connection recycling resolved connection contention with zero failed transactions.'
  },
  {
    id: 'AUD-88990',
    timestamp: '12:15:00 UTC',
    relativeTime: '2.3 hours ago',
    action: 'Change Detected',
    category: 'detection',
    target: 'Card Transaction Ingress (v3.2.0)',
    affectedComponent: 'Card Transaction Ingress',
    workflow: 'Payment Fraud Detection',
    workflowCode: 'WF-PFD-02',
    actor: 'Production telemetry',
    result: 'Canary version deployment detected. 10% transaction traffic routed with zero regressions.',
    status: 'completed',
    severity: 'normal',
    details: 'Canary deployment observed across 42K req/min traffic. Contract integrity and latency benchmarks verified.'
  }
];

export const AuditLog: React.FC<AuditLogProps> = ({ onNavigate }) => {
  const [entriesList, setEntriesList] = useState<AuditEntry[]>(enterpriseAuditEntries);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const logs = await fetchAuditLogs();
        if (logs && logs.length > 0) {
          setEntriesList(logs);
        }
      } catch (err) {
        console.warn('Loaded audit logs locally:', err);
      }
    };
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter calculations
  const totalEntries = entriesList.length;
  const detectionCount = entriesList.filter(e => e.category === 'detection').length;
  const analysisCount = entriesList.filter(e => e.category === 'analysis').length;
  const recommendationCount = entriesList.filter(e => e.category === 'recommendation').length;
  const operatorActionCount = entriesList.filter(e => e.category === 'operator_action').length;

  const filteredEntries = entriesList.filter((entry) => {
    const matchesSearch =
      entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.workflow.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.workflowCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.result.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      activeCategory === 'all' ? true : entry.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadge = (category: AuditCategory) => {
    switch (category) {
      case 'detection':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold font-mono tracking-wide flex items-center gap-1">
            <Radio className="w-3 h-3 text-amber-600" />
            DETECTION
          </span>
        );
      case 'analysis':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold font-mono tracking-wide flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-600" />
            ANALYSIS
          </span>
        );
      case 'recommendation':
        return (
          <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold font-mono tracking-wide flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            RECOMMENDATION
          </span>
        );
      case 'operator_action':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold font-mono tracking-wide flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-purple-600" />
            OPERATOR ACTION
          </span>
        );
    }
  };

  const getStatusBadge = (status: AuditEntry['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-semibold">
            COMPLETED
          </span>
        );
      case 'recommended':
        return (
          <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold tracking-wide animate-pulse">
            RECOMMENDED
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold tracking-wide">
            AWAITING DECISION
          </span>
        );
      case 'action_taken':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
            ACTION TAKEN
          </span>
        );
      case 'verified':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-semibold">
            VERIFIED
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fadeIn">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              Audit Log
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Audit trail &bull; All systems</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Trace detections, analysis decisions, recommendations and operator actions across FlowTrace.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time governance ledger</span>
        </div>
      </div>

      {/* 2. SUMMARY CARDS (4 Compact KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Events Today */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Events Today
            </span>
            <div className="h-6 w-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-slate-900">48</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>Telemetry &amp; change events</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Risk Assessments */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Risk Assessments
            </span>
            <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-slate-900">14</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>Autonomous impact evaluations</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Recommendations */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Recommendations
            </span>
            <div className="h-6 w-6 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-slate-900">6</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>Policy &amp; guardrail advisories</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Operator Actions */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Operator Actions
            </span>
            <div className="h-6 w-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-slate-900">5</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>Operator decisions &amp; approvals</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. REASONING CHAIN LIFECYCLE BAR */}
      <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              FlowTrace Autonomous Governance Flow
            </span>
            <span className="text-[11px] text-slate-500">
              Explainable chain of continuous detection, impact tracing, risk assessment, and operator governance
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Deterministic Audit Chain</span>
        </div>

        {/* 6 Step Progression Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-2 rounded-md bg-amber-50/70 border border-amber-200/80 space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-amber-700 block">STEP 1</span>
            <span className="font-bold text-slate-900 text-[11px] block">Change Detected</span>
          </div>

          <div className="p-2 rounded-md bg-blue-50/70 border border-blue-200/80 space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-blue-700 block">STEP 2</span>
            <span className="font-bold text-slate-900 text-[11px] block">Dependencies Traced</span>
          </div>

          <div className="p-2 rounded-md bg-blue-50/70 border border-blue-200/80 space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-blue-700 block">STEP 3</span>
            <span className="font-bold text-slate-900 text-[11px] block">Impact Predicted</span>
          </div>

          <div className="p-2 rounded-md bg-amber-50/70 border border-amber-200/80 space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-amber-700 block">STEP 4</span>
            <span className="font-bold text-slate-900 text-[11px] block">Risk Assessed</span>
          </div>

          <div className="p-2 rounded-md bg-red-50/70 border border-red-200/80 space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-red-700 block">STEP 5</span>
            <span className="font-bold text-slate-900 text-[11px] block">Recommendation</span>
          </div>

          <div className="p-2 rounded-md bg-purple-50/70 border border-purple-200/80 space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-purple-700 block">STEP 6</span>
            <span className="font-bold text-slate-900 text-[11px] block">Operator Decision</span>
          </div>
        </div>
      </div>

      {/* 4. SEARCH & CATEGORY FILTERS */}
      <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actions, workflows, actors, results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing {filteredEntries.length} immutable governance records
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Category Filter:
          </span>
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
              {totalEntries}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('detection')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'detection'
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-800'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Detection</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'detection' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              {detectionCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('analysis')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'analysis'
                ? 'bg-blue-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Analysis</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'analysis' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
              {analysisCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('recommendation')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'recommendation'
                ? 'bg-red-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Recommendation</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'recommendation' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {recommendationCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('operator_action')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'operator_action'
                ? 'bg-purple-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-800'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Operator Action</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'operator_action' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 border border-purple-200'}`}>
              {operatorActionCount}
            </span>
          </button>
        </div>
      </div>

      {/* 5. AUDIT TIMELINE TABLE */}
      <div className="rounded-lg border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No matching audit entries</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No governance entries found matching your search query &ldquo;{searchTerm}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('all');
              }}
              className="mt-2 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEntries.map((entry) => {
              const isCurrent = entry.isCurrentIncident;
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`p-4 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer group ${
                    isCurrent
                      ? 'bg-red-50/15 hover:bg-red-50/30 border-l-4 border-l-red-500'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Left Column: Timestamp & Action */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Timestamp */}
                    <div className="w-28 shrink-0 space-y-0.5 pt-0.5">
                      <div className="text-[11px] font-mono font-bold text-slate-800">
                        {entry.timestamp}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {entry.relativeTime || 'Earlier today'}
                      </div>
                    </div>

                    {/* Main Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                          {entry.action}
                        </span>

                        {getCategoryBadge(entry.category)}
                        {getStatusBadge(entry.status)}

                        <span className="text-[10px] font-mono text-slate-400">
                          {entry.id}
                        </span>
                      </div>

                      {/* Workflow & Component Context */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                        <span className="font-medium text-slate-500">Workflow:</span>
                        <span className="font-bold text-slate-900">{entry.workflow}</span>
                        <code className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                          {entry.workflowCode}
                        </code>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-500">Target:</span>
                        <strong className="text-slate-800">{entry.target}</strong>
                      </div>

                      {/* Result / Outcome */}
                      <div className="text-xs text-slate-700 font-medium">
                        <span className="text-slate-500 font-normal">Result: </span>
                        {entry.result}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Actor & Actions */}
                  <div className="flex items-center gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-between lg:justify-end">
                    {/* Actor */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Source / Actor
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {entry.actor}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('simulator');
                          }}
                          className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                          title="Inspect in Incident Analysis"
                        >
                          <span>View Analysis</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(entry);
                          }}
                          className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. SLIDE-OVER AUDIT EVENT DETAILS INSPECTOR */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideLeft"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {selectedEntry.id}
                  </span>
                  <button
                    onClick={() => handleCopyId(selectedEntry.id)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    title="Copy Event ID"
                  >
                    {copiedId === selectedEntry.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {getCategoryBadge(selectedEntry.category)}
                  {getStatusBadge(selectedEntry.status)}
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedEntry.action}
                </h2>
              </div>

              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* What Happened & Result */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                  Action Result &amp; Consequence
                </span>
                <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900">
                    {selectedEntry.result}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {selectedEntry.details}
                  </p>
                </div>
              </div>

              {/* Execution & Provenance Context */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Execution Timestamp
                  </span>
                  <div className="font-mono font-bold text-slate-900">{selectedEntry.timestamp}</div>
                  <span className="text-[10px] text-slate-500 block">
                    Relative: {selectedEntry.relativeTime || 'Today'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Source / Actor
                  </span>
                  <div className="font-mono font-bold text-slate-900">{selectedEntry.actor}</div>
                  <span className="text-[10px] text-slate-500 block">
                    Verified Execution
                  </span>
                </div>
              </div>

              {/* Workflow & Component */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Workflow Scope
                  </span>
                  <div className="font-bold text-slate-900">{selectedEntry.workflow}</div>
                  <code className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-semibold inline-block">
                    {selectedEntry.workflowCode}
                  </code>
                </div>

                <div className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Target Component
                  </span>
                  <div className="font-bold text-slate-900">{selectedEntry.target}</div>
                  <span className="text-[10px] text-slate-500 block">
                    Component Target
                  </span>
                </div>
              </div>

              {/* Evidence & Decision Trail */}
              {selectedEntry.evidence && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                    Decision Evidence &amp; Incident Reference
                  </span>

                  <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 space-y-3 shadow-2xs text-xs">
                    {selectedEntry.evidence.riskScore !== undefined && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/70">
                          <span className="text-[9px] uppercase font-semibold text-slate-400 block">Risk Score</span>
                          <strong className="font-mono text-red-600 text-sm">{selectedEntry.evidence.riskScore} / 100</strong>
                        </div>
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/70">
                          <span className="text-[9px] uppercase font-semibold text-slate-400 block">Failure Prob.</span>
                          <strong className="font-mono text-red-600 text-sm">{selectedEntry.evidence.failureProbability}</strong>
                        </div>
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/70">
                          <span className="text-[9px] uppercase font-semibold text-slate-400 block">Impacted</span>
                          <strong className="font-mono text-slate-800 text-sm">{selectedEntry.evidence.affectedComponentsCount} components</strong>
                        </div>
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/70">
                          <span className="text-[9px] uppercase font-semibold text-slate-400 block">Traced Links</span>
                          <strong className="font-mono text-slate-800 text-sm">{selectedEntry.evidence.dependenciesTracedCount} paths</strong>
                        </div>
                      </div>
                    )}

                    {selectedEntry.evidence.schemaDiffSummary && (
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200/70 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Contract Drift Summary
                        </span>
                        <code className="font-mono text-[11px] text-red-700 block">
                          {selectedEntry.evidence.schemaDiffSummary}
                        </code>
                      </div>
                    )}

                    {selectedEntry.evidence.recommendedAction && (
                      <div className="p-2.5 rounded bg-red-50/70 border border-red-200 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-red-800 block">
                          Advisory Recommendation
                        </span>
                        <div className="font-bold text-red-900 font-mono text-xs">
                          {selectedEntry.evidence.recommendedAction}
                        </div>
                      </div>
                    )}

                    {selectedEntry.evidence.operatorNote && (
                      <div className="p-2.5 rounded bg-purple-50/70 border border-purple-200 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-purple-800 block">
                          Operator Governance Status
                        </span>
                        <p className="text-xs text-purple-950 font-medium">
                          {selectedEntry.evidence.operatorNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    onNavigate('workflows');
                  }}
                  className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <GitFork className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Workflow</span>
                </button>

                {selectedEntry.isCurrentIncident && (
                  <button
                    onClick={() => {
                      setSelectedEntry(null);
                      onNavigate('simulator');
                    }}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View Incident Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
