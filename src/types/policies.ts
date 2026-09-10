/**
 * IMPACTMESH - Expert Policy Types
 * Models executive perspectives (CEO, CFO, COO) and their priority dimensions.
 */

export type ExecutiveRole = 'ceo' | 'cfo' | 'coo' | 'balanced';

export type PolicyDimension =
  | 'growth'
  | 'strategic_value'
  | 'customer_value'
  | 'cash_preservation'
  | 'cost_control'
  | 'operational_stability'
  | 'capacity'
  | 'risk';

export type DimensionWeights = Record<PolicyDimension, number>;

export interface ExpertPolicy {
  id: string;
  role: ExecutiveRole;
  name: string;
  title: string;
  description: string;
  weights: DimensionWeights;
  thresholds: {
    max_acceptable_risk: number; // 0.0 - 1.0
    min_roi_factor?: number;
    max_capacity_burn?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface PolicyEvaluationScore {
  policy_role: ExecutiveRole;
  overall_score: number; // 0 - 100
  dimension_scores: Partial<Record<PolicyDimension, number>>;
  alignment_summary: string;
  flags: string[];
}
