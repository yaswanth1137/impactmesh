import React, { useState, useEffect, useMemo } from 'react';
import { DecisionDesk } from '../../components/signals/DecisionDesk.tsx';
import { DecisionAlert } from '../../components/decisions/DecisionAlert.tsx';
import { ImpactSummary } from '../../components/decisions/ImpactSummary.tsx';
import { InteractiveImpactMap } from '../../components/impact-map/InteractiveImpactMap.tsx';
import { DecisionOptionList } from '../../components/decisions/DecisionOptionList.tsx';
import { RecommendationCard } from '../../components/decisions/RecommendationCard.tsx';
import { HumanDecisionPanel } from '../../components/decisions/HumanDecisionPanel.tsx';
import { ExecutionPlanSection } from '../../components/decisions/ExecutionPlanSection.tsx';
import { CausalChain, type CausalStep } from '../../components/editorial/CausalChain.tsx';
import { OutcomeStrip } from '../../components/editorial/OutcomeStrip.tsx';
import { ScenarioSimulatorModal } from '../../components/simulation/ScenarioSimulatorModal.tsx';
import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';
import { signalService } from '../../../server/engines/signal-engine/signal.service.ts';
import type { Signal } from '../../../server/engines/signal-engine/signal.interface.ts';
import type { DecisionEvent } from '../../types/events.ts';
import {
  MOCK_ENTITIES,
  MOCK_DEPENDENCIES,
  MOCK_ACTIVE_DECISION_EVENT,
  MOCK_IMPACT_RESULT,
  MOCK_DECISION_OPTIONS,
  MOCK_RECOMMENDATION,
  MOCK_BUSINESS_STATE,
} from '../../mocks/blacktide-mock.ts';
import { securityPolicyService, CEO_USER } from '../../lib/auth/auth-service.ts';

interface CommandRouteProps {
  onPlotRoute: () => void;
}

export const CommandRoute: React.FC<CommandRouteProps> = ({ onPlotRoute }) => {
  const [isSimulatingCascade, setIsSimulatingCascade] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('opt-scope-reduction');
  const [isDecisionConfirmed, setIsDecisionConfirmed] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('CONNECTED');
  const [showFullGraph, setShowFullGraph] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  // Initialize and maintain active signals
  const [signals, setSignals] = useState<Signal[]>(() => {
    const generated = signalService.processState({
      state: {
        ...MOCK_BUSINESS_STATE,
        metrics: {
          ...MOCK_BUSINESS_STATE.metrics,
          available_budget: 1100000,
          committed_revenue: 5000000,
          engineering_capacity: 300,
          engineering_demand: 420,
          capacity_utilization: 1.4,
          budget_pressure: 1.0,
          risk_score: 0.68,
        },
      },
    });
    return generated.length > 0 ? generated : signalService.getAllSignals();
  });

  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(() => {
    return signals[0]?.id || null;
  });

  // Dynamic challenge & operational trigger state (updates in realtime from mobile screens)
  const [activeChallenge, setActiveChallenge] = useState({
    department: 'OPERATIONS & SALES',
    title: 'DELIVERY RISK: ENGINEERING DEMAND EXCEEDS CAPACITY',
    description:
      'Sales committed a custom enterprise feature, increasing sprint demand to 420h against 300h available capacity. Milestone delivery is projected to slip by +8 days without intervention.',
    capacityHours: 300,
    demandHours: 420,
    deliveryDaysDelay: 8,
    financialExposure: '₹50L Contract',
    severity: 'CRITICAL' as 'NORMAL' | 'TENSION' | 'RISK' | 'CRITICAL',
  });

  const [latestEvent, setLatestEvent] = useState<DecisionEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<DecisionEvent[]>([]);
  const [showEventFeed, setShowEventFeed] = useState<boolean>(false);

  useEffect(() => {
    // Set authenticated user to CEO
    securityPolicyService.setCurrentUser(CEO_USER);

    // 1. Connection status listener
    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    // 2. Realtime event listener (actively receives updates broadcasted from mobile phones)
    const unsubscribe = realtimeSubscriptionManager.onEvent((incomingEvent: DecisionEvent) => {
      setIsAnalyzing(true);
      setLatestEvent(incomingEvent);
      setRecentEvents((prev) => [incomingEvent, ...prev.slice(0, 19)]);

      const payload = (incomingEvent.payload || {}) as Record<string, any>;
      const deptName = incomingEvent.department?.toUpperCase() || 'OPERATIONS';

      // Dynamically extract typed challenges or parameter changes from mobile
      setActiveChallenge((prev) => {
        const newTitle =
          payload.challenge_title ||
          (incomingEvent.event_type === 'capacity_changed'
            ? `OPERATIONAL CAPACITY ${payload.production_capacity ?? ''}% (${payload.new_capacity_hours ?? prev.capacityHours}h)`
            : incomingEvent.event_type === 'budget_changed'
            ? `TREASURY BUDGET MODIFICATION: ₹${((payload.new_budget ?? 1100000) / 100000).toFixed(1)}L`
            : incomingEvent.event_type === 'deal_accepted'
            ? `SALES DEAL COMMITTED: ₹${((payload.final_value ?? 5000000) / 100000).toFixed(1)}L APEX CONTRACT`
            : incomingEvent.event_type === 'spending_freeze'
            ? 'TREASURY SPENDING FREEZE ACTIVATED'
            : incomingEvent.event_type === 'delivery_delay'
            ? `SHIPMENT DELAY: +${payload.delay_days ?? 14} DAYS SLIPPAGE`
            : prev.title);

        const newDesc =
          payload.challenge_description ||
          payload.notes ||
          payload.rationale ||
          `Department ${deptName} emitted live operational update: ${incomingEvent.event_type}`;

        const newCap =
          payload.new_capacity_hours !== undefined
            ? Number(payload.new_capacity_hours)
            : payload.engineering_capacity !== undefined
            ? Number(payload.engineering_capacity)
            : prev.capacityHours;

        const newDelay =
          payload.delay_days !== undefined
            ? Number(payload.delay_days)
            : payload.delivery_exposure_days !== undefined
            ? Number(payload.delivery_exposure_days)
            : payload.shipment_status === 'Delayed'
            ? 12
            : prev.deliveryDaysDelay;

        const newExposure =
          payload.final_value !== undefined
            ? `₹${(Number(payload.final_value) / 100000).toFixed(1)}L Contract`
            : payload.new_budget !== undefined
            ? `₹${(Number(payload.new_budget) / 100000).toFixed(1)}L Discretionary`
            : prev.financialExposure;

        return {
          department: deptName,
          title: newTitle,
          description: newDesc,
          capacityHours: newCap,
          demandHours: prev.demandHours,
          deliveryDaysDelay: newDelay,
          financialExposure: newExposure,
          severity: payload.severity || (newCap < 300 ? 'CRITICAL' : 'RISK'),
        };
      });

      setIsSimulatingCascade(true);

      // Re-evaluate signals incrementally
      const updated = signalService.getAllSignals();
      setSignals([...updated]);

      setTimeout(() => {
        setIsAnalyzing(false);
      }, 600);
    });

    return () => {
      unsubConn();
      unsubscribe();
    };
  }, []);

  const scrollToDecisionFlow = () => {
    const el = document.getElementById('what-changed-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAcknowledgeSignal = (signalId: string) => {
    signalService.acknowledgeSignal(signalId, {
      id: 'USR-DEVON-ROSS',
      name: 'Commander Devon Ross',
      role: 'ceo',
    });
    setSignals([...signalService.getAllSignals()]);
  };

  const handleDismissSignal = (signalId: string) => {
    signalService.dismissSignal(signalId, {
      id: 'USR-DEVON-ROSS',
      name: 'Commander Devon Ross',
      role: 'ceo',
    });
    setSignals([...signalService.getAllSignals()]);
  };

  const handleConfirmHumanDecision = (chosenId: string, decisionNote: string) => {
    setSelectedOptionId(chosenId);
    setIsDecisionConfirmed(true);

    signalService.recordDecisionReview({
      decisionId: 'DEC-APEX-EXPANSION-Q3',
      reviewerId: 'USR-DEVON-ROSS',
      reviewerName: 'Commander Devon Ross',
      role: 'ceo',
      systemRecommendationId: MOCK_RECOMMENDATION.id,
      systemRecommendedOptionId: MOCK_RECOMMENDATION.top_option_id,
      selectedOptionId: chosenId,
      override: chosenId !== MOCK_RECOMMENDATION.top_option_id,
      overrideReason: decisionNote || undefined,
      approvedAt: new Date().toISOString(),
    });

    // Smoothly scroll to Execution Plan
    const execSec = document.getElementById('execution-plan-section');
    if (execSec) {
      execSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const dynamicCausalSteps: CausalStep[] = useMemo(() => {
    const deficit = Math.max(0, activeChallenge.demandHours - activeChallenge.capacityHours);
    const loadPct = Math.round((activeChallenge.demandHours / Math.max(1, activeChallenge.capacityHours)) * 100);

    return [
      {
        id: 'trigger',
        stage: `01. ${activeChallenge.department}`,
        label: 'OPERATIONAL TRIGGER',
        figure: activeChallenge.title.length > 24 ? activeChallenge.title.slice(0, 22) + '...' : activeChallenge.title,
        subtext: activeChallenge.description.length > 40 ? activeChallenge.description.slice(0, 38) + '...' : activeChallenge.description,
        status: activeChallenge.severity === 'CRITICAL' ? 'critical' : activeChallenge.severity === 'RISK' ? 'risk' : 'tension',
        icon: 'spyglass',
      },
      {
        id: 'scope',
        stage: '02. PRODUCT',
        label: 'PRODUCT LOAD',
        figure: '3 Custom Modules',
        subtext: `${activeChallenge.demandHours}h sprint load committed`,
        status: deficit > 50 ? 'critical' : 'normal',
        icon: 'compass',
      },
      {
        id: 'engineering',
        stage: '03. ENGINEERING',
        label: 'ENGINEERING CAPACITY',
        figure: `${activeChallenge.capacityHours}h / ${activeChallenge.demandHours}h`,
        subtext: `${deficit}h deficit (${loadPct}% load)`,
        status: deficit > 100 ? 'critical' : deficit > 0 ? 'risk' : 'normal',
        icon: 'gear',
      },
      {
        id: 'delivery',
        stage: '04. OPERATIONS',
        label: 'DELIVERY TIMELINE',
        figure: `+${activeChallenge.deliveryDaysDelay} Days Delay`,
        subtext: activeChallenge.deliveryDaysDelay > 0 ? 'Milestone target at risk' : 'On schedule',
        status: activeChallenge.deliveryDaysDelay > 7 ? 'critical' : activeChallenge.deliveryDaysDelay > 0 ? 'risk' : 'normal',
        icon: 'route-marker',
      },
      {
        id: 'financial',
        stage: '05. FINANCIAL POSTURE',
        label: 'ENTERPRISE EXPOSURE',
        figure: activeChallenge.financialExposure,
        subtext: 'Blacktide Systems ARR & SLA',
        status: activeChallenge.severity === 'CRITICAL' ? 'critical' : 'risk',
        icon: 'ledger',
      },
    ];
  }, [activeChallenge]);

  const affectedEntityIds = useMemo(() => {
    return MOCK_IMPACT_RESULT.affected_entities.map((e) => e.entity_id);
  }, []);

  const topOption =
    MOCK_DECISION_OPTIONS.find((o) => o.id === selectedOptionId) ||
    MOCK_DECISION_OPTIONS[0];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto select-none">
      {/* 0. Live Telemetry & Scenario Link Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#FAF8F1] border border-[#DDD5C5] text-xs font-mono shadow-2xs rounded-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'CONNECTED'
                ? 'bg-[#5B8D70] animate-pulse'
                : connectionState === 'CONNECTING'
                ? 'bg-[#C89638] animate-ping'
                : 'bg-[#C86150]'
            }`}
          />
          <span className="text-[#718894]">EVENT MESH:</span>
          <span
            className={`font-bold ${
              connectionState === 'CONNECTED'
                ? 'text-[#2D5A40]'
                : connectionState === 'CONNECTING'
                ? 'text-[#8B651B]'
                : 'text-[#C86150]'
            }`}
          >
            {connectionState}
          </span>
          <span className="text-[#DDD5C5] hidden sm:inline">|</span>
          <span className="text-[#718894] hidden sm:inline">PRIMARY PERSPECTIVE:</span>
          <span className="text-[#18201D] font-bold hidden sm:inline">EXECUTIVE DECISION DESK</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScenarioModalOpen(true)}
            className="px-2.5 py-1 text-[11px] font-sans font-semibold bg-[#F3EFE5] hover:bg-[#FAF8F1] border border-[#C89638] text-[#18201D] rounded-xs cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>Simulate Scenario</span>
            <span className="font-mono text-[9px] text-[#C89638]">⚡</span>
          </button>
        </div>
      </div>

      {/* 0B. REALTIME LIVE INGESTED CHALLENGE BANNER (Flashing alert when mobile updates) */}
      {latestEvent && (
        <div className="p-4 bg-[#18201D] border-2 border-[#C89638] text-[#FAF8F1] rounded-xs flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#5B8D70] animate-ping shrink-0" />
            <div>
              <div className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest flex items-center gap-2">
                <span>⚡ LIVE MOBILE INGESTION RECEIVED // [{latestEvent.department?.toUpperCase()}]</span>
                <span className="text-[#A9ADA8]">
                  {new Date(latestEvent.created_at).toLocaleTimeString()}
                </span>
                <span className="px-1.5 py-0.5 bg-[#FAF8F1]/10 text-[#5B8D70] text-[9px] font-bold rounded-2xs">
                  REALTIME SYNCHRONIZED
                </span>
              </div>
              <div className="font-sans font-bold text-sm sm:text-base text-[#FAF8F1] mt-0.5">
                {(latestEvent.payload as any)?.challenge_title || (latestEvent.payload as any)?.notes || latestEvent.event_type}
              </div>
              <div className="font-sans text-xs text-[#DDD5C5]/80 mt-0.5 max-w-2xl truncate">
                {(latestEvent.payload as any)?.challenge_description || (latestEvent.payload as any)?.notes || ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEventFeed((prev) => !prev)}
              className="px-2.5 py-1 text-[11px] font-mono border border-[#DDD5C5]/40 text-[#DDD5C5] hover:bg-[#FAF8F1]/10 transition-colors cursor-pointer"
            >
              {showEventFeed ? '▲ HIDE STREAM' : `▼ EVENT FEED (${recentEvents.length})`}
            </button>
            <button
              onClick={scrollToDecisionFlow}
              className="px-3 py-1.5 bg-[#C89638] hover:bg-[#D6A84F] text-[#18201D] font-sans font-bold text-xs cursor-pointer shadow-md transition-colors"
            >
              INSPECT IMPACT
            </button>
          </div>
        </div>
      )}

      {/* Realtime Event Feed Drawer */}
      {showEventFeed && recentEvents.length > 0 && (
        <div className="p-3.5 bg-[#FAF8F1] border border-[#C89638] rounded-xs space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#DDD5C5]">
            <span className="font-bold text-[#18201D] uppercase">
              LIVE INGESTED EVENT FEED (CROSS-DEVICE MESH)
            </span>
            <span className="text-[#718894]">{recentEvents.length} TOTAL INGESTIONS</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentEvents.map((evt) => {
              const p = (evt.payload || {}) as Record<string, any>;
              return (
                <div
                  key={evt.id}
                  className="p-2 bg-[#F3EFE5] border border-[#DDD5C5] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-1.5 py-0.5 bg-[#18201D] text-[#FAF8F1] text-[9px] font-bold uppercase">
                      {evt.department}
                    </span>
                    <span className="font-bold text-[#18201D] truncate">
                      {p.challenge_title || p.notes || evt.event_type}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#718894] shrink-0">
                    {new Date(evt.created_at).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. HEADER + SECTION 1 — WHAT NEEDS YOUR ATTENTION? (Important Signals) */}
      <section id="decision-desk-section">
        <DecisionDesk
          signals={signals}
          onReviewSignal={(id) => {
            setSelectedSignalId(id);
            scrollToDecisionFlow();
          }}
          onAcknowledgeSignal={handleAcknowledgeSignal}
          onDismissSignal={handleDismissSignal}
          selectedSignalId={selectedSignalId}
        />
      </section>

      {/* 2. SECTION 2 — WHAT CHANGED? (Causal Trigger - Dynamically Reflects Mobile Updates) */}
      <section id="what-changed-section">
        <DecisionAlert
          department={activeChallenge.department}
          actionTitle={activeChallenge.title}
          changeDetail={activeChallenge.description}
          effectsCount={5}
          capacityDeficitHours={Math.max(0, activeChallenge.demandHours - activeChallenge.capacityHours)}
          deliveryExposureDays={activeChallenge.deliveryDaysDelay}
          financialExposure={activeChallenge.financialExposure}
          onReviewImpact={scrollToDecisionFlow}
          onViewDetails={scrollToDecisionFlow}
        />
      </section>

      {/* 3. SECTION 3 — WHAT DOES THIS AFFECT? (Simple Impact Chain + Interactive Graph) */}
      <section
        id="impact-map-section"
        className="p-5 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C5]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
              STEP 03 // IMPACT CHAIN
            </span>
            <span className="text-[#718894]">/</span>
            <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
              WHAT DOES THIS AFFECT?
            </h3>
          </div>
          <span className="font-mono text-xs text-[#576560]">
            5 LINKED ENTITIES
          </span>
        </div>

        {/* Clean 5-Card Horizontal Process Chain (Actively updates from mobile input) */}
        <CausalChain
          steps={dynamicCausalSteps}
          showFullGraph={showFullGraph}
          onToggleFullGraph={() => setShowFullGraph((prev) => !prev)}
        />

        {/* Progressive Disclosure: Interactive Graph (Celonis-inspired React Flow) */}
        {showFullGraph && (
          <div className="pt-2 animate-in fade-in">
            <InteractiveImpactMap
              entities={MOCK_ENTITIES}
              dependencies={MOCK_DEPENDENCIES}
              affectedEntityIds={affectedEntityIds}
              isAnalyzing={isAnalyzing}
              isSimulatingCascade={isSimulatingCascade}
              showFullMapDefault={false}
            />
          </div>
        )}
      </section>

      {/* 4. SECTION 4 — HOW SERIOUS IS IT? (Severity & Impact Summary) */}
      <section id="severity-summary-section">
        <ImpactSummary
          event={MOCK_ACTIVE_DECISION_EVENT}
          impact={MOCK_IMPACT_RESULT}
        />
      </section>

      {/* 5. SECTION 5 — WHAT CAN WE DO? (4 Strategic Options) */}
      <section id="options-section">
        <DecisionOptionList
          options={MOCK_DECISION_OPTIONS}
          selectedOptionId={selectedOptionId}
          onSelectOption={(opt) => setSelectedOptionId(opt.id)}
        />
      </section>

      {/* 6. SECTION 6 — SYSTEM RECOMMENDATION (Plain Reason & Analysis Quality) */}
      <section id="recommendation-section">
        <RecommendationCard
          recommendation={MOCK_RECOMMENDATION}
          topOption={topOption}
          onSimulate={() => setIsScenarioModalOpen(true)}
        />
      </section>

      {/* 7. SECTION 7 — HUMAN DECISION (Explicit Choices + Decision Note + Confirm) */}
      <section id="human-decision-section">
        <HumanDecisionPanel
          systemRecommendedOptionId="opt-scope-reduction"
          systemRecommendedTitle="Reduce Scope (Defer Phase 2 Reporting)"
          selectedOptionId={selectedOptionId}
          onSelectOption={(optId) => setSelectedOptionId(optId)}
          onConfirmDecision={handleConfirmHumanDecision}
          isConfirmed={isDecisionConfirmed}
        />
      </section>

      {/* 8. SECTION 8 — EXECUTION PLAN (FlowTrace Execution Bridge) */}
      <section id="execution-plan-section">
        <ExecutionPlanSection
          onOpenFlowTrace={onPlotRoute}
          decisionTitle={topOption.title}
          isConfirmed={isDecisionConfirmed}
        />
      </section>

      {/* 9. SECTION 9 — WHAT ACTUALLY HAPPENED? (Closed-Loop Outcome) */}
      <section id="outcome-section">
        <OutcomeStrip
          decisionTitle={topOption.title}
          outcomeStatus={
            isDecisionConfirmed
              ? 'DECISION CONFIRMED // FLOWTRACE READY TO DISPATCH'
              : 'DECISION PENDING // OPERATIONAL BASELINE UNRESOLVED'
          }
        />
      </section>

      {/* Scenario Simulator Modal */}
      <ScenarioSimulatorModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onApplyScenarioToDecision={(optId) => {
          setSelectedOptionId(optId);
          const humanSec = document.getElementById('human-decision-section');
          if (humanSec) {
            humanSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />
    </div>
  );
};
