/**
 * IMPACTMESH - Reasoning Engine Interface
 * Layer 3: Strategic synthesis and explanation layer over deterministic evidence.
 */

import type { StructuredReasoningEvidence, ReasoningResult } from '../../types/server-types.ts';
import type { ExecutiveRole } from '../../../src/types/policies.ts';

export interface IReasoningEngine {
  /**
   * Evaluates structured evidence and produces strategic recommendations and synthesis.
   */
  evaluateEvidence(
    evidence: StructuredReasoningEvidence,
    perspective?: ExecutiveRole
  ): Promise<ReasoningResult>;
}
