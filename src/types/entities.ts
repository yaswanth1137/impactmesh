/**
 * IMPACTMESH - Business Entity Types
 * Extensible entity definitions across Blacktide Systems operational departments.
 */

export type BusinessEntityType =
  | 'customer'
  | 'deal'
  | 'product'
  | 'feature'
  | 'project'
  | 'resource'
  | 'budget'
  | 'supplier'
  | 'decision'
  | 'constraint'
  | 'outcome'
  | (string & {});

export type EntityStatus =
  | 'active'
  | 'pending'
  | 'blocked'
  | 'completed'
  | 'deprecated'
  | 'at_risk';

export interface BusinessEntity<TMetadata = Record<string, unknown>> {
  id: string;
  organization_id: string;
  entity_type: BusinessEntityType;
  name: string;
  description?: string;
  department: string;
  status: EntityStatus;
  metadata: TMetadata;
  created_at: string;
  updated_at: string;
}

// Typed metadata schemas for core entity types

export interface CustomerEntityMetadata {
  tier: 'enterprise' | 'growth' | 'startup';
  arr_contribution: number;
  churn_risk: number; // 0.0 to 1.0
  health_score: number; // 0 to 100
}

export interface DealEntityMetadata {
  contract_value: number;
  pipeline_stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  expected_close_date: string;
  probability: number;
  custom_features_requested: string[];
}

export interface FeatureEntityMetadata {
  product_id: string;
  scope_points: number;
  required_sprints: number;
  critical_path: boolean;
  target_release_date: string;
}

export interface ResourceEntityMetadata {
  role: string;
  capacity_hours_per_week: number;
  current_allocation_pct: number;
  hourly_cost: number;
}

export interface BudgetEntityMetadata {
  allocated_amount: number;
  committed_amount: number;
  spent_amount: number;
  currency: string;
  fiscal_quarter: string;
}
