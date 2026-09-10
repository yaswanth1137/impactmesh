/**
 * IMPACTMESH - Decision Engine Interface
 * Layer 2: Generates and scores possible actions/alternatives based on deterministic impact.
 */

import type { DecisionOption, ImpactResult, BusinessState } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';
import type { ExpertPolicy, ExecutiveRole } from '../../../src/types/policies.ts';

export interface DecisionGenerationInput {
  event: DecisionEvent;
  currentState: BusinessState;
  impactResult: ImpactResult;
  policies: Record<ExecutiveRole, ExpertPolicy>;
}

export interface IDecisionEngine {
  /**
   * Generates discrete decision options addressing the triggering event and impact.
   */
  generateOptions(input: DecisionGenerationInput): Promise<DecisionOption[]>;

  /**
   * Scores a candidate option against executive policies (CEO, CFO, COO).
   */
  scoreOptionAgainstPolicies(
    option: DecisionOption,
    policies: Record<ExecutiveRole, ExpertPolicy>
  ): Record<ExecutiveRole, number>;
}
