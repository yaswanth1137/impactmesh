/**
 * IMPACTMESH - Decision Engine Service
 * Implementation of Layer 2: Generating decision options and scoring policy alignment.
 */

import type {
  IDecisionEngine,
  DecisionGenerationInput,
} from './decision-engine.interface.ts';
import type { DecisionOption } from '../../../src/types/domain.ts';
import type { ExpertPolicy, ExecutiveRole } from '../../../src/types/policies.ts';

export class RuleBasedDecisionEngine implements IDecisionEngine {
  public scoreOptionAgainstPolicies(
    option: DecisionOption,
    policies: Record<ExecutiveRole, ExpertPolicy>
  ): Record<ExecutiveRole, number> {
    const scores: Record<ExecutiveRole, number> = {
      ceo: 50,
      cfo: 50,
      coo: 50,
      balanced: 50,
    };

    // Calculate alignment using policy weights and option tradeoffs
    for (const role of ['ceo', 'cfo', 'coo', 'balanced'] as ExecutiveRole[]) {
      const policy = policies[role];
      if (!policy) continue;

      let score = option.feasibility_score;

      // Adjust based on executive priorities
      if (role === 'ceo') {
        // CEO favors growth and accept/scale options
        if (option.action_type === 'accept' || option.action_type === 'scale_capacity') {
          score += 20;
        } else if (option.action_type === 'reject') {
          score -= 30;
        }
      } else if (role === 'cfo') {
        // CFO favors cash preservation, cost control, negotiation
        if (option.action_type === 'negotiate' || option.action_type === 'reject') {
          score += 15;
        } else if (option.action_type === 'scale_capacity') {
          score -= 25; // Capital expenditure penalty
        }
      } else if (role === 'coo') {
        // COO favors capacity stability, delays or scope adjustments
        if (option.action_type === 'delay' || option.action_type === 'negotiate') {
          score += 20;
        } else if (option.action_type === 'accept' && option.feasibility_score < 70) {
          score -= 20; // Delivery failure risk
        }
      } else if (role === 'balanced') {
        score = (scores.ceo + scores.cfo + scores.coo) / 3;
      }

      scores[role] = Math.max(10, Math.min(98, Math.round(score)));
    }

    return scores;
  }

  public async generateOptions(input: DecisionGenerationInput): Promise<DecisionOption[]> {
    const { event, currentState, impactResult, policies } = input;
    const options: DecisionOption[] = [];

    const baseEventId = event.id;

    // Option A: Direct Acceptance / Execution
    const optAccept: DecisionOption = {
      id: `opt-${baseEventId}-accept`,
      event_id: baseEventId,
      title: 'Absorb and Execute Commitment',
      description: 'Proceed with full scope as requested, absorbing capacity and financial deltas.',
      action_type: 'accept',
      projected_metrics: {
        capacity_utilization: Math.min(100, currentState.metrics.capacity_utilization + 12),
        budget_pressure: currentState.metrics.budget_pressure + 0.05,
      },
      feasibility_score: impactResult.risk_assessment.overall_risk === 'critical' ? 42 : 78,
      policy_alignment: { ceo: 85, cfo: 45, coo: 50, balanced: 60 },
      tradeoffs: {
        pros: ['Maximizes deal ARR and customer satisfaction', 'Immediate commercial milestone hit'],
        cons: ['Tightens engineering team slack', 'Elevates sprint delivery risk'],
        risks: ['Potential SLA breach if secondary blockers occur'],
      },
      rationale: 'Direct execution preserves customer momentum but places operational stress on downstream teams.',
    };
    optAccept.policy_alignment = this.scoreOptionAgainstPolicies(optAccept, policies);
    options.push(optAccept);

    // Option B: Negotiate / Phased Scope
    const optNegotiate: DecisionOption = {
      id: `opt-${baseEventId}-negotiate`,
      event_id: baseEventId,
      title: 'Phased Scope Delivery & Milestone Restructure',
      description: 'Deliver core critical features in Phase 1; defer secondary requirements to Phase 2.',
      action_type: 'negotiate',
      projected_metrics: {
        capacity_utilization: currentState.metrics.capacity_utilization + 5,
        budget_pressure: currentState.metrics.budget_pressure,
      },
      feasibility_score: 88,
      policy_alignment: { ceo: 70, cfo: 80, coo: 85, balanced: 78 },
      tradeoffs: {
        pros: ['Maintains engineering stability', 'Guarantees on-time delivery for high-priority items'],
        cons: ['Requires commercial customer alignment call'],
        risks: ['Minor friction in initial sales negotiation'],
      },
      rationale: 'Balancing delivery certainty with customer commitments.',
    };
    optNegotiate.policy_alignment = this.scoreOptionAgainstPolicies(optNegotiate, policies);
    options.push(optNegotiate);

    // Option C: Scale Capacity with External Contractors
    const optScale: DecisionOption = {
      id: `opt-${baseEventId}-scale`,
      event_id: baseEventId,
      title: 'Augment Capacity via Pre-vetted Contractors',
      description: 'Approve temporary contractor spend to absorb additional scope without slipping dates.',
      action_type: 'scale_capacity',
      projected_metrics: {
        available_budget: Math.max(0, currentState.metrics.available_budget - 50000),
        capacity_utilization: currentState.metrics.capacity_utilization - 8,
      },
      feasibility_score: 72,
      policy_alignment: { ceo: 75, cfo: 50, coo: 80, balanced: 68 },
      tradeoffs: {
        pros: ['Protects internal team velocity', 'Meets aggressive customer deadline'],
        cons: ['Incurs direct operational expense', 'Onboarding overhead of 1-2 weeks'],
        risks: ['Contractor deliverable quality variance'],
      },
      rationale: 'Trades short-term budget for team stability and deadline protection.',
    };
    optScale.policy_alignment = this.scoreOptionAgainstPolicies(optScale, policies);
    options.push(optScale);

    return options;
  }
}

export const decisionEngine = new RuleBasedDecisionEngine();
