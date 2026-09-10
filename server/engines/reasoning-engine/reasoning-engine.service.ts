/**
 * IMPACTMESH - Reasoning Engine Service
 * Implementation of Layer 3: Coordinates structured evidence and executes Groq reasoning.
 */

import type { IReasoningEngine } from './reasoning-engine.interface.ts';
import type { StructuredReasoningEvidence, ReasoningResult } from '../../types/server-types.ts';
import type { ExecutiveRole } from '../../../src/types/policies.ts';
import { groqService, GroqService } from '../../services/groq-service.ts';

export class StrategicReasoningEngine implements IReasoningEngine {
  private groq: GroqService;

  constructor(groqClient: GroqService = groqService) {
    this.groq = groqClient;
  }

  public async evaluateEvidence(
    evidence: StructuredReasoningEvidence,
    perspective: ExecutiveRole = 'balanced'
  ): Promise<ReasoningResult> {
    // Validate evidence integrity before passing to reasoning layer
    if (!evidence.triggeringEvent || !evidence.deterministicImpact) {
      throw new Error('Incomplete evidence dossier provided to Reasoning Engine.');
    }

    // Execute reasoning through Groq abstraction
    return await this.groq.executeReasoning(evidence, perspective);
  }
}

export const reasoningEngine = new StrategicReasoningEngine();
