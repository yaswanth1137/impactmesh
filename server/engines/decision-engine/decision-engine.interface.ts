/**
 * IMPACTMESH - Decision Engine Interface & Contracts
 * Layer 2: Generates feasible alternatives, checks constraints, scores policy alignment,
 * and forms deterministic executive recommendations.
 */

import type { BusinessState } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';
import type { ExpertPolicy, ExecutiveRole } from '../../../src/types/policies.ts';
import type { ImpactAnalysis } from '../impact-engine/impact-engine.interface.ts';
import type { ConstraintViolation } from '../constraint-engine/constraint.interface.ts';

export interface DecisionOptionDetails {
  id: string;
  eventId: string;
  title: string;
  description: string;
  actionType: 'reduce_scope' | 'delay_delivery' | 'increase_budget' | 'scale_capacity' | 'reduce_commitment' | 'cancel_commitment' | 'negotiate' | 'accept';
  action_type: string;
  feasible: boolean;
  score: number; // 0 - 100
  feasibility_score: number;
  financialImpact: number;   // INR savings or expense
  customerImpact: number;    // -100 to +100 satisfaction index
  capacityImpact: number;    // Hours freed (+) or demanded (-)
  deliveryImpact: number;    // Days slippage change (- means earlier)
  riskImpact: number;        // Risk reduction delta
  implementationCost: number;// Setup/contracting expense
  constraintViolations: ConstraintViolation[];
  projectedMetrics: {
    capacity_utilization: number;
    budget_pressure: number;
    risk_score: number;
    available_budget: number;
  };
  policyAlignment: Record<ExecutiveRole, number>; // CEO, CFO, COO scores
  policy_alignment: Record<ExecutiveRole, number>;
  tradeoffs: { pros: string[]; cons: string[]; risks?: string[] };
  evidence: string[];
}

export interface RecommendationResult {
  recommendationId: string;
  decisionId: string;
  selectedOption: DecisionOptionDetails;
  perspective: ExecutiveRole;
  score: number;
  confidenceScore: number; // 0.0 - 1.0 deterministic confidence
  confidenceFactors: {
    dataCompleteness: number;
    dependencyCoverage: number;
    constraintCertainty: number;
    inputConsistency: number;
  };
  rationaleEvidence: string[];
  tradeoffs: string[];
  risks: string[];
  assumptions: string[];
  missingContext: string[];
  generatedAt: string;
}

export interface DecisionGenerationInput {
  event: DecisionEvent;
  currentState: BusinessState;
  impactAnalysis?: ImpactAnalysis;
  impactResult?: unknown;
  policies: Record<ExecutiveRole, ExpertPolicy>;
  activeRole?: ExecutiveRole;
}

export interface IDecisionEngine {
  generateOptions(input: DecisionGenerationInput): Promise<DecisionOptionDetails[]>;
  scoreOption(
    option: DecisionOptionDetails,
    policy: ExpertPolicy,
    role: ExecutiveRole
  ): number;
  formRecommendation(
    options: DecisionOptionDetails[],
    impactAnalysis: ImpactAnalysis,
    activeRole?: ExecutiveRole
  ): RecommendationResult;
}
