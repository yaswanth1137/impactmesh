import React, { useState, useEffect, useCallback } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelIcon } from '../../components/pixel/PixelIcon.tsx';
import { PixelBadge } from '../../components/pixel/PixelBadge.tsx';
import type { NavRoute } from '../../components/shell/CommandRail.tsx';
import {
  scenarioSimulatorService,
  SCENARIO_STEP_DEFINITIONS,
  type SimulatorEventLogItem,
  type SimulatorAnalysisResult,
} from '../../features/simulator/index.ts';
import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';

interface SimulatorRouteProps {
  onSelectRoute: (route: NavRoute) => void;
}

export const SimulatorRoute: React.FC<SimulatorRouteProps> = ({ onSelectRoute }) => {
  const [businessState, setBusinessState] = useState(() => scenarioSimulatorService.getCurrentState());
  const [eventLog, setEventLog] = useState<SimulatorEventLogItem[]>(() => scenarioSimulatorService.getEventLog());
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => scenarioSimulatorService.getCompletedSteps());
  const [analysisResult, setAnalysisResult] = useState<SimulatorAnalysisResult | null>(() =>
    scenarioSimulatorService.getAnalysisResult()
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeRunningStep, setActiveRunningStep] = useState<number | null>(null);
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('CONNECTED');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync with SimulatorService
  const syncWithService = useCallback(() => {
    setBusinessState(scenarioSimulatorService.getCurrentState());
    setEventLog(scenarioSimulatorService.getEventLog());
    setCompletedSteps(scenarioSimulatorService.getCompletedSteps());
    setAnalysisResult(scenarioSimulatorService.getAnalysisResult());
  }, []);

  useEffect(() => {
    const unsubscribeService = scenarioSimulatorService.subscribe(syncWithService);
    const unsubscribeConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    return () => {
      unsubscribeService();
      unsubscribeConn();
    };
  }, [syncWithService]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Run a single action step
  const handleExecuteStep = async (step: 1 | 2 | 3 | 4 | 5) => {
    if (isExecuting) return;
    setIsExecuting(true);
    setActiveRunningStep(step);

    try {
      const result = await scenarioSimulatorService.executeStep(step);
      showNotification(
        `Step ${step} Completed: ${result.stepTitle} (${result.isIdempotent ? 'Idempotent Cache Hit' : 'State Transition Applied'})`,
        'success'
      );
    } catch (err: any) {
      showNotification(err.message || `Failed to execute step ${step}`, 'error');
    } finally {
      setIsExecuting(false);
      setActiveRunningStep(null);
    }
  };

  // Run full scenario sequentially
  const handleStartFullScenario = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    showNotification('Starting complete Blacktide scenario sequence...', 'info');

    try {
      // Step through with 500ms delay for visual feedback
      for (let s = 1; s <= 5; s++) {
        setActiveRunningStep(s);
        await scenarioSimulatorService.executeStep(s as 1 | 2 | 3 | 4 | 5);
        if (s < 5) {
          await new Promise((resolve) => setTimeout(resolve, 450));
        }
      }
      showNotification('Complete 5-step Blacktide scenario executed successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error executing complete scenario', 'error');
    } finally {
      setIsExecuting(false);
      setActiveRunningStep(null);
    }
  };

  // Non-destructive reset
  const handleReset = () => {
    scenarioSimulatorService.resetScenario();
    showNotification('Scenario reset to initial baseline state (production events preserved).', 'info');
  };

  // Derived Business Metrics from actual BusinessState
  const m = businessState.metrics;
  const committedRevenue = m.committed_revenue ?? m.committedRevenue ?? 0;
  const availableBudget = m.available_budget ?? m.availableBudget ?? 0;
  const capacity = m.engineering_capacity ?? m.engineeringCapacity ?? 0;
  const demand = m.engineering_demand ?? m.engineeringDemand ?? 0;
  const deficit = demand > capacity ? demand - capacity : 0;
  const utilization = m.capacity_utilization ?? m.capacityUtilization ?? (capacity > 0 ? Math.round((demand / capacity) * 100) : 0);
  const committedFeatures = m.committed_features_count ?? 0;

  // Station jump options for judges
  const departmentStations = [
    { id: 'sales' as NavRoute, label: 'Sales Station', icon: 'spyglass' as const, color: '#D6A84F' },
    { id: 'product' as NavRoute, label: 'Product Station', icon: 'compass' as const, color: '#557A91' },
    { id: 'operations' as NavRoute, label: 'Operations Station', icon: 'gear' as const, color: '#C5B58F' },
    { id: 'finance' as NavRoute, label: 'Finance Station', icon: 'ledger' as const, color: '#59A66A' },
    { id: 'command' as NavRoute, label: 'CEO Command Deck', icon: 'helm' as const, color: '#AFCBC2' },
    { id: 'flowtrace' as NavRoute, label: 'FlowTrace Bridge', icon: 'route-marker' as const, color: '#D6A84F' },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto select-none font-sans">
      {/* 1. CONTROL ROOM TELEMETRY HEADER */}
      <div className="p-4 bg-[#141A20] border-2 border-[#D6A84F]/40 pixel-shadow relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#1A2128] border border-[#D6A84F] flex items-center justify-center shrink-0">
              <PixelIcon name="crosshair" size={22} color="#D6A84F" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-[11px] text-[#D6A84F] uppercase tracking-wider">
                  BLACKTIDE SCENARIO CONTROLLER // OPERATIONAL CONTROL ROOM
                </span>
                <PixelBadge variant="brass" size="sm">EVENT PIPELINE: ISOMORPHIC</PixelBadge>
                <PixelBadge variant={connectionState === 'CONNECTED' ? 'seaFoam' : 'warning'} size="sm">
                  {connectionState === 'CONNECTED' ? 'REALTIME ACTIVE' : 'LOCAL MESH'}
                </PixelBadge>
              </div>
              <h1 className="font-mono font-bold text-lg md:text-xl text-[#E8E4D8] mt-0.5 tracking-tight">
                IMPACTMESH Decision Impact Simulator
              </h1>
              <p className="text-xs text-[#A9ADA8] font-sans mt-1 max-w-3xl">
                Drives real <code className="font-mono text-[#D6A84F]">DecisionEvent</code>s through the canonical
                validation and <code className="font-mono text-[#D6A84F]">StateTransitionEngine</code>. The simulator
                never mutates BusinessState directly.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-[#101419] p-2 border border-[#2A333B] text-[11px] font-mono">
            <span className="text-[#A9ADA8]">TENANT:</span>
            <span className="text-[#D6A84F] font-bold">DEMO-SIM-01</span>
            <span className="text-[#2A333B]">|</span>
            <span className="text-[#A9ADA8]">EVENTS:</span>
            <span className="text-[#E8E4D8] font-bold">{eventLog.length}</span>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`mt-3 p-2.5 text-xs font-mono border flex items-center gap-2 transition-all ${
              notification.type === 'success'
                ? 'bg-[#10201B] border-[#59A66A] text-[#AFCBC2]'
                : notification.type === 'error'
                ? 'bg-[#261214] border-[#D05A4A] text-[#D05A4A]'
                : 'bg-[#101D28] border-[#557A91] text-[#E8E4D8]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* 2. SCENARIO PROGRESSION STEPPER */}
      <PixelPanel
        title="BLACKTIDE 5-STEP DEMO SEQUENCE"
        subtitle="Canonical Scenario Actions"
        coordinate="STEPPER 01-05"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SCENARIO_STEP_DEFINITIONS.map((def) => {
            const isCompleted = completedSteps.includes(def.step);
            const isRunning = activeRunningStep === def.step;

            return (
              <div
                key={def.step}
                className={`p-3 border transition-all relative ${
                  isRunning
                    ? 'bg-[#252E37] border-[#D6A84F] ring-1 ring-[#D6A84F]'
                    : isCompleted
                    ? 'bg-[#10201B]/80 border-[#59A66A]'
                    : 'bg-[#141A20] border-[#2A333B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-pixel text-[10px] text-[#A9ADA8]">
                    STEP 0{def.step}
                  </span>
                  {isCompleted ? (
                    <PixelBadge variant="seaFoam" size="sm">COMPLETED ✓</PixelBadge>
                  ) : isRunning ? (
                    <PixelBadge variant="warning" size="sm" pulse>RUNNING...</PixelBadge>
                  ) : (
                    <PixelBadge variant="muted" size="sm">PENDING</PixelBadge>
                  )}
                </div>

                <h3 className="font-pixel text-xs text-[#E8E4D8] uppercase tracking-wide">
                  {def.title}
                </h3>

                <p className="text-[11px] text-[#A9ADA8] font-sans mt-1 line-clamp-2 leading-snug">
                  {def.summary}
                </p>

                <div className="mt-2.5 pt-2 border-t border-[#2A333B] flex items-center justify-between">
                  <span className="font-mono text-[9px] text-[#D6A84F] truncate">
                    {def.expectedDelta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Action Controls Bar */}
        <div className="mt-4 pt-3 border-t border-[#2A333B] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <PixelButton
              variant="primary"
              size="md"
              loading={isExecuting && activeRunningStep !== null}
              disabled={isExecuting}
              onClick={handleStartFullScenario}
              icon={<PixelIcon name="helm" size={15} color="#090B0F" />}
            >
              [ RUN COMPLETE SCENARIO (1-5) ]
            </PixelButton>

            <PixelButton
              variant="secondary"
              size="md"
              disabled={isExecuting}
              onClick={handleReset}
              icon={<PixelIcon name="anchor" size={15} color="#D6A84F" />}
            >
              [ ↺ RESET SCENARIO (NON-DESTRUCTIVE) ]
            </PixelButton>
          </div>

          <span className="font-mono text-[10px] text-[#66727C]">
            Deterministic pipeline • Zero direct state mutation
          </span>
        </div>
      </PixelPanel>

      {/* 3. INDIVIDUAL SCENARIO ACTION CONTROLS */}
      <PixelPanel
        title="INDIVIDUAL STEP TRIGGERS"
        subtitle="Emit discrete DecisionEvents on demand"
        coordinate="DISPATCH"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <PixelButton
            variant={completedSteps.includes(1) ? 'secondary' : 'outline'}
            size="sm"
            disabled={isExecuting}
            loading={activeRunningStep === 1}
            onClick={() => handleExecuteStep(1)}
            icon={<PixelIcon name="spyglass" size={13} color="#D6A84F" />}
          >
            1. ACCEPT ₹50L DEAL
          </PixelButton>

          <PixelButton
            variant={completedSteps.includes(2) ? 'secondary' : 'outline'}
            size="sm"
            disabled={isExecuting}
            loading={activeRunningStep === 2}
            onClick={() => handleExecuteStep(2)}
            icon={<PixelIcon name="compass" size={13} color="#557A91" />}
          >
            2. COMMIT 3 FEATURES
          </PixelButton>

          <PixelButton
            variant={completedSteps.includes(3) ? 'secondary' : 'outline'}
            size="sm"
            disabled={isExecuting}
            loading={activeRunningStep === 3}
            onClick={() => handleExecuteStep(3)}
            icon={<PixelIcon name="gear" size={13} color="#C5B58F" />}
          >
            3. REDUCE CAPACITY (300h)
          </PixelButton>

          <PixelButton
            variant={completedSteps.includes(4) ? 'secondary' : 'outline'}
            size="sm"
            disabled={isExecuting}
            loading={activeRunningStep === 4}
            onClick={() => handleExecuteStep(4)}
            icon={<PixelIcon name="ledger" size={13} color="#59A66A" />}
          >
            4. CUT BUDGET (₹11L)
          </PixelButton>

          <PixelButton
            variant="primary"
            size="sm"
            disabled={isExecuting}
            loading={activeRunningStep === 5}
            onClick={() => handleExecuteStep(5)}
            icon={<PixelIcon name="pressure-gauge" size={13} color="#090B0F" />}
          >
            5. ANALYZE IMPACT
          </PixelButton>
        </div>
      </PixelPanel>

      {/* 4. CURRENT BUSINESS STATE TELEMETRY GRID */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#D6A84F] inline-block" />
            <span className="font-pixel text-xs text-[#E8E4D8] uppercase tracking-wider">
              CURRENT BUSINESS STATE (DERIVED FROM EVENT PIPELINE)
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#A9ADA8]">
            HASH: <span className="text-[#D6A84F]">{businessState.state_hash}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Card 1: Revenue */}
          <div className="p-3 bg-[#141A20] border border-[#2A333B] pixel-shadow">
            <span className="font-mono text-[10px] text-[#A9ADA8] uppercase block">
              Committed Revenue
            </span>
            <div className="font-mono text-lg font-bold text-[#E8E4D8] mt-1">
              ₹{(committedRevenue / 100000).toFixed(1)}L
            </div>
            <span className="text-[10px] font-mono text-[#59A66A] block mt-0.5">
              {committedRevenue > 0 ? '₹5,000,000 committed' : '₹0 pipeline'}
            </span>
          </div>

          {/* Card 2: Budget */}
          <div className="p-3 bg-[#141A20] border border-[#2A333B] pixel-shadow">
            <span className="font-mono text-[10px] text-[#A9ADA8] uppercase block">
              Available Budget
            </span>
            <div className="font-mono text-lg font-bold text-[#E8E4D8] mt-1">
              ₹{(availableBudget / 100000).toFixed(1)}L
            </div>
            <span
              className={`text-[10px] font-mono block mt-0.5 ${
                availableBudget <= 1100000 ? 'text-[#D05A4A]' : 'text-[#59A66A]'
              }`}
            >
              {availableBudget <= 1100000 ? '-₹7.0L cut applied' : '₹18.0L baseline'}
            </span>
          </div>

          {/* Card 3: Capacity */}
          <div className="p-3 bg-[#141A20] border border-[#2A333B] pixel-shadow">
            <span className="font-mono text-[10px] text-[#A9ADA8] uppercase block">
              Capacity (Hours)
            </span>
            <div className="font-mono text-lg font-bold text-[#E8E4D8] mt-1">
              {capacity}h
            </div>
            <span
              className={`text-[10px] font-mono block mt-0.5 ${
                capacity < 420 ? 'text-[#D05A4A]' : 'text-[#A9ADA8]'
              }`}
            >
              {capacity < 420 ? '-120h reduction' : '420h nominal pool'}
            </span>
          </div>

          {/* Card 4: Demand */}
          <div className="p-3 bg-[#141A20] border border-[#2A333B] pixel-shadow">
            <span className="font-mono text-[10px] text-[#A9ADA8] uppercase block">
              Engineering Demand
            </span>
            <div className="font-mono text-lg font-bold text-[#E8E4D8] mt-1">
              {demand}h
            </div>
            <span className="text-[10px] font-mono text-[#D6A84F] block mt-0.5">
              {demand > 0 ? 'Sprint-24 requirement' : '0h backlog'}
            </span>
          </div>

          {/* Card 5: Capacity Deficit */}
          <div
            className={`p-3 border pixel-shadow ${
              deficit > 0 ? 'bg-[#261214] border-[#D05A4A]' : 'bg-[#141A20] border-[#2A333B]'
            }`}
          >
            <span className="font-mono text-[10px] uppercase block text-[#A9ADA8]">
              Capacity Deficit
            </span>
            <div
              className={`font-mono text-lg font-bold mt-1 ${
                deficit > 0 ? 'text-[#D05A4A]' : 'text-[#59A66A]'
              }`}
            >
              {deficit}h
            </div>
            <span
              className={`text-[10px] font-mono block mt-0.5 ${
                deficit > 0 ? 'text-[#D05A4A] font-bold' : 'text-[#59A66A]'
              }`}
            >
              {deficit > 0 ? 'CRITICAL DEFICIT' : 'Balanced'}
            </span>
          </div>

          {/* Card 6: Utilization */}
          <div
            className={`p-3 border pixel-shadow ${
              utilization > 100 ? 'bg-[#292010] border-[#D6A84F]' : 'bg-[#141A20] border-[#2A333B]'
            }`}
          >
            <span className="font-mono text-[10px] text-[#A9ADA8] uppercase block">
              Utilization
            </span>
            <div
              className={`font-mono text-lg font-bold mt-1 ${
                utilization > 100 ? 'text-[#D6A84F]' : 'text-[#E8E4D8]'
              }`}
            >
              {utilization}%
            </div>
            <span
              className={`text-[10px] font-mono block mt-0.5 ${
                utilization >= 140 ? 'text-[#D05A4A] font-bold' : 'text-[#59A66A]'
              }`}
            >
              {utilization >= 140 ? '140% OVERLOAD' : 'Within threshold'}
            </span>
          </div>

          {/* Card 7: Committed Features */}
          <div className="p-3 bg-[#141A20] border border-[#2A333B] pixel-shadow">
            <span className="font-mono text-[10px] text-[#A9ADA8] uppercase block">
              Committed Features
            </span>
            <div className="font-mono text-lg font-bold text-[#E8E4D8] mt-1">
              {committedFeatures}
            </div>
            <span className="text-[10px] font-mono text-[#A9ADA8] block mt-0.5">
              {committedFeatures === 3 ? 'SAML, Reports, Audit' : 'None committed'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. IMPACT ANALYSIS & DECISION INTELLIGENCE PANEL (TRIGGERED BY STEP 5) */}
      {analysisResult && (
        <PixelPanel
          title="STEP 5 RESULT // DECISION INTELLIGENCE & IMPACT ANALYSIS"
          subtitle="Output of Layer 1 (Impact), Layer 2 (Decisions), Layer 3 (Reasoning), and FlowTrace"
          coordinate="INTELLIGENCE-CORE"
          variant="brass"
          hasDoubleBorder
        >
          <div className="space-y-4">
            {/* Executive Synthesis Banner */}
            <div className="p-3.5 bg-[#101419] border border-[#D6A84F]/50 text-xs text-[#E8E4D8] leading-relaxed">
              <div className="flex items-center gap-2 mb-1">
                <PixelIcon name="emblem-impactmesh" size={14} color="#D6A84F" />
                <strong className="font-pixel text-[11px] text-[#D6A84F] uppercase">
                  Executive Strategic Synthesis:
                </strong>
              </div>
              <p className="font-sans text-xs text-[#E8E4D8] leading-relaxed">
                {analysisResult.executiveSynthesis}
              </p>
              <div className="mt-2 pt-2 border-t border-[#2A333B] text-[11px] text-[#A9ADA8] font-mono">
                <span className="text-[#D6A84F]">STRATEGIC RATIONALE: </span>
                {analysisResult.strategicRationale}
              </div>
            </div>

            {/* Grid: Downstream Impact + Generated Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Downstream Impact Entities */}
              <div className="p-3 bg-[#101419] border border-[#2A333B] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#2A333B] pb-1.5">
                  <span className="font-pixel text-[11px] text-[#E8E4D8] uppercase">
                    Downstream Cascade ({analysisResult.impactAnalysis.affectedEntities.length} Entities)
                  </span>
                  <PixelBadge variant="danger" size="sm">
                    {analysisResult.impactAnalysis.severity.toUpperCase()} SEVERITY
                  </PixelBadge>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {analysisResult.impactAnalysis.affectedEntities.map((ent) => (
                    <div
                      key={ent.entity_id}
                      className="p-2 bg-[#141A20] border border-[#2A333B] text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-[#D6A84F] block truncate">
                          [{ent.department.toUpperCase()}] {ent.entity_name}
                        </span>
                        <span className="text-[10px] text-[#A9ADA8] truncate block">
                          {ent.details || `Type: ${ent.entity_type}`}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold shrink-0 px-1.5 py-0.5 border ${
                          ent.impact_severity === 'critical'
                            ? 'bg-[#261214] text-[#D05A4A] border-[#D05A4A]'
                            : 'bg-[#292010] text-[#D6A84F] border-[#D6A84F]'
                        }`}
                      >
                        {ent.impact_severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Decision Options */}
              <div className="p-3 bg-[#101419] border border-[#2A333B] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#2A333B] pb-1.5">
                  <span className="font-pixel text-[11px] text-[#E8E4D8] uppercase">
                    Strategic Alternatives & Tradeoffs ({analysisResult.decisionOptions.length})
                  </span>
                  <PixelBadge variant="brass" size="sm">BALANCED POLICY</PixelBadge>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {analysisResult.decisionOptions.map((opt) => {
                    const isSelected = opt.id === analysisResult.recommendation.top_option_id;
                    return (
                      <div
                        key={opt.id}
                        className={`p-2 border transition-all ${
                          isSelected
                            ? 'bg-[#1A2128] border-[#D6A84F] ring-1 ring-[#D6A84F]'
                            : 'bg-[#141A20] border-[#2A333B]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-pixel text-xs text-[#E8E4D8] truncate">
                            {opt.title}
                          </span>
                          <span
                            className={`font-mono text-[9px] px-1.5 py-0.5 border shrink-0 ${
                              opt.feasible
                                ? 'bg-[#10201B] text-[#AFCBC2] border-[#59A66A]'
                                : 'bg-[#261214] text-[#D05A4A] border-[#D05A4A]'
                            }`}
                          >
                            {opt.feasible ? 'FEASIBLE' : 'VIOLATION'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A9ADA8] font-sans mt-0.5 leading-snug line-clamp-2">
                          {opt.description}
                        </p>
                        <div className="mt-1.5 pt-1 border-t border-[#2A333B] flex items-center justify-between text-[10px] font-mono text-[#66727C]">
                          <span>
                            CEO: {opt.policyAlignment.ceo} | CFO: {opt.policyAlignment.cfo} | COO: {opt.policyAlignment.coo}
                          </span>
                          {isSelected && <span className="text-[#D6A84F] font-bold">RECOMMENDED ★</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FlowTrace Bridge Action */}
            <div className="p-3 bg-[#101419] border border-[#2A333B] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PixelIcon name="route-marker" size={16} color="#D6A84F" />
                <span className="text-xs text-[#E8E4D8] font-mono">
                  FlowTrace Execution Plan Registered:
                  <strong className="text-[#D6A84F] ml-1">
                    {analysisResult.executionPlan.id} ({analysisResult.executionPlan.steps.length} Steps)
                  </strong>
                </span>
              </div>

              <PixelButton
                variant="primary"
                size="sm"
                onClick={() => onSelectRoute('flowtrace')}
                icon={<PixelIcon name="route-marker" size={12} color="#090B0F" />}
              >
                [ VIEW IN FLOWTRACE EXECUTION ENGINE ]
              </PixelButton>
            </div>
          </div>
        </PixelPanel>
      )}

      {/* 6. LIVE DECISION EVENT LOG */}
      <PixelPanel
        title="LIVE DECISIONEVENT LOG (IMMUTABLE CANONICAL EMISSIONS)"
        subtitle="Real events processed through handleEventIngestion"
        coordinate="AUDIT-LOG"
      >
        {eventLog.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-[#66727C] border border-dashed border-[#2A333B]">
            No DecisionEvents emitted yet. Click [RUN COMPLETE SCENARIO] or trigger individual actions above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#2A333B] text-[10px] text-[#A9ADA8] uppercase bg-[#101419]">
                <tr>
                  <th className="py-2 px-2.5">Time</th>
                  <th className="py-2 px-2.5">Event Type</th>
                  <th className="py-2 px-2.5">Department</th>
                  <th className="py-2 px-2.5">Entity</th>
                  <th className="py-2 px-2.5">Payload Summary</th>
                  <th className="py-2 px-2.5">Ingestion Status</th>
                  <th className="py-2 px-2.5 text-right">Event ID / Correlation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A333B]/50">
                {eventLog.map((evt) => (
                  <tr key={evt.eventId} className="hover:bg-[#1A2128]/50 transition-colors">
                    <td className="py-2 px-2.5 text-[#A9ADA8] whitespace-nowrap text-[11px]">
                      {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <span className="font-bold text-[#D6A84F] text-[11px]">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <span className="uppercase text-[10px] text-[#AFCBC2]">
                        [{evt.department}]
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-[#E8E4D8] whitespace-nowrap text-[11px]">
                      {evt.entityId}
                    </td>
                    <td className="py-2 px-2.5 text-[#A9ADA8] text-[11px] max-w-xs truncate">
                      {evt.description}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border ${
                          evt.status === 'PROCESSED'
                            ? 'bg-[#10201B] text-[#59A66A] border-[#59A66A]'
                            : 'bg-[#292010] text-[#D6A84F] border-[#D6A84F]'
                        }`}
                      >
                        {evt.httpStatus} {evt.status}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right text-[10px] text-[#66727C] font-mono whitespace-nowrap">
                      {evt.eventId.slice(0, 22)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PixelPanel>

      {/* 7. QUICK STATION SWITCHER (MULTI-DEVICE CLUSTER CONSOLE) */}
      <div className="p-4 bg-[#141A20] border border-[#2A333B]">
        <div className="flex items-center justify-between mb-3 border-b border-[#2A333B] pb-2">
          <div className="flex items-center gap-2">
            <PixelIcon name="helm" size={16} color="#D6A84F" />
            <span className="font-pixel text-xs text-[#E8E4D8] uppercase tracking-wider">
              MULTI-STATION WORKSPACE JUMP
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#66727C]">
            Inspect individual terminals in realtime
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {departmentStations.map((station) => (
            <button
              key={station.id}
              onClick={() => onSelectRoute(station.id)}
              className="p-2.5 bg-[#101419] hover:bg-[#1A2128] border border-[#2A333B] hover:border-[#D6A84F] text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-[#A9ADA8] group-hover:text-[#D6A84F]">
                <PixelIcon name={station.icon} size={14} />
                <span className="font-pixel text-[10px] uppercase truncate">
                  {station.label}
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#66727C] block mt-1">
                /{station.id}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
