import React, { useState } from 'react';
import { PixelBadge } from '../../components/pixel/PixelBadge.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelIcon } from '../../components/pixel/PixelIcon.tsx';
import { flowTraceAdapter } from '../../../server/services/flowtrace/flowtrace.adapter.ts';
import { CANONICAL_EXECUTION_PLAN_ID } from '../../../server/services/flowtrace/blacktide-execution-plan.ts';
import type { ExecutionPlan, ExecutionStep } from '../../types/execution.ts';
import type { DecisionEvent } from '../../types/events.ts';
import type { StateDeltaChange } from '../../../server/services/state-transition/state-transition.interface.ts';

interface FlowTraceRouteProps {
  onBackToCommand: () => void;
}

export const FlowTraceRoute: React.FC<FlowTraceRouteProps> = ({ onBackToCommand }) => {
  const [plan, setPlan] = useState<ExecutionPlan>(() => {
    return flowTraceAdapter.getExecutionPlan(CANONICAL_EXECUTION_PLAN_ID) ||
      flowTraceAdapter.resetPlan(CANONICAL_EXECUTION_PLAN_ID);
  });
  const [executingStepId, setExecutingStepId] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<Array<{ event: DecisionEvent; changes: StateDeltaChange[] }>>([]);
  const [isExecutingAll, setIsExecutingAll] = useState(false);

  const isApproved = plan.approvedAt !== null;
  const isCompleted = plan.status === 'completed';

  const handleApprove = () => {
    const { plan: approvedPlan } = flowTraceAdapter.approveExecutionPlan(
      plan.id,
      'Commander Devon Ross (Bridge Authority)'
    );
    flowTraceAdapter.startExecution(approvedPlan.id);
    setPlan({ ...approvedPlan });
  };

  const handleExecuteStep = async (stepId: string) => {
    try {
      setExecutingStepId(stepId);
      const { step, event, transitionResult } = await flowTraceAdapter.executeStep(plan.id, stepId);

      setRecentEvents((prev) => [
        { event, changes: transitionResult.stateDelta.changes },
        ...prev,
      ]);

      const updatedPlan = flowTraceAdapter.getExecutionPlan(plan.id);
      if (updatedPlan) {
        setPlan({ ...updatedPlan });
      }
      return step;
    } catch (err) {
      console.error('Step execution error:', err);
    } finally {
      setExecutingStepId(null);
    }
  };

  const handleRunAllSteps = async () => {
    if (!isApproved) return;
    setIsExecutingAll(true);

    for (const step of plan.steps) {
      if (step.status !== 'completed') {
        await handleExecuteStep(step.id);
        // Small visual cadence between steps
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    setIsExecutingAll(false);
  };

  const handleReset = () => {
    const fresh = flowTraceAdapter.resetPlan(CANONICAL_EXECUTION_PLAN_ID);
    setPlan({ ...fresh });
    setRecentEvents([]);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Navigation and Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PixelButton
          variant="secondary"
          size="sm"
          onClick={onBackToCommand}
          icon={<PixelIcon name="helm" size={12} />}
        >
          [ ← RETURN TO COMMAND DECK ]
        </PixelButton>

        <div className="flex items-center gap-2">
          <PixelBadge variant="brass" size="sm">
            FLOWTRACE BRIDGE // ACTIVE
          </PixelBadge>
          {isApproved && !isCompleted && (
            <PixelBadge variant="seaFoam" size="sm" pulse>
              EXECUTION IN PROGRESS
            </PixelBadge>
          )}
          {isCompleted && (
            <PixelBadge variant="seaFoam" size="sm">
              ALL STEPS COMPLETED
            </PixelBadge>
          )}
          <PixelButton variant="ghost" size="sm" onClick={handleReset}>
            [ RESET ]
          </PixelButton>
        </div>
      </div>

      {/* Main Execution Plan Box */}
      <div className="p-4 md:p-6 bg-[#141A20] border-2 border-[#D6A84F] pixel-shadow-raised select-none">
        {/* Route Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A333B] pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <PixelIcon name="route-marker" size={18} color="#D6A84F" />
            <div>
              <span className="font-pixel text-xs text-[#D6A84F] uppercase tracking-widest block">
                FLOWTRACE // STRATEGIC EXECUTION ROUTE
              </span>
              <h3 className="font-mono font-bold text-sm text-[#E8E4D8] mt-0.5">
                {plan.title.toUpperCase()}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PixelBadge variant="brass" size="md">
              BEARING: 4 DEPT COUPLING
            </PixelBadge>
            <PixelBadge variant={isApproved ? 'seaFoam' : 'warning'} size="md">
              {isApproved ? 'ORDER APPROVED' : 'LOCKED: APPROVAL REQUIRED'}
            </PixelBadge>
          </div>
        </div>

        {/* Objective & Context */}
        <div className="mb-6 p-3 bg-[#0D131A] border border-[#2A333B] text-xs font-mono text-[#AFCBC2]">
          <span className="text-[#D6A84F] font-bold">OPERATIONAL OBJECTIVE: </span>
          {plan.objective}
        </div>

        {/* Stepped Route Execution Line */}
        <div className="relative pl-6 md:pl-10 space-y-6 before:absolute before:left-3 md:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#2A333B]">
          {plan.steps.map((step: ExecutionStep) => {
            const isStepCompleted = step.status === 'completed';
            const isStepReady = step.status === 'ready';
            const isStepBlocked = step.status === 'blocked';
            const isRunning = executingStepId === step.id || step.status === 'running';

            return (
              <div key={step.id} className="relative">
                {/* Waypoint Marker */}
                <div
                  className={`absolute -left-6 md:-left-10 top-0.5 w-6 h-6 flex items-center justify-center pixel-corners-sm text-xs font-pixel ${
                    isStepCompleted
                      ? 'bg-[#10201B] border border-[#59A66A] text-[#59A66A]'
                      : isStepReady
                      ? 'bg-[#292010] border border-[#D6A84F] text-[#D6A84F] animate-pulse'
                      : 'bg-[#141A20] border border-[#2A333B] text-[#66727C]'
                  }`}
                >
                  {isStepCompleted ? '✓' : isRunning ? '●' : step.sequence}
                </div>

                {/* Step Detail Box */}
                <div
                  className={`p-3.5 border pixel-shadow transition-colors ${
                    isStepCompleted
                      ? 'bg-[#121A16] border-[#2A333B]'
                      : isStepReady
                      ? 'bg-[#1A2128] border-[#D6A84F]'
                      : 'bg-[#101419] border-[#1C242C]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-pixel text-[10px] text-[#D6A84F] tracking-wider uppercase">
                      {step.departmentTitle}
                    </span>
                    <div className="flex items-center gap-2">
                      {step.dependsOn.length > 0 && isStepBlocked && (
                        <span className="text-[10px] font-mono text-[#E06C75]">
                          WAITING ON STEP {step.sequence - 1}
                        </span>
                      )}
                      <PixelBadge
                        variant={
                          isStepCompleted ? 'seaFoam' : isStepReady ? 'brass' : 'muted'
                        }
                        size="sm"
                      >
                        {step.status.toUpperCase()}
                      </PixelBadge>
                    </div>
                  </div>

                  <h4 className="font-mono font-bold text-xs text-[#E8E4D8] mt-1">
                    {step.title}
                  </h4>

                  <p className="text-xs text-[#A9ADA8] font-sans mt-1 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Telemetry Output Line if completed */}
                  {step.evidence && (
                    <div className="mt-2.5 pt-2 border-t border-[#2A333B]/60 font-mono text-[10px] text-[#59A66A] flex items-center gap-2">
                      <span className="text-[#AFCBC2]">VERIFIED RESULT:</span>
                      <span>{step.evidence.telemetrySummary}</span>
                    </div>
                  )}

                  {/* Individual Step Action Trigger */}
                  {isApproved && isStepReady && !isStepCompleted && (
                    <div className="mt-3 flex justify-end">
                      <PixelButton
                        variant="primary"
                        size="sm"
                        disabled={isRunning || isExecutingAll}
                        onClick={() => handleExecuteStep(step.id)}
                        icon={<PixelIcon name="emblem-blacktide" size={12} />}
                      >
                        {isRunning ? '[ DISPATCHING... ]' : `[ EXECUTE STEP ${step.sequence} ]`}
                      </PixelButton>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Route Execution Approval / Dispatch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-[#2A333B] bg-[#101419] p-4">
          <div className="font-mono text-xs">
            <span className="text-[#66727C] block text-[10px]">EXECUTION AUTHORITY</span>
            <span className="text-[#E8E4D8] font-bold">
              {isApproved
                ? `APPROVED BY ${plan.approvedBy?.toUpperCase()}`
                : 'COMMAND CENTER // HUMAN APPROVAL MANDATORY'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isApproved ? (
              <PixelButton
                variant="primary"
                size="lg"
                onClick={handleApprove}
                icon={<PixelIcon name="emblem-blacktide" size={16} />}
              >
                [ APPROVE & TRANSMIT EXECUTION ROUTE ]
              </PixelButton>
            ) : !isCompleted ? (
              <PixelButton
                variant="primary"
                size="md"
                disabled={isExecutingAll}
                onClick={handleRunAllSteps}
                icon={<PixelIcon name="emblem-blacktide" size={14} />}
              >
                {isExecutingAll ? '[ DISPATCHING ALL... ]' : '[ DISPATCH ALL REMAINING STEPS ]'}
              </PixelButton>
            ) : (
              <PixelBadge variant="seaFoam" size="md">
                ✓ ALL OPERATIONAL ORDERS EXECUTED
              </PixelBadge>
            )}
          </div>
        </div>
      </div>

      {/* Closed-Loop Telemetry & Generated Events Stream */}
      {recentEvents.length > 0 && (
        <div className="p-4 bg-[#10201B] border-2 border-[#59A66A] text-[#E8E4D8] pixel-shadow font-mono text-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#2A333B] pb-2">
            <div className="flex items-center gap-2">
              <PixelIcon name="emblem-blacktide" size={18} />
              <span className="font-pixel text-[11px] text-[#59A66A] uppercase tracking-wider">
                CLOSED-LOOP FEEDBACK TELEMETRY (FLOWTRACE → IMPACTMESH)
              </span>
            </div>
            <PixelBadge variant="seaFoam" size="sm">
              {recentEvents.length} EVENTS EMITTED
            </PixelBadge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentEvents.map(({ event, changes }, idx) => (
              <div key={event.id || idx} className="p-2 bg-[#0D131A] border border-[#2A333B] text-[11px] flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[#D6A84F] font-bold">[{event.department.toUpperCase()}]</span>{' '}
                  <span className="text-[#E8E4D8]">{event.event_type}</span>{' '}
                  <span className="text-[#66727C]">ID: {event.id}</span>
                </div>
                <div className="text-[#AFCBC2]">
                  Deltas:{' '}
                  {changes
                    .filter((c) => c.metric === 'engineering_demand' || c.metric === 'engineering_capacity' || c.metric === 'capacity_utilization' || c.metric === 'committed_budget')
                    .map((c) => `${c.metric}: ${c.delta > 0 ? '+' : ''}${c.delta}`)
                    .join(' • ') || 'State updated'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
