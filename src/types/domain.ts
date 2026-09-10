/**
 * IMPACTMESH - Core Domain Interfaces & Types
 * Defines the core models for the Decision Impact Intelligence system.
 */

import type { DepartmentCode } from './events.ts';
import type { ExecutiveRole } from './policies.ts';
import type { BusinessEntity } from './entities.ts';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  department: DepartmentCode;
  email: string;
  full_name: string;
  role: 'member' | 'lead' | 'executive' | 'admin';
  device_id?: string;
  created_at: string;
}

export interface Department {
  id: string;
  code: DepartmentCode;
  name: string;
  lead_user_id?: string;
  device_role: 'sales_client' | 'product_client' | 'eng_client' | 'finance_client' | 'command_center';
}

export type DependencyRelationType =
  | 'requires'
  | 'consumes'
  | 'constrained_by'
  | 'generates'
  | 'affects'
  | (string & {});

export interface Dependency {
  id: string;
  organization_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: DependencyRelationType;
  strength: number; // 0.0 to 1.0 (coupling degree)
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BusinessMetrics {
  available_budget: number;
  committed_budget: number;
  revenue_pipeline: number;
  engineering_capacity: number;
  engineering_demand: number;
  capacity_utilization: number; // percentage, e.g. 0 to 100+
  budget_pressure: number; // 0.0 to 1.0
  risk_score: number; // 0.0 to 1.0
  business_health: number; // 0 to 100

  // Phase 2 backward-compatible extensions
  committed_revenue?: number;
  runway_months?: number;
  delivery_pressure?: number;
  active_deals_count?: number;
  committed_features_count?: number;
  committed_scope_points?: number;
  engineering_deficit?: number;

  // CamelCase accessors / aliases
  availableBudget?: number;
  committedBudget?: number;
  revenuePipeline?: number;
  engineeringCapacity?: number;
  engineeringDemand?: number;
  capacityUtilization?: number;
  budgetPressure?: number;
  riskScore?: number;
  businessHealth?: number;
  committedRevenue?: number;
  runwayMonths?: number;
  deliveryPressure?: number;
  engineeringDeficit?: number;
}

export interface BusinessState {
  id: string;
  organization_id: string;
  timestamp: string;
  metrics: BusinessMetrics;
  state_hash: string;
  last_event_id: string | null;
  created_at: string;

  // Phase 2 backward-compatible entity state map & versioning
  entities?: Record<string, BusinessEntity>;
  version?: number;
  processed_event_ids?: string[];
}

export interface MetricDelta {
  metric: keyof BusinessMetrics;
  previous_value: number;
  new_value: number;
  delta: number;
  delta_pct: number;
}

export interface AffectedEntitySummary {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  department: string;
  direct_or_cascaded: 'direct' | 'cascaded';
  impact_severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

export interface ImpactResult {
  id: string;
  organization_id: string;
  decision_event_id: string;
  affected_entities: AffectedEntitySummary[];
  metric_deltas: MetricDelta[];
  cascade_depth: number;
  deterministic_score: number; // 0 - 100
  risk_assessment: {
    overall_risk: 'low' | 'medium' | 'high' | 'critical';
    risk_score: number;
    primary_risks: string[];
    bottlenecks: string[];
  };
  confidence_score: number; // 0.0 to 1.0
  calculated_at: string;
}

export interface DecisionOption {
  id: string;
  decision_id?: string;
  event_id?: string;
  title: string;
  description: string;
  action_type: 'accept' | 'negotiate' | 'delay' | 'pivot' | 'reject' | 'scale_capacity';
  projected_metrics: Partial<BusinessMetrics>;
  feasibility_score: number; // 0 - 100
  policy_alignment: {
    ceo: number;
    cfo: number;
    coo: number;
    balanced: number;
  };
  tradeoffs: {
    pros: string[];
    cons: string[];
    risks: string[];
  };
  rationale: string;
}

export interface Recommendation {
  id: string;
  decision_id: string;
  decision_event_id: string;
  top_option_id: string;
  perspective: ExecutiveRole;
  groq_reasoning?: {
    executive_synthesis: string;
    strategic_rationale: string;
    counterfactual_analysis: string;
    risk_mitigation: string[];
  };
  confidence_score: number;
  created_at: string;
}

export type DecisionStatus =
  | 'proposed'
  | 'evaluating'
  | 'approved'
  | 'rejected'
  | 'executed';

export interface Decision {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  department: DepartmentCode;
  status: DecisionStatus;
  trigger_event_id: string;
  impact_result_id?: string;
  selected_option_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type { BusinessEntity } from './entities.ts';
export type { DecisionEvent, DepartmentCode } from './events.ts';
export type { ExpertPolicy, ExecutiveRole } from './policies.ts';
