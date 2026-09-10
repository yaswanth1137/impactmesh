import React, { useState, useEffect, useMemo } from 'react';
import { DecisionDesk } from '../../components/signals/DecisionDesk.tsx';
import { HumanOverrideModal } from '../../components/decisions/HumanOverrideModal.tsx';
import { DecisionAlert } from '../../components/decisions/DecisionAlert.tsx';
import { BusinessPositionStrip, type OperationalMetrics } from '../../components/business/BusinessPositionStrip.tsx';
import { ImpactSummary } from '../../components/decisions/ImpactSummary.tsx';
import { ImpactMap } from '../../components/impact-map/ImpactMap.tsx';
import { DecisionOptionList } from '../../components/decisions/DecisionOptionList.tsx';
import { RecommendationCard } from '../../components/decisions/RecommendationCard.tsx';
import { BusinessCourse } from '../../components/course/BusinessCourse.tsx';
import { LiveEventStream } from '../../components/decisions/LiveEventStream.tsx';
import { CausalChain } from '../../components/editorial/CausalChain.tsx';
import { AnalysisQualityCard } from '../../components/editorial/AnalysisQualityCard.tsx';
import { OutcomeStrip } from '../../components/editorial/OutcomeStrip.tsx';
import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';
import { signalService } from '../../../server/engines/signal-engine/signal.service.ts';
import type { Signal } from '../../../server/engines/signal-engine/signal.interface.ts';
import type { ExecutiveRole } from '../../types/policies.ts';
import type { DecisionEvent } from '../../types/events.ts';
import {
  MOCK_ENTITIES,
  MOCK_DEPENDENCIES,
  MOCK_EVENT_LOG,
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

const getInitialOperationalMetrics = (): OperationalMetrics => {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('impactmesh_ops_state');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
  }
  return {
    productionCapacity: 100,
    previousProductionCapacity: 100,
    capacityHours: 420,
    inventoryUnits: 1240,
    previousInventoryUnits: 1240,
    equipmentStatus: 'ONLINE',
    inventoryLevel: 'NORMAL',
    deliveryDelayDays: 0,
  };
};

export const CommandRoute: React.FC<CommandRouteProps> = ({ onPlotRoute }) => {
  const [isSimulatingCascade, setIsSimulatingCascade] = useState<boolean>(() => {
    const initialMetrics = getInitialOperationalMetrics();
    return initialMetrics.productionCapacity <= 70 || (initialMetrics.inventoryUnits ?? 1240) < 1000;
  });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('opt-scope-reduction');
  const [events, setEvents] = useState<any[]>(MOCK_EVENT_LOG);
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('CONNECTED');
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics>(getInitialOperationalMetrics);
  const [activeRole, setActiveRole] = useState<'ALL' | 'CEO' | 'CFO' | 'COO'>('ALL');
  const [showFullGraph, setShowFullGraph] = useState<boolean>(true);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);

  // Initialize and maintain active signals
  const [signals, setSignals] = useState<Signal[]>(() => {
    // Generate initial deterministic signals from current business state
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

    // 2. Realtime event listener (deduplicated automatically by RealtimeSubscriptionManager)
    const unsubscribe = realtimeSubscriptionManager.onEvent((incomingEvent: DecisionEvent) => {
      setIsAnalyzing(true);

      const streamEvent = {
        id: incomingEvent.id,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        department: incomingEvent.department.toUpperCase(),
        department_code: incomingEvent.department,
        actor: incomingEvent.created_by,
        action: incomingEvent.event_type.replace(/_/g, ' ').toUpperCase(),
        severity: (incomingEvent.event_type.includes('cut') ||
        incomingEvent.event_type.includes('delay') ||
        incomingEvent.event_type.includes('unavailable') ||
        incomingEvent.event_type.includes('budget') ||
        incomingEvent.event_type.includes('inventory')
          ? 'critical'
          : incomingEvent.event_type.includes('accepted')
          ? 'success'
          : 'warning') as 'critical' | 'warning' | 'success' | 'info',
        details: JSON.stringify(incomingEvent.payload),
      };

      setEvents((prev) => [streamEvent, ...prev]);

      if (incomingEvent.event_type === 'inventory_changed') {
        const payload = incomingEvent.payload as any;
        const newInv = payload?.new_value ?? 860;
        const prevInv = payload?.previous_value ?? 1240;

        setOperationalMetrics((prev) => {
          const updated = {
            ...prev,
            inventoryUnits: newInv,
            previousInventoryUnits: prevInv,
            lastUpdatedEventId: incomingEvent.id,
            lastUpdatedTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
          };
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('impactmesh_ops_state', JSON.stringify(updated));
            } catch {}
          }
          return updated;
        });

        setIsSimulatingCascade(true);
      } else if (incomingEvent.event_type === 'capacity_changed') {
        const payload = incomingEvent.payload as any;
        const newCapacity = payload?.production_capacity ?? Math.round(((payload?.new_hours ?? 300) / 420) * 100);
        const prevCapacity = payload?.previous_production_capacity ?? 100;
        const newInv = payload?.inventory_units ?? 860;
        const prevInv = payload?.previous_inventory_units ?? 1240;

        setOperationalMetrics((prev) => {
          const updated = {
            ...prev,
            productionCapacity: newCapacity,
            previousProductionCapacity: prevCapacity,
            capacityHours: payload?.new_hours ?? 300,
            inventoryUnits: newInv,
            previousInventoryUnits: prevInv,
            shipmentStatus: payload?.shipment_status ?? prev.shipmentStatus,
            operationsStatus: payload?.operations_status ?? prev.operationsStatus,
            equipmentStatus: payload?.equipment_status ?? prev.equipmentStatus,
            lastUpdatedEventId: incomingEvent.id,
            lastUpdatedTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
          };
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('impactmesh_ops_state', JSON.stringify(updated));
            } catch {}
          }
          return updated;
        });

        setIsSimulatingCascade(true);
      } else if ((incomingEvent.event_type as string) === 'contractor_cut') {
        const payload = incomingEvent.payload as any;
        const newHours = payload?.new_hours ?? 300;
        const capacityPercent = Math.round((newHours / 420) * 100);

        setOperationalMetrics((prev) => ({
          ...prev,
          capacityHours: newHours,
          productionCapacity: capacityPercent,
          previousProductionCapacity: 100,
          inventoryUnits: prev.inventoryUnits ?? 860,
          previousInventoryUnits: 1240,
          lastUpdatedEventId: incomingEvent.id,
        }));
        setIsSimulatingCascade(true);
      } else if ((incomingEvent.event_type as string) === 'machine_offline') {
        setOperationalMetrics((prev) => ({
          ...prev,
          equipmentStatus: 'OFFLINE (MAINTENANCE)',
          lastUpdatedEventId: incomingEvent.id,
        }));
        setIsSimulatingCascade(true);
      } else if (incomingEvent.event_type === 'budget_changed') {
        const payload = incomingEvent.payload as any;
        const isCut = (payload?.new_budget ?? 0) <= 1100000;
        setIsSimulatingCascade(isCut);
      } else if (incomingEvent.event_type === 'deal_accepted') {
        setIsSimulatingCascade(true);
      }

      // Re-evaluate signals incrementally
      const updated = signalService.getAllSignals();
      setSignals([...updated]);

      setTimeout(() => {
        setIsAnalyzing(false);
      }, 700);
    });

    return () => {
      unsubConn();
      unsubscribe();
    };
  }, []);

  const handleTriggerSimulation = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsSimulatingCascade((prev) => !prev);
    }, 800);
  };

  const scrollToImpact = () => {
    const el = document.getElementById('impact-map-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAcknowledgeSignal = (signalId: string) => {
    signalService.acknowledgeSignal(signalId, {
      id: 'USR-DEVON-ROSS',
      name: 'Commander Devon Ross',
      role: activeRole === 'ALL' ? 'ceo' : (activeRole.toLowerCase() as ExecutiveRole),
    });
    setSignals([...signalService.getAllSignals()]);
  };

  const handleDismissSignal = (signalId: string) => {
    signalService.dismissSignal(signalId, {
      id: 'USR-DEVON-ROSS',
      name: 'Commander Devon Ross',
      role: activeRole === 'ALL' ? 'ceo' : (activeRole.toLowerCase() as ExecutiveRole),
    });
    setSignals([...signalService.getAllSignals()]);
  };

  const handleRequestContext = (signalId: string, fields: string[]) => {
    signalService.requestMoreContext(
      signalId,
      {
        id: 'USR-DEVON-ROSS',
        name: 'Commander Devon Ross',
        role: activeRole === 'ALL' ? 'ceo' : (activeRole.toLowerCase() as ExecutiveRole),
      },
      fields
    );
    setSignals([...signalService.getAllSignals()]);
  };

  const handleConvertToDecision = (signalId: string) => {
    signalService.convertToDecision(signalId, {
      id: 'USR-DEVON-ROSS',
      name: 'Commander Devon Ross',
      role: activeRole === 'ALL' ? 'ceo' : (activeRole.toLowerCase() as ExecutiveRole),
    });
    setSignals([...signalService.getAllSignals()]);
    scrollToImpact();
  };

  const handleConfirmHumanDecision = (chosenId: string, isOverride: boolean, overrideReason?: string) => {
    setSelectedOptionId(chosenId);
    signalService.recordDecisionReview({
      decisionId: 'DEC-APEX-EXPANSION-Q3',
      reviewerId: 'USR-DEVON-ROSS',
      reviewerName: 'Commander Devon Ross',
      role: activeRole === 'ALL' ? 'ceo' : (activeRole.toLowerCase() as ExecutiveRole),
      systemRecommendationId: MOCK_RECOMMENDATION.id,
      systemRecommendedOptionId: MOCK_RECOMMENDATION.top_option_id,
      selectedOptionId: chosenId,
      override: isOverride,
      overrideReason,
      approvedAt: new Date().toISOString(),
    });

    onPlotRoute();
  };

  const filteredSignals = useMemo(() => {
    if (activeRole === 'ALL') return signals;
    return signals.filter((s) => {
      if (activeRole === 'CEO') return s.materiality === 'HIGH' || s.relatedDepartments.includes('sales');
      if (activeRole === 'CFO') return s.relatedDepartments.includes('finance');
      if (activeRole === 'COO') return s.relatedDepartments.includes('engineering') || s.relatedDepartments.includes('product');
      return true;
    });
  }, [signals, activeRole]);

  const affectedEntityIds = isSimulatingCascade
    ? MOCK_IMPACT_RESULT.affected_entities.map((e) => e.entity_id)
    : [];

  const topOption =
    MOCK_DECISION_OPTIONS.find((o) => o.id === selectedOptionId) ||
    MOCK_DECISION_OPTIONS[0];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* 0. Realtime Link Status Bar (Light Theme) */}
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
          <span className="text-[#718894] hidden sm:inline">PERSPECTIVE:</span>
          <span className="text-[#C89638] font-bold hidden sm:inline">EXECUTIVE DECISION DESK</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#576560]">
          <span>OPS SYNC: <strong className="text-[#18201D]">{operationalMetrics.productionCapacity}% CAP / {operationalMetrics.inventoryUnits ?? 860}U</strong></span>
          {operationalMetrics.lastUpdatedTime && (
            <span className="text-[#718894]">({operationalMetrics.lastUpdatedTime})</span>
          )}
        </div>
      </div>

      {/* 1. STEP 01 // WHAT NEEDS YOUR ATTENTION? */}
      <section id="decision-desk-section">
        <DecisionDesk
          signals={filteredSignals}
          activeRole={activeRole}
          onSelectRole={(r) => setActiveRole(r)}
          onReviewSignal={(id) => setSelectedSignalId(id)}
          onAcknowledgeSignal={handleAcknowledgeSignal}
          onDismissSignal={handleDismissSignal}
          onRequestContext={handleRequestContext}
          onConvertToDecision={handleConvertToDecision}
          onToggleFullGraph={() => setShowFullGraph((prev) => !prev)}
          selectedSignalId={selectedSignalId}
        />
      </section>

      {/* 2. STEP 02 // DECISION INTRODUCTION */}
      <section id="decision-alert-section">
        <DecisionAlert
          department={operationalMetrics.productionCapacity <= 70 ? 'OPERATIONS' : 'FINANCE'}
          actionTitle={
            (operationalMetrics.inventoryUnits ?? 1240) < 1000
              ? 'OPERATIONS UPDATE: INVENTORY DEFICIT REQUIRES ACTION'
              : operationalMetrics.productionCapacity <= 70
              ? 'OPERATIONS UPDATE: PRODUCTION CAPACITY REDUCED'
              : 'A BUDGET CHANGE MAY AFFECT A CUSTOMER COMMITMENT'
          }
          changeDetail={
            (operationalMetrics.inventoryUnits ?? 1240) < 1000
              ? `Safety buffer fell from ${operationalMetrics.previousInventoryUnits ?? 1240} to ${operationalMetrics.inventoryUnits ?? 860} units.`
              : operationalMetrics.productionCapacity <= 70
              ? `Production capacity reduced from ${operationalMetrics.previousProductionCapacity ?? 100}% to ${operationalMetrics.productionCapacity}% (${operationalMetrics.capacityHours}h).`
              : 'Finance reduced the project budget from ₹18L to ₹11L.'
          }
          effectsCount={7}
          capacityDeficitHours={120}
          deliveryExposureDays={8}
          financialExposure="₹50L"
          onReviewImpact={scrollToImpact}
          onViewDetails={scrollToImpact}
        />
      </section>

      {/* 3. STEP 03 & STEP 05 // WHY DOES THIS MATTER? & HOW SERIOUS IS IT? */}
      <section id="impact-map-section">
        <ImpactSummary
          event={MOCK_ACTIVE_DECISION_EVENT}
          impact={MOCK_IMPACT_RESULT}
        />
      </section>

      {/* 4. STEP 04 // WHAT DOES THIS AFFECT? (Causal Chain + Progressive Disclosure) */}
      <section className="p-5 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C5]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
              STEP 04 // DOWNSTREAM EFFECTS
            </span>
            <span className="text-[#718894]">/</span>
            <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
              WHAT DOES THIS AFFECT?
            </h3>
          </div>
          <span className="font-mono text-xs text-[#576560]">
            5 LINKED STATIONS
          </span>
        </div>

        {/* Simplified 5-Step Causal Chain */}
        <CausalChain
          showFullGraph={showFullGraph}
          onToggleFullGraph={() => setShowFullGraph((prev) => !prev)}
        />

        {/* Progressive Disclosure: Advanced Full Impact Map */}
        {showFullGraph && (
          <div className="pt-2 animate-in fade-in">
            <ImpactMap
              entities={MOCK_ENTITIES}
              dependencies={MOCK_DEPENDENCIES}
              affectedEntityIds={affectedEntityIds}
              isAnalyzing={isAnalyzing}
              isSimulatingCascade={isSimulatingCascade}
              onTriggerSimulation={handleTriggerSimulation}
            />
          </div>
        )}
      </section>

      {/* 5. ORGANIZATIONAL POSITION (Business Health & Capacity Gauges) */}
      <section>
        <BusinessPositionStrip
          isSimulatingCascade={isSimulatingCascade}
          operationalMetrics={operationalMetrics}
          connectionState={connectionState}
        />
      </section>

      {/* 6. STEP 06 // WHAT CAN WE DO? (Candidate Alternatives) */}
      <section>
        <DecisionOptionList
          options={MOCK_DECISION_OPTIONS}
          selectedOptionId={selectedOptionId}
          onSelectOption={(opt) => setSelectedOptionId(opt.id)}
        />
      </section>

      {/* 7. STEP 07 // SYSTEM VIEW (Recommended Course) */}
      <section>
        <RecommendationCard
          recommendation={MOCK_RECOMMENDATION}
          topOption={topOption}
          onPlotRoute={() => setIsOverrideModalOpen(true)}
          onSimulate={handleTriggerSimulation}
        />
      </section>

      {/* 8. STEP 09 // CONFIDENCE & TRUST (Analysis Quality) */}
      <section>
        <AnalysisQualityCard
          quality="GOOD"
          dataCoverage={92}
          dependencyCoverage={87}
          constraintCoverage={100}
        />
      </section>

      {/* 9. STEP 11 // WHAT ACTUALLY HAPPENED? (Closed-Loop Outcome) */}
      <section>
        <OutcomeStrip
          decisionTitle={topOption.title}
          outcomeStatus="DECISION COMPLETED // CLOSED-LOOP VERIFIED"
        />
      </section>

      {/* 10. HISTORICAL TRAJECTORY */}
      <section>
        <BusinessCourse />
      </section>

      {/* 11. RECENT OPERATIONAL ACTIVITY STREAM */}
      <section>
        <LiveEventStream
          events={events}
          isAnalyzing={isAnalyzing}
        />
      </section>

      {/* 12. STEP 08 // YOUR DECISION & EXECUTION (Human Authority Modal) */}
      <HumanOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        recommendation={MOCK_RECOMMENDATION}
        options={MOCK_DECISION_OPTIONS}
        selectedOptionId={selectedOptionId}
        onConfirmChoice={handleConfirmHumanDecision}
      />
    </div>
  );
};
