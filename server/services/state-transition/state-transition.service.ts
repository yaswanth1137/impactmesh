/**
 * IMPACTMESH - State Transition Engine Implementation
 * Purely deterministic business state mutation service.
 * Applies typed DecisionEvents to BusinessState, producing exact state deltas
 * and identifying directly affected entities without probabilistic reasoning or LLMs.
 */

import type { BusinessMetrics, BusinessState } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';
import type {
  IStateTransitionEngine,
  StateTransitionResult,
  StateDelta,
  StateDeltaChange,
  AffectedEntityRef,
} from './state-transition.interface.ts';

/**
 * Deterministic hash function for business state integrity verification.
 */
function computeStateHash(metrics: BusinessMetrics, lastEventId: string | null): string {
  const content = JSON.stringify({
    b: metrics.available_budget,
    cb: metrics.committed_budget,
    rp: metrics.revenue_pipeline,
    cr: metrics.committed_revenue ?? 0,
    ec: metrics.engineering_capacity,
    ed: metrics.engineering_demand,
    cu: Math.round(metrics.capacity_utilization * 100) / 100,
    bp: Math.round(metrics.budget_pressure * 100) / 100,
    eid: lastEventId ?? '',
  });

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `st-hash-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export class StateTransitionEngine implements IStateTransitionEngine {
  public applyEvent(currentState: BusinessState, event: DecisionEvent): StateTransitionResult {
    // Clone metrics cleanly
    const beforeMetrics: BusinessMetrics = { ...currentState.metrics };
    const nextMetrics: BusinessMetrics = { ...currentState.metrics };
    const changes: StateDeltaChange[] = [];
    const affectedEntities: AffectedEntityRef[] = [];

    const payload = (event.payload || {}) as unknown as Record<string, unknown>;

    // Record change helper: records both camelCase and snake_case for maximum caller interoperability
    const recordChange = (
      camelMetric: string,
      snakeMetric: keyof BusinessMetrics,
      beforeVal: number,
      afterVal: number
    ) => {
      const delta = Math.round((afterVal - beforeVal) * 100) / 100;
      changes.push({
        metric: camelMetric,
        before: beforeVal,
        after: afterVal,
        delta,
      });
      if (camelMetric !== snakeMetric) {
        changes.push({
          metric: snakeMetric,
          before: beforeVal,
          after: afterVal,
          delta,
        });
      }
    };

    switch (event.event_type) {
      // =======================================================================
      // SALES EVENTS
      // =======================================================================
      case 'customer_added': {
        const arr = Number(payload.arr || 0);
        if (arr > 0) {
          const prevPipeline = nextMetrics.revenue_pipeline ?? 0;
          const newPipeline = prevPipeline + arr;
          nextMetrics.revenue_pipeline = newPipeline;
          recordChange('revenuePipeline', 'revenue_pipeline', prevPipeline, newPipeline);
        }
        affectedEntities.push({
          entityId: String(payload.customer_id || event.entity_id),
          entityType: 'customer',
          department: 'sales',
          details: `Customer added: ${payload.name || payload.customer_id}`,
        });
        break;
      }

      case 'deal_created': {
        const contractVal = Number(payload.contract_value || 0);
        const prevPipeline = nextMetrics.revenue_pipeline ?? 0;
        const newPipeline = prevPipeline + contractVal;
        nextMetrics.revenue_pipeline = newPipeline;
        recordChange('revenuePipeline', 'revenue_pipeline', prevPipeline, newPipeline);

        const prevDeals = nextMetrics.active_deals_count ?? 0;
        nextMetrics.active_deals_count = prevDeals + 1;

        affectedEntities.push({
          entityId: String(payload.deal_id || event.entity_id),
          entityType: 'deal',
          department: 'sales',
          details: `Deal created with pipeline value ₹${contractVal}`,
        });
        if (payload.customer_id) {
          affectedEntities.push({
            entityId: String(payload.customer_id),
            entityType: 'customer',
            department: 'sales',
          });
        }
        break;
      }

      case 'deal_value_changed': {
        const prevVal = Number(payload.previous_value || 0);
        const newVal = Number(payload.new_value || 0);
        const diff = newVal - prevVal;
        const prevPipeline = nextMetrics.revenue_pipeline ?? 0;
        const newPipeline = prevPipeline + diff;
        nextMetrics.revenue_pipeline = newPipeline;
        recordChange('revenuePipeline', 'revenue_pipeline', prevPipeline, newPipeline);

        affectedEntities.push({
          entityId: String(payload.deal_id || event.entity_id),
          entityType: 'deal',
          department: 'sales',
          details: `Deal value amended by ₹${diff}`,
        });
        break;
      }

      case 'deadline_changed': {
        affectedEntities.push({
          entityId: String(payload.deal_id || event.entity_id),
          entityType: 'deal',
          department: 'sales',
          details: `Deadline adjusted to ${payload.new_deadline}`,
        });
        break;
      }

      case 'deal_accepted': {
        const finalVal = Number(payload.final_value ?? payload.finalValue ?? 0);
        const prevCommittedRev = nextMetrics.committed_revenue ?? 0;
        const nextCommittedRev = prevCommittedRev + finalVal;
        nextMetrics.committed_revenue = nextCommittedRev;
        recordChange('committedRevenue', 'committed_revenue', prevCommittedRev, nextCommittedRev);

        // Ensure revenue pipeline reflects accepted revenue if starting from 0
        const prevPipeline = nextMetrics.revenue_pipeline ?? 0;
        if (prevPipeline < nextCommittedRev) {
          nextMetrics.revenue_pipeline = nextCommittedRev;
          recordChange('revenuePipeline', 'revenue_pipeline', prevPipeline, nextCommittedRev);
        }

        affectedEntities.push({
          entityId: String(payload.deal_id || event.entity_id),
          entityType: 'deal',
          department: 'sales',
          details: `Deal accepted and committed for ₹${finalVal}`,
        });
        break;
      }

      case 'customer_risk_changed': {
        const newRisk = Number(payload.new_risk || 0);
        affectedEntities.push({
          entityId: String(payload.customer_id || event.entity_id),
          entityType: 'customer',
          department: 'sales',
          details: `Customer risk tier adjusted to ${newRisk}`,
        });
        break;
      }

      // =======================================================================
      // PRODUCT EVENTS
      // =======================================================================
      case 'feature_requested': {
        const scopePts = Number(payload.estimated_scope_points || 0);
        affectedEntities.push({
          entityId: String(payload.feature_id || event.entity_id),
          entityType: 'feature',
          department: 'product',
          details: `Feature requested with estimated ${scopePts} scope points`,
        });
        break;
      }

      case 'feature_committed': {
        const committedHours = Number(
          payload.committed_capacity_hours ?? payload.committedCapacityHours ?? 0
        );
        const prevDemand = nextMetrics.engineering_demand ?? 0;
        const nextDemand = prevDemand + committedHours;
        nextMetrics.engineering_demand = nextDemand;
        recordChange('engineeringDemand', 'engineering_demand', prevDemand, nextDemand);

        // Recalculate capacity utilization
        const cap = nextMetrics.engineering_capacity ?? 0;
        const prevUtil = nextMetrics.capacity_utilization ?? 0;
        const nextUtil = cap > 0 ? Math.round((nextDemand / cap) * 10000) / 100 : 100;
        nextMetrics.capacity_utilization = nextUtil;
        recordChange('capacityUtilization', 'capacity_utilization', prevUtil, nextUtil);

        const countIncrement = Number(payload.feature_count ?? payload.featureCount ?? 1);
        nextMetrics.committed_features_count = (nextMetrics.committed_features_count ?? 0) + countIncrement;

        affectedEntities.push({
          entityId: String(payload.feature_id || event.entity_id),
          entityType: 'feature',
          department: 'product',
          details: `Feature committed: +${committedHours}h demand`,
        });
        affectedEntities.push({
          entityId: 'ent-eng-capacity',
          entityType: 'resource',
          department: 'engineering',
          details: `Engineering capacity load increased to ${nextUtil}%`,
        });
        break;
      }

      case 'feature_scope_changed': {
        const prevPts = Number(payload.previous_points || 0);
        const nextPts = Number(payload.new_points || 0);
        const deltaPts = nextPts - prevPts;
        const prevScope = nextMetrics.committed_scope_points ?? 0;
        const nextScope = prevScope + deltaPts;
        nextMetrics.committed_scope_points = nextScope;
        recordChange('committedScopePoints', 'committed_scope_points', prevScope, nextScope);

        affectedEntities.push({
          entityId: String(payload.feature_id || event.entity_id),
          entityType: 'feature',
          department: 'product',
          details: `Scope points amended from ${prevPts} to ${nextPts}`,
        });
        break;
      }

      case 'feature_deprioritized': {
        const freedHours = Number(payload.freed_capacity_hours || 0);
        const prevDemand = nextMetrics.engineering_demand ?? 0;
        const nextDemand = Math.max(0, prevDemand - freedHours);
        nextMetrics.engineering_demand = nextDemand;
        recordChange('engineeringDemand', 'engineering_demand', prevDemand, nextDemand);

        const cap = nextMetrics.engineering_capacity ?? 0;
        const prevUtil = nextMetrics.capacity_utilization ?? 0;
        const nextUtil = cap > 0 ? Math.round((nextDemand / cap) * 10000) / 100 : 0;
        nextMetrics.capacity_utilization = nextUtil;
        recordChange('capacityUtilization', 'capacity_utilization', prevUtil, nextUtil);

        nextMetrics.committed_features_count = Math.max(0, (nextMetrics.committed_features_count ?? 1) - 1);

        affectedEntities.push({
          entityId: String(payload.feature_id || event.entity_id),
          entityType: 'feature',
          department: 'product',
          details: `Feature deprioritized: freed ${freedHours}h`,
        });
        break;
      }

      case 'launch_date_changed': {
        const slippage = Number(payload.slippage_weeks || 0);
        const prevPressure = nextMetrics.delivery_pressure ?? 0;
        const nextPressure = Math.min(1.0, Math.round((prevPressure + slippage * 0.05) * 100) / 100);
        nextMetrics.delivery_pressure = nextPressure;
        recordChange('deliveryPressure', 'delivery_pressure', prevPressure, nextPressure);

        affectedEntities.push({
          entityId: String(payload.feature_id || event.entity_id),
          entityType: 'feature',
          department: 'product',
          details: `Target launch slipped by ${slippage} weeks`,
        });
        break;
      }

      case 'priority_changed': {
        affectedEntities.push({
          entityId: String(payload.feature_id || event.entity_id),
          entityType: 'feature',
          department: 'product',
          details: `Priority updated from ${payload.previous_priority} to ${payload.new_priority}`,
        });
        break;
      }

      // =======================================================================
      // ENGINEERING / OPERATIONS EVENTS
      // =======================================================================
      case 'capacity_changed': {
        const prevCap = Number(
          payload.previous_capacity_hours ?? payload.previousCapacity ?? beforeMetrics.engineering_capacity
        );
        const nextCap = Number(payload.new_capacity_hours ?? payload.newCapacity ?? prevCap);
        nextMetrics.engineering_capacity = nextCap;
        recordChange('engineeringCapacity', 'engineering_capacity', prevCap, nextCap);

        // Recalculate capacity utilization
        const demand = nextMetrics.engineering_demand ?? 0;
        const prevUtil = nextMetrics.capacity_utilization ?? 0;
        const nextUtil = nextCap > 0 ? Math.round((demand / nextCap) * 10000) / 100 : 100;
        nextMetrics.capacity_utilization = nextUtil;
        recordChange('capacityUtilization', 'capacity_utilization', prevUtil, nextUtil);

        affectedEntities.push({
          entityId: String(payload.team_id || event.entity_id || 'ent-eng-capacity'),
          entityType: 'resource',
          department: 'engineering',
          details: `Engineering capacity shifted to ${nextCap}h (utilization: ${nextUtil}%)`,
        });
        break;
      }

      case 'resource_unavailable': {
        const days = Number(payload.duration_days || 0);
        affectedEntities.push({
          entityId: String(payload.resource_id || event.entity_id),
          entityType: 'resource',
          department: 'engineering',
          details: `Resource unavailable for ${days} days`,
        });
        if (Array.isArray(payload.affected_features)) {
          payload.affected_features.forEach((featId) => {
            affectedEntities.push({
              entityId: String(featId),
              entityType: 'feature',
              department: 'product',
              details: 'Blocked by resource unavailability',
            });
          });
        }
        break;
      }

      case 'delivery_delay': {
        const delayDays = Number(payload.delay_days || 0);
        const prevPressure = nextMetrics.delivery_pressure ?? 0;
        const nextPressure = Math.min(1.0, Math.round((prevPressure + (delayDays / 30) * 0.2) * 100) / 100);
        nextMetrics.delivery_pressure = nextPressure;
        recordChange('deliveryPressure', 'delivery_pressure', prevPressure, nextPressure);

        affectedEntities.push({
          entityId: String(payload.project_id || event.entity_id),
          entityType: 'project',
          department: 'engineering',
          details: `Delivery delayed by ${delayDays} days`,
        });
        break;
      }

      case 'infrastructure_cost_changed': {
        const prevCost = Number(payload.previous_monthly_cost || 0);
        const nextCost = Number(payload.new_monthly_cost || 0);
        const costDiff = nextCost - prevCost;

        const prevCommittedBudget = nextMetrics.committed_budget ?? 0;
        const nextCommittedBudget = prevCommittedBudget + costDiff;
        nextMetrics.committed_budget = nextCommittedBudget;
        recordChange('committedBudget', 'committed_budget', prevCommittedBudget, nextCommittedBudget);

        const prevAvail = nextMetrics.available_budget ?? 0;
        const nextAvail = Math.max(0, prevAvail - costDiff);
        nextMetrics.available_budget = nextAvail;
        recordChange('availableBudget', 'available_budget', prevAvail, nextAvail);

        const prevPressure = nextMetrics.budget_pressure ?? 0;
        const totalCapital = nextAvail + nextCommittedBudget;
        const nextPressure = totalCapital > 0 ? Math.round((nextCommittedBudget / totalCapital) * 100) / 100 : 1.0;
        nextMetrics.budget_pressure = nextPressure;
        recordChange('budgetPressure', 'budget_pressure', prevPressure, nextPressure);

        affectedEntities.push({
          entityId: String(payload.service || event.entity_id),
          entityType: 'infrastructure',
          department: 'engineering',
          details: `Monthly infra cost changed from ₹${prevCost} to ₹${nextCost}`,
        });
        affectedEntities.push({
          entityId: 'ent-budget',
          entityType: 'budget',
          department: 'finance',
        });
        break;
      }

      case 'supplier_delay': {
        affectedEntities.push({
          entityId: String(payload.supplier_id || event.entity_id),
          entityType: 'supplier',
          department: 'engineering',
          details: `Supplier ${payload.supplier_name || payload.supplier_id} delayed by ${payload.delay_days} days`,
        });
        break;
      }

      // =======================================================================
      // FINANCE EVENTS
      // =======================================================================
      case 'budget_changed': {
        const prevBudget = Number(
          payload.previous_budget ?? payload.previousBudget ?? beforeMetrics.available_budget
        );
        const nextBudget = Number(payload.new_budget ?? payload.newBudget ?? prevBudget);
        nextMetrics.available_budget = nextBudget;
        recordChange('availableBudget', 'available_budget', prevBudget, nextBudget);

        // Recalculate budget pressure
        const committed = nextMetrics.committed_budget ?? 0;
        const prevPressure = nextMetrics.budget_pressure ?? 0;
        const newPressure = nextBudget > 0 ? Math.round((committed / nextBudget) * 100) / 100 : 1.0;
        nextMetrics.budget_pressure = Math.min(1.0, Math.max(0, newPressure));
        recordChange('budgetPressure', 'budget_pressure', prevPressure, nextMetrics.budget_pressure);

        affectedEntities.push({
          entityId: 'ent-budget',
          entityType: 'budget',
          department: 'finance',
          details: `Available budget adjusted from ₹${prevBudget} to ₹${nextBudget}`,
        });
        if (payload.department) {
          affectedEntities.push({
            entityId: String(payload.department),
            entityType: 'department',
            department: String(payload.department),
          });
        }
        break;
      }

      case 'cost_changed': {
        const deltaAmount = Number(payload.delta_amount || 0);

        const prevCommitted = nextMetrics.committed_budget ?? 0;
        const nextCommitted = prevCommitted + deltaAmount;
        nextMetrics.committed_budget = nextCommitted;
        recordChange('committedBudget', 'committed_budget', prevCommitted, nextCommitted);

        const prevAvail = nextMetrics.available_budget ?? 0;
        const nextAvail = Math.max(0, prevAvail - deltaAmount);
        nextMetrics.available_budget = nextAvail;
        recordChange('availableBudget', 'available_budget', prevAvail, nextAvail);

        const prevPressure = nextMetrics.budget_pressure ?? 0;
        const total = nextAvail + nextCommitted;
        const nextPressure = total > 0 ? Math.round((nextCommitted / total) * 100) / 100 : 1.0;
        nextMetrics.budget_pressure = nextPressure;
        recordChange('budgetPressure', 'budget_pressure', prevPressure, nextPressure);

        affectedEntities.push({
          entityId: 'ent-budget',
          entityType: 'budget',
          department: 'finance',
          details: `Cost variance: delta of ₹${deltaAmount}`,
        });
        break;
      }

      case 'spending_freeze': {
        affectedEntities.push({
          entityId: String(payload.department || 'global'),
          entityType: 'budget_policy',
          department: 'finance',
          details: `Spending freeze enacted for ${payload.department || 'all departments'}`,
        });
        break;
      }

      case 'funding_approved': {
        const approved = Number(payload.approved_amount || 0);
        const prevAvail = nextMetrics.available_budget ?? 0;
        const nextAvail = prevAvail + approved;
        nextMetrics.available_budget = nextAvail;
        recordChange('availableBudget', 'available_budget', prevAvail, nextAvail);

        const committed = nextMetrics.committed_budget ?? 0;
        const prevPressure = nextMetrics.budget_pressure ?? 0;
        const nextPressure = nextAvail > 0 ? Math.round((committed / nextAvail) * 100) / 100 : 1.0;
        nextMetrics.budget_pressure = nextPressure;
        recordChange('budgetPressure', 'budget_pressure', prevPressure, nextPressure);

        affectedEntities.push({
          entityId: String(payload.allocation_id || event.entity_id),
          entityType: 'capital_allocation',
          department: 'finance',
          details: `Capital injection approved: +₹${approved}`,
        });
        break;
      }

      case 'runway_changed': {
        const prevRunway = Number(payload.previous_runway_months ?? nextMetrics.runway_months ?? 0);
        const nextRunway = Number(payload.new_runway_months ?? prevRunway);
        nextMetrics.runway_months = nextRunway;
        recordChange('runwayMonths', 'runway_months', prevRunway, nextRunway);

        affectedEntities.push({
          entityId: 'ent-treasury',
          entityType: 'treasury',
          department: 'finance',
          details: `Cash runway updated to ${nextRunway} months`,
        });
        break;
      }

      default: {
        // Unknown or unhandled event type: maintain state without mutation
        break;
      }
    }

    // Mirror camelCase aliases onto metrics for immediate property-access convenience
    nextMetrics.availableBudget = nextMetrics.available_budget;
    nextMetrics.committedBudget = nextMetrics.committed_budget;
    nextMetrics.revenuePipeline = nextMetrics.revenue_pipeline;
    nextMetrics.engineeringCapacity = nextMetrics.engineering_capacity;
    nextMetrics.engineeringDemand = nextMetrics.engineering_demand;
    nextMetrics.capacityUtilization = nextMetrics.capacity_utilization;
    nextMetrics.budgetPressure = nextMetrics.budget_pressure;
    nextMetrics.riskScore = nextMetrics.risk_score;
    nextMetrics.businessHealth = nextMetrics.business_health;
    nextMetrics.committedRevenue = nextMetrics.committed_revenue;
    nextMetrics.runwayMonths = nextMetrics.runway_months;
    nextMetrics.deliveryPressure = nextMetrics.delivery_pressure;

    const nextStateHash = computeStateHash(nextMetrics, event.id);

    const nextState: BusinessState = {
      id: `state-${Date.now()}-${event.id.slice(0, 8)}`,
      organization_id: currentState.organization_id || event.organization_id,
      timestamp: event.created_at || new Date().toISOString(),
      metrics: nextMetrics,
      state_hash: nextStateHash,
      last_event_id: event.id,
      created_at: new Date().toISOString(),
      entities: currentState.entities ? { ...currentState.entities } : {},
      version: (currentState.version ?? 1) + 1,
    };

    const stateDelta: StateDelta = {
      eventId: event.id,
      timestamp: event.created_at || new Date().toISOString(),
      changes,
    };

    return {
      nextState,
      stateDelta,
      affectedEntities,
    };
  }
}

export const stateTransitionEngine = new StateTransitionEngine();
