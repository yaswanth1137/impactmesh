/**
 * IMPACTMESH - Salesforce Connector
 * Contract-level input adapter for Salesforce CRM Opportunity business events.
 *
 * PRODUCTION ARCHITECTURE NOTE:
 * In a production deployment, this connector would sit behind:
 * 1. Salesforce Connected App OAuth 2.0 JWT Bearer Token / Web Server Flow.
 * 2. Signature verification (Salesforce Outbound Message HMAC-SHA256 or Apex Webhook secret).
 * 3. Salesforce Pub/Sub API (gRPC) or Change Data Capture (CDC) streaming event bus.
 *
 * This implementation provides the contract and deterministic normalization layer.
 * It strictly enforces data types and rejects invalid external payloads without side-effects.
 *
 * FIELD MAPPING CONTRACT:
 * ─────────────────────────────────────────────────────────────────────────────
 * Salesforce Field              │ IMPACTMESH Canonical Field
 * ──────────────────────────────┼──────────────────────────────────────────────
 * id / Id                       │ entity_id & payload.deal_id
 * name / Name                   │ source_metadata.dealName (& payload.deal_name if deal_created)
 * amount / Amount               │ payload.final_value (deal_accepted) or contract_value (deal_created)
 * stage / StageName             │ Determines event_type:
 *                               │   - "Closed Won"  → "deal_accepted"
 *                               │   - "Prospecting" → "deal_created"
 * closeDate / CloseDate         │ payload.close_date or expected_close_date
 * accountId / AccountId         │ payload.customer_id
 * sla_commitments (Custom)      │ payload.sla_commitments
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { DecisionEvent } from '../../../src/types/events.ts';
import {
  type Connector,
  type ConnectorHealth,
  type NormalizationContext,
  NormalizationError,
} from '../connector.interface.ts';

export interface SalesforceOpportunityPayload {
  id?: string;
  Id?: string;
  type?: string;
  name?: string;
  Name?: string;
  stage?: string;
  StageName?: string;
  amount?: unknown;
  Amount?: unknown;
  closeDate?: string;
  CloseDate?: string;
  accountId?: string;
  AccountId?: string;
  sla_commitments?: string[];
  attributes?: {
    type?: string;
    url?: string;
  };
  [key: string]: unknown;
}

export class SalesforceConnector implements Connector<SalesforceOpportunityPayload> {
  public readonly id = 'salesforce';
  public readonly name = 'Salesforce CRM Connector';
  public readonly source = 'salesforce';
  public readonly version = '1.0.0';

  /**
   * Identifies if incoming payload originates from Salesforce Opportunity schema.
   */
  public canHandle(input: unknown): boolean {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return false;
    }

    const obj = input as Record<string, unknown>;

    // 1. Explicit type field
    if (obj.type === 'Opportunity' || obj.type === 'opportunity') {
      return true;
    }

    // 2. Salesforce attributes wrapper
    if (
      obj.attributes &&
      typeof obj.attributes === 'object' &&
      (obj.attributes as Record<string, unknown>).type === 'Opportunity'
    ) {
      return true;
    }

    // 3. Salesforce standard prefix (006 is standard Salesforce Opportunity key prefix)
    const rawId = obj.id || obj.Id;
    if (typeof rawId === 'string' && rawId.startsWith('006')) {
      return true;
    }

    // 4. Characteristic fields matching SFDC Opportunity
    const hasStage = typeof (obj.stage || obj.StageName) === 'string';
    const hasAmount = obj.amount !== undefined || obj.Amount !== undefined;
    if (hasStage && hasAmount && (obj.name || obj.Name || obj.id || obj.Id)) {
      return true;
    }

    return false;
  }

  /**
   * Normalizes Salesforce Opportunity into canonical DecisionEvent.
   * Strictly validates numeric values without silent string coercion.
   */
  public normalize(
    input: SalesforceOpportunityPayload,
    context?: NormalizationContext
  ): DecisionEvent[] {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new NormalizationError('Salesforce payload must be a non-null object.', {
        code: 'INVALID_PAYLOAD',
        connectorId: this.id,
        received: input,
      });
    }

    const rawAmount = input.amount !== undefined ? input.amount : input.Amount;
    // CRITICAL: Reject string coercion! "5000000" must be rejected, not silently parsed.
    if (typeof rawAmount === 'string') {
      throw new NormalizationError(
        `Salesforce amount must be a number, not a string (received: "${rawAmount}"). Coercion is forbidden.`,
        {
          code: 'INVALID_NUMERIC_VALUE',
          connectorId: this.id,
          field: 'amount',
          received: rawAmount,
        }
      );
    }

    const rawIdCandidate = input.id ?? input.Id;
    if (rawIdCandidate === undefined || rawIdCandidate === null) {
      throw new NormalizationError('Salesforce Opportunity missing required field: id/Id.', {
        code: 'MISSING_FIELD',
        connectorId: this.id,
        field: 'id',
      });
    }

    const rawId = String(rawIdCandidate).trim();
    if (rawId === '') {
      throw new NormalizationError('Salesforce Opportunity id cannot be empty.', {
        code: 'EMPTY_ENTITY_ID',
        connectorId: this.id,
        field: 'id',
        received: rawIdCandidate,
      });
    }

    const stage = (input.stage ?? input.StageName)?.toString().trim();
    if (!stage) {
      throw new NormalizationError('Salesforce Opportunity missing required field: stage/StageName.', {
        code: 'MISSING_FIELD',
        connectorId: this.id,
        field: 'stage',
      });
    }

    if (rawAmount === undefined || rawAmount === null) {
      throw new NormalizationError('Salesforce Opportunity missing required field: amount/Amount.', {
        code: 'MISSING_FIELD',
        connectorId: this.id,
        field: 'amount',
      });
    }

    if (typeof rawAmount !== 'number' || isNaN(rawAmount) || !isFinite(rawAmount) || rawAmount < 0) {
      throw new NormalizationError(
        `Salesforce amount must be a valid non-negative number (received: ${rawAmount}).`,
        {
          code: 'INVALID_NUMERIC_VALUE',
          connectorId: this.id,
          field: 'amount',
          received: rawAmount,
        }
      );
    }

    const rawCloseDate = input.closeDate ?? input.CloseDate;
    if (rawCloseDate !== undefined && isNaN(Date.parse(String(rawCloseDate)))) {
      throw new NormalizationError(`Invalid date format for closeDate: "${rawCloseDate}".`, {
        code: 'INVALID_DATE',
        connectorId: this.id,
        field: 'closeDate',
        received: rawCloseDate,
      });
    }

    const dealName = (input.name ?? input.Name ?? `Opportunity ${rawId}`).toString();
    const closeDate = (rawCloseDate ?? new Date().toISOString().split('T')[0]).toString();
    const orgId = context?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const createdAt = context?.timestamp || new Date().toISOString();
    const createdBy = context?.createdBy || `connector:${this.id}`;
    const sanitizedId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const actor = (input.actor || input.createdBy) as string | undefined;

    const normalizedStage = stage.toLowerCase().replace(/[-_]/g, ' ');

    const eventId = context?.deterministicId
      ? `sfdc-evt-${sanitizedId}`
      : `sfdc-evt-${rawId}-${Date.now().toString(36)}`;

    if (normalizedStage === 'closed won') {
      const decisionEvent: DecisionEvent<'deal_accepted'> = {
        id: eventId,
        organization_id: orgId,
        department: 'sales',
        event_type: 'deal_accepted',
        entity_id: rawId,
        payload: {
          deal_id: rawId,
          final_value: rawAmount,
          close_date: closeDate,
          sla_commitments: input.sla_commitments || [
            '99.9% uptime SLA',
            '4h critical incident response',
          ],
        },
        created_by: createdBy,
        created_at: createdAt,
        source_metadata: {
          source: this.source,
          sourceSystem: 'salesforce',
          sourceEventId: rawId,
          externalId: rawId,
          eventType: 'Opportunity:Closed Won',
          receivedAt: new Date().toISOString(),
          actor,
          organizationId: orgId,
          entity: rawId,
          entityId: rawId,
          dealName,
          stage,
          contractAmount: rawAmount,
        },
      };

      return [decisionEvent];
    }

    // Default to deal_created for open stages (e.g. Prospecting, Qualification, Proposal)
    const accountId = (input.accountId ?? input.AccountId ?? `cust-${rawId}`).toString();

    const decisionEvent: DecisionEvent<'deal_created'> = {
      id: eventId,
      organization_id: orgId,
      department: 'sales',
      event_type: 'deal_created',
      entity_id: rawId,
      payload: {
        deal_id: rawId,
        deal_name: dealName,
        customer_id: accountId,
        contract_value: rawAmount,
        expected_close_date: closeDate,
      },
      created_by: createdBy,
      created_at: createdAt,
      source_metadata: {
        source: this.source,
        sourceSystem: 'salesforce',
        sourceEventId: rawId,
        externalId: rawId,
        eventType: `Opportunity:${stage}`,
        receivedAt: new Date().toISOString(),
        actor,
        organizationId: orgId,
        entity: rawId,
        entityId: rawId,
        dealName,
        stage,
        contractAmount: rawAmount,
      },
    };

    return [decisionEvent];
  }

  public async healthCheck(): Promise<ConnectorHealth> {
    return {
      status: 'healthy',
      message: 'Salesforce contract adapter ready.',
      timestamp: new Date().toISOString(),
      details: {
        supportedTypes: ['Opportunity'],
        stageMappings: {
          'Closed Won': 'deal_accepted',
          '*': 'deal_created',
        },
      },
    };
  }
}

export const salesforceConnector = new SalesforceConnector();
