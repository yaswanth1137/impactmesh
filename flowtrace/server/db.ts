
import type {
  WorkflowDefinition,
  WorkflowNodeData,
  WorkflowEdgeData,
  RiskEventItem,
  AuditEntry,
  RiskLevel
} from '../src/types/index.ts';

// ============================================================================
// PostgreSQL Data Model Interfaces (Schema Tables)
// ============================================================================

export interface WorkflowRecord {
  id: string;
  name: string;
  code: string;
  environment: 'Production' | 'Staging' | 'Canary';
  description: string;
  health_score: number;
  risk_level: RiskLevel;
  total_nodes: number;
  avg_latency_ms: number;
  is_live_dataset?: boolean;
  dataset_id?: string;
  dataset_filename?: string;
  case_count?: number;
  event_count?: number;
  activity_count?: number;
  transition_count?: number;
  time_range?: { start: string; end: string };
  metrics?: any;
  created_at: string;
  updated_at: string;
}

export interface WorkflowComponentRecord {
  id: string;
  workflow_id: string;
  label: string;
  type: string;
  model_or_protocol: string;
  status: 'healthy' | 'warning' | 'critical' | 'changed';
  latency_ms: number;
  error_rate: number;
  version: string;
  owner: string;
  description: string;
  consumers_count: number;
  last_evaluated: string;
  change_summary?: string;
  is_root_cause?: boolean;
  is_affected?: boolean;
  impact_classification?: 'changed' | 'direct_impact' | 'downstream_impact' | 'unaffected';
  why_affected?: string;
  occurrences?: number;
  cases_count?: number;
  frequency?: number;
  position_x?: number;
  position_y?: number;
}

export interface DependencyRecord {
  id: string;
  workflow_id: string;
  source_id: string;
  target_id: string;
  source_label: string;
  target_label: string;
  protocol: string;
  latency_ms: number;
  requests_per_min: string;
  failure_rate: string;
  propagation_type: 'DIRECT' | 'CASCADE' | 'NONE';
  is_impact_path: boolean;
  transition_count?: number;
  cases_count?: number;
  frequency?: number;
}

export interface ProductionChangeRecord {
  id: string;
  workflow_id: string;
  component_id: string;
  change_type: string;
  previous_version: string;
  new_version: string;
  diff_summary: string;
  detected_at: string;
}

export interface RiskEventRecord {
  id: string;
  timestamp: string;
  detected_time: string;
  event_type: string;
  workflow_id: string;
  workflow_name: string;
  workflow_code: string;
  affected_component: string;
  source_node?: string;
  severity: RiskLevel;
  risk_score: number;
  status: 'action_required' | 'investigating' | 'monitored' | 'mitigated' | 'resolved' | 'verified';
  recommended_action?: 'ALLOW' | 'WARN' | 'PAUSE';
  details: string;
  root_cause?: string;
  failure_rate?: string;
  impact_radius?: number;
  propagation_path?: string[];
  schema_diff?: { before: string; after: string };
  telemetry_snapshot?: {
    latency: string;
    error_rate: string;
    p99_latency?: string;
    traffic?: string;
  };
  is_current_incident?: boolean;
}

export interface IncidentRecord {
  id: string;
  title: string;
  workflow_id: string;
  workflow_code: string;
  changed_component: string;
  change_description: string;
  risk_score: number;
  failure_probability: string;
  affected_components_count: number;
  dependencies_traced_count: number;
  status: 'active' | 'mitigated' | 'resolved';
  recommended_action: 'PAUSE' | 'WARN' | 'ALLOW';
  recommendation_reason: string;
  operator_decision: 'none' | 'paused' | 'continued';
  operator_decision_timestamp?: string;
  detected_at: string;
}

export interface RecommendationRecord {
  id: string;
  incident_id: string;
  workflow_id: string;
  action: 'PAUSE' | 'WARN' | 'ALLOW';
  reasoning: string;
  confidence: number;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  relative_time?: string;
  action: string;
  category: 'detection' | 'analysis' | 'recommendation' | 'operator_action';
  target: string;
  affected_component?: string;
  workflow_id: string;
  workflow_name: string;
  workflow_code: string;
  actor: string;
  result: string;
  status: 'completed' | 'recommended' | 'pending' | 'verified' | 'action_taken';
  severity?: 'critical' | 'high' | 'info' | 'normal';
  details: string;
  step_number?: number;
  evidence?: {
    riskScore?: number;
    failureProbability?: string;
    affectedComponentsCount?: number;
    dependenciesTracedCount?: number;
    schemaDiffSummary?: string;
    recommendedAction?: string;
    operatorNote?: string;
  };
  is_current_incident?: boolean;
}

// ============================================================================
// In-Memory Database Store Initialized with Seed Data
// ============================================================================

class FlowTraceDatabase {
  private workflows: Map<string, WorkflowRecord> = new Map();
  private components: Map<string, WorkflowComponentRecord> = new Map();
  private dependencies: Map<string, DependencyRecord> = new Map();
  private productionChanges: Map<string, ProductionChangeRecord> = new Map();
  private riskEvents: Map<string, RiskEventRecord> = new Map();
  private incidents: Map<string, IncidentRecord> = new Map();
  private recommendations: Map<string, RecommendationRecord> = new Map();
  private auditLogs: Map<string, AuditLogRecord> = new Map();
  constructor() {
    this.seed();
    this.loadFromDisk();
  }

  public async saveToDisk() {
    if (typeof window !== 'undefined') return;
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const storeFilePath = path.resolve(process.cwd(), 'data', 'workflows_store.json');
      const dataDir = path.dirname(storeFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dump = {
        workflows: Array.from(this.workflows.entries()),
        components: Array.from(this.components.entries()),
        dependencies: Array.from(this.dependencies.entries()),
        riskEvents: Array.from(this.riskEvents.entries()),
        auditLogs: Array.from(this.auditLogs.entries())
      };
      fs.writeFileSync(storeFilePath, JSON.stringify(dump, null, 2), 'utf8');
    } catch {
      // In-memory mode active
    }
  }

  public async loadFromDisk() {
    if (typeof window !== 'undefined') return;
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const storeFilePath = path.resolve(process.cwd(), 'data', 'workflows_store.json');
      if (fs.existsSync(storeFilePath)) {
        const raw = fs.readFileSync(storeFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.workflows) {
          parsed.workflows.forEach(([id, val]: [string, WorkflowRecord]) => this.workflows.set(id, val));
        }
        if (parsed.components) {
          parsed.components.forEach(([id, val]: [string, WorkflowComponentRecord]) => this.components.set(id, val));
        }
        if (parsed.dependencies) {
          parsed.dependencies.forEach(([id, val]: [string, DependencyRecord]) => this.dependencies.set(id, val));
        }
        if (parsed.riskEvents) {
          parsed.riskEvents.forEach(([id, val]: [string, RiskEventRecord]) => this.riskEvents.set(id, val));
        }
        if (parsed.auditLogs) {
          parsed.auditLogs.forEach(([id, val]: [string, AuditLogRecord]) => this.auditLogs.set(id, val));
        }
      }
    } catch {
      // Seed data used
    }
  }

  public seed() {
    this.clear();

    // 1. Seed Workflows
    const wf1: WorkflowRecord = {
      id: 'wf-customer-verification',
      name: 'Customer Verification & Approval',
      code: 'WF-CVA-01',
      environment: 'Production',
      description: 'End-to-end automated loan verification and underwriting chain: orchestrating KYC checks, risk intelligence, and core approval API bindings.',
      health_score: 58,
      risk_level: 'high',
      total_nodes: 5,
      avg_latency_ms: 115,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const wf2: WorkflowRecord = {
      id: 'wf-payment-fraud',
      name: 'Payment Fraud Detection',
      code: 'WF-PFD-02',
      environment: 'Production',
      description: 'Real-time card transaction velocity scoring and merchant anomaly evaluation pipeline.',
      health_score: 99,
      risk_level: 'low',
      total_nodes: 4,
      avg_latency_ms: 42,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const wf3: WorkflowRecord = {
      id: 'wf-customer-onboarding',
      name: 'Customer Onboarding',
      code: 'WF-COB-03',
      environment: 'Production',
      description: 'Document extraction, OCR verification, and automated customer profile synthesis.',
      health_score: 98,
      risk_level: 'low',
      total_nodes: 3,
      avg_latency_ms: 88,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const wf4: WorkflowRecord = {
      id: 'wf-loan-underwriting',
      name: 'Loan Underwriting',
      code: 'WF-LUW-04',
      environment: 'Production',
      description: 'Credit score aggregation, debt-to-income verification, and loan pricing calculation.',
      health_score: 95,
      risk_level: 'low',
      total_nodes: 3,
      avg_latency_ms: 76,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    [wf1, wf2, wf3, wf4].forEach(w => this.workflows.set(w.id, w));

    // 2. Seed Workflow Components for WF-CVA-01
    const c1: WorkflowComponentRecord = {
      id: 'customer-identity-api',
      workflow_id: 'wf-customer-verification',
      label: 'Customer Identity API',
      type: 'tool',
      model_or_protocol: 'REST / JSON (v2.5)',
      status: 'changed',
      latency_ms: 45,
      error_rate: 1.2,
      version: 'v2.5.0',
      owner: 'Identity & Auth Platform',
      description: 'Provides government registry verification and customer identity status tokens.',
      consumers_count: 3,
      last_evaluated: 'Just now',
      change_summary: 'Schema modified: status changed from string enum to nested object.',
      is_root_cause: true,
      is_affected: false,
      impact_classification: 'changed',
      why_affected: 'Source of schema contract drift. Changed contract without backwards compatibility.',
      position_x: 40,
      position_y: 90
    };

    const c2: WorkflowComponentRecord = {
      id: 'customer-verification-agent',
      workflow_id: 'wf-customer-verification',
      label: 'Customer Verification Agent',
      type: 'agent',
      model_or_protocol: 'Groq / LLaMA 3.3 (Reasoning)',
      status: 'critical',
      latency_ms: 140,
      error_rate: 68.0,
      version: 'v2.1.0',
      owner: 'Customer Onboarding Squad',
      description: 'Orchestrates identity verification, document parsing, and customer attribute checks.',
      consumers_count: 2,
      last_evaluated: 'Just now',
      is_affected: true,
      impact_classification: 'direct_impact',
      why_affected: 'Directly consumes Customer Identity API payload; deserialization exceptions spike to 68%.',
      position_x: 330,
      position_y: 90
    };

    const c3: WorkflowComponentRecord = {
      id: 'fraud-assessment-agent',
      workflow_id: 'wf-customer-verification',
      label: 'Fraud Assessment Agent',
      type: 'agent',
      model_or_protocol: 'GPT-4o (Reasoning)',
      status: 'critical',
      latency_ms: 210,
      error_rate: 42.5,
      version: 'v3.0.4',
      owner: 'Risk Intelligence Pod',
      description: 'Analyzes behavioral velocity, device anomalies, and consumer risk profiles.',
      consumers_count: 1,
      last_evaluated: 'Just now',
      is_affected: true,
      impact_classification: 'downstream_impact',
      why_affected: 'Receives unverified fallback tokens from verification agent, causing underwriting analysis failures.',
      position_x: 620,
      position_y: 90
    };

    const c4: WorkflowComponentRecord = {
      id: 'approval-api',
      workflow_id: 'wf-customer-verification',
      label: 'Approval API / Business System',
      type: 'system',
      model_or_protocol: 'Enterprise Core gRPC',
      status: 'warning',
      latency_ms: 65,
      error_rate: 18.0,
      version: 'v4.1.2',
      owner: 'Core Banking Systems',
      description: 'Executes automated underwriting decisions and generates account binding tokens.',
      consumers_count: 0,
      last_evaluated: 'Just now',
      is_affected: true,
      impact_classification: 'downstream_impact',
      why_affected: 'Final underwriting gate receives incomplete risk scores, triggering automatic approval rejections.',
      position_x: 910,
      position_y: 90
    };

    const c5: WorkflowComponentRecord = {
      id: 'audit-telemetry-sink',
      workflow_id: 'wf-customer-verification',
      label: 'Audit & Compliance Sink',
      type: 'system',
      model_or_protocol: 'Kafka / EventStream',
      status: 'healthy',
      latency_ms: 14,
      error_rate: 0.0,
      version: 'v1.8.0',
      owner: 'SecOps & Compliance',
      description: 'Immutable asynchronous event store logging verification lifecycle records.',
      consumers_count: 0,
      last_evaluated: 'Just now',
      is_affected: false,
      impact_classification: 'unaffected',
      why_affected: 'Operates on independent raw event stream with schema isolation.',
      position_x: 330,
      position_y: 270
    };

    [c1, c2, c3, c4, c5].forEach(c => this.components.set(c.id, c));

    // Components for WF-PFD-02
    const pfdNodes: WorkflowComponentRecord[] = [
      {
        id: 'txn-gateway',
        workflow_id: 'wf-payment-fraud',
        label: 'Card Transaction Ingress',
        type: 'api',
        model_or_protocol: 'ISO 8583 REST Gateway',
        status: 'healthy',
        latency_ms: 18,
        error_rate: 0.01,
        version: 'v3.2.0',
        owner: 'Payment Infra',
        description: 'Ingests global point-of-sale and e-commerce payment payloads.',
        consumers_count: 2,
        last_evaluated: '4 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 40,
        position_y: 90
      },
      {
        id: 'fraud-scorer-agent',
        workflow_id: 'wf-payment-fraud',
        label: 'Velocity & Pattern Scorer',
        type: 'agent',
        model_or_protocol: 'Groq / LLaMA 3.1 Instant',
        status: 'healthy',
        latency_ms: 38,
        error_rate: 0.02,
        version: 'v2.0.1',
        owner: 'Risk Engineering',
        description: 'Computes rolling 5-minute geolocation and card velocity vectors.',
        consumers_count: 1,
        last_evaluated: '4 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 340,
        position_y: 90
      },
      {
        id: 'feature-store',
        workflow_id: 'wf-payment-fraud',
        label: 'Redis Feature Store',
        type: 'database',
        model_or_protocol: 'Redis Cluster',
        status: 'healthy',
        latency_ms: 4,
        error_rate: 0.0,
        version: 'v7.2.4',
        owner: 'Data Platform',
        description: 'Low-latency distributed state for historical merchant transaction baselines.',
        consumers_count: 1,
        last_evaluated: '4 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 640,
        position_y: 40
      },
      {
        id: 'settlement-router',
        workflow_id: 'wf-payment-fraud',
        label: 'Settlement Decision Router',
        type: 'system',
        model_or_protocol: 'gRPC Core',
        status: 'healthy',
        latency_ms: 22,
        error_rate: 0.0,
        version: 'v1.4.0',
        owner: 'Banking Core',
        description: 'Applies automated authorization blocks or passes cleared transactions.',
        consumers_count: 0,
        last_evaluated: '4 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 640,
        position_y: 190
      }
    ];
    pfdNodes.forEach(c => this.components.set(c.id, c));

    // Components for WF-COB-03
    const cobNodes: WorkflowComponentRecord[] = [
      {
        id: 'doc-parser-agent',
        workflow_id: 'wf-customer-onboarding',
        label: 'Document Extraction Agent',
        type: 'agent',
        model_or_protocol: 'Groq / LLaMA Vision',
        status: 'healthy',
        latency_ms: 120,
        error_rate: 0.05,
        version: 'v2.8.0',
        owner: 'Onboarding Squad',
        description: 'Extracts structured fields from passports and utility bills.',
        consumers_count: 1,
        last_evaluated: '7 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 40,
        position_y: 90
      },
      {
        id: 'crm-sync-api',
        workflow_id: 'wf-customer-onboarding',
        label: 'Enterprise CRM Sync API',
        type: 'api',
        model_or_protocol: 'REST / OAuth2',
        status: 'healthy',
        latency_ms: 48,
        error_rate: 0.0,
        version: 'v4.0.0',
        owner: 'Enterprise Apps',
        description: 'Creates lead and customer records in core Salesforce/HubSpot.',
        consumers_count: 1,
        last_evaluated: '7 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 350,
        position_y: 90
      },
      {
        id: 'welcome-stream',
        workflow_id: 'wf-customer-onboarding',
        label: 'Customer Notification Stream',
        type: 'stream',
        model_or_protocol: 'Kafka Event',
        status: 'healthy',
        latency_ms: 10,
        error_rate: 0.0,
        version: 'v1.1.0',
        owner: 'Growth Platform',
        description: 'Triggers personalized onboarding emails and mobile push verification.',
        consumers_count: 0,
        last_evaluated: '7 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 660,
        position_y: 90
      }
    ];
    cobNodes.forEach(c => this.components.set(c.id, c));

    // Components for WF-LUW-04
    const luwNodes: WorkflowComponentRecord[] = [
      {
        id: 'credit-bureau-agent',
        workflow_id: 'wf-loan-underwriting',
        label: 'Credit Bureau Integration',
        type: 'agent',
        model_or_protocol: 'Groq / LLaMA 3.3 (Reasoning)',
        status: 'healthy',
        latency_ms: 95,
        error_rate: 0.1,
        version: 'v1.9.0',
        owner: 'Lending Platform',
        description: 'Fetches Equifax and Experian telemetry with automated retry policies.',
        consumers_count: 1,
        last_evaluated: '9 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 40,
        position_y: 90
      },
      {
        id: 'pricing-calc-api',
        workflow_id: 'wf-loan-underwriting',
        label: 'Loan Pricing Calculator API',
        type: 'api',
        model_or_protocol: 'C++ Fast gRPC',
        status: 'healthy',
        latency_ms: 16,
        error_rate: 0.0,
        version: 'v5.1.0',
        owner: 'Quantitative Finance',
        description: 'Calculates actuarial risk models and APR brackets.',
        consumers_count: 1,
        last_evaluated: '9 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 350,
        position_y: 90
      },
      {
        id: 'loan-ledger-db',
        workflow_id: 'wf-loan-underwriting',
        label: 'Loan Origination Ledger',
        type: 'database',
        model_or_protocol: 'CockroachDB SQL',
        status: 'healthy',
        latency_ms: 25,
        error_rate: 0.0,
        version: 'v23.2.0',
        owner: 'Lending Core',
        description: 'Stores approved loan covenants with cryptographic signature hashing.',
        consumers_count: 0,
        last_evaluated: '9 min ago',
        is_affected: false,
        impact_classification: 'unaffected',
        position_x: 660,
        position_y: 90
      }
    ];
    luwNodes.forEach(c => this.components.set(c.id, c));

    // 3. Seed Dependencies
    const depList: DependencyRecord[] = [
      {
        id: 'e1',
        workflow_id: 'wf-customer-verification',
        source_id: 'customer-identity-api',
        target_id: 'customer-verification-agent',
        source_label: 'Customer Identity API',
        target_label: 'Customer Verification Agent',
        protocol: 'REST / JSON',
        latency_ms: 32,
        requests_per_min: '18.4K / min',
        failure_rate: '6.8%',
        propagation_type: 'DIRECT',
        is_impact_path: true
      },
      {
        id: 'e2',
        workflow_id: 'wf-customer-verification',
        source_id: 'customer-verification-agent',
        target_id: 'fraud-assessment-agent',
        source_label: 'Customer Verification Agent',
        target_label: 'Fraud Assessment Agent',
        protocol: 'Agentic ToolCall',
        latency_ms: 28,
        requests_per_min: '14.2K / min',
        failure_rate: '4.2%',
        propagation_type: 'CASCADE',
        is_impact_path: true
      },
      {
        id: 'e3',
        workflow_id: 'wf-customer-verification',
        source_id: 'fraud-assessment-agent',
        target_id: 'approval-api',
        source_label: 'Fraud Assessment Agent',
        target_label: 'Approval API',
        protocol: 'gRPC v2',
        latency_ms: 24,
        requests_per_min: '8.6K / min',
        failure_rate: '1.8%',
        propagation_type: 'CASCADE',
        is_impact_path: true
      },
      {
        id: 'e4',
        workflow_id: 'wf-customer-verification',
        source_id: 'customer-identity-api',
        target_id: 'audit-telemetry-sink',
        source_label: 'Customer Identity API',
        target_label: 'Audit & Compliance Sink',
        protocol: 'Kafka Event',
        latency_ms: 14,
        requests_per_min: '18.4K / min',
        failure_rate: '0.0%',
        propagation_type: 'NONE',
        is_impact_path: false
      },

      // PFD edges
      {
        id: 'pfd-e1',
        workflow_id: 'wf-payment-fraud',
        source_id: 'txn-gateway',
        target_id: 'fraud-scorer-agent',
        source_label: 'Card Transaction Ingress',
        target_label: 'Velocity & Pattern Scorer',
        protocol: 'gRPC Stream',
        latency_ms: 12,
        requests_per_min: '42.0K / min',
        failure_rate: '0.01%',
        propagation_type: 'DIRECT',
        is_impact_path: false
      },
      {
        id: 'pfd-e2',
        workflow_id: 'wf-payment-fraud',
        source_id: 'fraud-scorer-agent',
        target_id: 'feature-store',
        source_label: 'Velocity & Pattern Scorer',
        target_label: 'Redis Feature Store',
        protocol: 'RESP3 Redis',
        latency_ms: 4,
        requests_per_min: '42.0K / min',
        failure_rate: '0.00%',
        propagation_type: 'DIRECT',
        is_impact_path: false
      },
      {
        id: 'pfd-e3',
        workflow_id: 'wf-payment-fraud',
        source_id: 'fraud-scorer-agent',
        target_id: 'settlement-router',
        source_label: 'Velocity & Pattern Scorer',
        target_label: 'Settlement Decision Router',
        protocol: 'gRPC v2',
        latency_ms: 16,
        requests_per_min: '41.9K / min',
        failure_rate: '0.00%',
        propagation_type: 'DIRECT',
        is_impact_path: false
      },

      // COB edges
      {
        id: 'cob-e1',
        workflow_id: 'wf-customer-onboarding',
        source_id: 'doc-parser-agent',
        target_id: 'crm-sync-api',
        source_label: 'Document Extraction Agent',
        target_label: 'Enterprise CRM Sync API',
        protocol: 'REST / JSON',
        latency_ms: 35,
        requests_per_min: '2.4K / min',
        failure_rate: '0.02%',
        propagation_type: 'DIRECT',
        is_impact_path: false
      },
      {
        id: 'cob-e2',
        workflow_id: 'wf-customer-onboarding',
        source_id: 'crm-sync-api',
        target_id: 'welcome-stream',
        source_label: 'Enterprise CRM Sync API',
        target_label: 'Customer Notification Stream',
        protocol: 'Kafka Event',
        latency_ms: 10,
        requests_per_min: '2.4K / min',
        failure_rate: '0.00%',
        propagation_type: 'DIRECT',
        is_impact_path: false
      },

      // LUW edges
      {
        id: 'luw-e1',
        workflow_id: 'wf-loan-underwriting',
        source_id: 'credit-bureau-agent',
        target_id: 'pricing-calc-api',
        source_label: 'Credit Bureau Integration',
        target_label: 'Loan Pricing Calculator API',
        protocol: 'gRPC v2',
        latency_ms: 14,
        requests_per_min: '5.1K / min',
        failure_rate: '0.04%',
        propagation_type: 'DIRECT',
        is_impact_path: false
      },
      {
        id: 'luw-e2',
        workflow_id: 'wf-loan-underwriting',
        source_id: 'pricing-calc-api',
        target_id: 'loan-ledger-db',
        source_label: 'Loan Pricing Calculator API',
        target_label: 'Loan Origination Ledger',
        protocol: 'Postgres wire / SQL',
        latency_ms: 22,
        requests_per_min: '5.1K / min',
        failure_rate: '0.00%',
        propagation_type: 'DIRECT',
        is_impact_path: false
      }
    ];
    depList.forEach(d => this.dependencies.set(d.id, d));

    // 4. Seed Canonical Incident
    const inc1: IncidentRecord = {
      id: 'INC-94021',
      title: 'Customer Identity API schema change drift',
      workflow_id: 'wf-customer-verification',
      workflow_code: 'WF-CVA-01',
      changed_component: 'Customer Identity API (v2.5)',
      change_description: 'Schema contract drift in customer.identity.status field (string enum -> nested object)',
      risk_score: 82,
      failure_probability: '68%',
      affected_components_count: 3,
      dependencies_traced_count: 5,
      status: 'active',
      recommended_action: 'PAUSE',
      recommendation_reason: 'Prevent potentially invalid verification results from reaching the approval system while the API contract is reviewed.',
      operator_decision: 'none',
      detected_at: '14:32:04 UTC'
    };
    this.incidents.set(inc1.id, inc1);

    // 5. Seed Risk Events
    const riskList: RiskEventRecord[] = [
      {
        id: 'EVT-94021',
        timestamp: '14:32:04 UTC',
        detected_time: 'Just now',
        event_type: 'API Contract Drift',
        workflow_id: 'wf-customer-verification',
        workflow_name: 'Customer Verification & Approval',
        workflow_code: 'WF-CVA-01',
        affected_component: 'Customer Identity API (v2.5)',
        source_node: 'customer-identity-api',
        severity: 'critical',
        risk_score: 82,
        status: 'action_required',
        recommended_action: 'PAUSE',
        failure_rate: '68.0%',
        impact_radius: 3,
        root_cause: 'Breaking schema contract drift: customer.identity.status payload modified from flat string enum to nested dictionary object without backward compatibility.',
        details: 'Schema change in Customer Identity API (v2.4 → v2.5) altered identity verification response format. Deserialization exceptions spiking to 68%, propagating unverified fallback tokens into downstream fraud assessment and approval engines.',
        propagation_path: [
          'Customer Identity API (v2.5)',
          'Customer Verification Agent (Groq-Powered)',
          'Fraud Assessment Agent',
          'Approval API / Business System (gRPC)'
        ],
        schema_diff: {
          before: `{\n  "customer_id": "CUST-883910",\n  "status": "VERIFIED_ACTIVE",\n  "identity_score": 0.98,\n  "registry_code": "REG-US-CA"\n}`,
          after: `{\n  "customer_id": "CUST-883910",\n  "status": {\n    "code": "VERIFIED",\n    "sub_status": "ACTIVE",\n    "tier": "TIER_A1"\n  },\n  "identity_score": 0.98,\n  "registry_code": "REG-US-CA"\n}`
        },
        telemetry_snapshot: {
          latency: '45 ms',
          error_rate: '68.0%',
          p99_latency: '180 ms',
          traffic: '18.4K / min'
        },
        is_current_incident: true
      },
      {
        id: 'EVT-94019',
        timestamp: '14:18:22 UTC',
        detected_time: '14 min ago',
        event_type: 'Dependency Failure',
        workflow_id: 'wf-loan-underwriting',
        workflow_name: 'Loan Underwriting',
        workflow_code: 'WF-LUW-04',
        affected_component: 'Credit Bureau Integration',
        source_node: 'credit-bureau-agent',
        severity: 'high',
        risk_score: 74,
        status: 'investigating',
        recommended_action: 'WARN',
        failure_rate: '24.5%',
        impact_radius: 2,
        root_cause: 'Upstream Equifax & Experian partner gateway timeout (HTTP 504 Gateway Timeout) on synchronous bureau score requests.',
        details: 'External credit scoring telemetry gateway latency spiked above 2500ms SLA. Auto-engaged fallback synthetic scoring cache with reduced underwriting confidence score.',
        propagation_path: [
          'Credit Bureau Integration',
          'Loan Pricing Calculator API',
          'Loan Origination Ledger'
        ]
      },
      {
        id: 'EVT-94015',
        timestamp: '14:00:10 UTC',
        detected_time: '32 min ago',
        event_type: 'Agent Behavior Anomaly',
        workflow_id: 'wf-payment-fraud',
        workflow_name: 'Payment Fraud Detection',
        workflow_code: 'WF-PFD-02',
        affected_component: 'Velocity & Pattern Scorer (Groq-Powered)',
        source_node: 'fraud-scorer-agent',
        severity: 'high',
        risk_score: 68,
        status: 'monitored',
        recommended_action: 'WARN',
        failure_rate: '4.2%',
        impact_radius: 1,
        root_cause: 'Non-ASCII character sets in international merchant category codes caused unexpected tool-call argument formatting drift in LLM output.',
        details: 'Autonomous evaluation engine detected token serialization drift in payment velocity agent. Deterministic guardrail retry policy engaged with automatic payload normalization.'
      },
      {
        id: 'EVT-94008',
        timestamp: '13:38:45 UTC',
        detected_time: '54 min ago',
        event_type: 'Elevated Error Rate',
        workflow_id: 'wf-customer-onboarding',
        workflow_name: 'Customer Onboarding',
        workflow_code: 'WF-COB-03',
        affected_component: 'Document Extraction Agent (GPT-4o Vision)',
        source_node: 'doc-parser-agent',
        severity: 'medium',
        risk_score: 48,
        status: 'monitored',
        recommended_action: 'WARN',
        failure_rate: '4.8%',
        impact_radius: 1,
        root_cause: 'Binary multipart passport scan upload stream contained unescaped Unicode byte sequences during OCR extraction.',
        details: 'Document extraction error rate temporarily elevated to 4.8% during batch onboarding cycle. Image sanitization pre-processing filter applied automatically.'
      },
      {
        id: 'EVT-93880',
        timestamp: '12:02:18 UTC',
        detected_time: '2.5 hours ago',
        event_type: 'High-Risk Production Change',
        workflow_id: 'wf-payment-fraud',
        workflow_name: 'Payment Fraud Detection',
        workflow_code: 'WF-PFD-02',
        affected_component: 'Redis Feature Store (v7.2.4)',
        source_node: 'feature-store',
        severity: 'high',
        risk_score: 76,
        status: 'resolved',
        recommended_action: 'ALLOW',
        failure_rate: '0.0%',
        impact_radius: 2,
        root_cause: 'Cluster partition rebalance during batch merchant settlement created connection pool contention (85% utilization spike).',
        details: 'High-risk partition rebalance detected in Redis distributed state cluster. Autonomous connection recycling and read-replica failover restored nominal latency in 45s.'
      },
      {
        id: 'EVT-93850',
        timestamp: '10:30:00 UTC',
        detected_time: '4 hours ago',
        event_type: 'Workflow Degradation',
        workflow_id: 'wf-loan-underwriting',
        workflow_name: 'Loan Underwriting',
        workflow_code: 'WF-LUW-04',
        affected_component: 'Loan Origination Ledger (CockroachDB)',
        source_node: 'loan-ledger-db',
        severity: 'low',
        risk_score: 28,
        status: 'resolved',
        recommended_action: 'ALLOW',
        failure_rate: '0.0%',
        impact_radius: 0,
        root_cause: 'Database transaction lock contention on historical covenant audit ledger during simultaneous quarterly closing queries.',
        details: 'p99 database write latency temporarily increased to 340ms. Autonomous query pool re-prioritization mitigated contention and recovered baseline latency to 25ms.'
      }
    ];
    riskList.forEach(r => this.riskEvents.set(r.id, r));

    // 6. Seed Audit Logs
    const auditList: AuditLogRecord[] = [
      {
        id: 'AUD-89105',
        timestamp: '14:32:20 UTC',
        relative_time: 'Just now',
        action: 'Operator Decision',
        category: 'operator_action',
        target: 'Production Approval Gate',
        affected_component: 'Approval API / Business System',
        workflow_id: 'wf-customer-verification',
        workflow_name: 'Customer Verification & Approval',
        workflow_code: 'WF-CVA-01',
        actor: 'Enterprise SRE Operator',
        result: 'Awaiting operator decision (Advisory: PAUSE recommendation issued to mitigate 68% verification failure rate).',
        status: 'pending',
        severity: 'high',
        step_number: 6,
        details: 'FlowTrace presented autonomous risk assessment (Risk Score 82, Failure Probability 68%) and recommended pausing the approval workflow. Operator notification dispatched; awaiting manual decision in Incident Analysis.',
        evidence: {
          riskScore: 82,
          failureProbability: '68%',
          affectedComponentsCount: 3,
          dependenciesTracedCount: 5,
          recommendedAction: 'PAUSE WORKFLOW',
          operatorNote: 'Operator review in progress via FlowTrace Incident Analysis command console.'
        },
        is_current_incident: true
      },
      {
        id: 'AUD-89104',
        timestamp: '14:32:15 UTC',
        relative_time: 'Just now',
        action: 'Recommendation Generated',
        category: 'recommendation',
        target: 'Approval Workflow Guardrail',
        affected_component: 'Customer Verification & Approval (WF-CVA-01)',
        workflow_id: 'wf-customer-verification',
        workflow_name: 'Customer Verification & Approval',
        workflow_code: 'WF-CVA-01',
        actor: 'FlowTrace Engine',
        result: 'Recommendation: Pause affected approval workflow to prevent invalid risk score propagation.',
        status: 'recommended',
        severity: 'critical',
        step_number: 5,
        details: 'Autonomous policy rule triggered: Predicted failure probability (68%) exceeds critical safety threshold (30%). Generated advisory recommending temporary pause of automated underwriting gate.',
        evidence: {
          riskScore: 82,
          failureProbability: '68%',
          affectedComponentsCount: 3,
          dependenciesTracedCount: 5,
          recommendedAction: 'PAUSE WORKFLOW'
        },
        is_current_incident: true
      },
      {
        id: 'AUD-89103',
        timestamp: '14:32:09 UTC',
        relative_time: 'Just now',
        action: 'Risk Assessment',
        category: 'analysis',
        target: 'Customer Verification & Approval',
        affected_component: 'Customer Identity API → Verification Chain',
        workflow_id: 'wf-customer-verification',
        workflow_name: 'Customer Verification & Approval',
        workflow_code: 'WF-CVA-01',
        actor: 'FlowTrace Engine',
        result: 'Risk score calculated: 82/100. Failure probability: 68%. Severity: High Risk.',
        status: 'completed',
        severity: 'high',
        step_number: 4,
        details: 'Calculated composite risk score based on telemetry breach, downstream blast radius (3 services), and deserialization failure rates across verification reasoning agents.',
        evidence: {
          riskScore: 82,
          failureProbability: '68%',
          affectedComponentsCount: 3,
          dependenciesTracedCount: 5
        },
        is_current_incident: true
      },
      {
        id: 'AUD-89102',
        timestamp: '14:32:06 UTC',
        relative_time: 'Just now',
        action: 'Impact Prediction',
        category: 'analysis',
        target: '3 Downstream Components',
        affected_component: 'Customer Verification Agent, Fraud Assessment Agent, Approval API',
        workflow_id: 'wf-customer-verification',
        workflow_name: 'Customer Verification & Approval',
        workflow_code: 'WF-CVA-01',
        actor: 'FlowTrace Engine',
        result: '3 downstream components identified as potentially affected (68% failure rate predicted).',
        status: 'completed',
        severity: 'high',
        step_number: 3,
        details: 'Autonomous model identified direct deserialization impact on Customer Verification Agent (Groq-powered reasoning) cascading unverified fallback tokens into Fraud Assessment Agent and core Approval API.',
        evidence: {
          riskScore: 82,
          failureProbability: '68%',
          affectedComponentsCount: 3,
          dependenciesTracedCount: 5
        },
        is_current_incident: true
      },
      {
        id: 'AUD-89101',
        timestamp: '14:32:05 UTC',
        relative_time: 'Just now',
        action: 'Dependency Analysis',
        category: 'analysis',
        target: '5 Workflow Dependency Links',
        affected_component: 'Identity → Verification → Fraud → Approval & Audit Sink',
        workflow_id: 'wf-customer-verification',
        workflow_name: 'Customer Verification & Approval',
        workflow_code: 'WF-CVA-01',
        actor: 'FlowTrace Engine',
        result: 'FlowTrace traced downstream dependencies. 5 dependencies traced from identity service to core underwriting.',
        status: 'completed',
        severity: 'info',
        step_number: 2,
        details: 'Traversed live topology graph from Customer Identity API across REST, Agentic ToolCall, and gRPC protocol edges. Isolated 5 dependency paths.',
        evidence: {
          dependenciesTracedCount: 5,
          affectedComponentsCount: 3
        },
        is_current_incident: true
      },
      {
        id: 'AUD-89100',
        timestamp: '14:32:04 UTC',
        relative_time: 'Just now',
        action: 'Change Detected',
        category: 'detection',
        target: 'Customer Identity API (v2.4 → v2.5)',
        affected_component: 'Customer Identity API',
        workflow_id: 'wf-customer-verification',
        workflow_name: 'Customer Verification & Approval',
        workflow_code: 'WF-CVA-01',
        actor: 'Production telemetry',
        result: 'Customer Identity API schema change detected: customer.identity.status converted from string enum to nested object.',
        status: 'completed',
        severity: 'high',
        step_number: 1,
        details: 'Contract observation hook detected payload format alteration in GET /v2/identity/verify response. Status field converted from flat string enum to dictionary object without backward compatibility.',
        evidence: {
          schemaDiffSummary: 'customer.identity.status: string enum -> nested dictionary object',
          affectedComponentsCount: 3
        },
        is_current_incident: true
      },
      {
        id: 'AUD-89085',
        timestamp: '14:00:00 UTC',
        relative_time: '32 min ago',
        action: 'Operator Decision',
        category: 'operator_action',
        target: 'Velocity & Pattern Scorer (Groq-Powered)',
        affected_component: 'Velocity & Pattern Scorer',
        workflow_id: 'wf-payment-fraud',
        workflow_name: 'Payment Fraud Detection',
        workflow_code: 'WF-PFD-02',
        actor: 'Enterprise SRE Operator',
        result: 'Workflow parameters updated by operator: enabled automated Unicode payload normalization hook.',
        status: 'action_taken',
        severity: 'normal',
        details: 'Operator reviewed minor token formatting anomaly and approved runtime schema sanitization hook. Telemetry error rate stabilized at 0.02%.'
      }
    ];
    auditList.forEach(a => this.auditLogs.set(a.id, a));
  }

  public clear() {
    this.workflows.clear();
    this.components.clear();
    this.dependencies.clear();
    this.productionChanges.clear();
    this.riskEvents.clear();
    this.incidents.clear();
    this.recommendations.clear();
    this.auditLogs.clear();
  }

  // ==========================================================================
  // Public Query and Mutation Helpers
  // ==========================================================================

  public getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values()).map(w => {
      const nodes = Array.from(this.components.values())
        .filter(c => c.workflow_id === w.id)
        .map(c => ({
          id: c.id,
          label: c.label,
          type: c.type as any,
          modelOrProtocol: c.model_or_protocol,
          status: c.status,
          latencyMs: c.latency_ms,
          errorRate: c.error_rate,
          version: c.version,
          owner: c.owner,
          description: c.description,
          consumersCount: c.consumers_count,
          lastEvaluated: c.last_evaluated,
          changeSummary: c.change_summary,
          isRootCause: c.is_root_cause,
          isAffected: c.is_affected,
          impactClassification: c.impact_classification,
          whyAffected: c.why_affected,
          occurrences: c.occurrences,
          casesCount: c.cases_count,
          frequency: c.frequency
        }));

      const edges = Array.from(this.dependencies.values())
        .filter(d => d.workflow_id === w.id)
        .map(d => ({
          id: d.id,
          source: d.source_id,
          target: d.target_id,
          sourceLabel: d.source_label,
          targetLabel: d.target_label,
          protocol: d.protocol,
          latencyMs: d.latency_ms,
          requestsPerMin: d.requests_per_min,
          failureRate: d.failure_rate,
          propagationType: d.propagation_type,
          isImpactPath: d.is_impact_path,
          transitionCount: d.transition_count,
          casesCount: d.cases_count,
          frequency: d.frequency
        }));

      return {
        id: w.id,
        name: w.name,
        code: w.code,
        environment: w.environment,
        description: w.description,
        healthScore: w.health_score,
        riskLevel: w.risk_level,
        totalNodes: nodes.length,
        avgLatencyMs: w.avg_latency_ms,
        isLiveDataset: w.is_live_dataset,
        datasetId: w.dataset_id,
        datasetFilename: w.dataset_filename,
        caseCount: w.case_count,
        eventCount: w.event_count,
        activityCount: w.activity_count,
        transitionCount: w.transition_count,
        timeRange: w.time_range,
        metrics: w.metrics,
        nodes,
        edges
      };
    });
  }

  public getWorkflowById(id: string): WorkflowDefinition | null {
    const list = this.getWorkflows();
    return list.find(w => w.id === id || w.code.toLowerCase() === id.toLowerCase()) || null;
  }

  public saveWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
    const now = new Date().toISOString();
    const wfRecord: WorkflowRecord = {
      id: workflow.id,
      name: workflow.name,
      code: workflow.code,
      environment: workflow.environment || 'Production',
      description: workflow.description || '',
      health_score: workflow.healthScore,
      risk_level: workflow.riskLevel,
      total_nodes: workflow.nodes.length,
      avg_latency_ms: workflow.avgLatencyMs || 50,
      is_live_dataset: workflow.isLiveDataset,
      dataset_id: workflow.datasetId,
      dataset_filename: workflow.datasetFilename,
      case_count: workflow.caseCount,
      event_count: workflow.eventCount,
      activity_count: workflow.activityCount,
      transition_count: workflow.transitionCount,
      time_range: workflow.timeRange,
      metrics: workflow.metrics,
      created_at: now,
      updated_at: now
    };
    this.workflows.set(wfRecord.id, wfRecord);

    // Save nodes
    workflow.nodes.forEach((n: WorkflowNodeData) => {
      const compRecord: WorkflowComponentRecord = {
        id: n.id,
        workflow_id: workflow.id,
        label: n.label,
        type: n.type,
        model_or_protocol: n.modelOrProtocol,
        status: n.status,
        latency_ms: n.latencyMs,
        error_rate: n.errorRate,
        version: n.version,
        owner: n.owner,
        description: n.description,
        consumers_count: n.consumersCount || 0,
        last_evaluated: n.lastEvaluated || 'Just now',
        change_summary: n.changeSummary,
        is_root_cause: n.isRootCause,
        is_affected: n.isAffected,
        impact_classification: n.impactClassification,
        why_affected: n.whyAffected,
        occurrences: n.occurrences,
        cases_count: n.casesCount,
        frequency: n.frequency
      };
      this.components.set(compRecord.id, compRecord);
    });

    // Save edges
    workflow.edges.forEach((e: WorkflowEdgeData) => {
      const depRecord: DependencyRecord = {
        id: e.id,
        workflow_id: workflow.id,
        source_id: e.source,
        target_id: e.target,
        source_label: e.sourceLabel || e.source,
        target_label: e.targetLabel || e.target,
        protocol: e.protocol,
        latency_ms: e.latencyMs,
        requests_per_min: e.requestsPerMin || '10K / min',
        failure_rate: e.failureRate || '0.0%',
        propagation_type: e.propagationType || 'DIRECT',
        is_impact_path: !!e.isImpactPath,
        transition_count: e.transitionCount,
        cases_count: e.casesCount,
        frequency: e.frequency
      };
      this.dependencies.set(depRecord.id, depRecord);
    });

    this.saveToDisk();
    return this.getWorkflowById(workflow.id)!;
  }

  public getIncidents(): IncidentRecord[] {
    return Array.from(this.incidents.values());
  }

  public getIncidentById(id: string): IncidentRecord | null {
    return this.incidents.get(id) || Array.from(this.incidents.values())[0] || null;
  }

  public saveIncident(incident: IncidentRecord) {
    this.incidents.set(incident.id, incident);
  }

  public getRiskEvents(): RiskEventItem[] {
    return Array.from(this.riskEvents.values()).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      detectedTime: r.detected_time,
      eventType: r.event_type,
      workflow: r.workflow_name,
      workflowCode: r.workflow_code,
      affectedComponent: r.affected_component,
      sourceNode: r.source_node,
      severity: r.severity,
      riskScore: r.risk_score,
      status: r.status,
      recommendedAction: r.recommended_action,
      details: r.details,
      rootCause: r.root_cause,
      failureRate: r.failure_rate,
      impactRadius: r.impact_radius,
      propagationPath: r.propagation_path,
      schemaDiff: r.schema_diff,
      telemetrySnapshot: r.telemetry_snapshot ? {
        latency: r.telemetry_snapshot.latency,
        errorRate: r.telemetry_snapshot.error_rate,
        p99Latency: r.telemetry_snapshot.p99_latency,
        traffic: r.telemetry_snapshot.traffic
      } : undefined,
      isCurrentIncident: r.is_current_incident
    }));
  }

  public addRiskEvent(event: RiskEventRecord) {
    this.riskEvents.set(event.id, event);
  }

  public getAuditLogs(): AuditEntry[] {
    return Array.from(this.auditLogs.values()).map(a => ({
      id: a.id,
      timestamp: a.timestamp,
      relativeTime: a.relative_time,
      action: a.action,
      category: a.category,
      target: a.target,
      affectedComponent: a.affected_component,
      workflow: a.workflow_name,
      workflowCode: a.workflow_code,
      actor: a.actor,
      result: a.result,
      status: a.status,
      severity: a.severity,
      details: a.details,
      stepNumber: a.step_number,
      evidence: a.evidence,
      isCurrentIncident: a.is_current_incident
    }));
  }

  public addAuditLog(log: AuditLogRecord) {
    this.auditLogs.set(log.id, log);
  }

  public addProductionChange(change: ProductionChangeRecord) {
    this.productionChanges.set(change.id, change);
  }

  public updateOperatorDecision(incidentId: string, decision: 'paused' | 'continued') {
    const inc = this.incidents.get(incidentId);
    if (inc) {
      inc.operator_decision = decision;
      inc.operator_decision_timestamp = new Date().toISOString();
      if (decision === 'paused') {
        inc.status = 'mitigated';
      }
      this.incidents.set(inc.id, inc);
    }
  }

  public getOverviewData() {
    const workflows = this.getWorkflows();
    const activeCount = workflows.length;
    const atRiskCount = workflows.filter(w => w.riskLevel === 'high').length;
    const nominalCount = workflows.filter(w => w.riskLevel === 'low').length;
    const criticalEventsCount = Array.from(this.riskEvents.values()).filter(
      r => r.severity === 'critical' || (r.severity === 'high' && r.status === 'action_required')
    ).length;

    const changesAnalyzed = 47 + this.productionChanges.size;

    const recentChanges = [
      {
        component: 'Customer Identity API',
        risk: 'HIGH RISK',
        severity: 'high',
        summary: 'Schema contract drift detected (v2.4 → v2.5)',
        details: '3 affected downstream components',
        time: 'Just now'
      },
      {
        component: 'Fraud Assessment Agent',
        risk: 'LOW RISK',
        severity: 'low',
        summary: 'Model configuration updated (v3.0.4)',
        details: 'No breaking schema changes',
        time: '18 min ago'
      },
      {
        component: 'Approval API',
        risk: 'MEDIUM RISK',
        severity: 'medium',
        summary: 'Latency threshold updated (65ms baseline)',
        details: '1 dependency monitored',
        time: '42 min ago'
      }
    ];

    return {
      activeWorkflows: activeCount,
      atRiskWorkflows: atRiskCount,
      nominalWorkflows: nominalCount,
      changesAnalyzed,
      criticalEvents: criticalEventsCount,
      healthDistribution: {
        healthy: nominalCount,
        atRisk: atRiskCount,
        critical: criticalEventsCount
      },
      recentChanges
    };
  }

  public getTelemetry(workflowId: string) {
    if (workflowId === 'wf-customer-verification' || !workflowId) {
      return [
        { time: '14:20', timestamp: '14:20:00 UTC', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 0.05, throughput: '18.2K req/min', p99LatencyMs: 42, annotation: 'Baseline nominal telemetry' },
        { time: '14:24', timestamp: '14:24:00 UTC', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 0.05, throughput: '18.4K req/min', p99LatencyMs: 43, annotation: 'Pre-deployment telemetry baseline' },
        { time: '14:28', timestamp: '14:28:00 UTC', errorRate: 0.0, agentErrorRate: 0.1, workflowAverage: 0.06, throughput: '18.3K req/min', p99LatencyMs: 44, annotation: 'Canary traffic shift 0%' },
        { time: '14:32', timestamp: '14:32:04 UTC', errorRate: 0.4, agentErrorRate: 0.4, workflowAverage: 0.12, throughput: '18.4K req/min', p99LatencyMs: 85, annotation: 'Customer Identity API v2.5 schema change detected (14:32:04)', isEventMarker: true },
        { time: '14:34', timestamp: '14:34:00 UTC', errorRate: 18.0, agentErrorRate: 18.5, workflowAverage: 2.1, throughput: '18.1K req/min', p99LatencyMs: 140, annotation: 'Verification agent deserialization exceptions begin' },
        { time: '14:36', timestamp: '14:36:00 UTC', errorRate: 45.0, agentErrorRate: 46.2, workflowAverage: 6.8, throughput: '17.6K req/min', p99LatencyMs: 195, annotation: 'Cascade to Fraud Assessment Agent' },
        { time: '14:38', timestamp: '14:38:00 UTC', errorRate: 68.0, agentErrorRate: 68.0, workflowAverage: 9.4, throughput: '16.8K req/min', p99LatencyMs: 240, annotation: 'Peak verification failure rate reached (68%)' },
        { time: '14:40', timestamp: '14:40:00 UTC', errorRate: 68.0, agentErrorRate: 68.0, workflowAverage: 11.2, throughput: '16.5K req/min', p99LatencyMs: 245, annotation: 'Current Observation Window' }
      ];
    }
    return [
      { time: '14:20', timestamp: '14:20:00 UTC', errorRate: 0.01, agentErrorRate: 0.01, workflowAverage: 0.01, throughput: '42.0K req/min', p99LatencyMs: 18 },
      { time: '14:30', timestamp: '14:30:00 UTC', errorRate: 0.01, agentErrorRate: 0.01, workflowAverage: 0.01, throughput: '42.1K req/min', p99LatencyMs: 18 },
      { time: '14:40', timestamp: '14:40:00 UTC', errorRate: 0.01, agentErrorRate: 0.01, workflowAverage: 0.01, throughput: '41.9K req/min', p99LatencyMs: 18 }
    ];
  }

  public getSourceData() {
    const workflow = this.getWorkflowById('wf-customer-verification');
    const telemetry = this.getTelemetry('wf-customer-verification');
    const dependencies = [
      {
        id: 'dep-cva-01',
        source: 'Customer Identity API',
        target: 'Customer Verification Agent',
        relationship: 'CONSUMES_API',
        protocol: 'REST / JSON',
        throughput: '18.4K req / min',
        failureRate: '6.8%',
        propagation: 'DIRECT'
      },
      {
        id: 'dep-cva-02',
        source: 'Customer Verification Agent',
        target: 'Fraud Assessment Agent',
        relationship: 'AGENT_TOOL_CALL',
        protocol: 'Agentic ToolCall',
        throughput: '14.2K req / min',
        failureRate: '4.2%',
        propagation: 'CASCADE'
      },
      {
        id: 'dep-cva-03',
        source: 'Fraud Assessment Agent',
        target: 'Approval API / Business System',
        relationship: 'GRPC_INVOCATION',
        protocol: 'gRPC v2',
        throughput: '8.6K req / min',
        failureRate: '1.8%',
        propagation: 'CASCADE'
      },
      {
        id: 'dep-cva-04',
        source: 'Customer Identity API',
        target: 'Audit & Compliance Sink',
        relationship: 'EVENT_STREAM',
        protocol: 'Kafka Event',
        throughput: '18.4K req / min',
        failureRate: '0.0%',
        propagation: 'NONE'
      },
      {
        id: 'dep-cva-05',
        source: 'Customer Verification Agent',
        target: 'Audit & Compliance Sink',
        relationship: 'EVENT_STREAM',
        protocol: 'Kafka Event',
        throughput: '14.2K req / min',
        failureRate: '0.0%',
        propagation: 'NONE'
      }
    ];

    const productionChange = {
      id: 'chg-94021',
      timestamp: '14:32:04 UTC',
      eventType: 'API Contract / Schema Change',
      service: 'Customer Identity API',
      oldVersion: 'v2.4.0',
      newVersion: 'v2.5.0',
      changedField: 'customer.identity.status',
      previousType: 'string enum (e.g. "VERIFIED_ACTIVE")',
      newType: 'nested object (e.g. { "code": "VERIFIED", "sub_status": "ACTIVE", "tier": "TIER_A1" })',
      contractDiff: {
        before: '{\n  "customer_id": "CUST-883910",\n  "status": "VERIFIED_ACTIVE",\n  "identity_score": 0.98,\n  "registry_code": "REG-US-CA"\n}',
        after: '{\n  "customer_id": "CUST-883910",\n  "status": {\n    "code": "VERIFIED",\n    "sub_status": "ACTIVE",\n    "tier": "TIER_A1"\n  },\n  "identity_score": 0.98,\n  "registry_code": "REG-US-CA"\n}'
      },
      rootCause: 'Breaking schema contract drift in Customer Identity API (v2.4 → v2.5) without backwards compatibility adapter.'
    };

    return {
      datasetClassification: 'Representative Demo Dataset',
      description: 'These records are the inputs used by the FlowTrace analysis pipeline for this scenario.',
      workflow: {
        id: workflow?.code || 'WF-CVA-01',
        name: workflow?.name || 'Customer Verification & Approval',
        environment: workflow?.environment || 'Production',
        componentsCount: workflow?.nodes.length || 5,
        dependenciesCount: dependencies.length,
        components: workflow?.nodes.map(n => ({
          id: n.id,
          name: n.label,
          type: n.type,
          version: n.version,
          owner: n.owner
        }))
      },
      productionChange,
      telemetry,
      dependencies,
      riskAssessment: {
        riskScore: 82,
        failureProbability: '68%',
        severity: 'HIGH RISK',
        affectedComponentsCount: 3,
        dependenciesTracedCount: 5,
        confidence: '94%'
      },
      recommendation: {
        action: 'PAUSE',
        target: 'Customer Verification & Approval (WF-CVA-01)',
        reasoning: 'Prevent potentially invalid verification results from reaching the approval system while the API contract is reviewed.'
      }
    };
  }
}

// Singleton database export
export const db = new FlowTraceDatabase();
