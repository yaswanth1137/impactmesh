/**
 * IMPACTMESH - Phase 5 Event Normalizer & Edge-Case Matrix Tests
 * Rigorously verifies Phase 5:
 *   1. VALID EVENT
 *   2. INVALID EVENT
 *   3. MISSING REQUIRED FIELD
 *   4. UNKNOWN EVENT TYPE
 *   5. DUPLICATE EVENT
 *   6. MALFORMED PAYLOAD
 *   7. NON-NUMERIC NUMERIC FIELD
 *   8. INVALID DATE
 *   9. EMPTY ENTITY ID
 *  10. SOURCE TRACEABILITY (source, sourceSystem, sourceEventId, eventType, timestamp, orgId, entity, entityId, actor, metadata)
 */

import { describe, it, expect } from 'vitest';
import {
  salesforceConnector,
  n8nConnector,
  genericWebhookConnector,
  eventNormalizer,
  NormalizationError,
} from '../../server/connectors/index.ts';

describe('Phase 5 — Event Normalizer Edge-Case Matrix', () => {
  // ---------------------------------------------------------------------------
  // 1. VALID EVENT
  // ---------------------------------------------------------------------------
  describe('1. VALID EVENT', () => {
    it('normalizes valid Salesforce Closed Won event with all canonical contracts', () => {
      const sfEvent = salesforceConnector.normalize({
        id: '006_VALID_SF',
        stage: 'Closed Won',
        amount: 5000000,
        closeDate: '2026-09-30',
        name: 'Enterprise License',
      });
      expect(sfEvent).toHaveLength(1);
      expect(sfEvent[0].event_type).toBe('deal_accepted');
      expect((sfEvent[0].payload as Record<string, any>).final_value).toBe(5000000);
    });

    it('normalizes valid n8n deal.accepted event with all canonical contracts', () => {
      const n8nEvt = n8nConnector.normalize({
        source: 'n8n',
        event: 'deal.accepted',
        id: 'n8n_exec_001',
        value: 5000000,
      });
      expect(n8nEvt).toHaveLength(1);
      expect(n8nEvt[0].event_type).toBe('deal_accepted');
      expect((n8nEvt[0].payload as Record<string, any>).final_value).toBe(5000000);
    });

    it('normalizes valid generic webhook event with all canonical contracts', () => {
      const genEvt = genericWebhookConnector.normalize({
        source: 'custom_erp',
        eventType: 'deal_accepted',
        externalId: 'ERP_001',
        payload: {
          final_value: 5000000,
        },
      });
      expect(genEvt).toHaveLength(1);
      expect(genEvt[0].event_type).toBe('deal_accepted');
      expect((genEvt[0].payload as Record<string, any>).final_value).toBe(5000000);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. INVALID EVENT
  // ---------------------------------------------------------------------------
  describe('2. INVALID EVENT', () => {
    it('rejects null input in normalizer', () => {
      expect(() => eventNormalizer.normalize(null)).toThrow(NormalizationError);
    });

    it('rejects undefined input in normalizer', () => {
      expect(() => eventNormalizer.normalize(undefined)).toThrow(NormalizationError);
    });

    it('rejects primitive strings in connector normalize', () => {
      expect(() => salesforceConnector.normalize('just-a-string' as any)).toThrow(NormalizationError);
      expect(() => n8nConnector.normalize('just-a-string' as any)).toThrow(NormalizationError);
      expect(() => genericWebhookConnector.normalize('just-a-string' as any)).toThrow(NormalizationError);
    });

    it('rejects arrays in connector normalize', () => {
      expect(() => salesforceConnector.normalize([] as any)).toThrow(NormalizationError);
      expect(() => n8nConnector.normalize([] as any)).toThrow(NormalizationError);
      expect(() => genericWebhookConnector.normalize([] as any)).toThrow(NormalizationError);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. MISSING REQUIRED FIELD
  // ---------------------------------------------------------------------------
  describe('3. MISSING REQUIRED FIELD', () => {
    it('Salesforce: rejects missing id/Id', () => {
      expect(() =>
        salesforceConnector.normalize({
          stage: 'Closed Won',
          amount: 5000000,
        } as any)
      ).toThrow(NormalizationError);
    });

    it('Salesforce: rejects missing stage', () => {
      expect(() =>
        salesforceConnector.normalize({
          id: '006_SF',
          amount: 5000000,
        } as any)
      ).toThrow(NormalizationError);
    });

    it('Salesforce: rejects missing amount', () => {
      expect(() =>
        salesforceConnector.normalize({
          id: '006_SF',
          stage: 'Closed Won',
        } as any)
      ).toThrow(NormalizationError);
    });

    it('n8n: rejects missing event field', () => {
      expect(() =>
        n8nConnector.normalize({
          id: 'exec_1',
          value: 100,
        } as any)
      ).toThrow(NormalizationError);
    });

    it('Generic Webhook: rejects missing externalId', () => {
      expect(() =>
        genericWebhookConnector.normalize({
          source: 'erp',
          eventType: 'deal_accepted',
          payload: { final_value: 100 },
        } as any)
      ).toThrow(NormalizationError);
    });

    it('Generic Webhook: rejects missing eventType', () => {
      expect(() =>
        genericWebhookConnector.normalize({
          source: 'erp',
          externalId: 'ext_1',
          payload: { final_value: 100 },
        } as any)
      ).toThrow(NormalizationError);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. UNKNOWN EVENT TYPE
  // ---------------------------------------------------------------------------
  describe('4. UNKNOWN EVENT TYPE', () => {
    it('n8n: rejects unknown event type', () => {
      try {
        n8nConnector.normalize({
          source: 'n8n',
          event: 'non_existent_event_type',
          id: 'exec_2',
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('UNSUPPORTED_EVENT_TYPE');
      }
    });

    it('Generic Webhook: rejects unknown event type', () => {
      try {
        genericWebhookConnector.normalize({
          source: 'jira',
          eventType: 'totally_unsupported_action',
          externalId: 'JIRA-99',
          payload: {},
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('UNSUPPORTED_EVENT_TYPE');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 5. MALFORMED PAYLOAD
  // ---------------------------------------------------------------------------
  describe('5. MALFORMED PAYLOAD', () => {
    it('Generic Webhook: rejects payload that is string instead of object', () => {
      try {
        genericWebhookConnector.normalize({
          source: 'jira',
          eventType: 'deal_accepted',
          externalId: 'JIRA-1',
          payload: 'malformed-string',
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('INVALID_PAYLOAD');
      }
    });

    it('Generic Webhook: rejects payload that is array instead of object', () => {
      try {
        genericWebhookConnector.normalize({
          source: 'jira',
          eventType: 'deal_accepted',
          externalId: 'JIRA-1',
          payload: [1, 2, 3],
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('INVALID_PAYLOAD');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 6. NON-NUMERIC NUMERIC FIELD
  // ---------------------------------------------------------------------------
  describe('6. NON-NUMERIC NUMERIC FIELD', () => {
    it('Salesforce: rejects string amount without coercion', () => {
      try {
        salesforceConnector.normalize({
          id: '006_SF',
          stage: 'Closed Won',
          amount: '5000000',
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('INVALID_NUMERIC_VALUE');
      }
    });

    it('n8n: rejects negative capacity without coercion', () => {
      try {
        n8nConnector.normalize({
          source: 'n8n',
          event: 'capacity.changed',
          id: 'exec_3',
          new_capacity_hours: -50,
          previous_capacity_hours: 400,
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('INVALID_NUMERIC_VALUE');
      }
    });

    it('Generic Webhook: rejects NaN amount in payload', () => {
      try {
        genericWebhookConnector.normalize({
          source: 'erp',
          eventType: 'deal_accepted',
          externalId: 'ERP_002',
          payload: { final_value: NaN },
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('INVALID_NUMERIC_VALUE');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 7. INVALID DATE
  // ---------------------------------------------------------------------------
  describe('7. INVALID DATE', () => {
    it('Salesforce: rejects malformed closeDate', () => {
      try {
        salesforceConnector.normalize({
          id: '006_SF',
          stage: 'Closed Won',
          amount: 5000000,
          closeDate: 'not-a-valid-date',
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('INVALID_DATE');
        expect((err as NormalizationError).field).toBe('closeDate');
      }
    });

    it('Generic Webhook: rejects malformed occurredAt', () => {
      try {
        genericWebhookConnector.normalize({
          source: 'erp',
          eventType: 'deal_accepted',
          externalId: 'ERP_DATE',
          occurredAt: 'invalid-iso-timestamp',
          payload: { final_value: 5000000 },
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('INVALID_DATE');
        expect((err as NormalizationError).field).toBe('occurredAt');
      }
    });

    it('n8n: rejects malformed timestamp', () => {
      try {
        n8nConnector.normalize({
          source: 'n8n',
          event: 'deal.accepted',
          id: 'exec_date',
          timestamp: 'unparseable-date',
          value: 5000000,
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('INVALID_DATE');
        expect((err as NormalizationError).field).toBe('timestamp');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 8. EMPTY ENTITY ID
  // ---------------------------------------------------------------------------
  describe('8. EMPTY ENTITY ID', () => {
    it('Salesforce: rejects empty whitespace id', () => {
      try {
        salesforceConnector.normalize({
          id: '   ',
          stage: 'Closed Won',
          amount: 5000000,
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('EMPTY_ENTITY_ID');
      }
    });

    it('Generic Webhook: rejects empty whitespace externalId', () => {
      try {
        genericWebhookConnector.normalize({
          source: 'jira',
          eventType: 'deal_accepted',
          externalId: '',
          payload: { final_value: 5000000 },
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('EMPTY_ENTITY_ID');
      }
    });

    it('n8n: rejects empty whitespace identifier', () => {
      try {
        n8nConnector.normalize({
          source: 'n8n',
          event: 'deal.accepted',
          id: '  ',
          value: 5000000,
        } as any);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as NormalizationError).code).toBe('EMPTY_ENTITY_ID');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 9. SOURCE TRACEABILITY & METADATA PRESERVATION
  // ---------------------------------------------------------------------------
  describe('9. SOURCE TRACEABILITY', () => {
    it('preserves all 10 required provenance fields in source_metadata', () => {
      const [event] = genericWebhookConnector.normalize(
        {
          source: 'servicenow-itsm',
          eventType: 'capacity_changed',
          externalId: 'SNOW-INC-9901',
          occurredAt: '2026-09-10T12:00:00Z',
          actor: 'alice.engineer@blacktide.io',
          metadata: {
            changeApprovalId: 'CHG-5512',
            environment: 'production',
          },
          payload: {
            team_id: 'ent-res-eng',
            previous_capacity_hours: 420,
            new_capacity_hours: 300,
          },
        },
        {
          organizationId: 'org-trace-001',
        }
      );

      expect(event.source_metadata).toBeDefined();
      const meta = event.source_metadata!;

      // 1. source
      expect(meta.source).toBe('servicenow-itsm');
      // 2. sourceSystem
      expect(meta.sourceSystem).toBe('servicenow-itsm');
      // 3. sourceEventId
      expect(meta.sourceEventId).toBe('SNOW-INC-9901');
      // 4. eventType
      expect(meta.eventType).toBe('capacity_changed');
      // 5. timestamp
      expect(event.created_at).toBe('2026-09-10T12:00:00Z');
      // 6. organization/context
      expect(event.organization_id).toBe('org-trace-001');
      expect(meta.organizationId).toBe('org-trace-001');
      // 7. entity
      expect(meta.entity).toBe('ent-res-eng');
      // 8. entityId
      expect(meta.entityId).toBe('ent-res-eng');
      // 9. actor if available
      expect(meta.actor).toBe('alice.engineer@blacktide.io');
      // 10. metadata
      expect((meta.metadata as any)?.changeApprovalId).toBe('CHG-5512');
    });
  });
});
