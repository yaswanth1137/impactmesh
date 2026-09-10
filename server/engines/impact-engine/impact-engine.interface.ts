/**
 * IMPACTMESH - Deterministic Impact Engine Interface & Contracts
 * Layer 1: Deterministic and statistical calculations over the dependency graph.
 * Pure deterministic logic, zero LLM reliance.
 */

import type { BusinessState, MetricDelta, AffectedEntitySummary, Dependency, BusinessEntity } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';
import type { StateDelta } from '../../services/state-transition/state-transition.interface.ts';
import type { ConstraintResult } from '../constraint-engine/constraint.interface.ts';

export interface DependencyGraphContext {
  entities: Map<string, BusinessEntity>;
  dependencies: Dependency[];
  directEntityId: string;
}

export interface RiskDimensions {
  budgetPressure: number;      // 0.0 - 1.0
  capacityPressure: number;    // 0.0 - 1.0 (deficit / demand)
  deadlinePressure: number;    // 0.0 - 1.0 (delay / max SLA)
  customerExposure: number;    // 0.0 - 1.0 (exposed revenue / total ARR)
  dependencyExposure: number;  // 0.0 - 1.0 (hop count & node ratio)
}

export interface RiskAssessment {
  overallRiskScore: number;    // 0.0 - 1.0
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dimensions: RiskDimensions;
  weights: Record<keyof RiskDimensions, number>;
  evidence: string[];
}

export interface PropagationPath {
  entityId: string;
  path: string[];
  depth: number;
  relevance: number;
  terminal: boolean;
}

export interface ImpactAnalysis {
  id: string;
  decision_event_id: string;
  analysisId: string;
  trigger: {
    eventId: string;
    eventType: string;
    department: string;
    summary: string;
  };
  currentState: BusinessState;
  affectedEntities: AffectedEntitySummary[];
  affected_entities: AffectedEntitySummary[];
  affectedPaths: PropagationPath[];
  metricDeltas: MetricDelta[];
  metric_deltas: MetricDelta[];
  materialImpacts: MetricDelta[];
  secondaryImpacts: MetricDelta[];
  constraintResults: ConstraintResult;
  riskAssessment: RiskAssessment;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidenceDossier: string[];
  generatedAt: string;
}

export interface ImpactCalculationInput {
  event: DecisionEvent;
  currentState: BusinessState;
  stateDelta?: StateDelta;
  graphContext: DependencyGraphContext;
  maxPropagationDepth?: number;
  relevanceThreshold?: number;
}

export interface IImpactEngine {
  calculateImpact(input: ImpactCalculationInput): Promise<ImpactAnalysis>;
  traverseCascadingDependencies(
    rootEntityId: string,
    dependencies: Dependency[],
    maxDepth?: number,
    relevanceThreshold?: number
  ): PropagationPath[];
  evaluateDeterministicRisk(
    state: BusinessState,
    deltas: MetricDelta[],
    affectedEntitiesCount: number
  ): RiskAssessment;
}
