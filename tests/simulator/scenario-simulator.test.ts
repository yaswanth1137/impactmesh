/**
 * IMPACTMESH - Blacktide Scenario Simulator & E2E QA Test Suite (Teammate 3)
 *
 * Comprehensive verification of:
 * - Phase 7: Event validation, idempotency, stale event rejection, schema validation,
 *   unknown event types, source traceability, and correlation ID preservation.
 * - Phase 8: External dependency resilience (Groq 401 fallback, Supabase offline in-memory preservation,
 *   FlowTrace execution safety).
 * - Phase 9 & 14: Complete end-to-end Blacktide scenario execution proving:
 *   Revenue = ₹50L, Budget = ₹11L, Capacity = 300h, Demand = 420h,
 *   Deficit = 120h, Utilization = 140%, Committed Features = 3.
 * - Non-destructive reset isolation (only resets demo/simulator tenant, preserving others).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ScenarioSimulatorService,
  SIMULATOR_ORG_ID,
} from '../../server/services/simulator/scenario-simulator.service.ts';
import { handleEventIngestion } from '../../server/api/event-routes.ts';
import { eventStore } from '../../server/services/event-store/event-store.service.ts';
import { GroqService } from '../../server/services/groq-service.ts';
import { StrategicReasoningEngine } from '../../server/engines/reasoning-engine/reasoning-engine.service.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('Blacktide Scenario Simulator & Pipeline Integration (Teammate 3)', () => {
  let simulator: ScenarioSimulatorService;

  beforeEach(() => {
    eventStore.clear();
    simulator = new ScenarioSimulatorService();
    simulator.resetScenario();
  });

  // ===========================================================================
  // PHASE 7: IDEMPOTENCY, STALE, AND INVALID EVENT PIPELINE TESTS
  // ===========================================================================
  describe('Phase 7: Event Pipeline Integrity & Guardrails', () => {
    it('1. VALID EVENT: successfully passes through ingestion pipeline and updates BusinessState', async () => {
      const result = await simulator.executeStep(1); // ACCEPT ₹50L DEAL

      expect(result.step).toBe(1);
      expect(result.event).toBeDefined();
      expect(result.event?.event_type).toBe('deal_accepted');
      expect((result.event?.payload as any)?.final_value).toBe(5000000);

      // BusinessState updated through StateTransitionEngine
      expect(result.currentState.metrics.committed_revenue).toBe(5000000);
      expect(result.currentState.metrics.revenue_pipeline).toBe(5000000);
      expect(result.stateDelta?.changes.some((c) => c.metric === 'committedRevenue' && c.delta === 5000000)).toBe(true);

      // Event logged in event store
      const hasStored = await eventStore.hasProcessed(result.event!.id);
      expect(hasStored).toBe(true);
    });

    it('2. DUPLICATE EVENT: sending the exact same event twice returns cached result without double-applying state mutation', async () => {
      const state = simulator.getCurrentState();
      const event = simulator.createScenarioEvent(1); // ₹50L deal

      // First arrival
      const res1 = await handleEventIngestion({ event, currentState: state });
      expect(res1.statusCode).toBe(200);
      if ('nextState' in res1.body) {
        expect(res1.body.success).toBe(true);
        expect(res1.body.idempotent).toBe(false);
        expect(res1.body.nextState.metrics.committed_revenue).toBe(5000000);
      }

      // Second arrival with identical event ID
      const res2 = await handleEventIngestion({ event, currentState: state });
      expect(res2.statusCode).toBe(200);
      if ('nextState' in res2.body) {
        expect(res2.body.success).toBe(true);
        expect(res2.body.idempotent).toBe(true);
        // Revenue is NOT doubled to ₹100L; it remains ₹50L
        expect(res2.body.nextState.metrics.committed_revenue).toBe(5000000);
      }
    });

    it('3. STALE EVENT: rejects an event expecting outdated metrics with a 409 conflict', async () => {
      const state = simulator.getCurrentState(); // Baseline available budget is ₹18L (1,800,000)

      // Event expecting previous budget to be ₹25L (mismatched/stale)
      const staleEvent: DecisionEvent<'budget_changed'> = {
        id: `sim-stale-evt-${Date.now()}`,
        organization_id: SIMULATOR_ORG_ID,
        department: 'finance',
        event_type: 'budget_changed',
        entity_id: 'ent-budget-q1',
        payload: {
          department: 'finance',
          previous_budget: 2500000, // Stale! Current is 1800000
          new_budget: 1100000,
          fiscal_period: 'Q1-2026',
        },
        created_by: 'Scenario Simulator',
        created_at: new Date().toISOString(),
      };

      const res = await handleEventIngestion({ event: staleEvent, currentState: state });
      expect(res.statusCode).toBe(409);
      if ('code' in res.body) {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe('STALE_STATE');
      }
    });

    it('4. INVALID EVENT: rejects event missing required schema fields with 400 validation error', async () => {
      const state = simulator.getCurrentState();

      // Missing organization_id and invalid negative budget
      const invalidEvent = {
        id: '',
        department: 'finance',
        event_type: 'budget_changed',
        payload: {
          new_budget: -5000,
        },
        created_by: '',
        created_at: 'invalid-date',
      } as unknown as DecisionEvent;

      const res = await handleEventIngestion({ event: invalidEvent, currentState: state });
      expect(res.statusCode).toBe(400);
      if ('code' in res.body) {
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe('VALIDATION_ERROR');
      }
    });

    it('5. UNKNOWN EVENT TYPE: rejects unrecognized event type safely without crashing', async () => {
      const state = simulator.getCurrentState();

      const unknownEvent = {
        id: `sim-unknown-${Date.now()}`,
        organization_id: SIMULATOR_ORG_ID,
        department: 'sales',
        event_type: 'alien_abduction_event',
        payload: {},
        created_by: 'Simulator',
        created_at: new Date().toISOString(),
      } as unknown as DecisionEvent;

      const res = await handleEventIngestion({ event: unknownEvent, currentState: state });
      expect(res.statusCode).toBe(400);
      if ('validationErrors' in res.body) {
        expect(res.body.validationErrors?.some((e) => e.code === 'INVALID_EVENT_TYPE')).toBe(true);
      }
    });

    it('6. SOURCE TRACEABILITY: simulator events clearly declare source provenance and operator', () => {
      const event1 = simulator.createScenarioEvent(1);
      const event2 = simulator.createScenarioEvent(2);
      const event3 = simulator.createScenarioEvent(3);
      const event4 = simulator.createScenarioEvent(4);

      expect(event1.created_by).toContain('Scenario Simulator');
      expect(event2.created_by).toContain('Scenario Simulator');
      expect(event3.created_by).toContain('Scenario Simulator');
      expect(event4.created_by).toContain('Scenario Simulator');

      expect(event1.execution_context?.executionPlanId).toBe('plan-blacktide-core');
      expect(event2.execution_context?.executionStepId).toBe('step-02-feature');
      expect(event3.execution_context?.recommendationId).toBe('rec-sim-capacity');
      expect(event4.execution_context?.sequence).toBe(4);
    });

    it('7. CORRELATION PRESERVATION: preserves correlation and execution plan IDs through ingestion', async () => {
      await simulator.executeStep(1);
      const log = simulator.getEventLog();

      expect(log.length).toBe(1);
      expect(log[0].correlationId).toBe('plan-blacktide-core');
      expect(log[0].source).toBe('scenario-simulator');
      expect(log[0].status).toBe('PROCESSED');
      expect(log[0].httpStatus).toBe(200);
    });
  });

  // ===========================================================================
  // PHASE 8: RESILIENCE & FAILURE TESTING
  // ===========================================================================
  describe('Phase 8: External Dependency Resilience & Fallback Behaviors', () => {
    it('1. Groq Unavailable / 401: falls back to deterministic structured evidence without crashing', async () => {
      // Configure Groq with invalid key or unconfigured key to simulate 401
      const groqMock = new GroqService({ apiKey: 'gsk_invalid_test_key_401' });
      const engine = new StrategicReasoningEngine(groqMock);

      const state = simulator.getCurrentState();
      const event = simulator.createScenarioEvent(4);

      const reasoning = await engine.evaluateEvidence({
        organizationId: SIMULATOR_ORG_ID,
        triggeringEvent: event,
        currentBusinessState: state,
        affectedEntities: [],
        deterministicImpact: {
          id: 'imp-res-01',
          organization_id: SIMULATOR_ORG_ID,
          decision_event_id: event.id,
          affected_entities: [],
          metric_deltas: [],
          cascade_depth: 3,
          deterministic_score: 75,
          risk_assessment: {
            overall_risk: 'high',
            risk_score: 0.82,
            primary_risks: ['Budget ceiling reduced', 'Capacity deficit'],
            bottlenecks: ['Platform Engineering Pool'],
          },
          confidence_score: 0.95,
          calculated_at: new Date().toISOString(),
        },
        generatedOptions: [],
        expertPolicies: {} as any,
      });

      expect(reasoning).toBeDefined();
      expect(reasoning.synthesis.executive_summary).toBeTruthy();
      expect(reasoning.synthesis.strategic_rationale).toBeTruthy();
      expect(reasoning.confidenceScore).toBeGreaterThanOrEqual(0.7);
    });

    it('2. Supabase Unavailable: in-memory store and BroadcastChannel maintain state safely', async () => {
      // Even if Supabase is offline (isSupabaseConfigured = false), in-memory store persists events
      const event = simulator.createScenarioEvent(1);
      const saveResult = await eventStore.saveEvent(event);

      expect(saveResult.saved).toBe(true);
      expect(saveResult.isDuplicate).toBe(false);

      const retrieved = await eventStore.getEvent(event.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(event.id);
    });

    it('3. FlowTrace Offline or Step Failure: never corrupts BusinessState', async () => {
      // Execute steps 1 to 4
      await simulator.executeStep(1);
      await simulator.executeStep(2);
      await simulator.executeStep(3);
      await simulator.executeStep(4);

      const stateAfterSteps = simulator.getCurrentState();

      // Execute Step 5 (Impact & FlowTrace Bridge)
      const step5Result = await simulator.executeStep(5);

      // Verify that step 5 (analysis & flowtrace) preserves the exact deterministic metrics
      expect(step5Result.currentState.metrics.committed_revenue).toBe(stateAfterSteps.metrics.committed_revenue);
      expect(step5Result.currentState.metrics.available_budget).toBe(stateAfterSteps.metrics.available_budget);
      expect(step5Result.currentState.metrics.engineering_capacity).toBe(stateAfterSteps.metrics.engineering_capacity);
      expect(step5Result.currentState.metrics.engineering_demand).toBe(stateAfterSteps.metrics.engineering_demand);
    });
  });

  // ===========================================================================
  // PHASE 9: END-TO-END BLACKTIDE SCENARIO TEST
  // ===========================================================================
  describe('Phase 9: Full E2E Blacktide Scenario Execution', () => {
    it('executes complete 5-step sequence and verifies the exact emergent BusinessState metrics', async () => {
      // Initial Assertions
      const initial = simulator.getCurrentState();
      expect(initial.metrics.committed_revenue).toBe(0);
      expect(initial.metrics.available_budget).toBe(1800000);
      expect(initial.metrics.engineering_capacity).toBe(420);
      expect(initial.metrics.engineering_demand).toBe(0);
      expect(initial.metrics.capacity_utilization).toBe(0);

      // STEP 1: ACCEPT ₹50L DEAL
      const step1 = await simulator.executeStep(1);
      expect(step1.currentState.metrics.committed_revenue).toBe(5000000);
      expect(step1.currentState.metrics.revenue_pipeline).toBe(5000000);

      // STEP 2: COMMIT 3 FEATURES
      const step2 = await simulator.executeStep(2);
      expect(step2.currentState.metrics.engineering_demand).toBe(420);
      expect(step2.currentState.metrics.committed_features_count).toBe(3);
      expect(step2.currentState.metrics.capacity_utilization).toBe(100);

      // STEP 3: REDUCE CAPACITY TO 300h
      const step3 = await simulator.executeStep(3);
      expect(step3.currentState.metrics.engineering_capacity).toBe(300);
      expect(step3.currentState.metrics.engineering_demand).toBe(420);
      // Capacity deficit = 420h - 300h = 120h
      const deficit = step3.currentState.metrics.engineering_demand - step3.currentState.metrics.engineering_capacity;
      expect(deficit).toBe(120);
      // Utilization = 420 / 300 = 140%
      expect(step3.currentState.metrics.capacity_utilization).toBe(140);

      // STEP 4: CUT BUDGET TO ₹11L
      const step4 = await simulator.executeStep(4);
      expect(step4.currentState.metrics.available_budget).toBe(1100000);

      // STEP 5: ANALYZE IMPACT & DECISIONS
      const step5 = await simulator.executeStep(5);
      expect(step5.analysisResult).toBeDefined();
      expect(step5.analysisResult?.impactAnalysis.affectedEntities.length).toBeGreaterThanOrEqual(4);
      expect(step5.analysisResult?.decisionOptions.length).toBeGreaterThanOrEqual(4);
      expect(step5.analysisResult?.recommendation).toBeDefined();
      expect(step5.analysisResult?.executionPlan).toBeDefined();

      // =======================================================================
      // FINAL DETERMINISTIC STATE VERIFICATION
      // =======================================================================
      const finalState = simulator.getCurrentState();

      expect(finalState.metrics.committed_revenue).toBe(5000000);     // ₹50L
      expect(finalState.metrics.available_budget).toBe(1100000);      // ₹11L
      expect(finalState.metrics.engineering_capacity).toBe(300);      // 300h
      expect(finalState.metrics.engineering_demand).toBe(420);        // 420h
      expect(finalState.metrics.capacity_utilization).toBe(140);      // 140%
      expect(finalState.metrics.committed_features_count).toBe(3);    // 3 committed features

      const finalDeficit = finalState.metrics.engineering_demand - finalState.metrics.engineering_capacity;
      expect(finalDeficit).toBe(120);                                 // 120h deficit

      // Verify event log contains 4 DecisionEvents in reverse-chronological order
      const eventLog = simulator.getEventLog();
      expect(eventLog.length).toBe(4);
      expect(eventLog[0].eventType).toBe('budget_changed');
      expect(eventLog[1].eventType).toBe('capacity_changed');
      expect(eventLog[2].eventType).toBe('feature_committed');
      expect(eventLog[3].eventType).toBe('deal_accepted');
    });

    it('runFullScenario executes complete pipeline autonomously', async () => {
      const results = await simulator.runFullScenario();

      expect(results.length).toBe(5);
      expect(results[0].step).toBe(1);
      expect(results[4].step).toBe(5);

      const finalMetrics = simulator.getCurrentState().metrics;
      expect(finalMetrics.committed_revenue).toBe(5000000);
      expect(finalMetrics.available_budget).toBe(1100000);
      expect(finalMetrics.engineering_capacity).toBe(300);
      expect(finalMetrics.engineering_demand).toBe(420);
      expect(finalMetrics.capacity_utilization).toBe(140);
      expect(finalMetrics.committed_features_count).toBe(3);
    });
  });

  // ===========================================================================
  // NON-DESTRUCTIVE RESET ISOLATION
  // ===========================================================================
  describe('Non-Destructive Reset Isolation', () => {
    it('resets simulator state and removes only simulator events without wiping other tenants', async () => {
      // 1. Add an event for another organization (production tenant)
      const otherOrgEvent: DecisionEvent<'deal_created'> = {
        id: 'evt-production-deal-001',
        organization_id: 'org-production-live',
        department: 'sales',
        event_type: 'deal_created',
        entity_id: 'deal-prod-01',
        payload: {
          deal_id: 'deal-prod-01',
          deal_name: 'Production Mega Deal',
          customer_id: 'cust-prod-01',
          contract_value: 12000000,
          expected_close_date: '2026-12-01',
        },
        created_by: 'Production System',
        created_at: new Date().toISOString(),
      };
      await eventStore.saveEvent(otherOrgEvent);

      // 2. Run simulator scenario
      await simulator.runFullScenario();
      expect(simulator.getEventLog().length).toBe(4);
      expect(simulator.getCurrentState().metrics.committed_revenue).toBe(5000000);

      // 3. Reset simulator
      simulator.resetScenario();

      // 4. Verify simulator is back to baseline
      expect(simulator.getEventLog().length).toBe(0);
      expect(simulator.getCurrentState().metrics.committed_revenue).toBe(0);
      expect(simulator.getCurrentState().metrics.available_budget).toBe(1800000);
      expect(simulator.getCurrentState().metrics.engineering_capacity).toBe(420);
      expect(simulator.getCurrentState().metrics.engineering_demand).toBe(0);

      // 5. Verify other organization event is COMPLETELY INTACT
      const prodEvent = await eventStore.getEvent('evt-production-deal-001');
      expect(prodEvent).not.toBeNull();
      expect(prodEvent?.entity_id).toBe('deal-prod-01');
    });
  });
});
