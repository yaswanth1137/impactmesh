/**
 * IMPACTMESH - Signal Priority & Materiality Service
 * Deterministic multi-dimensional scoring and explainable priority evidence.
 */

import type { TriggerRuleResult } from './trigger-rule.interface.ts';
import type { MaterialityLevel } from './signal.interface.ts';

export interface PriorityScoreResult {
  score: number; // 0 - 100
  rank: 'P1' | 'P2' | 'P3' | 'P4';
  materiality: MaterialityLevel;
  evidenceFactors: string[];
}

export class SignalPriorityService {
  /**
   * Calculates deterministic priority score, rank, and materiality:
   * Score = 0.25 * Financial + 0.25 * Customer + 0.20 * Severity + 0.15 * Depts + 0.15 * Delivery/Constraint
   */
  public calculatePriority(result: TriggerRuleResult): PriorityScoreResult {
    const evidenceFactors: string[] = [];

    // 1. Financial Exposure Factor (0 - 100)
    let financialScore = 20;
    const fin = result.financialExposureINR ?? 0;
    if (fin >= 5000000) {
      financialScore = 100;
      evidenceFactors.push(`₹${(fin / 100000).toFixed(0)}L financial exposure`);
    } else if (fin >= 1000000) {
      financialScore = 75;
      evidenceFactors.push(`₹${(fin / 100000).toFixed(1)}L financial exposure`);
    } else if (fin >= 200000) {
      financialScore = 50;
      evidenceFactors.push(`₹${(fin / 100000).toFixed(1)}L variance`);
    }

    // 2. Customer Exposure Factor (0 - 100)
    let customerScore = 20;
    if (result.scope === 'CUSTOMER' || result.affectedDepartments.includes('sales')) {
      if (fin >= 5000000) {
        customerScore = 100;
        evidenceFactors.push('Tier-1 key enterprise account commitment at risk');
      } else {
        customerScore = 70;
        evidenceFactors.push('Customer delivery milestone impact');
      }
    }

    // 3. Severity Factor (0 - 100)
    let severityScore = 30;
    if (result.severity === 'CRITICAL') {
      severityScore = 100;
    } else if (result.severity === 'WARNING') {
      severityScore = 60;
    }

    // 4. Cross-department Coupling Factor (0 - 100)
    const deptCount = result.affectedDepartments.length;
    let deptScore = Math.min(100, deptCount * 25);
    if (deptCount >= 3) {
      evidenceFactors.push(`${deptCount} operational departments coupled`);
    }

    // 5. Delivery & Capacity Deficit Factor (0 - 100)
    let constraintScore = 30;
    if (result.affectedCapacityHours && result.affectedCapacityHours > 0) {
      constraintScore = Math.min(100, Math.round((result.affectedCapacityHours / 120) * 100));
      evidenceFactors.push(`${result.affectedCapacityHours}h engineering deficit`);
    }
    if (result.deliveryDelayDays && result.deliveryDelayDays > 0) {
      evidenceFactors.push(`+${result.deliveryDelayDays} days delivery pressure`);
    }

    // Weighted composite
    const score = Math.round(
      0.25 * financialScore +
      0.25 * customerScore +
      0.20 * severityScore +
      0.15 * deptScore +
      0.15 * constraintScore
    );

    // Rank mapping
    let rank: 'P1' | 'P2' | 'P3' | 'P4' = 'P3';
    if (score >= 80) rank = 'P1';
    else if (score >= 60) rank = 'P2';
    else if (score >= 40) rank = 'P3';
    else rank = 'P4';

    // Materiality threshold evaluation
    let materiality: MaterialityLevel = 'LOW';
    if (score >= 70 || fin >= 2000000 || deptCount >= 3 || (result.affectedCapacityHours ?? 0) >= 60) {
      materiality = 'HIGH';
    } else if (score >= 45 || fin >= 500000 || (result.affectedCapacityHours ?? 0) >= 20) {
      materiality = 'MEDIUM';
    }

    return {
      score,
      rank,
      materiality,
      evidenceFactors,
    };
  }
}

export const signalPriorityService = new SignalPriorityService();
