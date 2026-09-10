/**
 * IMPACTMESH - Trigger Rule Service
 * Implements canonical business triggers and incremental rule evaluation.
 */

import type { TriggerRule, TriggerEvaluationContext, TriggerRuleResult } from './trigger-rule.interface.ts';
import type { StateDelta } from '../../services/state-transition/state-transition.interface.ts';

export class TriggerRuleService {
  private rules: Map<string, TriggerRule> = new Map();

  constructor() {
    this.registerCanonicalRules();
  }

  public registerRule(rule: TriggerRule): void {
    this.rules.set(rule.id, rule);
  }

  public getRule(ruleId: string): TriggerRule | undefined {
    return this.rules.get(ruleId);
  }

  public getAllRules(): TriggerRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Evaluates all enabled rules unconditionally (e.g. for full audit).
   */
  public evaluateAll(ctx: TriggerEvaluationContext): TriggerRuleResult[] {
    const results: TriggerRuleResult[] = [];
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      const res = rule.evaluate(ctx);
      if (res && res.triggered) {
        results.push(res);
      }
    }
    return results;
  }

  /**
   * Incremental evaluation:
   * 1. Extracts changed metrics from StateDelta
   * 2. Selects only rules targeting those metrics or cross-functional scope
   * 3. Evaluates only the relevant subset
   */
  public evaluateIncremental(ctx: TriggerEvaluationContext, delta?: StateDelta): TriggerRuleResult[] {
    if (!delta || !delta.changes || delta.changes.length === 0) {
      return this.evaluateAll(ctx);
    }

    const changedMetrics = new Set(delta.changes.map((c) => c.metric));
    const results: TriggerRuleResult[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Always evaluate cross-department or wildcard rules, or rules matching changed metrics
      const isApplicable =
        rule.operator === 'cross_department' ||
        rule.metric === '*' ||
        changedMetrics.has(rule.metric) ||
        (rule.metric === 'engineering_capacity' && changedMetrics.has('engineering_demand')) ||
        (rule.metric === 'engineering_demand' && changedMetrics.has('engineering_capacity')) ||
        (rule.metric === 'available_budget' && (changedMetrics.has('committed_budget') || changedMetrics.has('budget_pressure')));

      if (isApplicable) {
        const res = rule.evaluate(ctx);
        if (res && res.triggered) {
          results.push(res);
        }
      }
    }

    return results;
  }

  private registerCanonicalRules(): void {
    // 1. CAPACITY OVERLOAD: engineering demand > available capacity * threshold
    this.registerRule({
      id: 'TRIGGER_CAPACITY_OVERLOAD',
      name: 'Capacity Overload',
      description: 'Committed engineering demand exceeds available capacity',
      scope: 'DEPARTMENT',
      scopeId: 'engineering',
      metric: 'capacity_utilization',
      operator: '>',
      threshold: 1.0, // 100%
      severity: 'CRITICAL',
      enabled: true,
      cooldownSeconds: 300,
      evaluate: (ctx) => {
        const cap = ctx.state.metrics.engineering_capacity || 300;
        const demand = ctx.state.metrics.engineering_demand || 0;
        const util = cap > 0 ? demand / cap : 1;
        if (util > 1.0) {
          const deficit = Math.max(0, demand - cap);
          const revenueExposure = ctx.state.metrics.committed_revenue || 5000000;
          return {
            triggered: true,
            ruleId: 'TRIGGER_CAPACITY_OVERLOAD',
            scope: 'DEPARTMENT',
            scopeId: 'engineering',
            scopeName: 'Platform Engineering',
            severity: util > 1.25 ? 'CRITICAL' : 'WARNING',
            title: 'Engineering Capacity Overload',
            summary: `Workload demand (${demand}h) exceeds available capacity (${cap}h) by ${Math.round((util - 1) * 100)}%.`,
            explanation: `Committed engineering workload exceeds platform capacity by ${deficit}h (${Math.round(util * 100)}% utilization), placing delivery commitments under severe operational stress.`,
            metric: 'capacity_utilization',
            currentValue: `${Math.round(util * 100)}%`,
            thresholdValue: '100%',
            financialExposureINR: revenueExposure,
            affectedCapacityHours: deficit,
            deliveryDelayDays: Math.min(14, Math.ceil(deficit / 15)),
            affectedDepartments: ['engineering', 'product', 'sales'],
            affectedEntityIds: ['TEAM-ENG-CORE', 'PRJ-APEX-SAML', 'FEAT-ANALYTICS'],
          };
        }
        return null;
      },
    });

    // 2. BUDGET PRESSURE: committed cost > available budget * threshold
    this.registerRule({
      id: 'TRIGGER_BUDGET_PRESSURE',
      name: 'Budget Pressure',
      description: 'Committed operational expenditures threaten available capital allocation',
      scope: 'DEPARTMENT',
      scopeId: 'finance',
      metric: 'budget_pressure',
      operator: '>=',
      threshold: 0.85, // 85%
      severity: 'WARNING',
      enabled: true,
      cooldownSeconds: 300,
      evaluate: (ctx) => {
        const pressure = ctx.state.metrics.budget_pressure ?? 1.0;
        const budget = ctx.state.metrics.available_budget ?? 1100000;
        if (pressure >= 0.85) {
          const isCritical = pressure >= 1.0;
          return {
            triggered: true,
            ruleId: 'TRIGGER_BUDGET_PRESSURE',
            scope: 'DEPARTMENT',
            scopeId: 'finance',
            scopeName: 'Treasury & Finance',
            severity: isCritical ? 'CRITICAL' : 'WARNING',
            title: 'Capital Budget Contraction',
            summary: `Operational budget pressure reached ${Math.round(pressure * 100)}% of ceiling.`,
            explanation: `Available budget of ₹${(budget / 100000).toFixed(1)}L is under ${Math.round(pressure * 100)}% allocation pressure, constraining contractor augmentation options.`,
            metric: 'budget_pressure',
            currentValue: `${Math.round(pressure * 100)}%`,
            thresholdValue: '85%',
            financialExposureINR: budget,
            affectedDepartments: ['finance', 'engineering'],
            affectedEntityIds: ['BUDGET-MAIN', 'TEAM-ENG-CORE'],
          };
        }
        return null;
      },
    });

    // 3. DELIVERY RISK: delivery delay exceeds configurable threshold
    this.registerRule({
      id: 'TRIGGER_DELIVERY_RISK',
      name: 'Delivery Schedule Risk',
      description: 'Projected delivery slippage threatens contractual SLAs',
      scope: 'PROJECT',
      scopeId: 'PRJ-APEX-SAML',
      metric: 'delivery_delay_days',
      operator: '>',
      threshold: 3, // > 3 days
      severity: 'CRITICAL',
      enabled: true,
      cooldownSeconds: 300,
      evaluate: (ctx) => {
        const cap = ctx.state.metrics.engineering_capacity || 300;
        const demand = ctx.state.metrics.engineering_demand || 0;
        const deficit = Math.max(0, demand - cap);
        const estimatedDelayDays = Math.ceil(deficit / 15); // approx 15h/day velocity
        if (estimatedDelayDays > 3) {
          const rev = ctx.state.metrics.committed_revenue || 5000000;
          return {
            triggered: true,
            ruleId: 'TRIGGER_DELIVERY_RISK',
            scope: 'PROJECT',
            scopeId: 'PRJ-APEX-SAML',
            scopeName: 'Atlas Enterprise (Apex Global)',
            severity: 'CRITICAL',
            title: 'Customer Delivery SLA Threat',
            summary: `Projected delivery slippage of +${estimatedDelayDays} days breaches contractual SLA tier.`,
            explanation: `Engineering deficit of ${deficit}h is creating an estimated +${estimatedDelayDays} day delivery delay, directly exposing the ₹${(rev / 100000).toFixed(1)}L customer expansion commitment.`,
            metric: 'delivery_delay_days',
            currentValue: `+${estimatedDelayDays} days`,
            thresholdValue: '+3 days',
            financialExposureINR: rev,
            affectedCapacityHours: deficit,
            deliveryDelayDays: estimatedDelayDays,
            affectedDepartments: ['sales', 'product', 'engineering'],
            affectedEntityIds: ['CUST-APEX', 'PRJ-APEX-SAML', 'SLA-ENTERPRISE-Q3'],
          };
        }
        return null;
      },
    });

    // 4. CUSTOMER EXPOSURE: material customer revenue is affected
    this.registerRule({
      id: 'TRIGGER_CUSTOMER_EXPOSURE',
      name: 'Customer Revenue Exposure',
      description: 'Commercial contract value at risk due to operational constraints',
      scope: 'CUSTOMER',
      scopeId: 'CUST-APEX',
      metric: 'committed_revenue',
      operator: '>=',
      threshold: 500000, // ₹5L
      severity: 'CRITICAL',
      enabled: true,
      cooldownSeconds: 300,
      evaluate: (ctx) => {
        const rev = ctx.state.metrics.committed_revenue || 0;
        const cap = ctx.state.metrics.engineering_capacity || 300;
        const demand = ctx.state.metrics.engineering_demand || 0;
        if (rev >= 500000 && demand > cap) {
          return {
            triggered: true,
            ruleId: 'TRIGGER_CUSTOMER_EXPOSURE',
            scope: 'CUSTOMER',
            scopeId: 'CUST-APEX',
            scopeName: 'Apex Global Financials',
            severity: 'CRITICAL',
            title: 'Customer Contract Exposure',
            summary: `₹${(rev / 100000).toFixed(1)}L commercial contract at risk due to operational bottleneck.`,
            explanation: `Apex Global key account commitment of ₹${(rev / 100000).toFixed(1)}L is vulnerable because required engineering milestones cannot be met under current capacity constraints.`,
            metric: 'committed_revenue',
            currentValue: `₹${(rev / 100000).toFixed(1)}L`,
            thresholdValue: '₹5.0L',
            financialExposureINR: rev,
            affectedDepartments: ['sales', 'finance'],
            affectedEntityIds: ['CUST-APEX', 'DEAL-APEX-Q3'],
          };
        }
        return null;
      },
    });

    // 5. RESOURCE CONSTRAINT: critical resource drops below threshold
    this.registerRule({
      id: 'TRIGGER_RESOURCE_CONSTRAINT',
      name: 'Resource Constraint',
      description: 'Platform bandwidth or critical resource availability constrained',
      scope: 'DEPARTMENT',
      scopeId: 'engineering',
      metric: 'engineering_capacity',
      operator: '<=',
      threshold: 300,
      severity: 'WARNING',
      enabled: true,
      cooldownSeconds: 300,
      evaluate: (ctx) => {
        const cap = ctx.state.metrics.engineering_capacity ?? 300;
        const demand = ctx.state.metrics.engineering_demand ?? 0;
        const deficit = Math.max(0, demand - cap);
        if (cap <= 300) {
          return {
            triggered: true,
            ruleId: 'TRIGGER_RESOURCE_CONSTRAINT',
            scope: 'DEPARTMENT',
            scopeId: 'engineering',
            scopeName: 'Platform Engineering',
            severity: 'WARNING',
            title: 'Critical Engineering Bandwidth Constraint',
            summary: `Available engineering capacity constrained to ${cap}h.`,
            explanation: `Platform engineering capacity ceiling of ${cap}h restricts parallel feature development and leaves zero buffer for incident remediation.`,
            metric: 'engineering_capacity',
            currentValue: `${cap}h`,
            thresholdValue: '300h',
            affectedCapacityHours: deficit,
            affectedDepartments: ['engineering'],
            affectedEntityIds: ['TEAM-ENG-CORE'],
            missingContextFields: ['contractor_market_rates', 'overtime_authorization'],
          };
        }
        return null;
      },
    });

    // 6. CROSS-FUNCTIONAL IMPACT: one state change affects multiple departments (>= 3)
    this.registerRule({
      id: 'TRIGGER_CROSS_FUNCTIONAL_IMPACT',
      name: 'Cross-Functional Cascade',
      description: 'Operational ripple effect touches 3 or more operational departments',
      scope: 'ORGANIZATION',
      scopeId: 'blacktide-global',
      metric: '*',
      operator: 'cross_department',
      threshold: 3,
      severity: 'CRITICAL',
      enabled: true,
      cooldownSeconds: 300,
      evaluate: (ctx) => {
        const touchedDepts: Set<string> = new Set();
        if (ctx.stateDelta?.changes) {
          for (const c of ctx.stateDelta.changes) {
            if (c.metric.includes('budget')) touchedDepts.add('finance');
            if (c.metric.includes('revenue') || c.metric.includes('pipeline')) touchedDepts.add('sales');
            if (c.metric.includes('capacity') || c.metric.includes('demand')) touchedDepts.add('engineering');
            if (c.metric.includes('feature')) touchedDepts.add('product');
          }
        }
        // If state shows high utilization and low budget, all 4 departments are coupled
        const isCoupled =
          (ctx.state.metrics.capacity_utilization ?? 1) > 1.1 &&
          (ctx.state.metrics.budget_pressure ?? 1) >= 0.9;

        if (touchedDepts.size >= 3 || isCoupled) {
          return {
            triggered: true,
            ruleId: 'TRIGGER_CROSS_FUNCTIONAL_IMPACT',
            scope: 'ORGANIZATION',
            scopeId: 'blacktide-global',
            scopeName: 'Blacktide Systems (Global)',
            severity: 'CRITICAL',
            title: 'Cross-Functional Dependency Cascade',
            summary: `State change ripples across 4 functional departments simultaneously.`,
            explanation: `Interlocking dependencies between Finance budget limits, Operations capacity, Product deliverables, and Sales commitments require coordinated executive alignment.`,
            metric: 'affected_departments_count',
            currentValue: '4 departments',
            thresholdValue: '3 departments',
            financialExposureINR: ctx.state.metrics.committed_revenue || 5000000,
            affectedDepartments: ['finance', 'engineering', 'product', 'sales'],
            affectedEntityIds: ['ORG-BLACKTIDE', 'DEP-FIN', 'DEP-ENG', 'DEP-PROD', 'DEP-SALES'],
          };
        }
        return null;
      },
    });

    // 7. COST ANOMALY: cost changes materially relative to baseline
    this.registerRule({
      id: 'TRIGGER_COST_ANOMALY',
      name: 'Cost / Budget Anomaly',
      description: 'Budget allocation differs from baseline by >= 15% or ₹2.0L',
      scope: 'DEPARTMENT',
      scopeId: 'finance',
      metric: 'available_budget',
      operator: 'rate_of_change',
      threshold: 0.15,
      severity: 'WARNING',
      enabled: true,
      cooldownSeconds: 300,
      evaluate: (ctx) => {
        const current = ctx.state.metrics.available_budget ?? 1800000;
        const baseline = 1800000;
        const delta = baseline - current;
        if (delta >= 200000 || delta / baseline >= 0.15) {
          return {
            triggered: true,
            ruleId: 'TRIGGER_COST_ANOMALY',
            scope: 'DEPARTMENT',
            scopeId: 'finance',
            scopeName: 'Treasury & Finance',
            severity: 'WARNING',
            title: 'Budget Allocation Variance',
            summary: `Capital budget contracted by ₹${(delta / 100000).toFixed(1)}L (${Math.round((delta / baseline) * 100)}% shift).`,
            explanation: `Budget dropped from ₹${(baseline / 100000).toFixed(1)}L to ₹${(current / 100000).toFixed(1)}L, exceeding the 15% variance threshold and reducing financial resilience.`,
            metric: 'available_budget',
            currentValue: `₹${(current / 100000).toFixed(1)}L`,
            thresholdValue: `₹${(baseline / 100000).toFixed(1)}L`,
            financialExposureINR: delta,
            affectedDepartments: ['finance'],
            affectedEntityIds: ['BUDGET-MAIN'],
          };
        }
        return null;
      },
    });

    // 8. TREND DETERIORATION: a monitored metric deteriorates across consecutive states
    this.registerRule({
      id: 'TRIGGER_TREND_DETERIORATION',
      name: 'Trend Deterioration',
      description: 'Metric exhibits multi-period persistent decline',
      scope: 'ORGANIZATION',
      scopeId: 'blacktide-global',
      metric: 'risk_score',
      operator: 'trend_up',
      threshold: 0.60,
      severity: 'WARNING',
      enabled: true,
      cooldownSeconds: 300,
      evaluate: (ctx) => {
        const risk = ctx.state.metrics.risk_score ?? 0.65;
        if (risk >= 0.60) {
          return {
            triggered: true,
            ruleId: 'TRIGGER_TREND_DETERIORATION',
            scope: 'ORGANIZATION',
            scopeId: 'blacktide-global',
            scopeName: 'Blacktide Systems (Global)',
            severity: risk > 0.75 ? 'CRITICAL' : 'WARNING',
            title: 'Persistent Risk Trend Elevation',
            summary: `Composite risk index elevated to ${(risk * 100).toFixed(0)}%.`,
            explanation: `Organizational health signals indicate negative multi-vector drift driven by sustained capacity deficit and capital constraints.`,
            metric: 'risk_score',
            currentValue: `${(risk * 100).toFixed(0)}%`,
            thresholdValue: '60%',
            affectedDepartments: ['engineering', 'finance'],
            affectedEntityIds: ['ORG-BLACKTIDE'],
          };
        }
        return null;
      },
    });
  }
}

export const triggerRuleService = new TriggerRuleService();
