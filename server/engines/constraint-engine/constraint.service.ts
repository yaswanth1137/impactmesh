/**
 * IMPACTMESH - Business Constraint Engine Service
 * Implementation of Layer 1.5: Validates operational, financial, SLA, and capacity boundaries.
 * Enforces hard and soft business constraints without LLM guesswork.
 */

import type { BusinessState } from '../../../src/types/domain.ts';
import type {
  IConstraintEngine,
  Constraint,
  ConstraintResult,
  ConstraintViolation,
  ConstraintEvaluation,
} from './constraint.interface.ts';

export class BusinessConstraintEngine implements IConstraintEngine {
  private constraints: Map<string, Constraint> = new Map();

  constructor() {
    this.registerDefaultConstraints();
  }

  private registerDefaultConstraints(): void {
    // 1. Engineering Demand <= Available Capacity (Hard Constraint)
    this.addConstraint({
      id: 'CONST_CAPACITY_LIMIT',
      name: 'Engineering Capacity Ceiling',
      dimension: 'capacity',
      operator: '<=',
      threshold: 0, // demand - capacity <= 0
      severity: 'hard',
      description: 'Active engineering demand must not exceed available sprint engineering capacity.',
      evaluate: (state: BusinessState): ConstraintEvaluation => {
        const capacity = state.metrics.engineering_capacity || 300;
        const demand = state.metrics.engineering_demand || 0;
        const deficit = demand - capacity; // > 0 means deficit
        const satisfied = deficit <= 0;
        const isNear = !satisfied || (deficit <= 0 && deficit > -30); // within 30h of ceiling

        return {
          satisfied,
          isNearViolation: isNear,
          currentValue: demand,
          threshold: capacity,
          deficitOrExcess: deficit,
          message: satisfied
            ? `Engineering load balanced: ${demand}h demand / ${capacity}h capacity.`
            : `Engineering capacity violated: ${demand}h required exceeds ${capacity}h capacity by ${deficit}h (${state.metrics.capacity_utilization}% load).`,
        };
      },
    });

    // 2. Committed Budget <= Available Budget (Hard Constraint)
    this.addConstraint({
      id: 'CONST_BUDGET_CAP',
      name: 'Fiscal Budget Cap',
      dimension: 'budget',
      operator: '<=',
      threshold: 0,
      severity: 'hard',
      description: 'Committed operational expenditure must not exceed available quarterly budget.',
      evaluate: (state: BusinessState): ConstraintEvaluation => {
        const available = state.metrics.available_budget;
        const committed = state.metrics.committed_budget;
        const overspend = committed - available;
        const satisfied = overspend <= 0;
        const isNear = overspend >= -100000; // within ₹1.0L of budget cap

        return {
          satisfied,
          isNearViolation: isNear,
          currentValue: committed,
          threshold: available,
          deficitOrExcess: overspend,
          message: satisfied
            ? `Committed expenditure within cap: ₹${(committed / 100000).toFixed(1)}L of ₹${(available / 100000).toFixed(1)}L.`
            : `Budget cap breached: ₹${(committed / 100000).toFixed(1)}L committed against ₹${(available / 100000).toFixed(1)}L available (deficit: ₹${(overspend / 100000).toFixed(1)}L).`,
        };
      },
    });

    // 3. Delivery Slippage <= Customer SLA Threshold (Hard Constraint)
    this.addConstraint({
      id: 'CONST_DELIVERY_SLA',
      name: 'Customer Contract SLA Threshold',
      dimension: 'sla',
      operator: '<=',
      threshold: 5, // max 5 days slippage allowed under SLA
      severity: 'hard',
      description: 'Projected delivery slippage must not exceed 5 business days without incurring SLA penalties.',
      evaluate: (state: BusinessState, context?: Record<string, unknown>): ConstraintEvaluation => {
        // Evaluate delivery delay from context or state metrics
        const delayDays = typeof context?.deliveryDelayDays === 'number'
          ? context.deliveryDelayDays
          : state.metrics.capacity_utilization > 130
          ? 8
          : state.metrics.capacity_utilization > 110
          ? 4
          : 0;

        const maxAllowed = 5;
        const satisfied = delayDays <= maxAllowed;
        const isNear = delayDays >= 3 && delayDays <= maxAllowed;

        return {
          satisfied,
          isNearViolation: isNear,
          currentValue: delayDays,
          threshold: maxAllowed,
          deficitOrExcess: delayDays - maxAllowed,
          message: satisfied
            ? `Delivery schedule aligned: +${delayDays} days within SLA threshold (+${maxAllowed} days).`
            : `Customer SLA breached: +${delayDays} days slippage exceeds contractual SLA limit of +${maxAllowed} days.`,
        };
      },
    });

    // 4. Minimum Budget Buffer >= 10% (Soft Constraint)
    this.addConstraint({
      id: 'CONST_MIN_BUFFER',
      name: 'Reserve Capital Buffer',
      dimension: 'budget',
      operator: '>=',
      threshold: 0.10, // at least 10% uncommitted buffer
      severity: 'soft',
      description: 'At least 10% of total available capital should remain uncommitted as an operational buffer.',
      evaluate: (state: BusinessState): ConstraintEvaluation => {
        const available = state.metrics.available_budget;
        const committed = state.metrics.committed_budget;
        const uncommitted = available - committed;
        const bufferRatio = available > 0 ? uncommitted / available : 0;
        const satisfied = bufferRatio >= 0.10;
        const isNear = bufferRatio < 0.15 && bufferRatio >= 0.10;

        return {
          satisfied,
          isNearViolation: isNear,
          currentValue: Math.round(bufferRatio * 100),
          threshold: 10,
          deficitOrExcess: Math.round((0.10 - bufferRatio) * 100),
          message: satisfied
            ? `Capital buffer adequate: ${(bufferRatio * 100).toFixed(1)}% uncommitted reserve.`
            : `Low capital reserve: only ${(bufferRatio * 100).toFixed(1)}% buffer remaining (< 10% target).`,
        };
      },
    });

    // 5. Organizational Risk Score <= 0.75 (Soft Constraint)
    this.addConstraint({
      id: 'CONST_RISK_CAP',
      name: 'Organizational Risk Tolerance',
      dimension: 'risk',
      operator: '<=',
      threshold: 0.75,
      severity: 'soft',
      description: 'Overall organizational risk score should not exceed 0.75.',
      evaluate: (state: BusinessState): ConstraintEvaluation => {
        const risk = state.metrics.risk_score;
        const satisfied = risk <= 0.75;
        const isNear = risk >= 0.65 && risk <= 0.75;

        return {
          satisfied,
          isNearViolation: isNear,
          currentValue: risk,
          threshold: 0.75,
          deficitOrExcess: +(risk - 0.75).toFixed(2),
          message: satisfied
            ? `Risk within operational tolerance: ${(risk * 100).toFixed(0)}% score.`
            : `Elevated operational risk: ${(risk * 100).toFixed(0)}% exceeds 75% tolerance threshold.`,
        };
      },
    });
  }

  public addConstraint(constraint: Constraint): void {
    this.constraints.set(constraint.id, constraint);
  }

  public getConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  public evaluateConstraints(
    state: BusinessState,
    context?: Record<string, unknown>
  ): ConstraintResult {
    const violations: ConstraintViolation[] = [];
    const nearViolations: ConstraintViolation[] = [];

    let hardViolationsCount = 0;
    let softViolationsCount = 0;

    for (const constraint of this.constraints.values()) {
      const evalResult = constraint.evaluate(state, context);

      if (!evalResult.satisfied) {
        const violation: ConstraintViolation = {
          constraintId: constraint.id,
          constraintName: constraint.name,
          dimension: constraint.dimension,
          severity: constraint.severity,
          currentValue: evalResult.currentValue,
          threshold: evalResult.threshold,
          deficitOrExcess: evalResult.deficitOrExcess,
          description: evalResult.message,
          isNearViolation: false,
        };
        violations.push(violation);

        if (constraint.severity === 'hard') {
          hardViolationsCount++;
        } else {
          softViolationsCount++;
        }
      } else if (evalResult.isNearViolation) {
        nearViolations.push({
          constraintId: constraint.id,
          constraintName: constraint.name,
          dimension: constraint.dimension,
          severity: constraint.severity,
          currentValue: evalResult.currentValue,
          threshold: evalResult.threshold,
          deficitOrExcess: evalResult.deficitOrExcess,
          description: evalResult.message,
          isNearViolation: true,
        });
      }
    }

    const overallFeasible = hardViolationsCount === 0;

    const summary = overallFeasible
      ? violations.length === 0
        ? 'All business constraints satisfied. Operational posture healthy.'
        : `${softViolationsCount} soft constraint warning(s) detected. Execution feasible.`
      : `${hardViolationsCount} hard constraint violation(s) detected: ${violations
          .filter((v) => v.severity === 'hard')
          .map((v) => v.constraintName)
          .join(', ')}.`;

    return {
      overallFeasible,
      violations,
      nearViolations,
      hardViolationsCount,
      softViolationsCount,
      summary,
    };
  }
}

export const businessConstraintEngine = new BusinessConstraintEngine();
