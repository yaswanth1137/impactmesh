import React, { useState, useEffect, useMemo } from 'react';
import { DecisionDesk } from '../../components/signals/DecisionDesk.tsx';
import { DecisionAlert } from '../../components/decisions/DecisionAlert.tsx';
import { ImpactSummary } from '../../components/decisions/ImpactSummary.tsx';
import { InteractiveImpactMap } from '../../components/impact-map/InteractiveImpactMap.tsx';
import { DecisionOptionList } from '../../components/decisions/DecisionOptionList.tsx';
import { RecommendationCard } from '../../components/decisions/RecommendationCard.tsx';
import { HumanDecisionPanel } from '../../components/decisions/HumanDecisionPanel.tsx';
import { ExecutionPlanSection } from '../../components/decisions/ExecutionPlanSection.tsx';
import { CausalChain } from '../../components/editorial/CausalChain.tsx';
import { OutcomeStrip } from '../../components/editorial/OutcomeStrip.tsx';
import { ScenarioSimulatorModal } from '../../components/simulation/ScenarioSimulatorModal.tsx';
import { useLiveBusinessSignals } from '../../lib/realtime/useLiveBusinessSignals.ts';
import { LiveSignalBanner } from '../../components/signals/LiveSignalBanner.tsx';
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

  // Live Business Signal Hook (Realtime event processing and transient emphasis)
  const {
    activeSignal,
    isEmphasized,
    acknowledgeSignal,
    dismissSignal,
    markSignalReviewed,
    simulateLiveDepartmentUpdate,
  } = useLiveBusinessSignals();

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

  useEffect(() => {
    // Set authenticated user to CEO
    securityPolicyService.setCurrentUser(CEO_USER);

    // 1. Connection status listener
    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    // 2. Realtime event listener
    const unsubscribe = realtimeSubscriptionManager.onEvent((incomingEvent: DecisionEvent) => {
      setIsAnalyzing(true);
      if (
        incomingEvent.event_type === 'capacity_changed' ||
        incomingEvent.event_type === 'budget_changed' ||
        (incomingEvent.event_type as string) === 'contractor_cut'
      ) {
        setIsSimulatingCascade(true);
      } else if ((incomingEvent.event_type as string) === 'pipeline_adjusted') {
        setIsSimulatingCascade(true);
      } else if ((incomingEvent.event_type as string) === 'commercial_terms_changed') {
        setIsSimulatingCascade(true);
      } else if ((incomingEvent.event_type as string) === 'feature_scope_changed') {
        setIsSimulatingCascade(true);
      } else if ((incomingEvent.event_type as string) === 'launch_date_changed') {
        setIsSimulatingCascade(true);
      }

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
    const el =
      document.getElementById('what-happened-section') ||
      document.getElementById('why-matters-section') ||
      document.getElementById('impact-map-section');
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
            onClick={() => simulateLiveDepartmentUpdate('sales_deadline')}
            className="px-2.5 py-1 text-[11px] font-sans font-semibold bg-[#FAF8F1] hover:bg-[#F3EFE5] border border-[#C89638] text-[#18201D] rounded-xs cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
            title="Simulate incoming customer commitment change from Sales phone"
          >
            <span>Simulate Phone Update</span>
            <span className="font-mono text-[9px] text-[#C89638]">📱</span>
          </button>
          <button
            onClick={() => setIsScenarioModalOpen(true)}
            className="px-2.5 py-1 text-[11px] font-sans font-semibold bg-[#F3EFE5] hover:bg-[#FAF8F1] border border-[#C89638] text-[#18201D] rounded-xs cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>Simulate Scenario</span>
            <span className="font-mono text-[9px] text-[#C89638]">⚡</span>
          </button>
        </div>
      </div>

      {/* PROMINENT LIVE BUSINESS SIGNAL (Department change alert surface) */}
      {activeSignal && (
        <section id="live-business-signal-section" className="animate-in fade-in slide-in-from-top-3 duration-300">
          <LiveSignalBanner
            signal={activeSignal}
            isEmphasized={isEmphasized}
            onReview={(sig) => {
              markSignalReviewed(sig.id);
              if (sig.signalId) {
                setSelectedSignalId(sig.signalId);
              }
              scrollToDecisionFlow();
            }}
            onAcknowledge={(id) => acknowledgeSignal(id)}
            onDismiss={(id) => dismissSignal(id)}
          />
        </section>
      )}

      {/* Main Content Area (de-emphasized briefly when new signal enters) */}
      <div className={`space-y-6 transition-opacity duration-300 ${isEmphasized ? 'opacity-70' : 'opacity-100'}`}>
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

      {/* 2. WHAT HAPPENED? (Causal Trigger Briefing) */}
      <section id="what-happened-section">
        <DecisionAlert
          department="OPERATIONS &amp; SALES"
          actionTitle="DELIVERY RISK: ENGINEERING DEMAND EXCEEDS CAPACITY"
          changeDetail="Sales committed a custom feature to Apex Global while engineering capacity was already constrained. Milestone delivery is projected to slip by +8 days without intervention."
          effectsCount={5}
          capacityDeficitHours={120}
          deliveryExposureDays={8}
          financialExposure="Apex Global Contract"
          onReviewImpact={scrollToDecisionFlow}
          onViewDetails={scrollToDecisionFlow}
        />
      </section>

      {/* 3. WHY DOES IT MATTER? (Explanation, Evidence Chips & Severity) */}
      <section id="why-matters-section">
        <ImpactSummary
          event={MOCK_ACTIVE_DECISION_EVENT}
          impact={MOCK_IMPACT_RESULT}
        />
      </section>

      {/* 4. WHAT DOES THIS AFFECT? (Simple Causal Chain + Progressive Disclosure Full Graph) */}
      <section
        id="impact-map-section"
        className="p-5 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-[#DDD5C5]">
          <div>
            <h3 className="font-sans font-bold text-xl text-[#18201D] tracking-tight">
              WHAT DOES THIS AFFECT?
            </h3>
            <p className="font-sans text-xs text-[#576560] mt-0.5">
              How this decision affects the business across cross-functional operations.
            </p>
          </div>
          <span className="font-mono text-xs text-[#718894]">
            5 LINKED ENTITIES
          </span>
        </div>

        {/* Clean Process Chain: Name + Short Status */}
        <CausalChain
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

      {/* 5. WHAT CAN WE DO? (Feasible Decision Courses) */}
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
      </div>

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
