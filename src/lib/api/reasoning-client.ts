/**
 * IMPACTMESH - Client Reasoning API Boundary
 * Communicates with the backend reasoning endpoint.
 * Notice: The frontend NEVER calls Groq or passes Groq API keys.
 */

import type { ReasoningRequest, ReasoningResult } from '../../../server/types/server-types.ts';
import { handleReasoningRequest } from '../../../server/api/reasoning-routes.ts';

export async function requestStrategicReasoning(
  request: ReasoningRequest
): Promise<ReasoningResult> {
  // In development/client environment, route via backend handler abstraction
  // In production, this can invoke `fetch('/api/reasoning', { ... })`
  const response = await handleReasoningRequest(request);

  if (response.statusCode !== 200 || 'error' in response.body) {
    const errorMsg = 'error' in response.body ? response.body.error : 'Reasoning evaluation failed';
    throw new Error(errorMsg);
  }

  return response.body as ReasoningResult;
}
