import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Flame,
  Search,
  CheckCircle2,
  ShieldAlert,
  Radio,
  SlidersHorizontal,
  X,
  Copy,
  Check,
  ChevronRight,
  GitFork,
  Layers,
  FileCode2,
  Zap,
  Info
} from 'lucide-react';
import type { NavigationPageId, RiskEventItem } from '../types';
import { fetchRiskEvents } from '../services/api';

interface RiskEventsProps {
  onNavigate: (page: NavigationPageId) => void;
}

const enterpriseRiskEvents: RiskEventItem[] = [
  {
    id: 'EVT-94021',
    timestamp: '14:32:04 UTC',
    detectedTime: 'Just now',
    eventType: 'API Contract Drift',
    workflow: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    affectedComponent: 'Customer Identity API (v2.5)',
    sourceNode: 'customer-identity-api',
    severity: 'critical',
    riskScore: 82,
    status: 'action_required',
    recommendedAction: 'PAUSE',
    failureRate: '68.0%',
    impactRadius: 3,
    rootCause: 'Breaking schema contract drift: customer.identity.status payload modified from flat string enum to nested dictionary object without backward compatibility.',
    details: 'Schema change in Customer Identity API (v2.4 → v2.5) altered identity verification response format. Deserialization exceptions spiking to 68%, propagating unverified fallback tokens into downstream fraud assessment and approval engines.',
    propagationPath: [
      'Customer Identity API (v2.5)',
      'Customer Verification Agent (Groq-Powered)',
      'Fraud Assessment Agent',
      'Approval API / Business System (gRPC)'
    ],
    schemaDiff: {
      before: `// v2.4 Contract (Expected)
{
  "customer_id": "CUST-883910",
  "status": "VERIFIED_ACTIVE",
  "identity_score": 0.98,
  "registry_code": "REG-US-CA"
}`,
      after: `// v2.5 Contract (Observed Drift)
{
  "customer_id": "CUST-883910",
  "status": {
    "code": "VERIFIED",
    "sub_status": "ACTIVE",
    "tier": "TIER_A1"
  },
  "identity_score": 0.98,
  "registry_code": "REG-US-CA"
}`
    },
    telemetrySnapshot: {
      latency: '140 ms',
      errorRate: '68.0%',
      p99Latency: '240 ms',
      traffic: '18.4K / min'
    },
    isCurrentIncident: true
  },
  {
    id: 'EVT-94018',
    timestamp: '14:15:30 UTC',
    detectedTime: '16 min ago',
    eventType: 'Dependency Failure',
    workflow: 'Payment Fraud Detection',
    workflowCode: 'WF-PFD-02',
    affectedComponent: 'Merchant Risk Evaluation Pod',
    sourceNode: 'fraud-scorer-agent',
    severity: 'high',
    riskScore: 72,
    status: 'investigating',
    recommendedAction: 'WARN',
    failureRate: '14.5%',
    impactRadius: 2,
    rootCause: 'Payment gateway upstream DNS resolution failure triggered fallback connection timeout cascading into merchant risk scoring pod.',
    details: 'Downstream merchant risk evaluation pod experienced 14.5% timeout rate. FlowTrace automatic circuit breaker engaged to isolate unhealthy node.',
    propagationPath: [
      'Payment Gateway Ingress',
      'Merchant Risk Evaluation Pod',
      'Settlement Decision Router'
    ],
    telemetrySnapshot: {
      latency: '210 ms',
      errorRate: '14.5%',
      p99Latency: '450 ms',
      traffic: '42.0K / min'
    }
  },
  {
    id: 'EVT-94015',
    timestamp: '14:00:10 UTC',
    detectedTime: '32 min ago',
    eventType: 'Agent Behavior Anomaly',
    workflow: 'Payment Fraud Detection',
    workflowCode: 'WF-PFD-02',
    affectedComponent: 'Velocity & Pattern Scorer (Groq-Powered)',
    sourceNode: 'fraud-scorer-agent',
    severity: 'high',
    riskScore: 68,
    status: 'monitored',
    recommendedAction: 'WARN',
    failureRate: '4.2%',
    impactRadius: 1,
    rootCause: 'Non-ASCII character sets in international merchant category codes caused unexpected tool-call argument formatting drift in LLM output.',
    details: 'Autonomous evaluation engine detected token serialization drift in payment velocity agent. Deterministic guardrail retry policy engaged with automatic payload normalization.',
    propagationPath: [
      'Card Transaction Ingress',
      'Velocity & Pattern Scorer (Groq-Powered)',
      'Redis Feature Store'
    ],
    telemetrySnapshot: {
      latency: '38 ms',
      errorRate: '4.2%',
      p99Latency: '120 ms',
      traffic: '42.0K / min'
    }
  },
  {
    id: 'EVT-94008',
    timestamp: '13:38:45 UTC',
    detectedTime: '54 min ago',
    eventType: 'Elevated Error Rate',
    workflow: 'Customer Onboarding',
    workflowCode: 'WF-COB-03',
    affectedComponent: 'Document Extraction Agent (GPT-4o Vision)',
    sourceNode: 'doc-parser-agent',
    severity: 'medium',
    riskScore: 48,
    status: 'monitored',
    recommendedAction: 'WARN',
    failureRate: '4.8%',
    impactRadius: 1,
    rootCause: 'Binary multipart passport scan upload stream contained unescaped Unicode byte sequences during OCR extraction.',
    details: 'Document extraction error rate temporarily elevated to 4.8% during batch onboarding cycle. Image sanitization pre-processing filter applied automatically.',
    propagationPath: [
      'Document Extraction Agent (GPT-4o Vision)',
      'Enterprise CRM Sync API'
    ],
    telemetrySnapshot: {
      latency: '120 ms',
      errorRate: '4.8%',
      p99Latency: '350 ms',
      traffic: '2.4K / min'
    }
  },
  {
    id: 'EVT-93992',
    timestamp: '13:30:12 UTC',
    detectedTime: '1 hour ago',
    eventType: 'Downstream Propagation',
    workflow: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    affectedComponent: 'Fraud Assessment Agent & Approval API',
    sourceNode: 'fraud-assessment-agent',
    severity: 'medium',
    riskScore: 52,
    status: 'mitigated',
    recommendedAction: 'PAUSE',
    failureRate: '18.0%',
    impactRadius: 2,
    rootCause: 'Downstream cascade propagation: unverified identity tokens from upstream verification agent caused underwriting confidence degradation.',
    details: 'Cascading failure path from Customer Identity API through verification agent reached core approval gateway. Rate limiting throttled 40% of non-critical requests.',
    propagationPath: [
      'Fraud Assessment Agent (GPT-4o)',
      'Approval API / Business System'
    ],
    telemetrySnapshot: {
      latency: '210 ms',
      errorRate: '18.0%',
      p99Latency: '420 ms',
      traffic: '8.6K / min'
    }
  },
  {
    id: 'EVT-93880',
    timestamp: '12:02:18 UTC',
    detectedTime: '2.5 hours ago',
    eventType: 'High-Risk Production Change',
    workflow: 'Payment Fraud Detection',
    workflowCode: 'WF-PFD-02',
    affectedComponent: 'Redis Feature Store (v7.2.4)',
    sourceNode: 'feature-store',
    severity: 'high',
    riskScore: 76,
    status: 'resolved',
    recommendedAction: 'ALLOW',
    failureRate: '0.0%',
    impactRadius: 2,
    rootCause: 'Cluster partition rebalance during batch merchant settlement created connection pool contention (85% utilization spike).',
    details: 'High-risk partition rebalance detected in Redis distributed state cluster. Autonomous connection recycling and read-replica failover restored nominal latency in 45s.',
    propagationPath: [
      'Redis Feature Store',
      'Settlement Decision Router'
    ],
    telemetrySnapshot: {
      latency: '4 ms',
      errorRate: '0.0%',
      p99Latency: '12 ms',
      traffic: '42.0K / min'
    }
  },
  {
    id: 'EVT-93850',
    timestamp: '10:30:00 UTC',
    detectedTime: '4 hours ago',
    eventType: 'Workflow Degradation',
    workflow: 'Loan Underwriting',
    workflowCode: 'WF-LUW-04',
    affectedComponent: 'Loan Origination Ledger (CockroachDB)',
    sourceNode: 'loan-ledger-db',
    severity: 'low',
    riskScore: 28,
    status: 'resolved',
    recommendedAction: 'ALLOW',
    failureRate: '0.0%',
    impactRadius: 0,
    rootCause: 'Database transaction lock contention on historical covenant audit ledger during simultaneous quarterly closing queries.',
    details: 'p99 database write latency temporarily increased to 340ms. Autonomous query pool re-prioritization mitigated contention and recovered baseline latency to 25ms.',
    propagationPath: [
      'Loan Pricing Calculator API',
      'Loan Origination Ledger'
    ],
    telemetrySnapshot: {
      latency: '25 ms',
      errorRate: '0.0%',
      p99Latency: '48 ms',
      traffic: '5.1K / min'
    }
  },
  {
    id: 'EVT-93720',
    timestamp: '08:30:00 UTC',
    detectedTime: '6 hours ago',
    eventType: 'API Contract Drift',
    workflow: 'Customer Onboarding',
    workflowCode: 'WF-COB-03',
    affectedComponent: 'Enterprise CRM Sync API (v4.0.0)',
    sourceNode: 'crm-sync-api',
    severity: 'low',
    riskScore: 16,
    status: 'resolved',
    recommendedAction: 'ALLOW',
    failureRate: '0.0%',
    impactRadius: 1,
    rootCause: 'Non-breaking additive field "crm_external_tenant_id" added to webhook synchronization contract payload.',
    details: 'Additive schema change deployed by CRM engineering pod. Autonomous contract validator verified backwards compatibility with zero consumer regressions.',
    propagationPath: [
      'Enterprise CRM Sync API',
      'Customer Notification Stream'
    ],
    telemetrySnapshot: {
      latency: '48 ms',
      errorRate: '0.0%',
      p99Latency: '82 ms',
      traffic: '2.4K / min'
    }
  },
  {
    id: 'EVT-93640',
    timestamp: '06:30:00 UTC',
    detectedTime: '8 hours ago',
    eventType: 'High-Risk Production Change',
    workflow: 'Payment Fraud Detection',
    workflowCode: 'WF-PFD-02',
    affectedComponent: 'Card Transaction Ingress (ISO 8583 Gateway)',
    sourceNode: 'txn-gateway',
    severity: 'low',
    riskScore: 35,
    status: 'resolved',
    recommendedAction: 'ALLOW',
    failureRate: '0.01%',
    impactRadius: 3,
    rootCause: 'Canary deployment of ISO 8583 ingress gateway v3.2.0 rolled out to 10% production transaction traffic.',
    details: 'Automated telemetry verification observed 42K req/min across canary ingress nodes. Contract integrity, payload deserialization, and latency benchmarks verified.',
    propagationPath: [
      'Card Transaction Ingress',
      'Velocity & Pattern Scorer',
      'Redis Feature Store',
      'Settlement Decision Router'
    ],
    telemetrySnapshot: {
      latency: '18 ms',
      errorRate: '0.01%',
      p99Latency: '35 ms',
      traffic: '42.0K / min'
    }
  }
];

export const RiskEvents: React.FC<RiskEventsProps> = ({ onNavigate }) => {
  const [eventsList, setEventsList] = useState<RiskEventItem[]>(enterpriseRiskEvents);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'resolved'>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<RiskEventItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const events = await fetchRiskEvents();
        if (events && events.length > 0) {
          setEventsList(events);
        }
      } catch (err) {
        console.warn('Loaded risk events locally:', err);
      }
    };
    loadEvents();
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter calculations
  const totalEvents = eventsList.length;
  const criticalCount = eventsList.filter(e => e.severity === 'critical' || (e.severity === 'high' && e.status === 'action_required')).length;
  const highCount = eventsList.filter(e => e.severity === 'high').length;
  const mediumCount = eventsList.filter(e => e.severity === 'medium').length;
  const resolvedCount = eventsList.filter(e => e.status === 'resolved' || e.status === 'verified').length;
  const activeCount = eventsList.filter(e => e.status === 'action_required' || e.status === 'investigating' || e.status === 'monitored').length;

  const eventTypes = Array.from(new Set(eventsList.map(e => e.eventType)));

  const filteredEvents = eventsList.filter((event) => {
    const matchesSearch =
      event.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.workflow.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.workflowCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.affectedComponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.rootCause && event.rootCause.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity =
      severityFilter === 'all'
        ? true
        : severityFilter === 'critical'
        ? event.severity === 'critical' || (event.severity === 'high' && event.status === 'action_required')
        : severityFilter === 'high'
        ? event.severity === 'high'
        : severityFilter === 'medium'
        ? event.severity === 'medium'
        : severityFilter === 'resolved'
        ? event.status === 'resolved' || event.status === 'verified'
        : true;

    const matchesType =
      selectedEventType === 'all' || event.eventType === selectedEventType;

    return matchesSearch && matchesSeverity && matchesType;
  });

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (severity: RiskEventItem['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 border border-red-200 text-red-800 text-[10px] font-bold tracking-wide">
            <Flame className="w-3 h-3 text-red-600 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold tracking-wide">
            <Flame className="w-3 h-3 text-red-600" />
            HIGH RISK
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold tracking-wide">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            MEDIUM RISK
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold tracking-wide">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            LOW RISK
          </span>
        );
    }
  };

  const getStatusBadge = (status: RiskEventItem['status']) => {
    switch (status) {
      case 'action_required':
        return (
          <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold tracking-wider animate-pulse flex items-center gap-1 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
            ACTION REQUIRED
          </span>
        );
      case 'investigating':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold tracking-wider">
            INVESTIGATING
          </span>
        );
      case 'monitored':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-semibold">
            MONITORED
          </span>
        );
      case 'mitigated':
        return (
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10px] font-semibold">
            MITIGATED
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-semibold">
            RESOLVED
          </span>
        );
      case 'verified':
        return (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-semibold">
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
              Risk Events
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
            Production changes, dependency anomalies and workflow risks detected by FlowTrace.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time event feed</span>
        </div>
      </div>

      {/* 2. SUMMARY CARDS (4 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Active Events */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Events
            </span>
            <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-slate-900">{activeCount}</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">Across 12 monitored workflows</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Critical */}
        <div className="rounded-lg border border-red-200/80 bg-red-50/20 p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
              Critical
            </span>
            <div className="h-6 w-6 rounded bg-red-100 text-red-700 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-red-600">{criticalCount}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-red-700 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
              <span>1 breaking schema drift</span>
            </div>
          </div>
        </div>

        {/* KPI 3: High Risk */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              High Risk
            </span>
            <div className="h-6 w-6 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-amber-700">{highCount}</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>Downstream cascade risk</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Resolved */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Resolved
            </span>
            <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-slate-900">{resolvedCount}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <span>Autonomous & verified fixes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROMINENT ACTIVE INCIDENT BANNER (Customer Identity API Schema Drift) */}
      <div className="rounded-lg border border-red-300 bg-red-50/30 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold tracking-wide flex items-center gap-1 shadow-2xs">
                <ShieldAlert className="w-3 h-3" />
                ACTIVE CRITICAL RISK EVENT
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                API CONTRACT DRIFT
              </span>
              <span className="text-[11px] text-slate-400 font-mono">• Detected just now (14:32:04 UTC)</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  Customer Identity API (v2.5) Schema Contract Drift
                </h2>
                <code className="font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                  EVT-94021
                </code>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                Response schema modified without backward compatibility: field <code className="font-mono bg-white px-1 py-0.2 rounded border border-red-200 text-red-800 text-[11px]">customer.identity.status</code> converted from string enum to dictionary object. Downstream verification agent experiencing <strong className="text-red-700 font-bold">68% deserialization failure rate</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium pt-0.5">
              <span>Affected Workflow:</span>
              <span className="font-bold text-slate-900">Customer Verification &amp; Approval</span>
              <code className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">WF-CVA-01</code>
              <span className="text-slate-300">•</span>
              <span>3 Affected Downstream Services</span>
              <span className="text-slate-300">•</span>
              <span className="text-red-700 font-bold">Recommended: PAUSE WORKFLOW</span>
            </div>
          </div>

          {/* Right Action Box */}
          <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-56">
            <button
              onClick={() => onNavigate('simulator')}
              className="flex-1 lg:w-full py-2.5 px-3.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Inspect Incident Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedEvent(enterpriseRiskEvents[0])}
              className="flex-1 lg:w-full py-2 px-3.5 rounded-md bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>View Telemetry Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. SEARCH & FILTER CONTROLS */}
      <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event ID, type, workflow, component..."
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

          {/* Type Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Event Type:
            </span>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full md:w-auto px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Event Types ({totalEvents})</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Severity Filter:
          </span>
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              severityFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${severityFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
              {totalEvents}
            </span>
          </button>

          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              severityFilter === 'critical'
                ? 'bg-red-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Critical</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${severityFilter === 'critical' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {criticalCount}
            </span>
          </button>

          <button
            onClick={() => setSeverityFilter('high')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              severityFilter === 'high'
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>High Risk</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${severityFilter === 'high' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              {highCount}
            </span>
          </button>

          <button
            onClick={() => setSeverityFilter('medium')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              severityFilter === 'medium'
                ? 'bg-slate-700 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Medium</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${severityFilter === 'medium' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
              {mediumCount}
            </span>
          </button>

          <button
            onClick={() => setSeverityFilter('resolved')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              severityFilter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${severityFilter === 'resolved' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {resolvedCount}
            </span>
          </button>
        </div>
      </div>

      {/* 5. ENTERPRISE EVENT FEED TABLE / LIST */}
      <div className="rounded-lg border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No matching risk events</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No events found matching your search term &ldquo;{searchTerm}&rdquo; and active severity filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('all');
                setSelectedEventType('all');
              }}
              className="mt-2 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((event) => {
              const isCurrent = event.isCurrentIncident;
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 sm:p-4.5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer group ${
                    isCurrent
                      ? 'bg-red-50/20 hover:bg-red-50/35 border-l-4 border-l-red-500'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Left Main Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Top Row Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                          {event.id}
                        </span>
                        <button
                          onClick={(e) => handleCopyId(event.id, e)}
                          className="text-slate-300 hover:text-slate-600 p-0.5 rounded transition-colors"
                          title="Copy Event ID"
                        >
                          {copiedId === event.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <span className="text-slate-300">•</span>

                      <span className="text-xs font-bold text-slate-900">
                        {event.eventType}
                      </span>

                      {getSeverityBadge(event.severity)}
                      {getStatusBadge(event.status)}

                      {event.impactRadius !== undefined && event.impactRadius > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                          {event.impactRadius} {event.impactRadius === 1 ? 'service' : 'services'} impacted
                        </span>
                      )}
                    </div>

                    {/* Workflow & Component Context */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                      <span className="font-medium text-slate-500">Workflow:</span>
                      <span className="font-bold text-slate-900">{event.workflow}</span>
                      <code className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                        {event.workflowCode}
                      </code>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium text-slate-500">Source:</span>
                      <strong className="text-slate-800">{event.affectedComponent}</strong>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed max-w-4xl line-clamp-2">
                      {event.details}
                    </p>

                    {/* Bottom Telemetry Strip */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-0.5">
                      <div className="flex items-center gap-1 text-slate-500 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{event.detectedTime}</span>
                        <span className="text-slate-400 font-normal">({event.timestamp})</span>
                      </div>

                      {event.failureRate && (
                        <div>
                          <span className="text-slate-400">Error rate: </span>
                          <span className={`font-bold ${parseFloat(event.failureRate) > 5 ? 'text-red-600' : 'text-slate-700'}`}>
                            {event.failureRate}
                          </span>
                        </div>
                      )}

                      {event.telemetrySnapshot?.traffic && (
                        <div>
                          <span className="text-slate-400">Throughput: </span>
                          <span className="text-slate-700">{event.telemetrySnapshot.traffic}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Risk Score & Action CTA */}
                  <div className="flex items-center gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-between lg:justify-end">
                    {/* Risk Score */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Risk Score
                      </span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          event.riskScore >= 70
                            ? 'text-red-600'
                            : event.riskScore >= 40
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {event.riskScore}{' '}
                        <span className="text-xs text-slate-400 font-normal">/ 100</span>
                      </span>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('simulator');
                          }}
                          className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Inspect Analysis</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>View Details</span>
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

      {/* 6. SLIDE-OVER EVENT DETAILS INSPECTOR (DRAWER) */}
      {selectedEvent && (
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
                    {selectedEvent.id}
                  </span>
                  <button
                    onClick={() => handleCopyId(selectedEvent.id)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    title="Copy Event ID"
                  >
                    {copiedId === selectedEvent.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {getSeverityBadge(selectedEvent.severity)}
                  {getStatusBadge(selectedEvent.status)}
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedEvent.eventType}
                </h2>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Event Description & Context */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                  Event Summary
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  {selectedEvent.details}
                </p>
              </div>

              {/* Workflow & Component Target */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Affected Workflow
                  </span>
                  <div className="font-bold text-slate-900">{selectedEvent.workflow}</div>
                  <code className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-semibold inline-block">
                    {selectedEvent.workflowCode}
                  </code>
                </div>

                <div className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Affected Component
                  </span>
                  <div className="font-bold text-slate-900">{selectedEvent.affectedComponent}</div>
                  <span className="text-[10px] font-mono text-slate-500 block">
                    Detected: {selectedEvent.timestamp}
                  </span>
                </div>
              </div>

              {/* Root Cause Analysis */}
              {selectedEvent.rootCause && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Root Cause Telemetry
                  </span>
                  <div className="rounded-lg border border-slate-200/80 bg-white p-3 space-y-1 text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Root Cause Diagnosis</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedEvent.rootCause}
                    </p>
                  </div>
                </div>
              )}

              {/* Live Telemetry Snapshot */}
              {selectedEvent.telemetrySnapshot && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Telemetry Observations
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Latency</span>
                      <strong className="font-mono text-slate-900">{selectedEvent.telemetrySnapshot.latency}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Error Rate</span>
                      <strong className={`font-mono ${parseFloat(selectedEvent.telemetrySnapshot.errorRate) > 5 ? 'text-red-600' : 'text-slate-900'}`}>
                        {selectedEvent.telemetrySnapshot.errorRate}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">p99 Latency</span>
                      <strong className="font-mono text-slate-900">{selectedEvent.telemetrySnapshot.p99Latency || 'N/A'}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Throughput</span>
                      <strong className="font-mono text-slate-900">{selectedEvent.telemetrySnapshot.traffic || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Schema Contract Diff (If Contract Drift) */}
              {selectedEvent.schemaDiff && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
                      Observed Schema Contract Drift
                    </span>
                    <span className="text-[10px] font-mono text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                      BREAKING CHANGE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 space-y-1 overflow-x-auto">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                        Expected Baseline
                      </span>
                      <pre className="text-[11px] leading-tight text-slate-300">
                        {selectedEvent.schemaDiff.before}
                      </pre>
                    </div>

                    <div className="p-3 rounded-lg bg-red-950/90 text-red-100 border border-red-800/80 space-y-1 overflow-x-auto">
                      <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                        Observed Drift (v2.5)
                      </span>
                      <pre className="text-[11px] leading-tight text-red-200">
                        {selectedEvent.schemaDiff.after}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Traced Downstream Propagation Path */}
              {selectedEvent.propagationPath && selectedEvent.propagationPath.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Traced Dependency Cascade
                  </span>
                  <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50 space-y-2 text-xs">
                    {selectedEvent.propagationPath.map((pathNode, idx) => (
                      <div key={idx} className="flex items-center gap-2 font-mono">
                        <span className="h-5 w-5 rounded-full bg-white border border-slate-300 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className={`text-xs font-semibold ${idx === 0 ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                          {pathNode}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-100 text-red-700 font-bold">
                            ROOT CAUSE
                          </span>
                        )}
                        {idx > 0 && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            IMPACTED
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Autonomous Recommendation */}
              {selectedEvent.recommendedAction && (
                <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 space-y-2 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    FlowTrace Autonomous Decision
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          selectedEvent.recommendedAction === 'PAUSE'
                            ? 'bg-red-600 text-white'
                            : selectedEvent.recommendedAction === 'WARN'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        RECOMMENDATION: {selectedEvent.recommendedAction}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">Autonomous Gate</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {selectedEvent.recommendedAction === 'PAUSE'
                      ? 'Autonomous policy recommends pausing automated underwriting to prevent corrupted risk score propagation.'
                      : selectedEvent.recommendedAction === 'WARN'
                      ? 'Continuous observation active. Non-critical fallback handling active with telemetry alarms.'
                      : 'Verified nominal execution. Zero policy or safety violations detected.'}
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    onNavigate('workflows');
                  }}
                  className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <GitFork className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Workflow</span>
                </button>

                {selectedEvent.isCurrentIncident && (
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      onNavigate('simulator');
                    }}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Open Incident Analysis</span>
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
