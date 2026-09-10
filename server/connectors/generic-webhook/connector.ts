/**
 * IMPACTMESH - Generic Webhook Connector
 * Extensible input adapter for arbitrary third-party enterprise webhooks (Jira, ERP, custom APIs).
 * Accepts documented JSON schema and transforms into canonical DecisionEvents.
 *
 * PRODUCTION ARCHITECTURE NOTE:
 * In production:
 * 1. Endpoint validates incoming HMAC-SHA256 signature in X-ImpactMesh-Signature header.
 * 2. API Key authentication via Authorization: Bearer <token>.
 * 3. Timestamp drift checks (rejecting requests with skew > 300s to prevent replay attacks).
 */

import type {
  DecisionEvent,
  DepartmentCode,
  ImpactMeshEventType,
} from '../../../src/types/events.ts';
import {
  type Connector,
  type ConnectorHealth,
  type NormalizationContext,
  NormalizationError,
} from '../connector.interface.ts';

export interface GenericWebhookPayload {
  source: string;
  eventType: string;
  externalId: string;
  occurredAt?: string;
  department?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

const EVENT_DEPARTMENT_DEFAULT: Record<string, DepartmentCode> = {
  customer_added: 'sales',
  deal_created: 'sales',
  deal_value_changed: 'sales',
  deadline_changed: 'sales',
  deal_accepted: 'sales',
  customer_risk_changed: 'sales',
  feature_requested: 'product',
  feature_committed: 'product',
  feature_scope_changed: 'product',
  feature_deprioritized: 'product',
  launch_date_changed: 'product',
  priority_changed: 'product',
  capacity_changed: 'engineering',
  inventory_changed: 'operations',
  resource_unavailable: 'engineering',
  delivery_delay: 'engineering',
  infrastructure_cost_changed: 'engineering',
  supplier_delay: 'operations',
  budget_changed: 'finance',
  cost_changed: 'finance',
  spending_freeze: 'finance',
  funding_approved: 'finance',
  runway_changed: 'finance',
};

export class GenericWebhookConnector implements Connector<GenericWebhookPayload> {
  public readonly id = 'generic-webhook';
  public readonly name = 'Generic Enterprise Webhook Connector';
  public readonly source = 'generic-webhook';
  public readonly version = '1.0.0';

  /**
   * Identifies standard generic webhook payload shape:
   * { source, eventType, externalId, payload }
   */
  public canHandle(input: unknown): boolean {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return false;
    }

    const obj = input as Record<string, unknown>;

    // Must have source, eventType (or event_type), and a payload object
    const hasSource = typeof obj.source === 'string' && obj.source.trim() !== '';
    const hasEventType = typeof (obj.eventType || obj.event_type) === 'string';
    const hasPayload = obj.payload !== null && typeof obj.payload === 'object';

    // Must not be an Opportunity object (handled by salesforce) or n8n dotted event without explicit generic source
    if (obj.source === 'salesforce' || obj.type === 'Opportunity') {
      return false;
    }

    return hasSource && hasEventType && hasPayload;
  }

  /**
   * Normalizes generic webhook payload into canonical DecisionEvent.
   * Strictly validates numeric properties without coercion.
   */
  public normalize(
    input: GenericWebhookPayload,
    context?: NormalizationContext
  ): DecisionEvent[] {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new NormalizationError('Generic webhook payload must be a non-null object.', {
        code: 'INVALID_PAYLOAD',
        connectorId: this.id,
        received: input,
      });
    }

    // 1. Validate top-level schema
    if (!input.source || typeof input.source !== 'string' || input.source.trim() === '') {
      throw new NormalizationError('Generic webhook missing required string: source.', {
        code: 'MISSING_FIELD',
        connectorId: this.id,
        field: 'source',
      });
    }

    const rawEventType = (input.eventType || (input as Record<string, unknown>).event_type) as string;
    if (!rawEventType || typeof rawEventType !== 'string' || rawEventType.trim() === '') {
      throw new NormalizationError('Generic webhook missing required string: eventType.', {
        code: 'MISSING_FIELD',
        connectorId: this.id,
        field: 'eventType',
      });
    }

    const externalId = input.externalId || (input as Record<string, unknown>).external_id as string;
    if (!externalId || typeof externalId !== 'string' || externalId.trim() === '') {
      throw new NormalizationError('Generic webhook missing required string: externalId.', {
        code: 'MISSING_FIELD',
        connectorId: this.id,
        field: 'externalId',
      });
    }

    if (!input.payload || typeof input.payload !== 'object' || Array.isArray(input.payload)) {
      throw new NormalizationError('Generic webhook payload property must be a non-null object.', {
        code: 'INVALID_PAYLOAD',
        connectorId: this.id,
        field: 'payload',
      });
    }

    const rawPayload = input.payload;

    // Standardize eventType (handle dot.notation or snake_case)
    const canonicalType = rawEventType.replace(/\./g, '_').toLowerCase();

    const defaultDept = EVENT_DEPARTMENT_DEFAULT[canonicalType];
    if (!defaultDept) {
      throw new NormalizationError(
        `Unknown or unsupported generic webhook eventType: '${rawEventType}'.`,
        {
          code: 'UNSUPPORTED_EVENT_TYPE',
          connectorId: this.id,
          field: 'eventType',
          received: rawEventType,
        }
      );
    }

    const department = (input.department || defaultDept) as DepartmentCode;
    const orgId = context?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const createdAt = input.occurredAt && !isNaN(Date.parse(input.occurredAt))
      ? input.occurredAt
      : (context?.timestamp || new Date().toISOString());
    const createdBy = context?.createdBy || `connector:${this.id}:${input.source}`;

    // Helper for strict non-coercion number validation
    const requireNumber = (val: unknown, fieldName: string): number => {
      if (val === undefined || val === null) {
        throw new NormalizationError(`Missing required numeric field '${fieldName}' in payload.`, {
          code: 'MISSING_FIELD',
          connectorId: this.id,
          field: fieldName,
        });
      }
      if (typeof val === 'string') {
        throw new NormalizationError(
          `Field '${fieldName}' must be a number, not a string (received: "${val}"). Coercion is forbidden.`,
          {
            code: 'INVALID_NUMERIC_VALUE',
            connectorId: this.id,
            field: fieldName,
            received: val,
          }
        );
      }
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val) || val < 0) {
        throw new NormalizationError(
          `Field '${fieldName}' must be a non-negative finite number (received: ${val}).`,
          {
            code: 'INVALID_NUMERIC_VALUE',
            connectorId: this.id,
            field: fieldName,
            received: val,
          }
        );
      }
      return val;
    };

    // Construct canonical event payload based on type
    let normalizedPayload: Record<string, unknown>;
    let entityId = externalId;

    switch (canonicalType) {
      case 'deal_accepted': {
        const rawVal = rawPayload.final_value ?? rawPayload.value ?? rawPayload.amount;
        const finalVal = requireNumber(rawVal, 'final_value');
        const dealId = (rawPayload.deal_id || externalId) as string;
        entityId = dealId;

        normalizedPayload = {
          deal_id: dealId,
          final_value: finalVal,
          close_date: (rawPayload.close_date as string) || createdAt.split('T')[0],
          sla_commitments: Array.isArray(rawPayload.sla_commitments)
            ? rawPayload.sla_commitments
            : ['99.9% uptime SLA'],
        };
        break;
      }

      case 'deal_created': {
        const rawVal = rawPayload.contract_value ?? rawPayload.value ?? rawPayload.amount;
        const contractVal = requireNumber(rawVal, 'contract_value');
        const dealId = (rawPayload.deal_id || externalId) as string;
        entityId = dealId;

        normalizedPayload = {
          deal_id: dealId,
          deal_name: (rawPayload.deal_name as string) || `Deal ${dealId}`,
          customer_id: (rawPayload.customer_id as string) || `cust-${dealId}`,
          contract_value: contractVal,
          expected_close_date: (rawPayload.expected_close_date as string) || createdAt.split('T')[0],
          requested_features: Array.isArray(rawPayload.requested_features) ? rawPayload.requested_features : [],
        };
        break;
      }

      case 'budget_changed': {
        const prev = requireNumber(
          rawPayload.previous_budget ?? rawPayload.previousBudget,
          'previous_budget'
        );
        const next = requireNumber(
          rawPayload.new_budget ?? rawPayload.newBudget ?? rawPayload.value,
          'new_budget'
        );
        const targetDept = (rawPayload.department || department) as DepartmentCode;
        entityId = `budget-${targetDept}`;

        normalizedPayload = {
          department: targetDept,
          previous_budget: prev,
          new_budget: next,
          fiscal_period: (rawPayload.fiscal_period as string) || 'Q3-2026',
          rationale: (rawPayload.rationale as string) || `Budget updated via ${input.source}`,
        };
        break;
      }

      case 'capacity_changed': {
        const teamId = (rawPayload.team_id || externalId) as string;
        const prev = requireNumber(
          rawPayload.previous_capacity_hours ?? rawPayload.previousCapacity,
          'previous_capacity_hours'
        );
        const next = requireNumber(
          rawPayload.new_capacity_hours ?? rawPayload.newCapacity ?? rawPayload.value,
          'new_capacity_hours'
        );
        entityId = teamId;

        normalizedPayload = {
          team_id: teamId,
          previous_capacity_hours: prev,
          new_capacity_hours: next,
          effective_date: (rawPayload.effective_date as string) || createdAt.split('T')[0],
        };
        break;
      }

      case 'feature_committed': {
        const featureId = (rawPayload.feature_id || externalId) as string;
        const hours = requireNumber(
          rawPayload.committed_capacity_hours ?? rawPayload.committedCapacityHours ?? rawPayload.value,
          'committed_capacity_hours'
        );
        entityId = featureId;

        normalizedPayload = {
          feature_id: featureId,
          sprint_target: (rawPayload.sprint_target as string) || 'Sprint 42',
          committed_capacity_hours: hours,
        };
        break;
      }

      default: {
        // Fallback for other valid ImpactMesh event types
        normalizedPayload = { ...rawPayload };
        if (rawPayload.id) {
          entityId = rawPayload.id as string;
        }
        break;
      }
    }

    const decisionEvent: DecisionEvent = {
      id: `gen-evt-${externalId}-${Date.now().toString(36)}`,
      organization_id: orgId,
      department,
      event_type: canonicalType as ImpactMeshEventType,
      entity_id: entityId,
      payload: normalizedPayload as any,
      created_by: createdBy,
      created_at: createdAt,
      source_metadata: {
        source: input.source,
        externalId,
        eventType: rawEventType,
        receivedAt: new Date().toISOString(),
        occurredAt: input.occurredAt,
        metadata: input.metadata,
      },
    };

    return [decisionEvent];
  }

  public async healthCheck(): Promise<ConnectorHealth> {
    return {
      status: 'healthy',
      message: 'Generic enterprise webhook adapter ready.',
      timestamp: new Date().toISOString(),
      details: {
        supportedEventTypes: Object.keys(EVENT_DEPARTMENT_DEFAULT),
      },
    };
  }
}

export const genericWebhookConnector = new GenericWebhookConnector();
