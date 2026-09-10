/**
 * IMPACTMESH - Deterministic Impact Engine Service
 * Implementation of Layer 1: Deterministic / statistical calculations over dependency graph.
 */

import type {
  IImpactEngine,
  ImpactCalculationInput,
} from './impact-engine.interface.ts';
import type {
  ImpactResult,
  MetricDelta,
  AffectedEntitySummary,
  Dependency,
} from '../../../src/types/domain.ts';
import { DEFAULT_THRESHOLDS } from '../../../src/config/constants.ts';

export class DeterministicImpactEngine implements IImpactEngine {
  public traverseCascadingDependencies(
    rootEntityId: string,
    dependencies: Dependency[],
    maxDepth = 3
  ): Array<{ entityId: string; depth: number; path: string[] }> {
    const visited = new Set<string>();
    const results: Array<{ entityId: string; depth: number; path: string[] }> = [];
    const queue: Array<{ entityId: string; depth: number; path: string[] }> = [
      { entityId: rootEntityId, depth: 0, path: [rootEntityId] },
    ];

    visited.add(rootEntityId);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      if (current.depth > 0) {
        results.push(current);
      }

      if (current.depth >= maxDepth) continue;

      // Find outbound connections
      const connectedEdges = dependencies.filter(
        (dep) => dep.source_entity_id === current.entityId
      );

      for (const edge of connectedEdges) {
        if (!visited.has(edge.target_entity_id)) {
          visited.add(edge.target_entity_id);
          queue.push({
            entityId: edge.target_entity_id,
            depth: current.depth + 1,
            path: [...current.path, edge.target_entity_id],
          });
        }
      }
    }

    return results;
  }

  public async calculateImpact(input: ImpactCalculationInput): Promise<ImpactResult> {
    const { event, currentState, graphContext } = input;
    const { entities, dependencies, directEntityId } = graphContext;

    // 1. Traverse graph to find affected downstream entities
    const cascadeResults = this.traverseCascadingDependencies(
      directEntityId,
      dependencies,
      3
    );

    const affectedEntities: AffectedEntitySummary[] = [];

    // Add direct entity
    const directEntity = entities.get(directEntityId);
    if (directEntity) {
      affectedEntities.push({
        entity_id: directEntity.id,
        entity_name: directEntity.name,
        entity_type: directEntity.entity_type,
        department: directEntity.department,
        direct_or_cascaded: 'direct',
        impact_severity: 'high',
        details: `Direct target of event [${event.event_type}].`,
      });
    }

    // Add downstream entities
    cascadeResults.forEach((cascaded) => {
      const entity = entities.get(cascaded.entityId);
      if (entity) {
        const severity = cascaded.depth === 1 ? 'high' : cascaded.depth === 2 ? 'medium' : 'low';
        affectedEntities.push({
          entity_id: entity.id,
          entity_name: entity.name,
          entity_type: entity.entity_type,
          department: entity.department,
          direct_or_cascaded: 'cascaded',
          impact_severity: severity,
          details: `Cascaded via dependency path: ${cascaded.path.join(' -> ')}`,
        });
      }
    });

    // 2. Deterministic Metric Deltas computation based on department and event payload
    const metricDeltas: MetricDelta[] = [];
    const payload = event.payload as unknown as Record<string, unknown>;

    if (event.department === 'finance' && event.event_type === 'budget_changed') {
      const prev = Number(payload.previous_budget || currentState.metrics.available_budget);
      const next = Number(payload.new_budget || prev);
      const delta = next - prev;
      metricDeltas.push({
        metric: 'available_budget',
        previous_value: prev,
        new_value: next,
        delta,
        delta_pct: prev !== 0 ? (delta / prev) * 100 : 0,
      });

      // Recalculate budget pressure deterministically
      const committed = currentState.metrics.committed_budget;
      const newPressure = next > 0 ? committed / next : 1.0;
      metricDeltas.push({
        metric: 'budget_pressure',
        previous_value: currentState.metrics.budget_pressure,
        new_value: Math.min(1.0, Math.max(0, newPressure)),
        delta: newPressure - currentState.metrics.budget_pressure,
        delta_pct: 0,
      });
    } else if (event.department === 'sales' && (event.event_type === 'deal_created' || event.event_type === 'deal_value_changed')) {
      const contractValue = Number(payload.contract_value || payload.new_value || 0);
      const prevPipeline = currentState.metrics.revenue_pipeline;
      const nextPipeline = prevPipeline + contractValue;
      metricDeltas.push({
        metric: 'revenue_pipeline',
        previous_value: prevPipeline,
        new_value: nextPipeline,
        delta: contractValue,
        delta_pct: prevPipeline !== 0 ? (contractValue / prevPipeline) * 100 : 100,
      });
    } else if (event.department === 'engineering' && event.event_type === 'capacity_changed') {
      const prevCap = Number(payload.previous_capacity_hours || currentState.metrics.engineering_capacity);
      const nextCap = Number(payload.new_capacity_hours || prevCap);
      const delta = nextCap - prevCap;
      metricDeltas.push({
        metric: 'engineering_capacity',
        previous_value: prevCap,
        new_value: nextCap,
        delta,
        delta_pct: prevCap !== 0 ? (delta / prevCap) * 100 : 0,
      });

      const demand = currentState.metrics.engineering_demand;
      const nextUtil = nextCap > 0 ? (demand / nextCap) * 100 : 100;
      metricDeltas.push({
        metric: 'capacity_utilization',
        previous_value: currentState.metrics.capacity_utilization,
        new_value: nextUtil,
        delta: nextUtil - currentState.metrics.capacity_utilization,
        delta_pct: 0,
      });
    }

    // 3. Deterministic Risk Assessment
    const maxCascadeDepth = cascadeResults.reduce((max, r) => Math.max(max, r.depth), 0);
    const capacityPressure = currentState.metrics.capacity_utilization >= DEFAULT_THRESHOLDS.CAPACITY_WARNING_PCT;
    const budgetPressure = currentState.metrics.budget_pressure >= DEFAULT_THRESHOLDS.BUDGET_PRESSURE_HIGH;

    const riskScore = Math.min(
      1.0,
      (capacityPressure ? 0.35 : 0.1) +
      (budgetPressure ? 0.35 : 0.1) +
      (maxCascadeDepth * 0.1)
    );

    const primaryRisks: string[] = [];
    if (capacityPressure) primaryRisks.push('Engineering capacity exceeding threshold.');
    if (budgetPressure) primaryRisks.push('Budget pressure elevated relative to commitments.');
    if (maxCascadeDepth > 1) primaryRisks.push(`Multi-hop cascade affects ${affectedEntities.length} entities.`);

    return {
      id: `impact-${Date.now()}`,
      organization_id: event.organization_id,
      decision_event_id: event.id,
      affected_entities: affectedEntities,
      metric_deltas: metricDeltas,
      cascade_depth: maxCascadeDepth,
      deterministic_score: Math.round((1 - riskScore) * 100),
      risk_assessment: {
        overall_risk: riskScore > DEFAULT_THRESHOLDS.RISK_SCORE_CRITICAL ? 'critical' : riskScore > 0.5 ? 'high' : riskScore > 0.3 ? 'medium' : 'low',
        risk_score: Number(riskScore.toFixed(2)),
        primary_risks: primaryRisks,
        bottlenecks: cascadeResults.map((c) => c.entityId),
      },
      confidence_score: 0.95,
      calculated_at: new Date().toISOString(),
    };
  }
}

export const impactEngine = new DeterministicImpactEngine();
