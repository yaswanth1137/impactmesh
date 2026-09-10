/**
 * IMPACTMESH - Connector API Route Handlers
 * Implements endpoints:
 *   - POST /api/connectors/webhook (Generic Webhook Ingestion)
 *   - POST /api/connectors/n8n     (n8n Automation Webhook Ingestion)
 *   - GET  /api/connectors/health  (Connector Hub Health Status)
 *
 * Flow:
 * External Payload -> Connector Normalization -> Canonical DecisionEvent -> handleEventIngestion (Validation -> Idempotency -> StateTransitionEngine -> EventStore).
 */

import type { BusinessState } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';
import {
  eventNormalizer,
  connectorRegistry,
  NormalizationError,
  type ConnectorHealth,
  type NormalizationContext,
} from '../connectors/index.ts';
import { handleEventIngestion, type EventIngestionResponse } from './event-routes.ts';

export interface ConnectorRouteRequest {
  body: unknown;
  headers?: Record<string, string | undefined>;
  context?: NormalizationContext;
  currentState?: BusinessState;
}

export interface ConnectorRouteSuccessBody {
  success: true;
  connectorId: string;
  source: string;
  eventsProcessed: number;
  events: DecisionEvent[];
  results: EventIngestionResponse['body'][];
  idempotent?: boolean;
}

export interface ConnectorRouteErrorBody {
  success: false;
  error: string;
  code?: string;
  connectorId?: string;
  field?: string;
  received?: unknown;
  details?: unknown;
}

export interface ConnectorHealthResponseBody {
  success: true;
  timestamp: string;
  totalConnectors: number;
  connectors: Record<string, ConnectorHealth>;
}

export interface ConnectorRouteResponse {
  statusCode: number;
  body: ConnectorRouteSuccessBody | ConnectorRouteErrorBody | ConnectorHealthResponseBody;
}

/**
 * Handles POST /api/connectors/webhook
 */
export async function handleWebhookIngestion(
  request: ConnectorRouteRequest
): Promise<ConnectorRouteResponse> {
  return processConnectorPayload('generic-webhook', request);
}

/**
 * Handles POST /api/connectors/n8n
 */
export async function handleN8nIngestion(
  request: ConnectorRouteRequest
): Promise<ConnectorRouteResponse> {
  return processConnectorPayload('n8n', request);
}

/**
 * Core processing pipeline:
 * 1. Validate request body presence
 * 2. Normalize through connector to produce DecisionEvent(s)
 * 3. Ingest each DecisionEvent into the state pipeline via handleEventIngestion()
 * 4. Aggregate and return deterministic execution results
 */
async function processConnectorPayload(
  preferredConnectorId: string,
  request: ConnectorRouteRequest
): Promise<ConnectorRouteResponse> {
  const { body, context, currentState } = request;

  if (body === null || body === undefined) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'Payload body is required.',
        code: 'PAYLOAD_REQUIRED',
        connectorId: preferredConnectorId,
      },
    };
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'Payload body must be a JSON object.',
        code: 'INVALID_PAYLOAD',
        connectorId: preferredConnectorId,
        received: body,
      },
    };
  }

  const effectiveContext: NormalizationContext = {
    ...context,
    deterministicId: context?.deterministicId ?? true,
  };

  // 1. Normalization phase
  let normalizedEvents: DecisionEvent[];
  try {
    normalizedEvents = eventNormalizer.normalize(body, {
      connectorId: preferredConnectorId,
      context: effectiveContext,
      validate: true,
    });
  } catch (err: unknown) {
    if (err instanceof NormalizationError) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: err.message,
          code: err.code,
          connectorId: err.connectorId || preferredConnectorId,
          field: err.field,
          received: err.received,
        },
      };
    }
    return {
      statusCode: 400,
      body: {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown normalization error.',
        code: 'NORMALIZATION_FAILED',
        connectorId: preferredConnectorId,
      },
    };
  }

  // 2. Ingestion phase into the existing state pipeline
  const results: EventIngestionResponse['body'][] = [];
  let runningState: BusinessState | undefined = currentState;
  let allIdempotent = true;

  for (const event of normalizedEvents) {
    const ingestionResponse = await handleEventIngestion({
      event,
      currentState: runningState,
    });

    if (!ingestionResponse.body.success) {
      // Propagation failure in pipeline
      return {
        statusCode: ingestionResponse.statusCode,
        body: {
          success: false,
          error: ingestionResponse.body.error,
          code: ingestionResponse.body.code,
          connectorId: preferredConnectorId,
          details: ingestionResponse.body.validationErrors,
        },
      };
    }

    if (!ingestionResponse.body.idempotent) {
      allIdempotent = false;
      runningState = ingestionResponse.body.nextState;
    }

    results.push(ingestionResponse.body);
  }

  return {
    statusCode: 200,
    body: {
      success: true,
      connectorId: preferredConnectorId,
      source: normalizedEvents[0]?.source_metadata?.source || preferredConnectorId,
      eventsProcessed: normalizedEvents.length,
      events: normalizedEvents,
      results,
      idempotent: allIdempotent,
    },
  };
}

/**
 * Handles GET /api/connectors/health
 */
export async function handleConnectorHealth(): Promise<ConnectorRouteResponse> {
  const connectors = connectorRegistry.list();
  const healthResults: Record<string, ConnectorHealth> = {};

  for (const connector of connectors) {
    if (connector.healthCheck) {
      try {
        healthResults[connector.id] = await connector.healthCheck();
      } catch (err) {
        healthResults[connector.id] = {
          status: 'down',
          message: err instanceof Error ? err.message : 'Health check failed',
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      healthResults[connector.id] = {
        status: 'healthy',
        message: 'Active (no explicit healthCheck implemented)',
        timestamp: new Date().toISOString(),
      };
    }
  }

  return {
    statusCode: 200,
    body: {
      success: true,
      timestamp: new Date().toISOString(),
      totalConnectors: connectors.length,
      connectors: healthResults,
    },
  };
}
