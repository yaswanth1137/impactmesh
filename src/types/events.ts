/**
 * IMPACTMESH - Event Type Definitions
 * Strongly typed events emitted by the four operational departments of Blacktide Systems.
 */

export type DepartmentCode = 'sales' | 'product' | 'engineering' | 'finance' | 'command_center' | 'operations';

// =============================================================================
// SALES EVENTS
// =============================================================================

export interface CustomerAddedPayload {
  customer_id: string;
  name: string;
  tier: 'enterprise' | 'growth' | 'startup';
  arr: number;
}

export interface DealCreatedPayload {
  deal_id: string;
  deal_name: string;
  customer_id: string;
  contract_value: number;
  expected_close_date: string;
  requested_features?: string[];
}

export interface DealValueChangedPayload {
  deal_id: string;
  previous_value: number;
  new_value: number;
  reason?: string;
}

export interface DeadlineChangedPayload {
  deal_id: string;
  previous_deadline: string;
  new_deadline: string;
  penalty_clause_active?: boolean;
}

export interface DealAcceptedPayload {
  deal_id: string;
  final_value: number;
  close_date: string;
  sla_commitments: string[];
  finalValue?: number;
}

export interface CustomerRiskChangedPayload {
  customer_id: string;
  previous_risk: number;
  new_risk: number;
  risk_factors: string[];
}

export type SalesEventType =
  | 'customer_added'
  | 'deal_created'
  | 'deal_value_changed'
  | 'deadline_changed'
  | 'deal_accepted'
  | 'customer_risk_changed';

// =============================================================================
// PRODUCT EVENTS
// =============================================================================

export interface FeatureRequestedPayload {
  feature_id: string;
  name: string;
  deal_id?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimated_scope_points: number;
}

export interface FeatureCommittedPayload {
  feature_id: string;
  sprint_target: string;
  committed_capacity_hours: number;
  feature_count?: number;
  featureCount?: number;
  features?: string[];
}

export interface FeatureScopeChangedPayload {
  feature_id: string;
  previous_points: number;
  new_points: number;
  justification?: string;
}

export interface FeatureDeprioritizedPayload {
  feature_id: string;
  reason: string;
  freed_capacity_hours: number;
}

export interface LaunchDateChangedPayload {
  feature_id: string;
  previous_launch_date: string;
  new_launch_date: string;
  slippage_weeks: number;
}

export interface PriorityChangedPayload {
  feature_id: string;
  previous_priority: number;
  new_priority: number;
}

export type ProductEventType =
  | 'feature_requested'
  | 'feature_committed'
  | 'feature_scope_changed'
  | 'feature_deprioritized'
  | 'launch_date_changed'
  | 'priority_changed';

// =============================================================================
// ENGINEERING / OPERATIONS EVENTS
// =============================================================================

export interface CapacityChangedPayload {
  team_id: string;
  previous_capacity_hours: number;
  new_capacity_hours: number;
  effective_date: string;
  previousCapacity?: number;
  newCapacity?: number;
  production_capacity?: number;
  previous_production_capacity?: number;
  unit?: string;
  equipment_status?: string;
  inventory_level?: string;
  inventory_units?: number;
  previous_inventory_units?: number;
  shipment_status?: string;
  operations_status?: string;
  notes?: string;
}

export interface InventoryChangedPayload {
  inventory_id: string;
  item_name?: string;
  previous_value: number; // e.g. 1240
  new_value: number;      // e.g. 860
  unit?: string;
  location?: string;
  notes?: string;
}

export interface ResourceUnavailablePayload {
  resource_id: string;
  resource_name: string;
  duration_days: number;
  affected_features: string[];
}

export interface DeliveryDelayPayload {
  project_id: string;
  delay_days: number;
  root_cause: string;
  cascading_impacts: string[];
}

export interface InfrastructureCostChangedPayload {
  service: string;
  previous_monthly_cost: number;
  new_monthly_cost: number;
  scaling_trigger: string;
}

export interface SupplierDelayPayload {
  supplier_id: string;
  supplier_name: string;
  delay_days: number;
  dependencies_blocked: string[];
}

export type EngineeringEventType =
  | 'capacity_changed'
  | 'inventory_changed'
  | 'resource_unavailable'
  | 'delivery_delay'
  | 'infrastructure_cost_changed'
  | 'supplier_delay';

export type OperationsEventType = EngineeringEventType;

// =============================================================================
// FINANCE EVENTS
// =============================================================================

export interface BudgetChangedPayload {
  department: DepartmentCode;
  previous_budget: number;
  new_budget: number;
  fiscal_period: string;
  rationale?: string;
  previousBudget?: number;
  newBudget?: number;
}

export interface CostChangedPayload {
  category: 'headcount' | 'infrastructure' | 'contractor' | 'operations';
  delta_amount: number;
  recurring: boolean;
}

export interface SpendingFreezePayload {
  department?: DepartmentCode;
  effective_immediately: boolean;
  exemptions: string[];
}

export interface FundingApprovedPayload {
  allocation_id: string;
  approved_amount: number;
  designated_initiative: string;
}

export interface RunwayChangedPayload {
  previous_runway_months: number;
  new_runway_months: number;
  burn_rate: number;
}

export type FinanceEventType =
  | 'budget_changed'
  | 'cost_changed'
  | 'spending_freeze'
  | 'funding_approved'
  | 'runway_changed';

// =============================================================================
// UNIFIED EVENT SCHEMAS
// =============================================================================

export type ImpactMeshEventType =
  | SalesEventType
  | ProductEventType
  | EngineeringEventType
  | FinanceEventType;

export type EventPayloadMap = {
  // Sales
  customer_added: CustomerAddedPayload;
  deal_created: DealCreatedPayload;
  deal_value_changed: DealValueChangedPayload;
  deadline_changed: DeadlineChangedPayload;
  deal_accepted: DealAcceptedPayload;
  customer_risk_changed: CustomerRiskChangedPayload;
  // Product
  feature_requested: FeatureRequestedPayload;
  feature_committed: FeatureCommittedPayload;
  feature_scope_changed: FeatureScopeChangedPayload;
  feature_deprioritized: FeatureDeprioritizedPayload;
  launch_date_changed: LaunchDateChangedPayload;
  priority_changed: PriorityChangedPayload;
  // Engineering / Operations
  capacity_changed: CapacityChangedPayload;
  inventory_changed: InventoryChangedPayload;
  resource_unavailable: ResourceUnavailablePayload;
  delivery_delay: DeliveryDelayPayload;
  infrastructure_cost_changed: InfrastructureCostChangedPayload;
  supplier_delay: SupplierDelayPayload;
  // Finance
  budget_changed: BudgetChangedPayload;
  cost_changed: CostChangedPayload;
  spending_freeze: SpendingFreezePayload;
  funding_approved: FundingApprovedPayload;
  runway_changed: RunwayChangedPayload;
};

import type { ExecutionContext } from './execution.ts';

export interface DecisionEvent<K extends ImpactMeshEventType = ImpactMeshEventType> {
  id: string;
  organization_id: string;
  department: DepartmentCode;
  event_type: K;
  entity_id: string;
  payload: K extends keyof EventPayloadMap ? EventPayloadMap[K] : Record<string, unknown>;
  created_by: string;
  created_at: string;

  // Phase 3 FlowTrace provenance tracking
  execution_context?: ExecutionContext;
  executionContext?: ExecutionContext;
}
