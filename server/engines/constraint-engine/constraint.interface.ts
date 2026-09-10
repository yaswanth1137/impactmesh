/**
 * IMPACTMESH - Business Constraint Contracts
 * Layer 1.5: Validates operational, financial, SLA, and capacity boundaries.
 */

import type { BusinessState } from '../../../src/types/domain.ts';

export type ConstraintDimension =
  | 'capacity'
  | 'budget'
  | 'delivery'
  | 'sla'
  | 'customer'
  | 'risk';

export type ConstraintSeverity = 'hard' | 'soft';

export interface ConstraintEvaluation {
  satisfied: boolean;
  isNearViolation: boolean; // within tolerance (e.g. 10% threshold)
  currentValue: number;
  threshold: number;
  deficitOrExcess: number;
  message: string;
}

export interface Constraint {
  id: string;
  name: string;
  dimension: ConstraintDimension;
  operator: '<=' | '>=' | '<' | '>' | '==';
  threshold: number;
  severity: ConstraintSeverity;
  description: string;
  evaluate: (state: BusinessState, context?: Record<string, unknown>) => ConstraintEvaluation;
}

export interface ConstraintViolation {
  constraintId: string;
  constraintName: string;
  dimension: ConstraintDimension;
  severity: ConstraintSeverity;
  currentValue: number;
  threshold: number;
  deficitOrExcess: number;
  description: string;
  isNearViolation: boolean;
}

export interface ConstraintResult {
  overallFeasible: boolean;
  violations: ConstraintViolation[];
  nearViolations: ConstraintViolation[];
  hardViolationsCount: number;
  softViolationsCount: number;
  summary: string;
}

export interface IConstraintEngine {
  evaluateConstraints(state: BusinessState, context?: Record<string, unknown>): ConstraintResult;
  getConstraints(): Constraint[];
  addConstraint(constraint: Constraint): void;
}
