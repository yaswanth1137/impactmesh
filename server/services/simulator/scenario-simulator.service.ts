/**
 * IMPACTMESH - Blacktide Scenario Simulator Service (Teammate 3)
 *
 * ARCHITECTURAL MANDATE:
 * 1. The simulator is NOT allowed to directly mutate BusinessState.
 * 2. Every action emits a canonical DecisionEvent.
 * 3. Events flow through the canonical ingestion pipeline:
 *    DecisionEvent -> eventValidator -> handleEventIngestion -> StateTransitionEngine -> BusinessState.
 * 4. UI derives displayed metrics purely from BusinessState.
 * 5. Impact Analysis calls existing DeterministicImpactEngine, DecisionEngine,
 *    and FlowTrace bridge without duplicating business logic.
 * 6. Non-destructive reset: only clears the simulator tenant/in-memory scenario events.
 */

import type {
  BusinessState,
  BusinessEntity,
  Dependency,
  Recommendation,
  Decision,
} from '../../../src/types/domain.ts';
import type { DecisionEvent, ImpactMeshEventType } from '../../../src/types/events.ts';
import type { StateDelta, StateDeltaChange } from '../state-transition/state-transition.interface.ts';
import type { ImpactAnalysis } from '../../engines/impact-engine/impact-engine.interface.ts';
import type {
  DecisionOptionDetails,
  RecommendationResult,
} from '../../engines/decision-engine/decision-engine.interface.ts';
import { handleEventIngestion } from '../../api/event-routes.ts';
import { eventStore } from '../event-store/event-store.service.ts';
import { deterministicImpactEngine } from '../../engines/impact-engine/impact-engine.service.ts';
import { deterministicDecisionEngine } from '../../engines/decision-engine/decision-engine.service.ts';
import { EXECUTIVE_POLICIES } from '../../policies/executive-policies.ts';
import { reasoningEngine } from '../../engines/reasoning-engine/reasoning-engine.service.ts';
import { FlowTraceAdapter } from '../flowtrace/flowtrace.adapter.ts';
import { registerPlanInFlowTraceDB } from '../flowtrace/flowtrace-real-bridge.ts';
import type { ExecutionPlan } from '../../../src/types/execution.ts';
import { realtimeSubscriptionManager } from '../../../src/lib/realtime/subscription-manager.ts';
import {
  MOCK_ENTITIES,
  MOCK_DEPENDENCIES,
} from '../../../src/mocks/blacktide-mock.ts';

export const SIMULATOR_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Baseline initial business state prior to scenario execution.
 * Revenue = 0, Budget = ₹18L (1,800,000), Capacity = 420h, Demand = 0h.
 */
export const SIMULATOR_INITIAL_STATE: BusinessState = {
  id: 'state-sim-baseline',
  organization_id: SIMULATOR_ORG_ID,
  timestamp: '2026-09-10T09:00:00Z',
  metrics: {
    available_budget: 1800000,      // ₹18L
    committed_budget: 1100000,      // ₹11L
    revenue_pipeline: 0,            // ₹0
    committed_revenue: 0,           // ₹0
    engineering_capacity: 420,      // 420h
    engineering_demand: 0,          // 0h
    capacity_utilization: 0,        // 0%
    budget_pressure: 0.61,
    risk_score: 0.28,
    business_health: 84,
    committed_features_count: 0,
  },
  state_hash: 'sim-hash-genesis',
  last_event_id: null,
  created_at: '2026-09-10T09:00:00Z',
};

export interface SimulatorEventLogItem {
  eventId: string;
  correlationId: string;
  eventType: ImpactMeshEventType;
  department: string;
  entityId: string;
  source: string;
  timestamp: string;
  status: 'PROCESSED' | 'IDEMPOTENT_CACHED' | 'FAILED';
  httpStatus: number;
  payload: Record<string, unknown>;
  changes: StateDeltaChange[];
  description: string;
}

export interface SimulatorAnalysisResult {
  impactAnalysis: ImpactAnalysis;
  decisionOptions: DecisionOptionDetails[];
  recommendation: Recommendation;
  recommendationResult: RecommendationResult;
  executiveSynthesis: string;
  strategicRationale: string;
  riskMitigation: string[];
  executionPlan: ExecutionPlan;
  analyzedAt: string;
}

export interface SimulatorStepResult {
  step: 1 | 2 | 3 | 4 | 5;
  stepTitle: string;
  event?: DecisionEvent;
  stateDelta?: StateDelta;
  currentState: BusinessState;
  analysisResult?: SimulatorAnalysisResult;
  isIdempotent?: boolean;
}

export interface SimulatorStepDefinition {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  department: 'sales' | 'product' | 'engineering' | 'finance' | 'command_center';
  eventType: ImpactMeshEventType | 'impact_analysis';
  summary: string;
  description: string;
  expectedDelta: string;
}

export const SCENARIO_STEP_DEFINITIONS: SimulatorStepDefinition[] = [
  {
    step: 1,
    title: 'ACCEPT ₹50L DEAL',
    department: 'sales',
    eventType: 'deal_accepted',
    summary: 'Apex Global ₹50L expansion deal accepted with custom SLA commitments.',
    description: 'Emits deal_accepted event. Ingestion pipeline mutates committed revenue from ₹0 to ₹50L.',
    expectedDelta: 'Revenue → ₹50L (Delta +₹50L)',
  },
  {
    step: 2,
    title: 'COMMIT 3 FEATURES',
    department: 'product',
    eventType: 'feature_committed',
    summary: 'Product commits 3 major features (SAML, Analytics, Audit) requiring 420h.',
    description: 'Emits feature_committed event. Engineering demand jumps to 420h, reaching 100% capacity load.',
    expectedDelta: 'Demand → 420h (3 Features)',
  },
  {
    step: 3,
    title: 'REDUCE CAPACITY (300h)',
    department: 'engineering',
    eventType: 'capacity_changed',
    summary: 'Core engineering capacity drops from 420h to 300h due to team reallocations.',
    description: 'Emits capacity_changed event. Triggers 120h deficit and overburdens utilization to 140%.',
    expectedDelta: 'Capacity → 300h, Deficit → 120h, Utilization → 140%',
  },
  {
    step: 4,
    title: 'CUT BUDGET (₹11L)',
    department: 'finance',
    eventType: 'budget_changed',
    summary: 'Finance reduces operating budget ceiling from ₹18L to ₹11L for capital preservation.',
    description: 'Emits budget_changed event. Available budget cut by -₹7L, preventing contractor hiring.',
    expectedDelta: 'Budget → ₹11L (Delta -₹7L)',
  },
  {
    step: 5,
    title: 'ANALYZE IMPACT & DECISIONS',
    department: 'command_center',
    eventType: 'impact_analysis',
    summary: 'Evaluate cascading cross-department consequences, compute risk, and form recommendations.',
    description: 'Invokes DeterministicImpactEngine, DecisionEngine, Groq reasoning, and FlowTrace execution plan.',
    expectedDelta: 'Impact Mesh Cascade + Decision Desk Options + FlowTrace Plan',
  },
];

export class ScenarioSimulatorService {
  private currentState: BusinessState;
  private eventLog: SimulatorEventLogItem[] = [];
  private completedSteps = new Set<number>();
  private analysisResult: SimulatorAnalysisResult | null = null;
  private listeners = new Set<() => void>();
  private flowTraceAdapter: FlowTraceAdapter;
  private mockEntityMap: Map<string, BusinessEntity>;
  private mockDependencies: Dependency[];

  constructor() {
    this.currentState = { ...SIMULATOR_INITIAL_STATE, metrics: { ...SIMULATOR_INITIAL_STATE.metrics } };
    this.flowTraceAdapter = new FlowTraceAdapter();
    this.mockEntityMap = new Map(MOCK_ENTITIES.map((e) => [e.id, e]));
    this.mockDependencies = [
      ...MOCK_DEPENDENCIES,
      {
        id: 'dep-sim-budget-constrains-res',
        organization_id: SIMULATOR_ORG_ID,
        source_entity_id: 'ent-budget-q1',
        target_entity_id: 'ent-res-eng',
        relation_type: 'constrains',
        strength: 0.95,
        created_at: '',
      },
      {
        id: 'dep-sim-res-affects-delivery',
        organization_id: SIMULATOR_ORG_ID,
        source_entity_id: 'ent-res-eng',
        target_entity_id: 'ent-outcome-delivery',
        relation_type: 'affects',
        strength: 0.9,
        created_at: '',
      },
      {
        id: 'dep-sim-delivery-governs-deal',
        organization_id: SIMULATOR_ORG_ID,
        source_entity_id: 'ent-outcome-delivery',
        target_entity_id: 'ent-deal-apex',
        relation_type: 'governs',
        strength: 0.9,
        created_at: '',
      },
      {
        id: 'dep-sim-deal-delivers-cust',
        organization_id: SIMULATOR_ORG_ID,
        source_entity_id: 'ent-deal-apex',
        target_entity_id: 'ent-cust-apex',
        relation_type: 'delivers_to',
        strength: 0.99,
        created_at: '',
      },
    ];
  }

  public getCurrentState(): BusinessState {
    return this.currentState;
  }

  public getEventLog(): SimulatorEventLogItem[] {
    return [...this.eventLog];
  }

  public getCompletedSteps(): number[] {
    return Array.from(this.completedSteps).sort((a, b) => a - b);
  }

  public getAnalysisResult(): SimulatorAnalysisResult | null {
    return this.analysisResult;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[ScenarioSimulatorService] Error in subscriber:', err);
      }
    });
  }

  /**
   * Resets the scenario to baseline initial state in a strictly non-destructive manner.
   * Cleans only events emitted by the simulator tenant in eventStore without wiping production data.
   */
  public resetScenario(): void {
    // 1. Remove only simulator events from eventStore
    eventStore.clearOrg(SIMULATOR_ORG_ID);

    // 2. Reset simulator state to baseline
    this.currentState = {
      ...SIMULATOR_INITIAL_STATE,
      metrics: { ...SIMULATOR_INITIAL_STATE.metrics },
      timestamp: new Date().toISOString(),
    };
    this.eventLog = [];
    this.completedSteps.clear();
    this.analysisResult = null;

    // 3. Notify realtime subscribers
    realtimeSubscriptionManager.emitStateUpdate(this.currentState);
    this.notify();
  }

  /**
   * Builds the exact canonical DecisionEvent for a given scenario action.
   */
  public createScenarioEvent(step: 1 | 2 | 3 | 4): DecisionEvent {
    const timestamp = new Date().toISOString();

    switch (step) {
      case 1: {
        return {
          id: `sim-evt-01-deal-accepted-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          organization_id: SIMULATOR_ORG_ID,
          department: 'sales',
          event_type: 'deal_accepted',
          entity_id: 'ent-deal-apex',
          payload: {
            deal_id: 'ent-deal-apex',
            final_value: 5000000, // ₹50L
            close_date: '2026-10-15',
            sla_commitments: ['Enterprise SAML Mandate', '99.9% Uptime', '3 Custom Modules'],
          },
          created_by: 'Scenario Simulator (Sales Station)',
          created_at: timestamp,
          execution_context: {
            executionPlanId: 'plan-blacktide-core',
            executionStepId: 'step-01-deal',
            decisionId: 'dec-blacktide-sim',
            recommendationId: 'rec-sim-deal',
            sequence: 1,
          },
        };
      }

      case 2: {
        return {
          id: `sim-evt-02-feature-committed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          organization_id: SIMULATOR_ORG_ID,
          department: 'product',
          event_type: 'feature_committed',
          entity_id: 'ent-feat-sso',
          payload: {
            feature_id: 'ent-feat-sso',
            sprint_target: 'Sprint-24',
            committed_capacity_hours: 420, // 420h demand
            feature_count: 3,              // 3 features
          },
          created_by: 'Scenario Simulator (Product Station)',
          created_at: timestamp,
          execution_context: {
            executionPlanId: 'plan-blacktide-core',
            executionStepId: 'step-02-feature',
            decisionId: 'dec-blacktide-sim',
            recommendationId: 'rec-sim-feature',
            sequence: 2,
          },
        };
      }

      case 3: {
        const currentCap = this.currentState.metrics.engineering_capacity ?? 420;
        return {
          id: `sim-evt-03-capacity-changed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          organization_id: SIMULATOR_ORG_ID,
          department: 'engineering',
          event_type: 'capacity_changed',
          entity_id: 'ent-res-eng',
          payload: {
            team_id: 'ent-res-eng',
            previous_capacity_hours: currentCap,
            new_capacity_hours: 300, // 300h
            effective_date: '2026-09-15',
          },
          created_by: 'Scenario Simulator (Engineering Station)',
          created_at: timestamp,
          execution_context: {
            executionPlanId: 'plan-blacktide-core',
            executionStepId: 'step-03-capacity',
            decisionId: 'dec-blacktide-sim',
            recommendationId: 'rec-sim-capacity',
            sequence: 3,
          },
        };
      }

      case 4: {
        const currentBudget = this.currentState.metrics.available_budget ?? 1800000;
        return {
          id: `sim-evt-04-budget-changed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          organization_id: SIMULATOR_ORG_ID,
          department: 'finance',
          event_type: 'budget_changed',
          entity_id: 'ent-budget-q1',
          payload: {
            department: 'finance',
            previous_budget: currentBudget,
            new_budget: 1100000, // ₹11L
            fiscal_period: 'Q1-2026',
            rationale: 'Capital preservation reserve',
          },
          created_by: 'Scenario Simulator (Finance Station)',
          created_at: timestamp,
          execution_context: {
            executionPlanId: 'plan-blacktide-core',
            executionStepId: 'step-04-budget',
            decisionId: 'dec-blacktide-sim',
            recommendationId: 'rec-sim-budget',
            sequence: 4,
          },
        };
      }
    }
  }

  /**
   * Executes a single scenario step through the canonical event ingestion pipeline.
   */
  public async executeStep(step: 1 | 2 | 3 | 4 | 5): Promise<SimulatorStepResult> {
    if (step === 5) {
      return await this.executeImpactAnalysis();
    }

    const event = this.createScenarioEvent(step);

    // INGESTION: Passes event and current state into the canonical handleEventIngestion handler
    const res = await handleEventIngestion({
      event,
      currentState: this.currentState,
    });

    if (res.statusCode !== 200 || !res.body.success) {
      const errorMsg = 'error' in res.body ? res.body.error : 'Unknown ingestion failure';
      throw new Error(`Simulator step ${step} rejected by ingestion pipeline: ${errorMsg}`);
    }

    const { nextState, stateDelta, idempotent } = res.body;

    // Set simulator state to the resulting BusinessState computed by StateTransitionEngine
    this.currentState = nextState;
    this.completedSteps.add(step);

    // Record in simulator event log
    const logItem: SimulatorEventLogItem = {
      eventId: event.id,
      correlationId: (event.execution_context?.executionPlanId || event.id),
      eventType: event.event_type,
      department: event.department,
      entityId: event.entity_id,
      source: 'scenario-simulator',
      timestamp: event.created_at,
      status: idempotent ? 'IDEMPOTENT_CACHED' : 'PROCESSED',
      httpStatus: res.statusCode,
      payload: event.payload as unknown as Record<string, unknown>,
      changes: stateDelta.changes,
      description: SCENARIO_STEP_DEFINITIONS[step - 1].summary,
    };
    this.eventLog.unshift(logItem);

    // Broadcast across realtime mesh
    realtimeSubscriptionManager.emitLocalEvent(event);
    realtimeSubscriptionManager.emitStateUpdate(nextState);

    this.notify();

    return {
      step,
      stepTitle: SCENARIO_STEP_DEFINITIONS[step - 1].title,
      event,
      stateDelta,
      currentState: nextState,
      isIdempotent: idempotent,
    };
  }

  /**
   * Step 5: Executes Impact Analysis, Decision Intelligence, Reasoning, and FlowTrace bridge.
   * MUST NOT calculate impact locally: invokes existing engines.
   */
  public async executeImpactAnalysis(): Promise<SimulatorStepResult> {
    // 1. Synthesize the trigger event (the budget cut or last event)
    const lastEventId = this.currentState.last_event_id;
    let triggerEvent: DecisionEvent | null = null;
    if (lastEventId) {
      triggerEvent = await eventStore.getEvent(lastEventId);
    }
    if (!triggerEvent) {
      triggerEvent = this.createScenarioEvent(4);
    }

    // 2. Call existing DeterministicImpactEngine (Layer 1)
    const impactAnalysis = await deterministicImpactEngine.calculateImpact({
      event: triggerEvent,
      currentState: this.currentState,
      graphContext: {
        entities: this.mockEntityMap,
        dependencies: this.mockDependencies,
        directEntityId: triggerEvent.entity_id || 'ent-budget-q1',
      },
    });

    // 3. Call existing DeterministicDecisionEngine (Layer 2)
    const decisionOptions = await deterministicDecisionEngine.generateOptions({
      event: triggerEvent,
      currentState: this.currentState,
      impactAnalysis,
      policies: EXECUTIVE_POLICIES,
    });

    // Form balanced recommendation
    const recommendationResult = deterministicDecisionEngine.formRecommendation(
      decisionOptions,
      impactAnalysis,
      'balanced'
    );

    // 4. Call existing ReasoningEngine & Groq abstraction (Layer 3)
    let executiveSynthesis = 'Fiscal contraction creates an active 120h engineering deficit. Scope reduction recommended to preserve customer delivery.';
    let strategicRationale = 'Eliminating 120h of non-critical analytics and audit export maintains the commit date for Apex Global without unbudgeted capital spend.';
    let riskMitigation = [
      'Scope addendum for Phase 2 Custom Analytics',
      'Preserve core multi-tenant SAML SSO on critical path',
      'Zero contractor overtime expenditure',
    ];

    try {
      const reasoning = await reasoningEngine.evaluateEvidence(
        {
          organizationId: SIMULATOR_ORG_ID,
          triggeringEvent: triggerEvent,
          currentBusinessState: this.currentState,
          affectedEntities: impactAnalysis.affectedEntities.map((ae) => ({
            entity: this.mockEntityMap.get(ae.entity_id) || {
              id: ae.entity_id,
              organization_id: SIMULATOR_ORG_ID,
              entity_type: ae.entity_type as any,
              name: ae.entity_name,
              department: ae.department as any,
              status: 'active',
              metadata: {},
              created_at: '',
              updated_at: '',
            },
            impactSeverity: ae.impact_severity,
          })),
          deterministicImpact: {
            id: impactAnalysis.id,
            organization_id: SIMULATOR_ORG_ID,
            decision_event_id: triggerEvent.id,
            affected_entities: impactAnalysis.affectedEntities,
            metric_deltas: impactAnalysis.metricDeltas,
            cascade_depth: impactAnalysis.affectedPaths.length,
            deterministic_score: Math.round((1 - impactAnalysis.riskAssessment.overallRiskScore) * 100),
            risk_assessment: {
              overall_risk: impactAnalysis.riskAssessment.riskLevel,
              risk_score: impactAnalysis.riskAssessment.overallRiskScore,
              primary_risks: impactAnalysis.riskAssessment.evidence,
              bottlenecks: ['Engineering Capacity (140% load)'],
            },
            confidence_score: 0.92,
            calculated_at: impactAnalysis.generatedAt,
          },
          generatedOptions: decisionOptions.map((opt) => ({
            id: opt.id,
            title: opt.title,
            description: opt.description,
            action_type: (opt.actionType === 'reduce_scope' ? 'pivot' : 'delay') as any,
            projected_metrics: {
              capacity_utilization: opt.projectedMetrics.capacity_utilization,
              budget_pressure: opt.projectedMetrics.budget_pressure,
              available_budget: opt.projectedMetrics.available_budget,
            },
            feasibility_score: opt.feasibility_score,
            policy_alignment: {
              ceo: opt.policyAlignment.ceo,
              cfo: opt.policyAlignment.cfo,
              coo: opt.policyAlignment.coo,
              balanced: 85,
            },
            tradeoffs: {
              pros: opt.tradeoffs.pros,
              cons: opt.tradeoffs.cons,
              risks: opt.tradeoffs.risks || [],
            },
            rationale: opt.evidence.join('; '),
          })),
          expertPolicies: EXECUTIVE_POLICIES,
        },
        'balanced'
      );

      if (reasoning && reasoning.synthesis) {
        executiveSynthesis = reasoning.synthesis.executive_summary || executiveSynthesis;
        strategicRationale = reasoning.synthesis.strategic_rationale || strategicRationale;
        if (reasoning.synthesis.risk_mitigations && reasoning.synthesis.risk_mitigations.length > 0) {
          riskMitigation = reasoning.synthesis.risk_mitigations;
        }
      }
    } catch {
      // Graceful offline fallback already guaranteed by GroqService
    }

    const recommendation: Recommendation = {
      id: recommendationResult.recommendationId,
      decision_id: recommendationResult.decisionId,
      decision_event_id: triggerEvent.id,
      top_option_id: recommendationResult.selectedOption.id,
      perspective: recommendationResult.perspective,
      confidence_score: recommendationResult.confidenceScore,
      created_at: recommendationResult.generatedAt,
      groq_reasoning: {
        executive_synthesis: executiveSynthesis,
        strategic_rationale: strategicRationale,
        counterfactual_analysis: 'If scope is not reduced, delivery SLA breaches by +8 days incurring penalty.',
        risk_mitigation: riskMitigation,
      },
    };

    // 5. Call existing FlowTrace Bridge & Execution Plan
    const decision: Decision = {
      id: `dec-sim-${Date.now()}`,
      organization_id: SIMULATOR_ORG_ID,
      title: 'Remediate Apex Global Delivery Overload',
      description: 'Execution plan resolving the 120h engineering deficit through scope reduction.',
      department: 'command_center',
      status: 'evaluating',
      trigger_event_id: triggerEvent.id,
      created_by: 'Blacktide Scenario Controller',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const executionPlan = this.flowTraceAdapter.createExecutionPlan(recommendation, decision);
    registerPlanInFlowTraceDB(executionPlan);

    this.analysisResult = {
      impactAnalysis,
      decisionOptions,
      recommendation,
      recommendationResult,
      executiveSynthesis,
      strategicRationale,
      riskMitigation,
      executionPlan,
      analyzedAt: new Date().toISOString(),
    };

    this.completedSteps.add(5);
    this.notify();

    return {
      step: 5,
      stepTitle: SCENARIO_STEP_DEFINITIONS[4].title,
      currentState: this.currentState,
      analysisResult: this.analysisResult,
    };
  }

  /**
   * Runs the full 5-step scenario sequentially.
   */
  public async runFullScenario(stepDelayMs: number = 0): Promise<SimulatorStepResult[]> {
    const results: SimulatorStepResult[] = [];
    for (let step = 1; step <= 5; step++) {
      const res = await this.executeStep(step as 1 | 2 | 3 | 4 | 5);
      results.push(res);
      if (stepDelayMs > 0 && step < 5) {
        await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
      }
    }
    return results;
  }
}

export const scenarioSimulatorService = new ScenarioSimulatorService();
