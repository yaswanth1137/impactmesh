/**
 * IMPACTMESH - Server Types & Reasoning Evidence Contracts
 * Defines the structured evidence boundaries passed into the Reasoning Engine and Groq service.
 */

import type {
  BusinessState,
  ImpactResult,
  DecisionOption,
  BusinessEntity,
  Dependency,
} from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';
import type { ExpertPolicy, ExecutiveRole } from '../../src/types/policies.ts';

/**
 * Structured evidence bundle passed to the Reasoning Engine.
 * Note: Groq never gets direct DB access; it only receives this sanitized, structured evidence.
 */
export interface StructuredReasoningEvidence {
  organizationId: string;
  triggeringEvent: DecisionEvent;
  currentBusinessState: BusinessState;
  affectedEntities: Array<{
    entity: BusinessEntity;
    dependencyRelation?: Dependency;
    impactSeverity: string;
  }>;
  deterministicImpact: ImpactResult;
  generatedOptions: DecisionOption[];
  expertPolicies: Record<ExecutiveRole, ExpertPolicy>;
  historicalContextSummary?: string;
}

export interface ReasoningRequest {
  organizationId: string;
  eventId: string;
  perspective?: ExecutiveRole;
  evidence: StructuredReasoningEvidence;
}

export interface ReasoningResult {
  decisionId?: string;
  recommendedOptionId: string;
  perspective: ExecutiveRole;
  synthesis: {
    executive_summary: string;
    strategic_rationale: string;
    tradeoff_assessment: string;
    counterfactual_analysis: string;
    risk_mitigations: string[];
  };
  policyAlignmentScores: Record<ExecutiveRole, number>;
  confidenceScore: number;
  tokensUsed?: number;
  executionTimeMs: number;
}
