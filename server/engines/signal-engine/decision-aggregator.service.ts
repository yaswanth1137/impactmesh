/**
 * IMPACTMESH - Decision Aggregator & Executive Brief Service
 * Aggregates, filters, and groups signals by executive role (CEO, CFO, COO, TEAM_LEAD).
 */

import type { Signal } from './signal.interface.ts';
import type { ExecutiveRole } from '../../../src/types/policies.ts';

export interface DecisionBriefItem {
  signalId: string;
  scope: string;
  scopeName: string;
  title: string;
  summary: string;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  priorityRank: 'P1' | 'P2' | 'P3' | 'P4';
  metricHighlight: string;
  financialExposureINR?: number;
  whyItMatters: string;
  recommendedAction: string;
  actionAvailable: boolean;
}

export interface DecisionBrief {
  role: ExecutiveRole | 'TEAM_LEAD' | string;
  headline: string;
  totalSignalsCount: number;
  criticalCount: number;
  itemsNeedingAttention: DecisionBriefItem[];
  recentlyResolved: Array<{ title: string; resolution: string; resolvedAt: string }>;
  keyExposures: {
    totalFinancialINR: number;
    capacityDeficitHours: number;
    maxDeliveryDelayDays: number;
  };
  generatedAt: string;
}

export class DecisionAggregatorService {
  /**
   * Produces a filtered, role-tailored Executive Decision Brief from active signals.
   */
  public generateBrief(
    signals: Signal[],
    roleInput: ExecutiveRole | 'TEAM_LEAD' | 'CEO' | 'CFO' | 'COO' | string
  ): DecisionBrief {
    const roleNormalized = roleInput.toLowerCase();
    const role: ExecutiveRole | 'TEAM_LEAD' =
      roleNormalized === 'team_lead'
        ? 'TEAM_LEAD'
        : (roleNormalized as ExecutiveRole);

    // 1. Filter signals relevant to the executive role
    const filteredSignals = signals.filter((s) => this.isSignalRelevantToRole(s, role));

    // 2. Sort by priority score descending (P1 first, then highest score)
    const sorted = [...filteredSignals].sort((a, b) => b.priorityScore - a.priorityScore);

    // 3. Transform to clean executive brief items
    const itemsNeedingAttention: DecisionBriefItem[] = sorted.map((s) => {
      let metricHighlight = `${s.evidence.metric}: ${s.evidence.currentValue}`;
      if (s.evidence.affectedCapacityHours && s.evidence.affectedCapacityHours > 0) {
        metricHighlight = `${s.evidence.affectedCapacityHours}h deficit (demand vs cap)`;
      } else if (s.evidence.deliveryDelayDays && s.evidence.deliveryDelayDays > 0) {
        metricHighlight = `+${s.evidence.deliveryDelayDays} days delivery exposure`;
      } else if (s.evidence.financialExposureINR && s.evidence.financialExposureINR > 0) {
        metricHighlight = `₹${(s.evidence.financialExposureINR / 100000).toFixed(1)}L exposure`;
      }

      return {
        signalId: s.id,
        scope: s.scope,
        scopeName: s.scopeName,
        title: s.title,
        summary: s.summary,
        severity: s.severity,
        priorityRank: s.priorityRank,
        metricHighlight,
        financialExposureINR: s.evidence.financialExposureINR,
        whyItMatters: s.evidence.explanation,
        recommendedAction: s.priorityRank === 'P1' ? 'Formal Decision Required' : 'Review & Validate Context',
        actionAvailable: s.state === 'NEW' || s.state === 'REVIEWING',
      };
    });

    // 4. Calculate key exposures
    let totalFinancialINR = 0;
    let capacityDeficitHours = 0;
    let maxDeliveryDelayDays = 0;

    for (const s of filteredSignals) {
      if (s.evidence.financialExposureINR) {
        totalFinancialINR = Math.max(totalFinancialINR, s.evidence.financialExposureINR);
      }
      if (s.evidence.affectedCapacityHours) {
        capacityDeficitHours = Math.max(capacityDeficitHours, s.evidence.affectedCapacityHours);
      }
      if (s.evidence.deliveryDelayDays) {
        maxDeliveryDelayDays = Math.max(maxDeliveryDelayDays, s.evidence.deliveryDelayDays);
      }
    }

    const criticalCount = itemsNeedingAttention.filter((i) => i.severity === 'CRITICAL').length;
    const headline = this.generateHeadline(roleInput.toUpperCase(), itemsNeedingAttention.length, criticalCount);

    return {
      role: roleInput.toUpperCase(),
      headline,
      totalSignalsCount: itemsNeedingAttention.length,
      criticalCount,
      itemsNeedingAttention,
      recentlyResolved: [
        {
          title: 'Customer commitment preserved',
          resolution: 'Apex Global scope phased to match available engineering bandwidth',
          resolvedAt: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          title: 'Capacity reallocated',
          resolution: 'Normalized team workload to 100% capacity ceiling',
          resolvedAt: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      keyExposures: {
        totalFinancialINR,
        capacityDeficitHours,
        maxDeliveryDelayDays,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private isSignalRelevantToRole(signal: Signal, role: ExecutiveRole | 'TEAM_LEAD'): boolean {
    // Only active signals needing attention
    if (signal.state === 'DISMISSED' || signal.state === 'RESOLVED') {
      return false;
    }

    switch (role) {
      case 'ceo':
        // CEO cares about revenue, enterprise customers, high-materiality cross-dept cascades
        return (
          signal.materiality === 'HIGH' ||
          signal.scope === 'CUSTOMER' ||
          signal.scope === 'ORGANIZATION' ||
          signal.relatedDepartments.includes('sales') ||
          (signal.evidence.financialExposureINR ?? 0) >= 1000000
        );

      case 'cfo':
        // CFO cares about budget, spend variance, cash, runway, financial exposure
        return (
          signal.relatedDepartments.includes('finance') ||
          signal.scopeId === 'finance' ||
          signal.evidence.metric.includes('budget') ||
          signal.evidence.metric.includes('cost') ||
          (signal.evidence.financialExposureINR ?? 0) > 0
        );

      case 'coo':
        // COO cares about capacity, operational delivery, SLA delays, engineering deficit
        return (
          signal.relatedDepartments.includes('engineering') ||
          signal.relatedDepartments.includes('product') ||
          signal.scopeId === 'engineering' ||
          signal.evidence.metric.includes('capacity') ||
          signal.evidence.metric.includes('delay') ||
          (signal.evidence.affectedCapacityHours ?? 0) > 0
        );

      case 'TEAM_LEAD':
        // Team lead cares about local operational blockers and direct resource constraints
        return (
          signal.scope === 'ENTITY' ||
          signal.scope === 'DEPARTMENT' ||
          signal.relatedDepartments.includes('engineering')
        );

      default:
        return true;
    }
  }

  private generateHeadline(role: string, total: number, critical: number): string {
    if (total === 0) return 'ALL OPERATIONAL STATIONS NOMINAL // NO ACTIVE SIGNALS';
    if (critical > 0) {
      return `${critical} CRITICAL ITEM${critical > 1 ? 'S' : ''} REQUIRE IMMEDIATE ${role} ATTENTION`;
    }
    return `${total} ITEM${total > 1 ? 'S' : ''} REQUIRE ${role} REVIEW`;
  }
}

export const decisionAggregatorService = new DecisionAggregatorService();
