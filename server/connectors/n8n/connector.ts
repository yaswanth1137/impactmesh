/**
 * IMPACTMESH - n8n Webhook Connector
 * Input adapter for n8n automation workflows, transforming external webhook payloads
 * into canonical IMPACTMESH DecisionEvents.
 *
 * PRODUCTION ARCHITECTURE NOTE:
 * In a production deployment, this connector would verify:
 * 1. n8n Header Authentication (X-N8N-Webhook-Secret / Bearer Token).
 * 2. HMAC-SHA256 signature verification over the raw JSON payload.
 * 3. Rate limiting and replay protection based on n8n executionId.
 */

import type { DecisionEvent, DepartmentCode } from '../../../src/types/events.ts';
import {
  type Connector,
  type ConnectorHealth,
  type NormalizationContext,
  NormalizationError,
} from '../connector.interface.ts';

export interface N8NWebhookPayload {
  event?: string;
  id?: string;
  value?: unknown;
  department?: string;
  timestamp?: string;
  workflow_id?: string;
  workflowId?: string;
  execution_id?: string;
  executionId?: string;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  source?: string;
  // Specific event fields
  deal_id?: string;
  deal_name?: string;
  customer_id?: string;
  contract_value?: unknown;
  previous_budget?: unknown;
  new_budget?: unknown;
  previous_capacity?: unknown;
  new_capacity?: unknown;
  previous_capacity_hours?: unknown;
  new_capacity_hours?: unknown;
  team_id?: string;
  feature_id?: string;
  committed_capacity_hours?: unknown;
  [key: string]: unknown;
}

export class N8NConnector implements Connector<N8NWebhookPayload> {
  public readonly id = 'n8n';
  public readonly name = 'n8n Automation Connector';
  public readonly source = 'n8n';
  public readonly version = '1.0.0';

  /**
   * Identifies if incoming payload originates from an n8n workflow webhook.
   */
  public canHandle(input: unknown): boolean {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return false;
    }

    const obj = input as Record<string, unknown>;

    // 1. Explicit source marker
    if (obj.source === 'n8n' || obj.origin === 'n8n') {
      return true;
    }

    // 2. Characteristic n8n execution markers
    if (obj.workflow_id || obj.workflowId || obj.execution_id || obj.executionId) {
      return true;
    }

    // 3. n8n dotted event syntax: "deal.accepted", "budget.changed", "capacity.changed"
    if (typeof obj.event === 'string' && obj.event.includes('.')) {
      const parts = obj.event.split('.');
      if (['deal', 'budget', 'capacity', 'feature', 'customer', 'inventory'].includes(parts[0])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Normalizes n8n webhook payload into canonical DecisionEvents.
   * Strictly enforces numeric types without string coercion.
   */
  public normalize(
    input: N8NWebhookPayload,
    context?: NormalizationContext
  ): DecisionEvent[] {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new NormalizationError('n8n payload must be a non-null object.', {
        code: 'INVALID_PAYLOAD',
        connectorId: this.id,
        received: input,
      });
    }

    const rawEvent = input.event;
    if (!rawEvent || typeof rawEvent !== 'string' || rawEvent.trim() === '') {
      throw new NormalizationError('n8n webhook missing required field: event.', {
        code: 'MISSING_FIELD',
        connectorId: this.id,
        field: 'event',
      });
    }

    const rawIdCandidate = input.id ?? input.deal_id ?? input.execution_id ?? input.executionId;
    if (rawIdCandidate === undefined || rawIdCandidate === null) {
      throw new NormalizationError('n8n webhook missing identifier (id, deal_id, or execution_id).', {
        code: 'MISSING_FIELD',
        connectorId: this.id,
        field: 'id',
      });
    }

    const rawId = String(rawIdCandidate).trim();
    if (rawId === '') {
      throw new NormalizationError('n8n webhook identifier cannot be empty.', {
        code: 'EMPTY_ENTITY_ID',
        connectorId: this.id,
        field: 'id',
        received: rawIdCandidate,
      });
    }

    if (input.timestamp !== undefined && isNaN(Date.parse(String(input.timestamp)))) {
      throw new NormalizationError(`Invalid date format for timestamp: "${input.timestamp}".`, {
        code: 'INVALID_DATE',
        connectorId: this.id,
        field: 'timestamp',
        received: input.timestamp,
      });
    }

    const orgId = context?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const createdAt = input.timestamp && !isNaN(Date.parse(input.timestamp))
      ? input.timestamp
      : (context?.timestamp || new Date().toISOString());
    const createdBy = context?.createdBy || `connector:${this.id}`;

    const normalizedEventType = rawEvent.toLowerCase().trim();

    // Helper for strict numeric verification (rejects strings without coercion)
    const requireNumber = (val: unknown, fieldName: string): number => {
      if (val === undefined || val === null) {
        throw new NormalizationError(`Missing required numeric field: ${fieldName}.`, {
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

    const sanitizedId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const actor = (input.actor || input.user || (input.data as any)?.user) as string | undefined;

    const eventId = context?.deterministicId
      ? `n8n-evt-${sanitizedId}`
      : `n8n-evt-${rawId}-${Date.now().toString(36)}`;

    // 1. DEAL ACCEPTED
    if (
      normalizedEventType === 'deal.accepted' ||
      normalizedEventType === 'deal_accepted' ||
      normalizedEventType === 'deal.closed_won'
    ) {
      const dealId = input.deal_id || rawId;
      const rawVal = input.value !== undefined
        ? input.value
        : (input.final_value ?? input.amount ?? input.contract_value);
      const valField = input.value !== undefined ? 'value' : 'final_value';
      const finalValue = requireNumber(rawVal, valField);

      const decisionEvent: DecisionEvent<'deal_accepted'> = {
        id: eventId,
        organization_id: orgId,
        department: 'sales',
        event_type: 'deal_accepted',
        entity_id: dealId,
        payload: {
          deal_id: dealId,
          final_value: finalValue,
          close_date: createdAt.split('T')[0],
          sla_commitments: [
            '99.9% uptime SLA',
            'Dedicated Technical Account Manager',
          ],
        },
        created_by: createdBy,
        created_at: createdAt,
        source_metadata: {
          source: this.source,
          sourceSystem: 'n8n',
          sourceEventId: rawId,
          externalId: rawId,
          eventType: rawEvent,
          receivedAt: new Date().toISOString(),
          actor,
          organizationId: orgId,
          entity: dealId,
          entityId: dealId,
          workflowId: input.workflow_id || input.workflowId,
          executionId: input.execution_id || input.executionId,
        },
      };

      return [decisionEvent];
    }

    // 2. BUDGET CHANGED
    if (normalizedEventType === 'budget.changed' || normalizedEventType === 'budget_changed') {
      const dept = (input.department || 'finance') as DepartmentCode;
      const prevBudget = requireNumber(
        input.previous_budget ?? input.payload?.previous_budget ?? input.data?.previous_budget,
        'previous_budget'
      );
      const nextBudget = requireNumber(
        input.new_budget ?? input.value ?? input.payload?.new_budget ?? input.data?.new_budget,
        'new_budget'
      );
      const entityId = `budget-${dept}`;

      const decisionEvent: DecisionEvent<'budget_changed'> = {
        id: eventId,
        organization_id: orgId,
        department: 'finance',
        event_type: 'budget_changed',
        entity_id: entityId,
        payload: {
          department: dept,
          previous_budget: prevBudget,
          new_budget: nextBudget,
          fiscal_period: (input.payload?.fiscal_period || input.fiscal_period || 'Q3-2026') as string,
          rationale: 'Adjusted via n8n automated budget workflow',
        },
        created_by: createdBy,
        created_at: createdAt,
        source_metadata: {
          source: this.source,
          sourceSystem: 'n8n',
          sourceEventId: rawId,
          externalId: rawId,
          eventType: rawEvent,
          receivedAt: new Date().toISOString(),
          actor,
          organizationId: orgId,
          entity: entityId,
          entityId,
          workflowId: input.workflow_id || input.workflowId,
          executionId: input.execution_id || input.executionId,
        },
      };

      return [decisionEvent];
    }

    // 3. CAPACITY CHANGED
    if (normalizedEventType === 'capacity.changed' || normalizedEventType === 'capacity_changed') {
      const teamId = input.team_id || (input.payload?.team_id as string) || 'team-eng-core';
      const prevCapacity = requireNumber(
        input.previous_capacity_hours ?? input.previous_capacity ?? input.payload?.previous_capacity_hours,
        'previous_capacity_hours'
      );
      const nextCapacity = requireNumber(
        input.new_capacity_hours ?? input.new_capacity ?? input.value ?? input.payload?.new_capacity_hours,
        'new_capacity_hours'
      );

      const decisionEvent: DecisionEvent<'capacity_changed'> = {
        id: eventId,
        organization_id: orgId,
        department: 'engineering',
        event_type: 'capacity_changed',
        entity_id: teamId,
        payload: {
          team_id: teamId,
          previous_capacity_hours: prevCapacity,
          new_capacity_hours: nextCapacity,
          effective_date: createdAt.split('T')[0],
        },
        created_by: createdBy,
        created_at: createdAt,
        source_metadata: {
          source: this.source,
          sourceSystem: 'n8n',
          sourceEventId: rawId,
          externalId: rawId,
          eventType: rawEvent,
          receivedAt: new Date().toISOString(),
          actor,
          organizationId: orgId,
          entity: teamId,
          entityId: teamId,
          workflowId: input.workflow_id || input.workflowId,
          executionId: input.execution_id || input.executionId,
        },
      };

      return [decisionEvent];
    }

    // 4. FEATURE COMMITTED
    if (normalizedEventType === 'feature.committed' || normalizedEventType === 'feature_committed') {
      const featureId = input.feature_id || (input.payload?.feature_id as string) || rawId;
      const hours = requireNumber(
        input.committed_capacity_hours ?? input.value ?? input.payload?.committed_capacity_hours,
        'committed_capacity_hours'
      );

      const count = input.feature_count ?? input.payload?.feature_count;

      const decisionEvent: DecisionEvent<'feature_committed'> = {
        id: eventId,
        organization_id: orgId,
        department: 'product',
        event_type: 'feature_committed',
        entity_id: featureId,
        payload: {
          feature_id: featureId,
          sprint_target: (input.payload?.sprint_target || 'Sprint 42') as string,
          committed_capacity_hours: hours,
          ...(count !== undefined ? { feature_count: Number(count) } : {}),
        },
        created_by: createdBy,
        created_at: createdAt,
        source_metadata: {
          source: this.source,
          sourceSystem: 'n8n',
          sourceEventId: rawId,
          externalId: rawId,
          eventType: rawEvent,
          receivedAt: new Date().toISOString(),
          actor,
          organizationId: orgId,
          entity: featureId,
          entityId: featureId,
          workflowId: input.workflow_id || input.workflowId,
          executionId: input.execution_id || input.executionId,
        },
      };

      return [decisionEvent];
    }

    throw new NormalizationError(
      `Unsupported n8n event type: '${rawEvent}'. Supported: deal.accepted, budget.changed, capacity.changed, feature.committed.`,
      {
        code: 'UNSUPPORTED_EVENT_TYPE',
        connectorId: this.id,
        received: rawEvent,
      }
    );
  }

  public async healthCheck(): Promise<ConnectorHealth> {
    return {
      status: 'healthy',
      message: 'n8n webhook integration adapter ready.',
      timestamp: new Date().toISOString(),
      details: {
        supportedEvents: [
          'deal.accepted',
          'budget.changed',
          'capacity.changed',
          'feature.committed',
        ],
      },
    };
  }
}

export const n8nConnector = new N8NConnector();
