/**
 * IMPACTMESH - Connector Hub Test Suite
 * Validates external connector adapters, registry, normalization layer,
 * strict non-coercion numeric validation, and end-to-end event pipeline ingestion.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConnectorRegistry,
  connectorRegistry,
  EventNormalizer,
  eventNormalizer,
  NormalizationError,
  salesforceConnector,
  n8nConnector,
  genericWebhookConnector,
  mockSalesforceOpportunityClosedWon,
  mockSalesforceOpportunityProspecting,
  mockSalesforceOpportunityOutboundCDC,
  mockSalesforceOpportunityStringAmount,
  mockSalesforceOpportunityMalformed,
  mockN8nDealAccepted,
  mockN8nBudgetChanged,
  mockN8nCapacityChanged,
  mockN8nFeatureCommitted,
  mockN8nStringValue,
  mockN8nMalformed,
  mockGenericWebhookDealAccepted,
  mockGenericWebhookBudgetChanged,
  mockGenericWebhookCapacityChanged,
  mockGenericWebhookStringValue,
  mockGenericWebhookMalformed,
} from '../../server/connectors/index.ts';
import type { DecisionEvent } from '../../src/types/events.ts';
import { eventValidator } from '../../server/services/validation/event-validator.service.ts';
import { handleEventIngestion } from '../../server/api/event-routes.ts';
import { stateTransitionEngine } from '../../server/services/state-transition/state-transition.service.ts';
import type { BusinessState } from '../../src/types/domain.ts';

describe('IMPACTMESH Connector Hub', () => {
  // Baseline initial business state for pipeline compatibility testing
  const createInitialState = (): BusinessState => ({
    id: 'state-hub-init',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    timestamp: '2026-09-10T09:00:00Z',
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
    state_hash: 'init-hash',
    last_event_id: null,
    created_at: '2026-09-10T09:00:00Z',
  });

  // ===========================================================================
  // 1. SALESFORCE CONNECTOR TESTS
  // ===========================================================================
  describe('SalesforceConnector', () => {
    it('normalizes a Closed Won Opportunity (₹50L) into a canonical deal_accepted DecisionEvent', () => {
      expect(salesforceConnector.canHandle(mockSalesforceOpportunityClosedWon)).toBe(true);

      const events = salesforceConnector.normalize(mockSalesforceOpportunityClosedWon);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'deal_accepted'>;
      expect(event.event_type).toBe('deal_accepted');
      expect(event.department).toBe('sales');
      expect(event.entity_id).toBe('006-demo-001');
      expect(event.payload.deal_id).toBe('006-demo-001');
      expect(event.payload.final_value).toBe(5000000);
      expect(event.payload.close_date).toBe('2026-09-10');
      expect(event.payload.sla_commitments).toContain('99.9% uptime SLA guarantee');

      // Preserves external provenance metadata
      expect(event.source_metadata).toBeDefined();
      expect(event.source_metadata?.source).toBe('salesforce');
      expect(event.source_metadata?.externalId).toBe('006-demo-001');
      expect(event.source_metadata?.eventType).toBe('Opportunity:Closed Won');
      expect(event.source_metadata?.dealName).toBe('Blacktide Enterprise Deal');

      // Canonical validator accepts the event
      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('normalizes a Prospecting Opportunity into a canonical deal_created DecisionEvent', () => {
      const events = salesforceConnector.normalize(mockSalesforceOpportunityProspecting);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'deal_created'>;
      expect(event.event_type).toBe('deal_created');
      expect(event.department).toBe('sales');
      expect(event.payload.contract_value).toBe(2500000);
      expect(event.payload.deal_name).toBe('Global Tech Mid-Market Renewal');

      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('supports PascalCase Salesforce Outbound / CDC formats', () => {
      expect(salesforceConnector.canHandle(mockSalesforceOpportunityOutboundCDC)).toBe(true);

      const events = salesforceConnector.normalize(mockSalesforceOpportunityOutboundCDC);
      expect(events).toHaveLength(1);
      const event = events[0] as DecisionEvent<'deal_accepted'>;
      expect(event.event_type).toBe('deal_accepted');
      expect(event.payload.final_value).toBe(5000000);
      expect(event.payload.deal_id).toBe('006-demo-003');
    });

    it('STRICT NUMERIC: rejects string amount "5000000" without coercion', () => {
      expect(() => {
        salesforceConnector.normalize(mockSalesforceOpportunityStringAmount);
      }).toThrow(NormalizationError);

      try {
        salesforceConnector.normalize(mockSalesforceOpportunityStringAmount);
      } catch (err) {
        const error = err as NormalizationError;
        expect(error.code).toBe('INVALID_NUMERIC_VALUE');
        expect(error.field).toBe('amount');
        expect(error.message).toContain('Coercion is forbidden');
      }
    });

    it('rejects malformed or empty Salesforce payload', () => {
      expect(() => {
        salesforceConnector.normalize(mockSalesforceOpportunityMalformed as any);
      }).toThrow(NormalizationError);
    });

    it('returns a healthy status from healthCheck', async () => {
      const health = await salesforceConnector.healthCheck!();
      expect(health.status).toBe('healthy');
      expect(health.details?.supportedTypes).toContain('Opportunity');
    });
  });

  // ===========================================================================
  // 2. N8N CONNECTOR TESTS
  // ===========================================================================
  describe('N8NConnector', () => {
    it('normalizes deal.accepted webhook payload into deal_accepted DecisionEvent', () => {
      expect(n8nConnector.canHandle(mockN8nDealAccepted)).toBe(true);

      const events = n8nConnector.normalize(mockN8nDealAccepted);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'deal_accepted'>;
      expect(event.event_type).toBe('deal_accepted');
      expect(event.department).toBe('sales');
      expect(event.entity_id).toBe('n8n-demo-001');
      expect(event.payload.final_value).toBe(5000000);
      expect(event.source_metadata?.source).toBe('n8n');
      expect(event.source_metadata?.workflowId).toBe('n8n-wf-sales-intake-v3');
      expect(event.source_metadata?.executionId).toBe('n8n-exec-99238');

      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('normalizes budget.changed webhook payload into budget_changed DecisionEvent', () => {
      const events = n8nConnector.normalize(mockN8nBudgetChanged);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'budget_changed'>;
      expect(event.event_type).toBe('budget_changed');
      expect(event.department).toBe('finance');
      expect(event.payload.previous_budget).toBe(1800000);
      expect(event.payload.new_budget).toBe(1100000);

      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('normalizes capacity.changed webhook payload into capacity_changed DecisionEvent', () => {
      const events = n8nConnector.normalize(mockN8nCapacityChanged);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'capacity_changed'>;
      expect(event.event_type).toBe('capacity_changed');
      expect(event.department).toBe('engineering');
      expect(event.payload.previous_capacity_hours).toBe(420);
      expect(event.payload.new_capacity_hours).toBe(300);

      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('normalizes feature.committed webhook payload into feature_committed DecisionEvent', () => {
      const events = n8nConnector.normalize(mockN8nFeatureCommitted);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'feature_committed'>;
      expect(event.event_type).toBe('feature_committed');
      expect(event.department).toBe('product');
      expect(event.payload.committed_capacity_hours).toBe(120);

      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('STRICT NUMERIC: rejects string value "5000000" without coercion', () => {
      expect(() => {
        n8nConnector.normalize(mockN8nStringValue);
      }).toThrow(NormalizationError);

      try {
        n8nConnector.normalize(mockN8nStringValue);
      } catch (err) {
        const error = err as NormalizationError;
        expect(error.code).toBe('INVALID_NUMERIC_VALUE');
        expect(error.field).toBe('value');
      }
    });

    it('rejects malformed n8n payload missing event type', () => {
      expect(() => {
        n8nConnector.normalize(mockN8nMalformed as any);
      }).toThrow(NormalizationError);
    });
  });

  // ===========================================================================
  // 3. GENERIC WEBHOOK CONNECTOR TESTS
  // ===========================================================================
  describe('GenericWebhookConnector', () => {
    it('normalizes generic deal_accepted webhook into canonical DecisionEvent', () => {
      expect(genericWebhookConnector.canHandle(mockGenericWebhookDealAccepted)).toBe(true);

      const events = genericWebhookConnector.normalize(mockGenericWebhookDealAccepted);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'deal_accepted'>;
      expect(event.event_type).toBe('deal_accepted');
      expect(event.department).toBe('sales');
      expect(event.payload.final_value).toBe(5000000);
      expect(event.source_metadata?.source).toBe('external-system');
      expect(event.source_metadata?.externalId).toBe('ext-001');

      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('normalizes SAP ERP budget_changed webhook into canonical DecisionEvent', () => {
      expect(genericWebhookConnector.canHandle(mockGenericWebhookBudgetChanged)).toBe(true);

      const events = genericWebhookConnector.normalize(mockGenericWebhookBudgetChanged);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'budget_changed'>;
      expect(event.event_type).toBe('budget_changed');
      expect(event.department).toBe('finance');
      expect(event.payload.previous_budget).toBe(1800000);
      expect(event.payload.new_budget).toBe(1100000);
      expect(event.source_metadata?.source).toBe('sap-erp-gateway');

      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('normalizes Jira Service Management capacity_changed webhook into canonical DecisionEvent', () => {
      expect(genericWebhookConnector.canHandle(mockGenericWebhookCapacityChanged)).toBe(true);

      const events = genericWebhookConnector.normalize(mockGenericWebhookCapacityChanged);
      expect(events).toHaveLength(1);

      const event = events[0] as DecisionEvent<'capacity_changed'>;
      expect(event.event_type).toBe('capacity_changed');
      expect(event.department).toBe('engineering');
      expect(event.payload.previous_capacity_hours).toBe(420);
      expect(event.payload.new_capacity_hours).toBe(300);

      const validation = eventValidator.validate(event);
      expect(validation.isValid).toBe(true);
    });

    it('STRICT NUMERIC: rejects string value "5000000" in generic payload', () => {
      expect(() => {
        genericWebhookConnector.normalize(mockGenericWebhookStringValue);
      }).toThrow(NormalizationError);

      try {
        genericWebhookConnector.normalize(mockGenericWebhookStringValue);
      } catch (err) {
        const error = err as NormalizationError;
        expect(error.code).toBe('INVALID_NUMERIC_VALUE');
        expect(error.field).toBe('final_value');
      }
    });

    it('rejects malformed generic webhook missing payload object', () => {
      expect(() => {
        genericWebhookConnector.normalize(mockGenericWebhookMalformed as any);
      }).toThrow(NormalizationError);
    });
  });

  // ===========================================================================
  // 4. CONNECTOR REGISTRY TESTS
  // ===========================================================================
  describe('ConnectorRegistry', () => {
    let registry: ConnectorRegistry;

    beforeEach(() => {
      registry = new ConnectorRegistry();
    });

    it('registers and retrieves connectors by ID', () => {
      registry.register(salesforceConnector);
      registry.register(n8nConnector);
      registry.register(genericWebhookConnector);

      expect(registry.size()).toBe(3);
      expect(registry.get('salesforce')).toBe(salesforceConnector);
      expect(registry.get('n8n')).toBe(n8nConnector);
      expect(registry.get('generic-webhook')).toBe(genericWebhookConnector);
      expect(registry.get('unknown')).toBeUndefined();
    });

    it('lists all registered connectors', () => {
      registry.register(salesforceConnector);
      registry.register(n8nConnector);

      const list = registry.list();
      expect(list).toHaveLength(2);
      expect(list.map((c) => c.id)).toEqual(['salesforce', 'n8n']);
    });

    it('unregisters connectors by ID', () => {
      registry.register(salesforceConnector);
      expect(registry.unregister('salesforce')).toBe(true);
      expect(registry.get('salesforce')).toBeUndefined();
      expect(registry.size()).toBe(0);
    });

    it('findHandler automatically discovers appropriate connector based on payload', () => {
      registry.register(salesforceConnector);
      registry.register(n8nConnector);
      registry.register(genericWebhookConnector);

      expect(registry.findHandler(mockSalesforceOpportunityClosedWon)?.id).toBe('salesforce');
      expect(registry.findHandler(mockN8nDealAccepted)?.id).toBe('n8n');
      expect(registry.findHandler(mockGenericWebhookDealAccepted)?.id).toBe('generic-webhook');
      expect(registry.findHandler({ unknown: true })).toBeUndefined();
    });
  });

  // ===========================================================================
  // 5. EVENT NORMALIZER LAYER TESTS
  // ===========================================================================
  describe('EventNormalizer', () => {
    it('normalizes external payloads by auto-detecting connector through registry', () => {
      const normalizer = new EventNormalizer(connectorRegistry);

      // Salesforce
      const sfdcEvents = normalizer.normalize(mockSalesforceOpportunityClosedWon);
      expect(sfdcEvents[0].event_type).toBe('deal_accepted');
      expect(sfdcEvents[0].source_metadata?.source).toBe('salesforce');

      // n8n
      const n8nEvents = normalizer.normalize(mockN8nDealAccepted);
      expect(n8nEvents[0].event_type).toBe('deal_accepted');
      expect(n8nEvents[0].source_metadata?.source).toBe('n8n');

      // Generic
      const genEvents = normalizer.normalize(mockGenericWebhookDealAccepted);
      expect(genEvents[0].event_type).toBe('deal_accepted');
      expect(genEvents[0].source_metadata?.source).toBe('external-system');
    });

    it('enforces validation when validate option is enabled', () => {
      const events = eventNormalizer.normalize(mockSalesforceOpportunityClosedWon, {
        validate: true,
      });
      expect(events).toHaveLength(1);
      const event = events[0] as DecisionEvent<'deal_accepted'>;
      expect(event.payload.final_value).toBe(5000000);
    });

    it('throws NormalizationError when payload cannot be handled by any connector', () => {
      expect(() => {
        eventNormalizer.normalize({ totally_unknown: 123 });
      }).toThrow(NormalizationError);
    });

    it('throws when payload is null or undefined', () => {
      expect(() => eventNormalizer.normalize(null)).toThrow(NormalizationError);
      expect(() => eventNormalizer.normalize(undefined)).toThrow(NormalizationError);
    });
  });

  // ===========================================================================
  // 6. EXISTING PIPELINE COMPATIBILITY TESTS
  // ===========================================================================
  describe('Existing Event Pipeline Ingestion Compatibility', () => {
    it('feeds normalized Salesforce event into handleEventIngestion without direct state mutation', async () => {
      const initialState = createInitialState();

      // 1. Normalize external Salesforce Opportunity
      const normalizedEvents = salesforceConnector.normalize(
        mockSalesforceOpportunityClosedWon,
        { organizationId: initialState.organization_id }
      );
      const decisionEvent = normalizedEvents[0];

      // 2. Feed into existing handleEventIngestion route handler
      const response = await handleEventIngestion({
        event: decisionEvent,
        currentState: initialState,
      });

      // 3. Verify standard ingestion result
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.success) {
        expect(response.body.event.id).toBe(decisionEvent.id);
        // Revenue pipeline updated from 0 -> 5,000,000
        expect(response.body.nextState.metrics.revenue_pipeline).toBe(5000000);
        expect(response.body.stateDelta.changes.some((c) => c.metric === 'revenue_pipeline')).toBe(true);
      }
    });

    it('feeds normalized n8n capacity event into StateTransitionEngine', () => {
      const initialState = createInitialState();

      // 1. Normalize external n8n capacity webhook
      const normalizedEvents = n8nConnector.normalize(mockN8nCapacityChanged, {
        organizationId: initialState.organization_id,
      });
      const capacityEvent = normalizedEvents[0];

      // 2. Feed into existing StateTransitionEngine directly
      const result = stateTransitionEngine.applyEvent(initialState, capacityEvent);

      // 3. Verify state transition occurred through canonical engine
      expect(result.nextState.metrics.engineering_capacity).toBe(300);
      expect(result.stateDelta.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            metric: 'engineering_capacity',
            before: 420,
            after: 300,
            delta: -120,
          }),
        ])
      );
    });

    it('feeds normalized SAP ERP budget event into handleEventIngestion', async () => {
      const initialState = createInitialState();

      // 1. Normalize external ERP webhook
      const normalizedEvents = genericWebhookConnector.normalize(
        mockGenericWebhookBudgetChanged,
        { organizationId: initialState.organization_id }
      );
      const budgetEvent = normalizedEvents[0];

      // 2. Feed into existing handleEventIngestion
      const response = await handleEventIngestion({
        event: budgetEvent,
        currentState: initialState,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.success) {
        expect(response.body.nextState.metrics.available_budget).toBe(1100000);
      }
    });
  });
});
