/**
 * IMPACTMESH - Phase 3 FlowTrace Execution Bridge Tests
 * Comprehensive Vitest verification covering the 10 required architectural assertions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlowTraceAdapter } from '../../server/services/flowtrace/flowtrace.adapter.ts';
import { StateTransitionEngine } from '../../server/services/state-transition/state-transition.service.ts';
import { EventStore } from '../../server/services/event-store/event-store.service.ts';
import type { Decision, Recommendation, BusinessState } from '../../src/types/domain.ts';

describe('FlowTrace Execution Bridge (Phase 3)', () => {
  let adapter: FlowTraceAdapter;
  let engine: StateTransitionEngine;
  let eventStore: EventStore;

  const mockDecision: Decision = {
    id: 'dec-fin-01',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Respond to ₹7.0L Budget Reduction',
    description: 'Evaluate strategic alternatives to rebalance platform engineering capacity',
    department: 'finance',
    status: 'evaluating',
    trigger_event_id: 'evt-fin-cut-01',
    created_by: 'Priya Sharma (Finance)',
    created_at: '2026-09-10T09:00:00Z',
    updated_at: '2026-09-10T09:00:00Z',
  };

  const mockRecommendation: Recommendation = {
    id: 'rec-fin-01',
    decision_id: 'dec-fin-01',
    decision_event_id: 'evt-fin-cut-01',
    top_option_id: 'opt-scope-reduction',
    perspective: 'balanced',
    confidence_score: 0.92,
    created_at: '2026-09-10T09:05:00Z',
  };

  const getBaselineState = (): BusinessState => ({
    id: 'state-baseline',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    timestamp: '2026-09-10T09:00:00Z',
    metrics: {
      available_budget: 1100000,
      committed_budget: 1100000,
      revenue_pipeline: 5000000,
      committed_revenue: 5000000,
      engineering_capacity: 300,
      engineering_demand: 420,
      capacity_utilization: 140, // 140% DEFICIT
      budget_pressure: 1.0,
      risk_score: 0.82,
      business_health: 64,
    },
    state_hash: 'baseline-state-hash',
    last_event_id: null,
    created_at: '2026-09-10T09:00:00Z',
  });

  beforeEach(() => {
    adapter = new FlowTraceAdapter();
    engine = new StateTransitionEngine();
    eventStore = new EventStore();
    eventStore.clear();
    adapter.setCurrentState(getBaselineState());
  });

  // ---------------------------------------------------------------------------
  // 1. Recommendation -> Execution Plan Conversion
  // ---------------------------------------------------------------------------
  it('1. converts a strategic recommendation into a structured ExecutionPlan', () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);

    expect(plan.id).toBeDefined();
    expect(plan.decisionId).toBe(mockDecision.id);
    expect(plan.sourceRecommendationId).toBe(mockRecommendation.id);
    expect(plan.status).toBe('pending');
    expect(plan.approvedAt).toBeNull();
    expect(plan.steps.length).toBeGreaterThanOrEqual(4);
  });

  // ---------------------------------------------------------------------------
  // 2. Execution Plan Step Ordering
  // ---------------------------------------------------------------------------
  it('2. guarantees strict step ordering across departments (sequence 1 to 4)', () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);

    expect(plan.steps[0].sequence).toBe(1);
    expect(plan.steps[0].department).toBe('product');

    expect(plan.steps[1].sequence).toBe(2);
    expect(plan.steps[1].department).toBe('engineering');

    expect(plan.steps[2].sequence).toBe(3);
    expect(plan.steps[2].department).toBe('sales');

    expect(plan.steps[3].sequence).toBe(4);
    expect(plan.steps[3].department).toBe('finance');
  });

  // ---------------------------------------------------------------------------
  // 3. Dependency Validation Between Execution Steps
  // ---------------------------------------------------------------------------
  it('3. enforces dependency validation: rejects executing Step 2 before Step 1 completes', async () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);
    adapter.approveExecutionPlan(plan.id, 'Captain Maya Lin');
    adapter.startExecution(plan.id);

    const step2 = plan.steps[1];
    expect(step2.dependsOn).toContain(plan.steps[0].id);

    // Attempt to execute Step 2 while Step 1 is pending
    await expect(adapter.executeStep(plan.id, step2.id)).rejects.toThrow(
      /Prerequisite step .* must be completed first/
    );
  });

  // ---------------------------------------------------------------------------
  // 4. Human Approval Requirement
  // ---------------------------------------------------------------------------
  it('4. strictly requires human approval before starting execution', () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);
    expect(plan.approvedAt).toBeNull();

    // Attempting to start without approval must throw
    expect(() => adapter.startExecution(plan.id)).toThrow(
      /Explicit human approval is required/
    );

    // After approval, execution starts successfully
    const { success, plan: approvedPlan } = adapter.approveExecutionPlan(
      plan.id,
      'Officer Devon Ross'
    );
    expect(success).toBe(true);
    expect(approvedPlan.approvedAt).not.toBeNull();
    expect(approvedPlan.approvedBy).toBe('Officer Devon Ross');

    const startResult = adapter.startExecution(plan.id);
    expect(startResult.success).toBe(true);
    expect(startResult.plan.status).toBe('running');
  });

  // ---------------------------------------------------------------------------
  // 5. FlowTrace Adapter Contract Compliance
  // ---------------------------------------------------------------------------
  it('5. adheres to the IFlowTraceAdapter contract lifecycle', () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);
    expect(adapter.getExecutionPlan(plan.id)).toEqual(plan);

    adapter.approveExecutionPlan(plan.id, 'Operator 1');
    adapter.startExecution(plan.id);
    expect(adapter.getExecutionPlan(plan.id)?.status).toBe('running');

    adapter.pauseExecution(plan.id);
    expect(adapter.getExecutionPlan(plan.id)?.status).toBe('blocked');

    adapter.resumeExecution(plan.id);
    expect(adapter.getExecutionPlan(plan.id)?.status).toBe('running');

    const result = adapter.getExecutionResult(plan.id);
    expect(result.planId).toBe(plan.id);
    expect(result.totalStepsCount).toBe(plan.steps.length);
  });

  // ---------------------------------------------------------------------------
  // 6. Execution Step Completion -> DecisionEvent Conversion
  // ---------------------------------------------------------------------------
  it('6. generates a valid DecisionEvent when a step completes', async () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);
    adapter.approveExecutionPlan(plan.id, 'Captain Maya');
    adapter.startExecution(plan.id);

    const step1 = plan.steps[0];
    const { step, event } = await adapter.executeStep(plan.id, step1.id);

    expect(step.status).toBe('completed');
    expect(step.completedAt).toBeDefined();

    // Verify DecisionEvent
    expect(event.id).toMatch(/^evt-flowtrace-/);
    expect(event.department).toBe('product');
    expect(event.event_type).toBe('feature_deprioritized');
    expect(event.payload).toBeDefined();
    expect(event.created_by).toContain('FlowTrace Operator');
  });

  // ---------------------------------------------------------------------------
  // 7. Provenance Metadata Preservation
  // ---------------------------------------------------------------------------
  it('7. preserves provenance metadata in execution_context and executionContext', async () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);
    adapter.approveExecutionPlan(plan.id, 'Operator Maya');
    adapter.startExecution(plan.id);

    const step1 = plan.steps[0];
    const { event } = await adapter.executeStep(plan.id, step1.id);

    const context = event.execution_context || event.executionContext;
    expect(context).toBeDefined();
    expect(context?.executionPlanId).toBe(plan.id);
    expect(context?.executionStepId).toBe(step1.id);
    expect(context?.decisionId).toBe(mockDecision.id);
    expect(context?.recommendationId).toBe(mockRecommendation.id);
    expect(context?.sequence).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // 8. Duplicate Execution Event Handling (Idempotency)
  // ---------------------------------------------------------------------------
  it('8. handles duplicate execution events idempotently without double state mutation', async () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);
    adapter.approveExecutionPlan(plan.id, 'Operator');
    adapter.startExecution(plan.id);

    const step1 = plan.steps[0];
    const { event, transitionResult } = await adapter.executeStep(plan.id, step1.id);

    // First save: persists cleanly
    const save1 = await eventStore.saveEvent(event, transitionResult);
    expect(save1.saved).toBe(true);
    expect(save1.isDuplicate).toBe(false);

    // Second save: recognizes duplicate, avoids duplicate state mutation
    const save2 = await eventStore.saveEvent(event, transitionResult);
    expect(save2.saved).toBe(false);
    expect(save2.isDuplicate).toBe(true);
    expect(save2.cachedResult?.stateDelta.eventId).toBe(event.id);
  });

  // ---------------------------------------------------------------------------
  // 9. Completed Step Does NOT Directly Mutate BusinessState
  // ---------------------------------------------------------------------------
  it('9. step execution produces an event; state mutation is delegated strictly through StateTransitionEngine', async () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);
    adapter.approveExecutionPlan(plan.id, 'Operator');
    adapter.startExecution(plan.id);

    const preExecutionState = adapter.getCurrentState();
    expect(preExecutionState?.metrics.engineering_demand).toBe(420);

    // Execute step
    const { event, transitionResult } = await adapter.executeStep(plan.id, plan.steps[0].id);

    // Directly verify that the event fed into StateTransitionEngine produced the exact delta
    const engineResult = engine.applyEvent(preExecutionState!, event);
    expect(engineResult.nextState.metrics.engineering_demand).toBe(300);
    expect(transitionResult.nextState.metrics.engineering_demand).toBe(300);

    // The state was updated through the engine's mathematical rules (freed 120h -> 420 - 120 = 300)
    expect(transitionResult.stateDelta.changes.some((c) => c.metric === 'engineeringDemand' && c.delta === -120)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 10. Closed-Loop Execution Updates State Deterministically Through All Steps
  // ---------------------------------------------------------------------------
  it('10. executes all 4 steps in sequence, closing the feedback loop and updating state', async () => {
    const plan = adapter.createExecutionPlan(mockRecommendation, mockDecision);
    adapter.approveExecutionPlan(plan.id, 'Bridge Captain');
    adapter.startExecution(plan.id);

    // Step 1: Product freezes scope
    const res1 = await adapter.executeStep(plan.id, plan.steps[0].id);
    expect(res1.transitionResult.nextState.metrics.engineering_demand).toBe(300);

    // Step 2: Operations reallocates capacity (now unblocked!)
    expect(plan.steps[1].status).toBe('ready');
    const res2 = await adapter.executeStep(plan.id, plan.steps[1].id);
    expect(res2.transitionResult.nextState.metrics.engineering_capacity).toBe(300);
    // Utilization is now: 300h demand / 300h capacity = 100% (DEFICIT ELIMINATED!)
    expect(res2.transitionResult.nextState.metrics.capacity_utilization).toBe(100);

    // Step 3: Sales updates customer commitment
    expect(plan.steps[2].status).toBe('ready');
    const res3 = await adapter.executeStep(plan.id, plan.steps[2].id);
    expect(res3.event.event_type).toBe('deadline_changed');

    // Step 4: Finance records realized contractor savings
    expect(plan.steps[3].status).toBe('ready');
    const res4 = await adapter.executeStep(plan.id, plan.steps[3].id);
    expect(res4.transitionResult.nextState.metrics.committed_budget).toBe(860000); // 1,100,000 - 240,000 = 860,000

    // Verify entire plan completion
    expect(plan.status).toBe('completed');
    const finalResult = adapter.getExecutionResult(plan.id);
    expect(finalResult.completedStepsCount).toBe(4);
    expect(finalResult.generatedEvents).toHaveLength(4);
  });
});
