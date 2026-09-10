/**
 * IMPACTMESH - Server Reasoning Route Handler
 * Server-side endpoint boundary to process reasoning requests without exposing keys to frontend.
 */

import type { ReasoningRequest, ReasoningResult } from '../types/server-types.ts';
import { reasoningEngine } from '../engines/reasoning-engine/reasoning-engine.service.ts';

export interface RouteResponse<T> {
  statusCode: number;
  body: T | { error: string };
}

/**
 * Handles incoming reasoning endpoint requests:
 * Validates request payload, delegates to Reasoning Engine, and returns synthesized recommendations.
 */
export async function handleReasoningRequest(
  request: ReasoningRequest
): Promise<RouteResponse<ReasoningResult>> {
  try {
    if (!request.evidence || !request.evidence.triggeringEvent) {
      return {
        statusCode: 400,
        body: { error: 'Invalid reasoning request: missing structured evidence dossier.' },
      };
    }

    const perspective = request.perspective || 'balanced';
    const result = await reasoningEngine.evaluateEvidence(request.evidence, perspective);

    return {
      statusCode: 200,
      body: result,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: {
        error: err instanceof Error ? err.message : 'Internal reasoning engine evaluation error',
      },
    };
  }
}
