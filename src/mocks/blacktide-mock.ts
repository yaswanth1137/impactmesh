/**
 * IMPACTMESH — Blacktide Systems Domain-Compliant Mock Scenario
 * Follows exact domain types from src/types/domain.ts, entities.ts, events.ts
 * Strictly isolated for visual development & demonstration.
 */

import type {
  BusinessState,
  BusinessEntity,
  Dependency,
  ImpactResult,
  DecisionOption,
  Recommendation,
} from '../types/domain.ts';
import type { DecisionEvent } from '../types/events.ts';

export const MOCK_ORGANIZATION_ID = 'a0000000-0000-0000-0000-000000000001';

// 1. Current Organizational Business State
export const MOCK_BUSINESS_STATE: BusinessState = {
  id: 'state-live-01',
  organization_id: MOCK_ORGANIZATION_ID,
  timestamp: '2026-09-09T21:13:42Z',
  metrics: {
    available_budget: 1100000,    // ₹11.0L (Post-reduction)
    committed_budget: 870000,     // ₹8.7L
    revenue_pipeline: 5000000,    // ₹50.0L
    engineering_capacity: 300,    // 300h available
    engineering_demand: 420,      // 420h required
    capacity_utilization: 140,    // 140% DEFICIT
    budget_pressure: 0.79,        // 79%
    risk_score: 0.82,             // HIGH RISK
    business_health: 64,          // Declining
  },
  state_hash: 'mesh-state-hash-9182',
  last_event_id: 'evt-fin-cut-01',
  created_at: '2026-09-09T21:13:42Z',
};

// 2. Core Business Entities in the Dependency Mesh
export const MOCK_ENTITIES: BusinessEntity[] = [
  {
    id: 'ent-cust-apex',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'customer',
    name: 'Apex Global Financials',
    description: 'Tier-1 Enterprise client with custom SLA commitments',
    department: 'sales',
    status: 'active',
    metadata: { tier: 'enterprise', arr_contribution: 2400000, churn_risk: 0.15, health_score: 88 },
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-09T21:04:11Z',
  },
  {
    id: 'ent-deal-apex',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'deal',
    name: 'Apex Enterprise Expansion',
    description: 'Multi-year expansion contract contingent on SAML & Custom Reports',
    department: 'sales',
    status: 'active',
    metadata: { contract_value: 5000000, pipeline_stage: 'proposal', target_date: '30 DAYS' },
    created_at: '2026-09-09T21:04:11Z',
    updated_at: '2026-09-09T21:04:11Z',
  },
  {
    id: 'ent-feat-sso',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'feature',
    name: 'Enterprise Multi-Tenant SAML',
    description: 'Core authentication module required by enterprise security audit',
    department: 'product',
    status: 'active',
    metadata: { scope_points: 80, required_hours: 180, critical_path: true },
    created_at: '2026-09-09T21:05:43Z',
    updated_at: '2026-09-09T21:05:43Z',
  },
  {
    id: 'ent-feat-reports',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'feature',
    name: 'Custom Executive Analytics',
    description: 'Secondary report generator committed during sales intake',
    department: 'product',
    status: 'at_risk',
    metadata: { scope_points: 40, required_hours: 120, critical_path: false },
    created_at: '2026-09-09T21:05:43Z',
    updated_at: '2026-09-09T21:13:42Z',
  },
  {
    id: 'ent-feat-audit',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'feature',
    name: 'Realtime Audit Export',
    description: 'Compliance telemetry streaming to client S3/GCS',
    department: 'product',
    status: 'at_risk',
    metadata: { scope_points: 35, required_hours: 120, critical_path: false },
    created_at: '2026-09-09T21:05:43Z',
    updated_at: '2026-09-09T21:13:42Z',
  },
  {
    id: 'ent-res-eng',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'resource',
    name: 'Core Platform Engineering',
    description: 'Sprint engineering capacity pool (6 full-stack engineers)',
    department: 'engineering',
    status: 'blocked',
    metadata: { capacity_hours: 300, demand_hours: 420, utilization_pct: 140 },
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-09T21:13:42Z',
  },
  {
    id: 'ent-budget-q1',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'budget',
    name: 'Q1 Tech & Engineering Budget',
    description: 'Operational and contractor capital allocation',
    department: 'finance',
    status: 'at_risk',
    metadata: { allocated: 1100000, committed: 870000, previous_allocated: 1800000 },
    created_at: '2026-09-09T21:08:11Z',
    updated_at: '2026-09-09T21:13:42Z',
  },
  {
    id: 'ent-outcome-delivery',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'outcome',
    name: 'Q3 Delivery Milestone & SLA',
    description: 'Target shipment date for enterprise client rollout',
    department: 'engineering',
    status: 'at_risk',
    metadata: { target_date: '2026-10-15', projected_slippage_days: 8 },
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-09T21:13:42Z',
  },
  {
    id: 'ent-outcome-rev',
    organization_id: MOCK_ORGANIZATION_ID,
    entity_type: 'outcome',
    name: 'FY26 Q4 ARR Expansion',
    description: 'Target organizational expansion benchmark (₹50L)',
    department: 'finance',
    status: 'active',
    metadata: { target_arr: 5000000, probability: 0.85 },
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-09T21:04:11Z',
  }
];

// 3. Explicit Navigational Dependencies
export const MOCK_DEPENDENCIES: Dependency[] = [
  {
    id: 'dep-1',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-cust-apex',
    target_entity_id: 'ent-deal-apex',
    relation_type: 'generates',
    strength: 1.0,
    created_at: '2026-09-09T21:04:11Z',
  },
  {
    id: 'dep-2',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-deal-apex',
    target_entity_id: 'ent-feat-sso',
    relation_type: 'requires',
    strength: 1.0,
    created_at: '2026-09-09T21:05:43Z',
  },
  {
    id: 'dep-3',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-deal-apex',
    target_entity_id: 'ent-feat-reports',
    relation_type: 'requires',
    strength: 0.7,
    created_at: '2026-09-09T21:05:43Z',
  },
  {
    id: 'dep-4',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-deal-apex',
    target_entity_id: 'ent-feat-audit',
    relation_type: 'requires',
    strength: 0.6,
    created_at: '2026-09-09T21:05:43Z',
  },
  {
    id: 'dep-5',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-feat-sso',
    target_entity_id: 'ent-res-eng',
    relation_type: 'consumes',
    strength: 0.9,
    created_at: '2026-09-09T21:05:43Z',
  },
  {
    id: 'dep-6',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-feat-reports',
    target_entity_id: 'ent-res-eng',
    relation_type: 'consumes',
    strength: 0.8,
    created_at: '2026-09-09T21:05:43Z',
  },
  {
    id: 'dep-7',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-res-eng',
    target_entity_id: 'ent-budget-q1',
    relation_type: 'constrained_by',
    strength: 0.95,
    created_at: '2026-09-09T21:08:11Z',
  },
  {
    id: 'dep-8',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-res-eng',
    target_entity_id: 'ent-outcome-delivery',
    relation_type: 'affects',
    strength: 0.9,
    created_at: '2026-09-09T21:07:02Z',
  },
  {
    id: 'dep-9',
    organization_id: MOCK_ORGANIZATION_ID,
    source_entity_id: 'ent-deal-apex',
    target_entity_id: 'ent-outcome-rev',
    relation_type: 'generates',
    strength: 1.0,
    created_at: '2026-09-09T21:04:11Z',
  },
];

// 4. Operational Event Stream
export const MOCK_EVENT_LOG: DecisionEvent[] = [
  {
    id: 'evt-01',
    organization_id: MOCK_ORGANIZATION_ID,
    department: 'sales',
    event_type: 'deal_created',
    entity_id: 'ent-deal-apex',
    payload: {
      deal_id: 'ent-deal-apex',
      deal_name: 'Apex Enterprise Expansion',
      customer_id: 'ent-cust-apex',
      contract_value: 5000000,
      expected_close_date: '30 DAYS',
    },
    created_by: 'Maya Lin (Sales)',
    created_at: '2026-09-09T21:04:11Z',
  },
  {
    id: 'evt-02',
    organization_id: MOCK_ORGANIZATION_ID,
    department: 'product',
    event_type: 'feature_committed',
    entity_id: 'ent-feat-sso',
    payload: {
      feature_id: 'ent-feat-sso',
      sprint_target: 'Sprint-24',
      committed_capacity_hours: 180,
    },
    created_by: 'Marcus Vance (Product)',
    created_at: '2026-09-09T21:05:43Z',
  },
  {
    id: 'evt-03',
    organization_id: MOCK_ORGANIZATION_ID,
    department: 'engineering',
    event_type: 'capacity_changed',
    entity_id: 'ent-res-eng',
    payload: {
      team_id: 'ent-res-eng',
      previous_capacity_hours: 420,
      new_capacity_hours: 300,
      effective_date: 'Immediate',
    },
    created_by: 'Devon Ross (Engineering)',
    created_at: '2026-09-09T21:07:02Z',
  },
  {
    id: 'evt-04',
    organization_id: MOCK_ORGANIZATION_ID,
    department: 'finance',
    event_type: 'budget_changed',
    entity_id: 'ent-budget-q1',
    payload: {
      department: 'finance',
      previous_budget: 1800000,
      new_budget: 1100000,
      fiscal_period: 'Q1',
      rationale: 'Strategic liquidity buffer preservation',
    },
    created_by: 'Priya Sharma (Finance)',
    created_at: '2026-09-09T21:13:42Z',
  },
];

// 5. Trigger Decision Event (The Core Demo Incident)
export const MOCK_ACTIVE_DECISION_EVENT = MOCK_EVENT_LOG[3]; // Budget Reduced ₹18L -> ₹11L

// 6. Deterministic Impact Result (Output of Layer 1 Impact Engine)
export const MOCK_IMPACT_RESULT: ImpactResult = {
  id: 'imp-budget-cut-01',
  organization_id: MOCK_ORGANIZATION_ID,
  decision_event_id: 'evt-04',
  affected_entities: [
    {
      entity_id: 'ent-budget-q1',
      entity_name: 'Q1 Platform Budget',
      entity_type: 'budget',
      department: 'finance',
      direct_or_cascaded: 'direct',
      impact_severity: 'critical',
      details: 'Capital ceiling reduced from ₹18.0L to ₹11.0L (-₹7.0L deficit).',
    },
    {
      entity_id: 'ent-res-eng',
      entity_name: 'Core Platform Engineering',
      entity_type: 'resource',
      department: 'engineering',
      direct_or_cascaded: 'cascaded',
      impact_severity: 'critical',
      details: 'Contractor budget eliminated: 120h capacity deficit at 140% load.',
    },
    {
      entity_id: 'ent-feat-reports',
      entity_name: 'Custom Executive Analytics',
      entity_type: 'feature',
      department: 'product',
      direct_or_cascaded: 'cascaded',
      impact_severity: 'high',
      details: 'Engineering deficit forces postponement of secondary scope.',
    },
    {
      entity_id: 'ent-feat-audit',
      entity_name: 'Realtime Audit Export',
      entity_type: 'feature',
      department: 'product',
      direct_or_cascaded: 'cascaded',
      impact_severity: 'medium',
      details: 'Slipping past sprint target date.',
    },
    {
      entity_id: 'ent-outcome-delivery',
      entity_name: 'Q3 Delivery Milestone',
      entity_type: 'outcome',
      department: 'engineering',
      direct_or_cascaded: 'cascaded',
      impact_severity: 'high',
      details: 'Projected delivery slippage of +8 days violates commercial SLA.',
    },
    {
      entity_id: 'ent-deal-apex',
      entity_name: 'Apex Enterprise Expansion',
      entity_type: 'deal',
      department: 'sales',
      direct_or_cascaded: 'cascaded',
      impact_severity: 'high',
      details: 'Delivery delay introduces contract cancellation penalty clause.',
    },
    {
      entity_id: 'ent-cust-apex',
      entity_name: 'Apex Global Financials',
      entity_type: 'customer',
      department: 'sales',
      direct_or_cascaded: 'cascaded',
      impact_severity: 'medium',
      details: 'Potential SLA breach escalates churn risk tier.',
    }
  ],
  metric_deltas: [
    {
      metric: 'available_budget',
      previous_value: 1800000,
      new_value: 1100000,
      delta: -700000,
      delta_pct: -38.9,
    },
    {
      metric: 'capacity_utilization',
      previous_value: 80,
      new_value: 140,
      delta: 60,
      delta_pct: 75.0,
    },
    {
      metric: 'budget_pressure',
      previous_value: 0.61,
      new_value: 0.79,
      delta: 0.18,
      delta_pct: 29.5,
    },
    {
      metric: 'risk_score',
      previous_value: 0.28,
      new_value: 0.82,
      delta: 0.54,
      delta_pct: 192.8,
    }
  ],
  cascade_depth: 4,
  deterministic_score: 18,
  risk_assessment: {
    overall_risk: 'critical',
    risk_score: 0.82,
    primary_risks: [
      '120h Engineering capacity deficit at 140% team burn',
      '8-day delivery delay breaches contract penalty clause with Apex Global',
      'High budget pressure (79%) limits emergency contractor intervention',
    ],
    bottlenecks: ['ent-res-eng', 'ent-feat-reports', 'ent-outcome-delivery'],
  },
  confidence_score: 0.96,
  calculated_at: '2026-09-09T21:13:42Z',
};

// 7. Decision Alternatives (Output of Layer 2 Decision Engine)
export const MOCK_DECISION_OPTIONS: DecisionOption[] = [
  {
    id: 'opt-scope-reduction',
    decision_id: 'dec-fin-01',
    event_id: 'evt-04',
    title: 'Reduce Feature Scope (Descope Secondary Analytics)',
    description: 'Protect core SAML SSO commitment while deferring non-essential Custom Reports & Audit Export to Phase 2.',
    action_type: 'negotiate',
    projected_metrics: {
      capacity_utilization: 92,
      budget_pressure: 0.72,
    },
    feasibility_score: 91,
    policy_alignment: { ceo: 82, cfo: 94, coo: 96, balanced: 91 },
    tradeoffs: {
      pros: [
        'Eliminates 120h capacity deficit immediately',
        'Preserves ₹50L Apex deal core contractual requirement (SAML)',
        'Saves ₹2.4L in engineering overtime & contractor fees',
        'Zero delivery slippage on critical path',
      ],
      cons: [
        'Requires customer alignment call regarding Phase 2 delivery schedule',
      ],
      risks: [
        'Client sales rep minor pushback on timeline',
      ],
    },
    rationale: 'Harmonizes capital discipline with execution stability while preserving enterprise deal revenue.',
  },
  {
    id: 'opt-delay-delivery',
    decision_id: 'dec-fin-01',
    event_id: 'evt-04',
    title: 'Delay Delivery by 14 Days',
    description: 'Absorb full scope with existing headcount by extending the delivery milestone by two calendar weeks.',
    action_type: 'delay',
    projected_metrics: {
      capacity_utilization: 104,
      budget_pressure: 0.79,
    },
    feasibility_score: 78,
    policy_alignment: { ceo: 62, cfo: 85, coo: 88, balanced: 78 },
    tradeoffs: {
      pros: [
        'No feature scope cuts required',
        'Direct cost saving of ₹2.7L by avoiding contractor ramp',
      ],
      cons: [
        'Breaches initial 30-day delivery expectation',
        'Moderate customer satisfaction penalty',
      ],
      risks: [
        'Apex procurement may trigger formal contractual delay penalty',
      ],
    },
    rationale: 'Protects budget but shifts friction onto the customer relationship.',
  },
  {
    id: 'opt-cancel-commitment',
    decision_id: 'dec-fin-01',
    event_id: 'evt-04',
    title: 'Reject Custom Feature Commitments Entirely',
    description: 'Cancel custom work and offer only standard off-the-shelf platform capabilities.',
    action_type: 'reject',
    projected_metrics: {
      capacity_utilization: 75,
      budget_pressure: 0.60,
    },
    feasibility_score: 43,
    policy_alignment: { ceo: 25, cfo: 92, coo: 68, balanced: 43 },
    tradeoffs: {
      pros: [
        'Immediate cash preservation of ₹3.2L',
        'Team capacity returns to healthy slack (75%)',
      ],
      cons: [
        'Severely risks losing the ₹50L expansion contract',
        'Violates verbal commitment from Sales',
      ],
      risks: [
        'Apex Global may terminate the entire relationship (churn threat)',
      ],
    },
    rationale: 'Fiscal safety prioritized at the unacceptable expense of commercial growth.',
  }
];

// 8. Strategic Recommendation (Output of Layer 3 Strategic Reasoning / Groq)
export const MOCK_RECOMMENDATION: Recommendation = {
  id: 'rec-01',
  decision_id: 'dec-fin-01',
  decision_event_id: 'evt-04',
  top_option_id: 'opt-scope-reduction',
  perspective: 'balanced',
  groq_reasoning: {
    executive_synthesis:
      'The deterministic impact reveals that the ₹7.0L budget reduction is not merely a financial adjustment; it has precipitated an acute 120h operational deficit at 140% capacity utilization. Option 1 (Scope Reduction) represents the Pareto-optimal course, preserving the ₹50L expansion while rectifying delivery stability.',
    strategic_rationale:
      'Apex Global requires SAML authentication for compliance; secondary custom analytics are negotiable. By isolating the critical path and shifting analytics to Phase 2, Blacktide eliminates the delivery hazard with zero capital expenditure.',
    counterfactual_analysis:
      'Attempting to brute-force full delivery with an unaugmented team guarantees an 8-day slippage, triggering SLA penalty clauses and inflicting severe reputation damage on the enterprise expansion.',
    risk_mitigation: [
      'Conduct executive alignment briefing with Apex Global VP of Technology within 24h',
      'Lock in written Phase 2 delivery schedule for Custom Reports with zero penalty clause',
      'Establish real-time capacity sentinel on Core Platform Engineering to prevent drift',
    ],
  },
  confidence_score: 0.91,
  created_at: '2026-09-09T21:13:43Z',
};

// 9. FlowTrace Execution Route
export interface FlowTraceStep {
  id: string;
  stepNumber: number;
  department: 'product' | 'operations' | 'sales' | 'finance';
  departmentTitle: string;
  actionTitle: string;
  instruction: string;
  status: 'completed' | 'active' | 'pending' | 'blocked';
  telemetry: string;
}

export const MOCK_FLOWTRACE_STEPS: FlowTraceStep[] = [
  {
    id: 'step-01',
    stepNumber: 1,
    department: 'product',
    departmentTitle: 'THE CHART ROOM (PRODUCT)',
    actionTitle: 'Freeze Non-Critical Custom Scope',
    instruction: 'Deprioritize Custom Executive Analytics & Audit Export; re-lock sprint goal strictly to Enterprise SAML SSO.',
    status: 'completed',
    telemetry: 'Scope reduced: 155 pts → 80 pts (freed 120h)',
  },
  {
    id: 'step-02',
    stepNumber: 2,
    department: 'operations',
    departmentTitle: 'THE ENGINE ROOM (OPERATIONS)',
    actionTitle: 'Reallocate 120h Engineering Capacity',
    instruction: 'Balance Core Platform Engineering workload to 300h target; normalize utilization from 140% to 92%.',
    status: 'active',
    telemetry: 'Burn rate: 420h/wk → 276h/wk (On Track)',
  },
  {
    id: 'step-03',
    stepNumber: 3,
    department: 'sales',
    departmentTitle: 'THE LOOKOUT (SALES)',
    actionTitle: 'Deliver Client Phasing Protocol',
    instruction: 'Notify Apex Global Financials of phased deployment: Phase 1 (SAML SSO) on schedule; Phase 2 (Reports) in 60 days.',
    status: 'pending',
    telemetry: 'Commercial alignment call queued for 10:00 AM',
  },
  {
    id: 'step-04',
    stepNumber: 4,
    department: 'finance',
    departmentTitle: 'THE TREASURY (FINANCE)',
    actionTitle: 'Audit & Record Operational Savings',
    instruction: 'Reconcile Q1 budget variance: lock ₹2.4L in verified contractor savings and update burn runway.',
    status: 'pending',
    telemetry: 'Cash runway extension: +0.6 months',
  },
];
