/**
 * IMPACTMESH - Connector API Routes Integration Tests
 * Verifies Phase 6:
 *   - POST /api/connectors/webhook
 *   - POST /api/connectors/n8n
 *   - GET  /api/connectors/health
 *
 * Checks:
 *   - request validation (missing payload, non-object, invalid formats)
 *   - status codes (200, 400, 409)
 *   - normalization & source traceability (source_metadata preserved)
 *   - idempotency & deduplication
 *   - end-to-end ingestion into StateTransitionEngine & EventStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleWebhookIngestion,
  handleN8nIngestion,
  handleConnectorHealth,
} from '../../server/api/connector-routes.ts';
import { eventStore } from '../../server/services/event-store/event-store.service.ts';
import type { BusinessState } from '../../src/types/domain.ts';

describe('Connector API Routes (POST /api/connectors/webhook, POST /api/connectors/n8n)', () => {
  const TEST_ORG_ID = 'test-org-routes-001';

  const getFreshState = (): BusinessState => ({
    id: 'state-routes-base',
    organization_id: TEST_ORG_ID,
    timestamp: '2026-09-10T10:00:00Z',
    metrics: {
      available_budget: 1800000,
      committed_budget: 1100000,
      revenue_pipeline: 0,
      committed_revenue: 0,
      engineering_capacity: 420,
      engineering_demand: 0,
      capacity_utilization: 0,
      budget_pressure: 0.61,
      risk_score: 0.28,
      business_health: 84,
    },
    state_hash: 'hash-routes-base',
    last_event_id: null,
    created_at: '2026-09-10T10:00:00Z',
  });

  beforeEach(() => {
    eventStore.clearOrg(TEST_ORG_ID);
  });

  // ===========================================================================
  // 1. GENERIC WEBHOOK ROUTE (POST /api/connectors/webhook)
  // ===========================================================================
  describe('POST /api/connectors/webhook', () => {
    it('successfully processes, normalizes, and ingests a valid webhook payload', async () => {
      const payload = {
        source: 'jira-webhook',
        eventType: 'feature_committed',
        externalId: 'JIRA-SEC-101',
        payload: {
          feature_id: 'ent-feat-sso',
          committed_capacity_hours: 420,
          feature_count: 3,
        },
      };

      const response = await handleWebhookIngestion({
        body: payload,
        currentState: getFreshState(),
        context: { organizationId: TEST_ORG_ID },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const successBody = response.body as any;
      expect(successBody.eventsProcessed).toBe(1);
      expect(successBody.events[0].event_type).toBe('feature_committed');
      expect(successBody.events[0].source_metadata.source).toBe('jira-webhook');
      expect(successBody.events[0].source_metadata.externalId).toBe('JIRA-SEC-101');

      // Verify deterministic state transition
      const nextState = successBody.results[0].nextState;
      expect(nextState.metrics.engineering_demand).toBe(420);
      expect(nextState.metrics.capacity_utilization).toBe(100);
      expect(nextState.metrics.committed_features_count).toBe(3);
    });

    it('rejects null or undefined payload with 400 PAYLOAD_REQUIRED', async () => {
      const response = await handleWebhookIngestion({
        body: null,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect((response.body as any).code).toBe('PAYLOAD_REQUIRED');
    });

    it('rejects non-object payload (e.g. string or array) with 400 INVALID_PAYLOAD', async () => {
      const response = await handleWebhookIngestion({
        body: 'invalid-string-body',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect((response.body as any).code).toBe('INVALID_PAYLOAD');
    });

    it('rejects webhook missing required externalId with 400 MISSING_FIELD', async () => {
      const payload = {
        source: 'jira',
        eventType: 'feature_committed',
        // externalId missing
        payload: {
          feature_id: 'FEAT-1',
          committed_capacity_hours: 100,
        },
      };

      const response = await handleWebhookIngestion({
        body: payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect((response.body as any).code).toBe('MISSING_FIELD');
      expect((response.body as any).field).toBe('externalId');
    });

    it('rejects non-numeric numeric field without silent string coercion', async () => {
      const payload = {
        source: 'custom-erp',
        eventType: 'capacity_changed',
        externalId: 'ERP-CAP-99',
        payload: {
          team_id: 'ent-res-eng',
          previous_capacity_hours: 420,
          new_capacity_hours: 'three hundred', // invalid string
        },
      };

      const response = await handleWebhookIngestion({
        body: payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect((response.body as any).code).toBe('INVALID_NUMERIC_VALUE');
    });

    it('enforces idempotency on duplicate webhook submission', async () => {
      const payload = {
        source: 'jira-webhook',
        eventType: 'feature_committed',
        externalId: 'JIRA-IDEM-001',
        payload: {
          feature_id: 'ent-feat-sso',
          committed_capacity_hours: 200,
          feature_count: 1,
        },
      };

      const initial = getFreshState();

      // First submission
      const res1 = await handleWebhookIngestion({
        body: payload,
        currentState: initial,
        context: { organizationId: TEST_ORG_ID },
      });
      expect(res1.statusCode).toBe(200);
      expect((res1.body as any).idempotent).toBe(false);

      const stateAfterFirst = (res1.body as any).results[0].nextState;

      // Duplicate submission
      const res2 = await handleWebhookIngestion({
        body: payload,
        currentState: stateAfterFirst,
        context: { organizationId: TEST_ORG_ID },
      });
      expect(res2.statusCode).toBe(200);
      expect((res2.body as any).idempotent).toBe(true);
      expect((res2.body as any).results[0].nextState.metrics.engineering_demand).toBe(200);
    });
  });

  // ===========================================================================
  // 2. N8N WEBHOOK ROUTE (POST /api/connectors/n8n)
  // ===========================================================================
  describe('POST /api/connectors/n8n', () => {
    it('successfully processes and ingests an n8n deal_accepted workflow event', async () => {
      const n8nPayload = {
        source: 'n8n',
        event: 'deal_accepted',
        workflow_id: 'wf-apex-deal',
        execution_id: 'exec-88992',
        deal_id: 'DEAL-APEX-50L',
        value: 5000000,
        department: 'sales',
      };

      const response = await handleN8nIngestion({
        body: n8nPayload,
        currentState: getFreshState(),
        context: { organizationId: TEST_ORG_ID },
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const body = response.body as any;
      expect(body.eventsProcessed).toBe(1);
      expect(body.events[0].event_type).toBe('deal_accepted');
      expect(body.events[0].source_metadata.source).toBe('n8n');
      expect(body.events[0].source_metadata.executionId).toBe('exec-88992');

      const nextState = body.results[0].nextState;
      expect(nextState.metrics.committed_revenue).toBe(5000000);
    });

    it('rejects malformed n8n payload missing event identifier', async () => {
      const n8nPayload = {
        source: 'n8n',
        // missing event
        workflow_id: 'wf-broken',
      };

      const response = await handleN8nIngestion({
        body: n8nPayload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect((response.body as any).code).toBe('MISSING_FIELD');
    });

    it('rejects unknown n8n event type without silent coercion', async () => {
      const n8nPayload = {
        source: 'n8n',
        event: 'completely_unknown_event_type',
        workflow_id: 'wf-test',
        id: 'evt-1',
      };

      const response = await handleN8nIngestion({
        body: n8nPayload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(['UNSUPPORTED_EVENT_TYPE', 'UNKNOWN_EVENT_TYPE']).toContain((response.body as any).code);
    });
  });

  // ===========================================================================
  // 3. CONNECTOR HEALTH ROUTE (GET /api/connectors/health)
  // ===========================================================================
  describe('GET /api/connectors/health', () => {
    it('reports health status across all registered connectors', async () => {
      const response = await handleConnectorHealth();
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const body = response.body as any;
      expect(body.totalConnectors).toBeGreaterThanOrEqual(3);
      expect(body.connectors.salesforce).toBeDefined();
      expect(body.connectors.salesforce.status).toBe('healthy');
      expect(body.connectors.n8n).toBeDefined();
      expect(body.connectors['generic-webhook']).toBeDefined();
    });
  });
});
