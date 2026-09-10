/**
 * IMPACTMESH - Execution Layer Type Contracts
 * Canonical interfaces defining ExecutionPlans, ExecutionSteps, Provenance Context,
 * and Execution Results bridging IMPACTMESH recommendations to FlowTrace.
 */

import type { DepartmentCode } from './events.ts';
import type { DecisionEvent } from './events.ts';

export type ExecutionStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'skipped';

export interface ExecutionContext {
  executionPlanId: string;
  executionStepId: string;
  decisionId: string;
  recommendationId: string;
  sequence?: number;
}

export interface ExecutionEvidence {
  telemetrySummary: string;
  logs: string[];
  recordedAt: string;
  operatorStamp?: string;
}

export interface ExecutionStep {
  id: string;
  planId: string;
  sequence: number;
  department: DepartmentCode;
  departmentTitle: string;
  actionType: string;
  title: string;
  description: string;
  inputs: Record<string, unknown>;
  dependsOn: string[]; // Array of step IDs that must be 'completed' before this step is 'ready'
  expectedStateChanges: Record<string, unknown>;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  evidence?: ExecutionEvidence;
  resultingEvent?: Partial<DecisionEvent>;
}

export interface ExecutionPlan {
  id: string;
  decisionId: string;
  title: string;
  objective: string;
  sourceRecommendationId: string;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  status: ExecutionStatus;
  steps: ExecutionStep[];
  expectedOutcome: string;
}

export interface ExecutionResult {
  planId: string;
  status: ExecutionStatus;
  completedStepsCount: number;
  totalStepsCount: number;
  generatedEvents: DecisionEvent[];
  startedAt: string;
  completedAt?: string;
  summary: string;
}
