/**
 * IMPACTMESH - Materiality Engine Service
 * Layer 1.2: Filters low-significance noise so executives see only decision-grade impacts.
 *
 * Rules:
 * - Budget change > 10%
 * - Capacity deficit > 20h (or > 10% capacity delta)
 * - Delivery delay > 3 days
 * - Customer exposure > ₹5.0L
 * - Risk score change > 0.10
 */

import type { MetricDelta } from '../../../src/types/domain.ts';

export interface MaterialityThresholds {
  budgetChangeRatio: number;      // 0.10 (10%)
  capacityDeficitHours: number;   // 20 hours
  deliveryDelayDays: number;      // 3 days
  customerExposureRupees: number; // 500,000 (₹5.0L)
  riskDelta: number;              // 0.10
}

export const DEFAULT_MATERIALITY_THRESHOLDS: MaterialityThresholds = {
  budgetChangeRatio: 0.10,
  capacityDeficitHours: 20,
  deliveryDelayDays: 3,
  customerExposureRupees: 500000,
  riskDelta: 0.10,
};

export class MaterialityEngine {
  private thresholds: MaterialityThresholds;

  constructor(thresholds: MaterialityThresholds = DEFAULT_MATERIALITY_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Evaluates whether a specific MetricDelta is material.
   */
  public isMetricDeltaMaterial(delta: MetricDelta): boolean {
    const metric = delta.metric.toLowerCase();
    const absDelta = Math.abs(delta.delta);

    if (metric.includes('budget') || metric.includes('capital') || metric.includes('cost')) {
      const prev = delta.previous_value || 1;
      const ratio = absDelta / Math.max(1, Math.abs(prev));
      return ratio >= this.thresholds.budgetChangeRatio || absDelta >= 100000;
    }

    if (metric.includes('capacity') || metric.includes('demand') || metric.includes('hours') || metric.includes('load')) {
      return absDelta >= this.thresholds.capacityDeficitHours;
    }

    if (metric.includes('delivery') || metric.includes('slippage') || metric.includes('delay') || metric.includes('days')) {
      return absDelta >= this.thresholds.deliveryDelayDays;
    }

    if (metric.includes('revenue') || metric.includes('exposure') || metric.includes('deal')) {
      return absDelta >= this.thresholds.customerExposureRupees;
    }

    if (metric.includes('risk') || metric.includes('pressure') || metric.includes('confidence')) {
      return absDelta >= this.thresholds.riskDelta;
    }

    // Default: relative change >= 10% is material
    const prev = delta.previous_value || 1;
    return absDelta / Math.max(1, Math.abs(prev)) >= 0.10;
  }

  /**
   * Filters a list of MetricDeltas into material and secondary (low-significance) impacts.
   */
  public filterMaterialImpacts(deltas: MetricDelta[]): {
    material: MetricDelta[];
    secondary: MetricDelta[];
  } {
    const material: MetricDelta[] = [];
    const secondary: MetricDelta[] = [];

    for (const d of deltas) {
      if (this.isMetricDeltaMaterial(d)) {
        material.push(d);
      } else {
        secondary.push(d);
      }
    }

    return { material, secondary };
  }

  /**
   * Evaluates whether a graph entity impact is material based on propagation depth and relevance.
   */
  public isEntityImpactMaterial(depth: number, relevance: number): boolean {
    // Entities at depth 1-2 with relevance >= 0.40 are material; deeper hops require >= 0.60
    if (depth <= 2) {
      return relevance >= 0.35;
    }
    return relevance >= 0.60;
  }
}

export const materialityEngine = new MaterialityEngine();
