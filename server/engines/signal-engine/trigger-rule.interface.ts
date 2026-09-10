/**
 * IMPACTMESH - Trigger Rule Contracts
 * Defines rule schemas, evaluation operators, and criteria for business triggers.
 */

import type { BusinessState } from '../../../src/types/domain.ts';
import type { DepartmentCode } from '../../../src/types/events.ts';
import type { StateDelta } from '../../services/state-transition/state-transition.interface.ts';
import type { SignalScope } from './signal.interface.ts';

export type TriggerOperator =
  | '>'
  | '>='
  | '<'
  | '<='
  | '=='
  | 'trend_up'
  | 'trend_down'
  | 'rate_of_change'
  | 'conflict'
  | 'dependency_count'
  | 'cross_department';

export interface TriggerEvaluationContext {
  state: BusinessState;
  stateDelta?: StateDelta;
  historyStates?: BusinessState[];
}

export interface TriggerRuleResult {
  triggered: boolean;
  ruleId: string;
  scope: SignalScope;
  scopeId: string;
  scopeName: string;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  title: string;
  summary: string;
  explanation: string;
  metric: string;
  currentValue: number | string;
  thresholdValue: number | string;
  financialExposureINR?: number;
  affectedCapacityHours?: number;
  deliveryDelayDays?: number;
  affectedDepartments: DepartmentCode[];
  affectedEntityIds: string[];
  missingContextFields?: string[];
}

export interface TriggerRule {
  id: string;
  name: string;
  description: string;
  scope: SignalScope;
  scopeId?: string;
  metric: string;
  operator: TriggerOperator;
  threshold: number;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  enabled: boolean;
  cooldownSeconds: number;
  evaluate: (ctx: TriggerEvaluationContext) => TriggerRuleResult | null;
}
