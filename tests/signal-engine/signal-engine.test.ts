import { describe, it, expect, beforeEach } from 'vitest';
import { triggerRuleService } from '../../server/engines/signal-engine/trigger-rule.service.ts';
import { signalService } from '../../server/engines/signal-engine/signal.service.ts';
import { signalPriorityService } from '../../server/engines/signal-engine/signal-priority.service.ts';
import { decisionAggregatorService } from '../../server/engines/signal-engine/decision-aggregator.service.ts';
import { salesforceConnector } from '../../server/connectors/salesforce.connector.ts';
import type { BusinessState } from '../../src/types/domain.ts';
import type { StateDelta } from '../../server/services/state-transition/state-transition.interface.ts';

const createMockBusinessState = (overrides?: Partial<BusinessState['metrics']>): BusinessState => ({
  id: 'state-test-01',
  version: 1,
  organization_id: 'org-blacktide-test',
  timestamp: new Date().toISOString(),
  metrics: {
    available_budget: 1100000,
    committed_budget: 1100000,
    committed_revenue: 5000000,
    revenue_pipeline: 5000000,
    runway_months: 6,
    engineering_capacity: 300,
    engineering_demand: 420,
    capacity_utilization: 1.4,
    budget_pressure: 1.0,
    risk_score: 0.68,
    business_health: 72,
    ...overrides,
  },
  state_hash: 'hash-001',
  last_event_id: null,
  created_at: new Date().toISOString(),
});

describe('IMPACTMESH — Signal + Trigger + Human Review Engine Test Suite', () => {
  beforeEach(() => {
    signalService.reset();
  });

  // 1. Capacity trigger
  it('1. triggers CAPACITY OVERLOAD when demand exceeds available capacity', () => {
    const state = createMockBusinessState({ engineering_capacity: 300, engineering_demand: 420 });
    const results = triggerRuleService.evaluateAll({ state });
    const capacityTrigger = results.find((r) => r.ruleId === 'TRIGGER_CAPACITY_OVERLOAD');

    expect(capacityTrigger).toBeDefined();
    expect(capacityTrigger?.triggered).toBe(true);
    expect(capacityTrigger?.affectedCapacityHours).toBe(120);
    expect(capacityTrigger?.severity).toBe('CRITICAL');
  });

  // 2. Budget trigger
  it('2. triggers BUDGET PRESSURE when budget pressure exceeds threshold', () => {
    const state = createMockBusinessState({ budget_pressure: 0.95, available_budget: 1100000 });
    const results = triggerRuleService.evaluateAll({ state });
    const budgetTrigger = results.find((r) => r.ruleId === 'TRIGGER_BUDGET_PRESSURE');

    expect(budgetTrigger).toBeDefined();
    expect(budgetTrigger?.triggered).toBe(true);
    expect(budgetTrigger?.affectedDepartments).toContain('finance');
  });

  // 3. Delivery trigger
  it('3. triggers DELIVERY RISK when deficit drives delay beyond threshold (> 3 days)', () => {
    const state = createMockBusinessState({ engineering_capacity: 300, engineering_demand: 420 });
    const results = triggerRuleService.evaluateAll({ state });
    const deliveryTrigger = results.find((r) => r.ruleId === 'TRIGGER_DELIVERY_RISK');

    expect(deliveryTrigger).toBeDefined();
    expect(deliveryTrigger?.triggered).toBe(true);
    expect(deliveryTrigger?.deliveryDelayDays).toBeGreaterThan(3);
    expect(deliveryTrigger?.scope).toBe('PROJECT');
  });

  // 4. Customer exposure trigger
  it('4. triggers CUSTOMER EXPOSURE when contract value is at risk', () => {
    const state = createMockBusinessState({ committed_revenue: 5000000, engineering_demand: 420, engineering_capacity: 300 });
    const results = triggerRuleService.evaluateAll({ state });
    const custTrigger = results.find((r) => r.ruleId === 'TRIGGER_CUSTOMER_EXPOSURE');

    expect(custTrigger).toBeDefined();
    expect(custTrigger?.financialExposureINR).toBe(5000000);
    expect(custTrigger?.scope).toBe('CUSTOMER');
  });

  // 5. Cross-functional trigger
  it('5. triggers CROSS-FUNCTIONAL IMPACT when changes couple 3+ departments', () => {
    const state = createMockBusinessState({ capacity_utilization: 1.4, budget_pressure: 1.0 });
    const delta: StateDelta = {
      eventId: 'evt-test',
      timestamp: new Date().toISOString(),
      changes: [
        { metric: 'available_budget', before: 1800000, after: 1100000, delta: -700000 },
        { metric: 'engineering_demand', before: 0, after: 420, delta: 420 },
        { metric: 'committed_revenue', before: 0, after: 5000000, delta: 5000000 },
      ],
    };
    const results = triggerRuleService.evaluateAll({ state, stateDelta: delta });
    const crossTrigger = results.find((r) => r.ruleId === 'TRIGGER_CROSS_FUNCTIONAL_IMPACT');

    expect(crossTrigger).toBeDefined();
    expect(crossTrigger?.affectedDepartments.length).toBeGreaterThanOrEqual(3);
  });

  // 6. Materiality threshold
  it('6. evaluates materiality threshold correctly into HIGH / MEDIUM / LOW', () => {
    const highState = createMockBusinessState({ committed_revenue: 5000000, engineering_demand: 420, engineering_capacity: 300 });
    const triggerRes = triggerRuleService.evaluateAll({ state: highState })[0];
    const prioRes = signalPriorityService.calculatePriority(triggerRes);

    expect(prioRes.materiality).toBe('HIGH');
    expect(prioRes.evidenceFactors.length).toBeGreaterThan(0);
  });

  // 7. Signal deduplication
  it('7. maintains single signal and increments occurrenceCount on duplicate events', () => {
    const state = createMockBusinessState();
    const sig1 = signalService.processState({ state });
    const initialCount = sig1.length;
    expect(initialCount).toBeGreaterThan(0);

    const firstSignalId = sig1[0].id;
    expect(sig1[0].occurrenceCount).toBe(1);

    // Second event arrives with same underlying state
    const sig2 = signalService.processState({ state });
    const matched = sig2.find((s) => s.id === firstSignalId);

    expect(matched).toBeDefined();
    expect(matched?.occurrenceCount).toBe(2);
    expect(signalService.getAllSignals().length).toBe(initialCount); // No duplicate signal inflation
  });

  // 8. Signal scope
  it('8. preserves scope taxonomy (ENTITY, PROJECT, CUSTOMER, DEPARTMENT, ORG)', () => {
    const state = createMockBusinessState();
    const signals = signalService.processState({ state });

    const scopes = new Set(signals.map((s) => s.scope));
    expect(scopes.has('DEPARTMENT') || scopes.has('PROJECT') || scopes.has('CUSTOMER') || scopes.has('ORGANIZATION')).toBe(true);
  });

  // 9. Signal review lifecycle
  it('9. tracks human review lifecycle from NEW to REVIEWING', () => {
    const state = createMockBusinessState();
    const [signal] = signalService.processState({ state });
    expect(signal.state).toBe('NEW');

    signalService.requestMoreContext(signal.id, { id: 'u1', name: 'Devon', role: 'ceo' }, ['contractor_rates']);
    const updated = signalService.getSignal(signal.id);
    expect(updated?.state).toBe('REVIEWING');
  });

  // 10. Dismiss action
  it('10. handles human dismiss action and moves signal to DISMISSED', () => {
    const state = createMockBusinessState();
    const [signal] = signalService.processState({ state });

    signalService.dismissSignal(signal.id, { id: 'u1', name: 'Devon', role: 'ceo' }, 'Expected seasonal shift');
    const dismissed = signalService.getSignal(signal.id);

    expect(dismissed?.state).toBe('DISMISSED');
    expect(dismissed?.resolvedAt).toBeDefined();
    expect(signalService.getActiveSignals().some((s) => s.id === signal.id)).toBe(false);
  });

  // 11. Acknowledge action
  it('11. handles human acknowledge action and moves signal to ACKNOWLEDGED', () => {
    const state = createMockBusinessState();
    const [signal] = signalService.processState({ state });

    signalService.acknowledgeSignal(signal.id, { id: 'u1', name: 'Devon', role: 'ceo' });
    const acked = signalService.getSignal(signal.id);

    expect(acked?.state).toBe('ACKNOWLEDGED');
  });

  // 12. Request more context
  it('12. handles request more context and appends missing fields to evidence', () => {
    const state = createMockBusinessState();
    const [signal] = signalService.processState({ state });

    signalService.requestMoreContext(signal.id, { id: 'u1', name: 'Devon', role: 'ceo' }, ['vendor_rates', 'audit_log']);
    const reviewing = signalService.getSignal(signal.id);

    expect(reviewing?.evidence.missingContextFields).toContain('vendor_rates');
    expect(reviewing?.evidence.missingContextFields).toContain('audit_log');
  });

  // 13. Signal -> Decision conversion
  it('13. converts signal to formal decision with complete provenance', () => {
    const state = createMockBusinessState();
    const [signal] = signalService.processState({ state });

    const decision = signalService.convertToDecision(signal.id, { id: 'u1', name: 'Devon Ross', role: 'ceo' });

    expect(decision.decisionId).toBeDefined();
    expect(decision.sourceSignalId).toBe(signal.id);
    expect(decision.triggerRuleId).toBe(signal.triggerRuleId);
    expect(decision.syntheticEvent.event_type).toBe('capacity_changed');
    expect(decision.decisionContext.provenance.reviewerId).toBe('u1');

    const updatedSignal = signalService.getSignal(signal.id);
    expect(updatedSignal?.state).toBe('CONVERTED_TO_DECISION');
    expect(updatedSignal?.convertedDecisionId).toBe(decision.decisionId);
  });

  // 14. Human override
  it('14. records human override choice and documents required business rationale', () => {
    signalService.recordDecisionReview({
      decisionId: 'DEC-001',
      reviewerId: 'USR-DEVON',
      reviewerName: 'Devon Ross',
      role: 'ceo',
      systemRecommendationId: 'REC-001',
      systemRecommendedOptionId: 'opt-scope-reduction',
      selectedOptionId: 'opt-delay-delivery',
      override: true,
      overrideReason: 'Customer contract requires full feature scope.',
      approvedAt: new Date().toISOString(),
    });

    const reviews = signalService.getDecisionReviews('DEC-001');
    expect(reviews.length).toBe(1);
    expect(reviews[0].override).toBe(true);
    expect(reviews[0].selectedOptionId).toBe('opt-delay-delivery');
    expect(reviews[0].overrideReason).toContain('full feature scope');
  });

  // 15. CEO aggregation
  it('15. filters signals into executive brief tailored for CEO priorities', () => {
    const state = createMockBusinessState();
    const signals = signalService.processState({ state });

    const brief = decisionAggregatorService.generateBrief(signals, 'CEO');
    expect(brief.role).toBe('CEO');
    expect(brief.itemsNeedingAttention.length).toBeGreaterThan(0);
    // CEO brief must include customer revenue exposure
    expect(brief.keyExposures.totalFinancialINR).toBe(5000000);
  });

  // 16. CFO aggregation
  it('16. filters signals into executive brief tailored for CFO priorities', () => {
    const state = createMockBusinessState();
    const signals = signalService.processState({ state });

    const brief = decisionAggregatorService.generateBrief(signals, 'CFO');
    expect(brief.role).toBe('CFO');
    // CFO brief includes budget and financial exposure
    expect(brief.itemsNeedingAttention.some((i) => i.scopeName.includes('Finance') || i.metricHighlight.includes('budget') || i.metricHighlight.includes('₹'))).toBe(true);
  });

  // 17. COO aggregation
  it('17. filters signals into executive brief tailored for COO priorities', () => {
    const state = createMockBusinessState();
    const signals = signalService.processState({ state });

    const brief = decisionAggregatorService.generateBrief(signals, 'COO');
    expect(brief.role).toBe('COO');
    // COO brief includes capacity and engineering deficit
    expect(brief.keyExposures.capacityDeficitHours).toBe(120);
  });

  // 18. Incremental trigger evaluation
  it('18. evaluates only applicable rules on incremental StateDelta', () => {
    const state = createMockBusinessState();
    // Delta only touches budget
    const delta: StateDelta = {
      eventId: 'evt-budget',
      timestamp: new Date().toISOString(),
      changes: [{ metric: 'available_budget', before: 1800000, after: 1100000, delta: -700000 }],
    };

    const incrementalResults = triggerRuleService.evaluateIncremental({ state, stateDelta: delta }, delta);
    expect(incrementalResults.length).toBeGreaterThan(0);
    // Applicable rules should include budget rules or cross-department
    const touchedRules = incrementalResults.map((r) => r.ruleId);
    expect(touchedRules.includes('TRIGGER_BUDGET_PRESSURE') || touchedRules.includes('TRIGGER_COST_ANOMALY') || touchedRules.includes('TRIGGER_CROSS_FUNCTIONAL_IMPACT')).toBe(true);
  });

  // Connector test: Salesforce normalizer
  it('normalizes external Salesforce Opportunity Closed Won payload into canonical DecisionEvent', async () => {
    const rawPayload = {
      sourceId: 'sf-instance-01',
      sourceType: 'SALESFORCE' as const,
      externalEventId: '0065g00000XyZ123',
      entityType: 'Opportunity',
      action: 'ClosedWon',
      timestamp: new Date().toISOString(),
      rawRecord: {
        OpportunityId: '0065g00000XyZ123',
        AccountId: '0015g00000AbC456',
        AccountName: 'Apex Global Financials',
        StageName: 'Closed Won',
        Amount: 5000000,
        CloseDate: '2026-09-30',
        CustomEngineeringHoursRequired: 420,
        RequiredFeatures: ['SAML SSO', 'Executive Analytics'],
      },
    };

    const event = salesforceConnector.normalizePayload(rawPayload);
    expect(event.department).toBe('sales');
    expect(event.event_type).toBe('deal_accepted');
    expect((event.payload as any).contract_value_inr).toBe(5000000);
    expect((event.payload as any).required_engineering_hours).toBe(420);
  });
});
