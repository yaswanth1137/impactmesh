/**
 * IMPACTMESH - Phase 4 Intelligence Core Tests
 * Comprehensive Vitest verification covering:
 * - Deterministic Impact Engine (direct impact, multi-hop, materiality, cutoff, evidence)
 * - Constraint Engine (hard/soft constraints, violations, near-violations)
 * - Decision Engine (feasible option generation, constraint rejection, CEO/CFO/COO divergence)
 * - Groq Strategic Reasoning (prompt construction, missing key fallback, structured JSON parsing)
 * - End-to-End closed-loop: Event -> State -> Impact -> Constraints -> Options -> Recommendation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeterministicImpactEngine } from '../../server/engines/impact-engine/impact-engine.service.ts';
import { materialityEngine } from '../../server/engines/impact-engine/materiality.service.ts';
import { BusinessConstraintEngine } from '../../server/engines/constraint-engine/constraint.service.ts';
import { DeterministicDecisionEngine } from '../../server/engines/decision-engine/decision-engine.service.ts';
import { GroqService } from '../../server/services/groq-service.ts';
import { StateTransitionEngine } from '../../server/services/state-transition/state-transition.service.ts';
import { EXECUTIVE_POLICIES } from '../../server/policies/executive-policies.ts';
import type { BusinessState, BusinessEntity, Dependency } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('Phase 4 Intelligence Core', () => {
  let impactEngine: DeterministicImpactEngine;
  let constraintEngine: BusinessConstraintEngine;
  let decisionEngine: DeterministicDecisionEngine;
  let stateEngine: StateTransitionEngine;

  const getBaselineState = (): BusinessState => ({
    id: 'state-baseline',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    timestamp: '2026-09-10T09:00:00Z',
    metrics: {
      available_budget: 1100000,
      committed_budget: 1100000,
      revenue_pipeline: 5000000,
      committed_revenue: 5000000,
      engineering_capacity: 300,
      engineering_demand: 420,
      capacity_utilization: 140, // 140% DEFICIT
      budget_pressure: 1.0,
      risk_score: 0.82,
      business_health: 64,
    },
    state_hash: 'hash-baseline',
    last_event_id: 'demo-evt-04-budget-changed',
    created_at: '2026-09-10T09:00:00Z',
  });

  const createEntity = (id: string, name: string, entity_type: any, department: any): BusinessEntity => ({
    id,
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    name,
    entity_type,
    department,
    status: 'active',
    metadata: {},
    created_at: '2026-09-10T09:00:00Z',
    updated_at: '2026-09-10T09:00:00Z',
  });

  const mockEntities = new Map<string, BusinessEntity>([
    ['ent-budget-q1', createEntity('ent-budget-q1', 'Q1 Tech & Engineering Budget', 'budget', 'finance')],
    ['ent-feat-reports', createEntity('ent-feat-reports', 'Custom Executive Analytics Builder', 'feature', 'product')],
    ['ent-feat-sso', createEntity('ent-feat-sso', 'Enterprise SAML Multi-Tenant SSO', 'feature', 'product')],
    ['ent-res-eng', createEntity('ent-res-eng', 'Platform Core Engineering Pod', 'resource', 'operations')],
    ['ent-outcome-delivery', createEntity('ent-outcome-delivery', 'Q3 Delivery Milestone', 'outcome', 'operations')],
    ['ent-deal-apex', createEntity('ent-deal-apex', 'Apex Enterprise Expansion', 'deal', 'sales')],
    ['ent-cust-apex', createEntity('ent-cust-apex', 'Apex Global Financial Corp', 'customer', 'sales')],
  ]);

  const mockDependencies: Dependency[] = [
    { id: 'd1', organization_id: 'org', source_entity_id: 'ent-budget-q1', target_entity_id: 'ent-feat-reports', relation_type: 'constrains', strength: 0.9, created_at: '' },
    { id: 'd2', organization_id: 'org', source_entity_id: 'ent-feat-reports', target_entity_id: 'ent-res-eng', relation_type: 'consumes', strength: 0.85, created_at: '' },
    { id: 'd3', organization_id: 'org', source_entity_id: 'ent-res-eng', target_entity_id: 'ent-outcome-delivery', relation_type: 'affects', strength: 0.95, created_at: '' },
    { id: 'd4', organization_id: 'org', source_entity_id: 'ent-outcome-delivery', target_entity_id: 'ent-deal-apex', relation_type: 'governs', strength: 0.9, created_at: '' },
    { id: 'd5', organization_id: 'org', source_entity_id: 'ent-deal-apex', target_entity_id: 'ent-cust-apex', relation_type: 'delivers_to', strength: 0.99, created_at: '' },
  ];

  const mockBudgetEvent: DecisionEvent = {
    id: 'evt-fin-cut-01',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    department: 'finance',
    event_type: 'budget_changed',
    entity_id: 'ent-budget-q1',
    payload: {
      department: 'finance',
      fiscal_period: 'Q1',
      previous_budget: 1800000,
      new_budget: 1100000,
      reason: 'Fiscal contraction',
    },
    created_by: 'Priya Sharma (Finance)',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    impactEngine = new DeterministicImpactEngine();
    constraintEngine = new BusinessConstraintEngine();
    decisionEngine = new DeterministicDecisionEngine();
    stateEngine = new StateTransitionEngine();
  });

  // ===========================================================================
  // 1. IMPACT ENGINE TESTS
  // ===========================================================================
  describe('Impact Engine', () => {
    it('traverses downstream dependencies across multiple hops with decaying relevance', () => {
      const paths = impactEngine.traverseCascadingDependencies(
        'ent-budget-q1',
        mockDependencies,
        4,
        0.20
      );

      expect(paths.length).toBeGreaterThanOrEqual(4);
      // First hop: budget -> feat-reports
      expect(paths[0].entityId).toBe('ent-feat-reports');
      expect(paths[0].depth).toBe(1);
      expect(paths[0].relevance).toBe(0.75);

      // Second hop: feat-reports -> res-eng
      expect(paths[1].entityId).toBe('ent-res-eng');
      expect(paths[1].depth).toBe(2);
      expect(paths[1].relevance).toBe(0.56);
    });

    it('enforces propagation cutoff when relevance drops below threshold', () => {
      // With high cutoff (0.70), deeper hops should be pruned
      const pathsPruned = impactEngine.traverseCascadingDependencies(
        'ent-budget-q1',
        mockDependencies,
        5,
        0.70
      );
      expect(pathsPruned.length).toBe(1); // Only hop 1 has relevance 0.75 >= 0.70
    });

    it('calculates deterministic multi-dimensional risk scores', () => {
      const state = getBaselineState();
      const risk = impactEngine.evaluateDeterministicRisk(state, [], 7);

      expect(risk.overallRiskScore).toBeGreaterThanOrEqual(0.70);
      expect(['high', 'critical']).toContain(risk.riskLevel);
      expect(risk.dimensions.capacityPressure).toBe(0.40); // (420 - 300) / 300 = 0.40
      expect(risk.dimensions.budgetPressure).toBe(1.0);     // 1.1M / 1.1M = 1.0
      expect(risk.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('identifies material impacts vs low-significance noise using MaterialityEngine', () => {
      const { material, secondary } = materialityEngine.filterMaterialImpacts([
        { metric: 'available_budget', previous_value: 1800000, new_value: 1100000, delta: -700000, delta_pct: -38.9 },
        { metric: 'engineering_demand', previous_value: 300, new_value: 420, delta: 120, delta_pct: 40 },
        { metric: 'business_health', previous_value: 65, new_value: 64, delta: -1, delta_pct: -1.5 }, // Minor noise (< 10%)
      ]);

      expect(material.some((m) => m.metric === 'available_budget')).toBe(true);
      expect(material.some((m) => m.metric === 'engineering_demand')).toBe(true);
      expect(secondary.some((m) => m.metric === 'business_health')).toBe(true);
    });
  });

  // ===========================================================================
  // 2. CONSTRAINT ENGINE TESTS
  // ===========================================================================
  describe('Constraint Engine', () => {
    it('detects violated hard constraints when engineering demand exceeds capacity', () => {
      const state = getBaselineState(); // demand 420h vs capacity 300h
      const result = constraintEngine.evaluateConstraints(state);

      expect(result.overallFeasible).toBe(false);
      expect(result.hardViolationsCount).toBeGreaterThanOrEqual(1);

      const capacityViolation = result.violations.find((v) => v.constraintId === 'CONST_CAPACITY_LIMIT');
      expect(capacityViolation).toBeDefined();
      expect(capacityViolation?.severity).toBe('hard');
      expect(capacityViolation?.deficitOrExcess).toBe(120);
    });

    it('detects satisfied constraints when state metrics are within boundaries', () => {
      const healthyState: BusinessState = {
        ...getBaselineState(),
        metrics: {
          ...getBaselineState().metrics,
          engineering_demand: 280, // < 300h capacity
          capacity_utilization: 93,
          available_budget: 1800000,
          committed_budget: 1100000, // 39% uncommitted buffer
          risk_score: 0.30,
        },
      };

      const result = constraintEngine.evaluateConstraints(healthyState, { deliveryDelayDays: 2 });
      expect(result.overallFeasible).toBe(true);
      expect(result.hardViolationsCount).toBe(0);
    });

    it('identifies soft constraint warnings and near-violations', () => {
      const nearCapState: BusinessState = {
        ...getBaselineState(),
        metrics: {
          ...getBaselineState().metrics,
          engineering_demand: 295, // within 30h of 300h cap -> near violation
          engineering_capacity: 300,
        },
      };

      const result = constraintEngine.evaluateConstraints(nearCapState);
      expect(result.nearViolations.some((v) => v.constraintId === 'CONST_CAPACITY_LIMIT')).toBe(true);
    });
  });

  // ===========================================================================
  // 3. DECISION ENGINE TESTS
  // ===========================================================================
  describe('Decision Engine', () => {
    it('generates feasible and infeasible options, rejecting hard constraint breaches', async () => {
      const state = getBaselineState();
      const impact = await impactEngine.calculateImpact({
        event: mockBudgetEvent,
        currentState: state,
        graphContext: { entities: mockEntities, dependencies: mockDependencies, directEntityId: 'ent-budget-q1' },
      });

      const options = await decisionEngine.generateOptions({
        event: mockBudgetEvent,
        currentState: state,
        impactAnalysis: impact,
        policies: EXECUTIVE_POLICIES,
      });

      expect(options.length).toBeGreaterThanOrEqual(4);

      // Option 1: Reduce Scope must be feasible
      const optScope = options.find((o) => o.actionType === 'reduce_scope');
      expect(optScope?.feasible).toBe(true);
      expect(optScope?.capacityImpact).toBe(120);

      // Option 2: Delay Delivery (14 days) must be flagged infeasible due to SLA breach
      const optDelay = options.find((o) => o.actionType === 'delay_delivery');
      expect(optDelay?.feasible).toBe(false);
      expect(optDelay?.constraintViolations.some((v) => v.constraintId === 'CONST_DELIVERY_SLA')).toBe(true);

      // Option 3: Scale Capacity (hire contractors) must be infeasible due to budget breach
      const optScale = options.find((o) => o.actionType === 'scale_capacity');
      expect(optScale?.feasible).toBe(false);
      expect(optScale?.constraintViolations.some((v) => v.constraintId === 'CONST_BUDGET_CAP')).toBe(true);
    });

    it('demonstrates explainable divergence between CEO, CFO, and COO perspectives', async () => {
      const state = getBaselineState();
      const impact = await impactEngine.calculateImpact({
        event: mockBudgetEvent,
        currentState: state,
        graphContext: { entities: mockEntities, dependencies: mockDependencies, directEntityId: 'ent-budget-q1' },
      });

      const options = await decisionEngine.generateOptions({
        event: mockBudgetEvent,
        currentState: state,
        impactAnalysis: impact,
        policies: EXECUTIVE_POLICIES,
      });

      const optScope = options.find((o) => o.actionType === 'reduce_scope')!;
      const optReject = options.find((o) => o.actionType === 'cancel_commitment')!;

      // CFO prioritizes cost savings and fiscal conservatism (rates Scope 94, Reject 90)
      expect(optScope.policyAlignment.cfo).toBeGreaterThanOrEqual(90);
      expect(optReject.policyAlignment.cfo).toBeGreaterThanOrEqual(85);

      // CEO strictly rejects canceling deal (CEO: 22 vs CFO: 90)
      expect(optReject.policyAlignment.ceo).toBeLessThan(30);
      expect(optReject.policyAlignment.cfo).toBeGreaterThan(optReject.policyAlignment.ceo);

      // COO prioritizes capacity stability (Scope resolves deficit -> COO: 96)
      expect(optScope.policyAlignment.coo).toBeGreaterThanOrEqual(95);
    });

    it('calculates deterministic confidence score based on data and constraint completeness', async () => {
      const state = getBaselineState();
      const impact = await impactEngine.calculateImpact({
        event: mockBudgetEvent,
        currentState: state,
        graphContext: { entities: mockEntities, dependencies: mockDependencies, directEntityId: 'ent-budget-q1' },
      });

      const options = await decisionEngine.generateOptions({
        event: mockBudgetEvent,
        currentState: state,
        impactAnalysis: impact,
        policies: EXECUTIVE_POLICIES,
      });

      const recommendation = decisionEngine.formRecommendation(options, impact, 'balanced');

      expect(recommendation.selectedOption.actionType).toBe('reduce_scope');
      expect(recommendation.confidenceScore).toBeGreaterThanOrEqual(0.85);
      expect(recommendation.confidenceFactors.dataCompleteness).toBe(0.95);
      expect(recommendation.rationaleEvidence.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ===========================================================================
  // 4. GROQ REASONING ABSTRACTION TESTS (Zero LLM API call in unit tests)
  // ===========================================================================
  describe('Groq Strategic Reasoning Layer', () => {
    it('constructs structured evidence prompts without giving Groq database access or numerical authority', () => {
      const groq = new GroqService({ apiKey: '' }); // Unconfigured for offline deterministic test
      const state = getBaselineState();

      const prompt = groq.constructEvidencePrompt(
        {
          organizationId: 'blacktide-systems',
          triggeringEvent: mockBudgetEvent,
          currentBusinessState: state,
          affectedEntities: [],
          deterministicImpact: {
            id: 'imp-1',
            organization_id: 'org',
            decision_event_id: mockBudgetEvent.id,
            affected_entities: [],
            metric_deltas: [],
            cascade_depth: 3,
            deterministic_score: 91,
            risk_assessment: { overall_risk: 'critical', risk_score: 0.82, primary_risks: [], bottlenecks: [] },
            confidence_score: 0.91,
            calculated_at: '',
          },
          generatedOptions: [
            {
              id: 'opt-scope',
              event_id: mockBudgetEvent.id,
              title: 'Reduce Feature Scope',
              description: 'Descope non-critical analytics',
              rationale: 'Descope non-critical analytics to balance team bandwidth.',
              action_type: 'negotiate',
              projected_metrics: { capacity_utilization: 100, budget_pressure: 0.78 },
              feasibility_score: 91,
              policy_alignment: { ceo: 88, cfo: 94, coo: 96, balanced: 91 },
              tradeoffs: { pros: ['Eliminates deficit'], cons: ['Roadmap delay'], risks: [] },
            },
          ],
          expertPolicies: EXECUTIVE_POLICIES,
        },
        'balanced'
      );

      expect(prompt.systemPrompt).toContain('You DO NOT calculate or fabricate financial numbers');
      expect(prompt.userPrompt).toContain('₹1,100,000');
      expect(prompt.userPrompt).toContain('Reduce Feature Scope');
    });

    it('falls back gracefully to deterministic simulation when GROQ_API_KEY is not configured', async () => {
      const groq = new GroqService({ apiKey: '' });
      expect(groq.isConfigured()).toBe(false);

      const result = await groq.executeReasoning(
        {
          organizationId: 'blacktide-systems',
          triggeringEvent: mockBudgetEvent,
          currentBusinessState: getBaselineState(),
          affectedEntities: [],
          deterministicImpact: {
            id: 'imp-1',
            organization_id: 'org',
            decision_event_id: mockBudgetEvent.id,
            affected_entities: [],
            metric_deltas: [],
            cascade_depth: 3,
            deterministic_score: 91,
            risk_assessment: { overall_risk: 'critical', risk_score: 0.82, primary_risks: [], bottlenecks: [] },
            confidence_score: 0.91,
            calculated_at: '',
          },
          generatedOptions: [
            {
              id: 'opt-scope',
              event_id: mockBudgetEvent.id,
              title: 'Reduce Feature Scope',
              description: 'Descope non-critical analytics',
              rationale: 'Descope non-critical analytics to balance team bandwidth.',
              action_type: 'negotiate',
              projected_metrics: { capacity_utilization: 100, budget_pressure: 0.78 },
              feasibility_score: 91,
              policy_alignment: { ceo: 88, cfo: 94, coo: 96, balanced: 91 },
              tradeoffs: { pros: ['Eliminates deficit'], cons: ['Roadmap delay'], risks: [] },
            },
          ],
          expertPolicies: EXECUTIVE_POLICIES,
        },
        'cfo'
      );

      expect(result.recommendedOptionId).toBe('opt-scope');
      expect(result.synthesis.executive_summary).toBeDefined();
      expect(result.synthesis.strategic_rationale.length).toBeGreaterThan(5);
    });
  });

  // ===========================================================================
  // 5. FULL END-TO-END INTELLIGENCE PIPELINE
  // ===========================================================================
  describe('Full Closed-Loop Pipeline', () => {
    it('executes: event -> state -> impact -> constraints -> options -> recommendation', async () => {
      // 1. Initial State
      const initial = getBaselineState();

      // 2. State Transition Engine applies event
      const { nextState } = stateEngine.applyEvent(initial, mockBudgetEvent);
      expect(nextState.metrics.available_budget).toBe(1100000);

      // 3. Impact Engine calculates deterministic cascade & materiality
      const impact = await impactEngine.calculateImpact({
        event: mockBudgetEvent,
        currentState: nextState,
        graphContext: { entities: mockEntities, dependencies: mockDependencies, directEntityId: 'ent-budget-q1' },
      });
      expect(impact.analysisId).toMatch(/^ANALYSIS_/);
      expect(impact.materialImpacts.length).toBeGreaterThanOrEqual(2);

      // 4. Constraint Engine detects hard capacity breach
      expect(impact.constraintResults.overallFeasible).toBe(false);

      // 5. Decision Engine evaluates alternatives & checks constraints
      const options = await decisionEngine.generateOptions({
        event: mockBudgetEvent,
        currentState: nextState,
        impactAnalysis: impact,
        policies: EXECUTIVE_POLICIES,
      });

      // 6. Recommendation selected deterministically
      const rec = decisionEngine.formRecommendation(options, impact, 'cfo');
      expect(rec.selectedOption.actionType).toBe('reduce_scope');
      expect(rec.score).toBe(94);
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0.90);
      expect(rec.rationaleEvidence[0]).toContain('CFO');
    });
  });
});
