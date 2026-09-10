/**
 * IMPACTMESH - FlowTrace Adapter Implementation
 * Implements the execution bridge between IMPACTMESH strategic decisions and FlowTrace.
 *
 * Core Guarantees:
 * 1. Human Approval Gate: Execution cannot start without explicit operator approval.
 * 2. Step Dependency Enforcement: Step N cannot execute until all dependsOn steps are completed.
 * 3. Event-Driven Closed Loop: FlowTrace never directly mutates BusinessState.
 *    Instead, completed steps emit typed DecisionEvents with executionContext provenance
 *    that flow into the authoritative StateTransitionEngine.
 */

import type { Decision, Recommendation, BusinessState } from '../../../src/types/domain.ts';
import type { DecisionEvent, ImpactMeshEventType } from '../../../src/types/events.ts';
import type {
  ExecutionPlan,
  ExecutionResult,
  ExecutionStep,
  ExecutionEvidence,
} from '../../../src/types/execution.ts';
import type { IFlowTraceAdapter, StepExecutionResult } from './flowtrace.interface.ts';
import {
  createCanonicalBlacktideExecutionPlan,
  CANONICAL_EXECUTION_PLAN_ID,
} from './blacktide-execution-plan.ts';
import { stateTransitionEngine } from '../state-transition/state-transition.service.ts';
import { eventStore } from '../event-store/event-store.service.ts';

export class FlowTraceAdapter implements IFlowTraceAdapter {
  private readonly plans = new Map<string, ExecutionPlan>();
  private readonly generatedEvents = new Map<string, DecisionEvent[]>();
  private currentState: BusinessState | null = null;

  constructor() {
    // Seed canonical Blacktide plan
    const canonicalPlan = createCanonicalBlacktideExecutionPlan();
    this.plans.set(canonicalPlan.id, canonicalPlan);
    this.generatedEvents.set(canonicalPlan.id, []);
  }

  public setCurrentState(state: BusinessState): void {
    this.currentState = state;
  }

  public getCurrentState(): BusinessState | null {
    return this.currentState;
  }

  public createExecutionPlan(
    recommendation: Recommendation,
    decision: Decision,
    customSteps?: ExecutionStep[]
  ): ExecutionPlan {
    const planId = `plan-${Date.now()}-${decision.id.slice(0, 6)}`;
    const steps: ExecutionStep[] =
      customSteps ||
      createCanonicalBlacktideExecutionPlan(decision.id, recommendation.id).steps.map((s) => ({
        ...s,
        planId,
      }));

    const plan: ExecutionPlan = {
      id: planId,
      decisionId: decision.id,
      title: `Execution Plan for ${decision.title}`,
      objective: `Execute strategic response approved from recommendation: ${recommendation.top_option_id}`,
      sourceRecommendationId: recommendation.id,
      createdAt: new Date().toISOString(),
      approvedAt: null, // Locked until human approval
      approvedBy: null,
      status: 'pending',
      steps,
      expectedOutcome: 'Operational harmony restored across all impacted departments.',
    };

    this.plans.set(planId, plan);
    this.generatedEvents.set(planId, []);
    return plan;
  }

  public getExecutionPlan(planId: string): ExecutionPlan | null {
    return this.plans.get(planId) || null;
  }

  /**
   * Human Approval Requirement:
   * Execution plans must be reviewed and explicitly signed by an operator.
   */
  public approveExecutionPlan(
    planId: string,
    operatorId: string
  ): { success: boolean; plan: ExecutionPlan } {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Execution plan '${planId}' not found.`);
    }

    plan.status = 'ready';
    plan.approvedAt = new Date().toISOString();
    plan.approvedBy = operatorId;

    // Unblock any step that has no prerequisite dependencies
    plan.steps.forEach((step) => {
      if (step.dependsOn.length === 0 && step.status === 'blocked') {
        step.status = 'ready';
      }
    });

    return { success: true, plan };
  }

  /**
   * Start Execution:
   * Enforces human approval before allowing workflow dispatch.
   */
  public startExecution(planId: string): { success: boolean; plan: ExecutionPlan } {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Execution plan '${planId}' not found.`);
    }

    if (!plan.approvedAt || plan.status === 'pending') {
      throw new Error(
        `Cannot start execution for plan '${planId}': Explicit human approval is required before execution dispatch.`
      );
    }

    plan.status = 'running';

    // Mark the first available step as ready if pending
    const firstStep = plan.steps.find((s) => s.dependsOn.length === 0);
    if (firstStep && (firstStep.status === 'pending' || firstStep.status === 'blocked')) {
      firstStep.status = 'ready';
    }

    return { success: true, plan };
  }

  /**
   * Execute a specific step within an approved plan:
   * 1. Validates step dependencies (cannot execute if preceding steps are not 'completed')
   * 2. Constructs typed DecisionEvent with executionContext provenance
   * 3. Sends event to StateTransitionEngine (closed loop!)
   * 4. Updates step status to 'completed' and unblocks dependent downstream steps
   */
  public async executeStep(planId: string, stepId: string): Promise<StepExecutionResult> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Execution plan '${planId}' not found.`);
    }

    if (plan.status !== 'running' && plan.status !== 'ready') {
      throw new Error(`Execution plan '${planId}' is not in an executable state (current: ${plan.status}).`);
    }

    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`Step '${stepId}' not found in plan '${planId}'.`);
    }

    if (step.status === 'completed') {
      throw new Error(`Step '${stepId}' has already been completed.`);
    }

    // Dependency check: All preceding steps must be completed
    for (const depId of step.dependsOn) {
      const depStep = plan.steps.find((s) => s.id === depId);
      if (!depStep || depStep.status !== 'completed') {
        step.status = 'blocked';
        throw new Error(
          `Cannot execute step '${step.title}' (ID: ${step.id}): Prerequisite step '${depStep ? depStep.title : depId}' must be completed first.`
        );
      }
    }

    step.status = 'running';
    step.startedAt = new Date().toISOString();

    // Construct typed DecisionEvent with provenance context
    const eventType = (step.resultingEvent?.event_type || 'feature_deprioritized') as ImpactMeshEventType;
    const eventId = `evt-flowtrace-${step.id}-${Date.now().toString().slice(-6)}`;

    const decisionEvent: DecisionEvent = {
      id: eventId,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      department: step.department,
      event_type: eventType,
      entity_id: step.resultingEvent?.entity_id || `ent-${step.department}`,
      payload: (step.resultingEvent?.payload || {}) as unknown as DecisionEvent['payload'],
      created_by: `FlowTrace Operator [${step.department.toUpperCase()}]`,
      created_at: new Date().toISOString(),
      execution_context: {
        executionPlanId: plan.id,
        executionStepId: step.id,
        decisionId: plan.decisionId,
        recommendationId: plan.sourceRecommendationId,
        sequence: step.sequence,
      },
      executionContext: {
        executionPlanId: plan.id,
        executionStepId: step.id,
        decisionId: plan.decisionId,
        recommendationId: plan.sourceRecommendationId,
        sequence: step.sequence,
      },
    };

    // Apply mutation through authoritative StateTransitionEngine
    const activeState: BusinessState = this.currentState || {
      id: 'state-live-flowtrace',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      timestamp: new Date().toISOString(),
      metrics: {
        available_budget: 1100000,
        committed_budget: 1100000,
        revenue_pipeline: 5000000,
        committed_revenue: 5000000,
        engineering_capacity: 300,
        engineering_demand: 420,
        capacity_utilization: 140,
        budget_pressure: 1.0,
        risk_score: 0.82,
        business_health: 64,
      },
      state_hash: 'live-flowtrace-init-hash',
      last_event_id: null,
      created_at: new Date().toISOString(),
    };

    const transitionResult = stateTransitionEngine.applyEvent(activeState, decisionEvent);
    this.currentState = transitionResult.nextState;

    // Persist to EventStore
    await eventStore.saveEvent(decisionEvent, transitionResult);

    // Record in local plan events
    const planEvents = this.generatedEvents.get(plan.id) || [];
    planEvents.push(decisionEvent);
    this.generatedEvents.set(plan.id, planEvents);

    // Complete step and record evidence
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    const evidence: ExecutionEvidence = {
      telemetrySummary: `Action '${step.actionType}' applied. State delta: ${transitionResult.stateDelta.changes.map((c) => `${c.metric}: ${c.delta > 0 ? '+' : ''}${c.delta}`).join(', ')}`,
      logs: [
        `[${step.completedAt}] Dispatched to ${step.departmentTitle}`,
        `[${step.completedAt}] Emitted DecisionEvent ${decisionEvent.id} (${decisionEvent.event_type})`,
        `[${step.completedAt}] StateTransition applied -> new state hash: ${transitionResult.nextState.state_hash}`,
      ],
      recordedAt: step.completedAt,
      operatorStamp: `Signed by Bridge Operator • Plan: ${plan.id}`,
    };
    step.evidence = evidence;

    // Evaluate downstream steps: unblock those whose dependencies are now satisfied
    plan.steps.forEach((s) => {
      if (s.status === 'blocked') {
        const allDepsSatisfied = s.dependsOn.every((depId) => {
          const d = plan.steps.find((st) => st.id === depId);
          return d && d.status === 'completed';
        });
        if (allDepsSatisfied) {
          s.status = 'ready';
        }
      }
    });

    // Check if entire plan is completed
    const allDone = plan.steps.every((s) => s.status === 'completed');
    if (allDone) {
      plan.status = 'completed';
    }

    return {
      step,
      event: decisionEvent,
      transitionResult,
    };
  }

  public pauseExecution(planId: string): { success: boolean; plan: ExecutionPlan } {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Execution plan '${planId}' not found.`);
    plan.status = 'blocked';
    return { success: true, plan };
  }

  public resumeExecution(planId: string): { success: boolean; plan: ExecutionPlan } {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Execution plan '${planId}' not found.`);
    plan.status = 'running';
    return { success: true, plan };
  }

  public getExecutionResult(planId: string): ExecutionResult {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Execution plan '${planId}' not found.`);

    const completed = plan.steps.filter((s) => s.status === 'completed').length;
    const events = this.generatedEvents.get(planId) || [];

    return {
      planId: plan.id,
      status: plan.status,
      completedStepsCount: completed,
      totalStepsCount: plan.steps.length,
      generatedEvents: events,
      startedAt: plan.approvedAt || plan.createdAt,
      completedAt: plan.status === 'completed' ? plan.steps[plan.steps.length - 1]?.completedAt : undefined,
      summary: `Execution plan '${plan.title}': ${completed}/${plan.steps.length} steps completed.`,
    };
  }

  public resetPlan(planId = CANONICAL_EXECUTION_PLAN_ID): ExecutionPlan {
    const freshPlan = createCanonicalBlacktideExecutionPlan();
    this.plans.set(planId, freshPlan);
    this.generatedEvents.set(planId, []);
    return freshPlan;
  }
}

export const flowTraceAdapter = new FlowTraceAdapter();
