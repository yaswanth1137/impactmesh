/**
 * LEAD 3: Supabase & Realtime Device Connectivity Verification Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { publishDecisionEvent } from '../src/lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager } from '../src/lib/realtime/subscription-manager.ts';
import { enterpriseDatasetService } from '../src/lib/dataset/dataset.service.ts';
import { groqReasoningService } from '../src/lib/groq/groq.service.ts';
import { checkSupabaseConnection } from '../src/lib/supabase/client.ts';
import type { DecisionEvent } from '../src/types/events.ts';
import type { ReasoningContext } from '../src/types/groq.ts';

describe('Lead 3: Device to Supabase & Realtime Connectivity', () => {
  beforeEach(() => {
    // Teardown previous channels
    realtimeSubscriptionManager.teardown();
    realtimeSubscriptionManager.initializeChannels();
  });

  it('should test Supabase connection check', async () => {
    const status = await checkSupabaseConnection();
    expect(status).toBeDefined();
    expect(typeof status.connected).toBe('boolean');
    expect(typeof status.message).toBe('string');
  });

  it('should publish an event from Phone 4 (Finance) and receive it on Laptop (Command Deck)', async () => {
    const commandDeckEvents: DecisionEvent[] = [];

    // Laptop (Command Deck) subscribes to all incoming events
    const unsubscribe = realtimeSubscriptionManager.onEvent((event) => {
      commandDeckEvents.push(event);
    });

    // Phone 4 (Finance) transmits budget cut
    const publishResult = await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'BUDGET-MAIN',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: 1100000,
        fiscal_period: 'Q3-2026',
        rationale: 'Capex contraction',
      },
      created_by: 'purser_finance_lead',
    });

    expect(publishResult.success).toBe(true);
    expect(publishResult.event).toBeDefined();

    // Verify Command Deck received the event
    expect(commandDeckEvents.length).toBeGreaterThanOrEqual(1);
    const lastEvent = commandDeckEvents[commandDeckEvents.length - 1];
    expect(lastEvent.department).toBe('finance');
    expect(lastEvent.event_type).toBe('budget_changed');
    expect((lastEvent.payload as any).new_budget).toBe(1100000);

    unsubscribe();
  });

  it('should publish an event from Phone 1 (Sales) and filter by event type', async () => {
    const salesEvents: DecisionEvent[] = [];

    const unsubscribe = realtimeSubscriptionManager.onEvent((event) => {
      salesEvents.push(event);
    }, 'deal_accepted');

    // Phone 1 transmits deal_accepted
    await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'sales',
      event_type: 'deal_accepted',
      entity_id: 'DEAL-APEX-50L',
      payload: {
        deal_id: 'DEAL-APEX-50L',
        final_value: 5000000,
        close_date: '2026-09-30',
        sla_commitments: ['SAML SSO', '30 Days Delivery'],
      },
      created_by: 'lookout_sales_lead',
    });

    expect(salesEvents.length).toBe(1);
    expect(salesEvents[0].department).toBe('sales');
    expect(salesEvents[0].event_type).toBe('deal_accepted');

    unsubscribe();
  });

  it('should query WideWorldImporters enterprise dataset', async () => {
    const customers = await enterpriseDatasetService.getCustomers();
    expect(customers.length).toBeGreaterThanOrEqual(3);

    const apex = await enterpriseDatasetService.getCustomerById('CUST-001');
    expect(apex).not.toBeNull();
    expect(apex?.name).toContain('Apex Global');
    expect(apex?.arrINR).toBe(5000000);

    const products = await enterpriseDatasetService.getProducts();
    expect(products.length).toBeGreaterThanOrEqual(3);

    const orders = await enterpriseDatasetService.getOrders();
    expect(orders.length).toBeGreaterThanOrEqual(2);
  });

  it('should synthesize structured strategic reasoning with Groq', async () => {
    const sampleContext: ReasoningContext = {
      decisionTitle: 'Budget Reduction ₹18L -> ₹11L',
      triggerEvent: {
        department: 'finance',
        eventType: 'budget_changed',
        entityId: 'BUDGET-MAIN',
        previousValue: { budget: 1800000 },
        newValue: { budget: 1100000 },
      },
      businessPosition: {
        revenueINR: 5000000,
        budgetINR: 1100000,
        engineeringCapacityHours: 300,
        allocatedCapacityHours: 420,
        riskScore: 0.82,
      },
      impactEvidence: [
        {
          nodeId: 'NODE-BUDGET',
          entityType: 'budget',
          metric: 'availableBudget',
          delta: -700000,
          severity: 'HIGH',
          description: 'Budget reduced by ₹7.0L',
        },
      ],
      feasibleOptions: [
        {
          id: 'OPT-01',
          title: 'Reduce Custom Scope & Protect Delivery SLA',
          department: 'product',
          score: 91,
          estimatedSavingsINR: 240000,
        },
      ],
    };

    const response = await groqReasoningService.reasonWithGroq(sampleContext);
    expect(response.recommendation).toBeDefined();
    expect(response.recommendation.recommendedOptionId).toBe('OPT-01');
    expect(response.recommendation.bearingDeltaDegrees).toBe(-27);
    expect(response.captainLogEntry).toBeDefined();
    expect(response.captainLogEntry.headline).toBeDefined();
  });
});
