/**
 * IMPACTMESH - FlowTrace Execution Adapter Interface
 * Defines the contract bridging IMPACTMESH Strategic Recommendations to
 * FlowTrace operational step execution and closed-loop DecisionEvent generation.
 */

import type { Decision, Recommendation } from '../../../src/types/domain.ts';
import type { ExecutionPlan, ExecutionResult, ExecutionStep } from '../../../src/types/execution.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';
import type { StateTransitionResult } from '../state-transition/state-transition.interface.ts';

export interface StepExecutionResult {
  step: ExecutionStep;
  event: DecisionEvent;
  transitionResult: StateTransitionResult;
}

export interface IFlowTraceAdapter {
  createExecutionPlan(
    recommendation: Recommendation,
    decision: Decision,
    customSteps?: ExecutionStep[]
  ): ExecutionPlan;

  getExecutionPlan(planId: string): ExecutionPlan | null;

  approveExecutionPlan(
    planId: string,
    operatorId: string
  ): { success: boolean; plan: ExecutionPlan };

  startExecution(
    planId: string
  ): { success: boolean; plan: ExecutionPlan };

  executeStep(
    planId: string,
    stepId: string
  ): Promise<StepExecutionResult>;

  pauseExecution(
    planId: string
  ): { success: boolean; plan: ExecutionPlan };

  resumeExecution(
    planId: string
  ): { success: boolean; plan: ExecutionPlan };

  getExecutionResult(
    planId: string
  ): ExecutionResult;
}
