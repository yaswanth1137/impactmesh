/**
 * IMPACTMESH - Impact Engine Interface
 * Layer 1: Deterministic and statistical calculations over the dependency graph.
 * Strict principle: Pure deterministic logic, zero LLM reliance.
 */

import type { BusinessState, ImpactResult, Dependency, BusinessEntity } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';

export interface DependencyGraphContext {
  entities: Map<string, BusinessEntity>;
  dependencies: Dependency[];
  directEntityId: string;
}

export interface ImpactCalculationInput {
  event: DecisionEvent;
  currentState: BusinessState;
  graphContext: DependencyGraphContext;
}

export interface IImpactEngine {
  /**
   * Evaluates an incoming event against the active state and dependency graph.
   * Produces deterministic metric deltas and identified cascade paths.
   */
  calculateImpact(input: ImpactCalculationInput): Promise<ImpactResult>;

  /**
   * Traverses graph dependencies outwards from the root entity to a maximum depth.
   */
  traverseCascadingDependencies(
    rootEntityId: string,
    dependencies: Dependency[],
    maxDepth?: number
  ): Array<{ entityId: string; depth: number; path: string[] }>;
}
