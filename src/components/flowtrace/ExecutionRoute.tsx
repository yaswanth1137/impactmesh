import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { PixelButton } from '../pixel/PixelButton.tsx';
import { PixelIcon } from '../pixel/PixelIcon.tsx';
import type { FlowTraceStep } from '../../mocks/blacktide-mock.ts';

interface ExecutionRouteProps {
  steps: FlowTraceStep[];
  decisionTitle: string;
  onApproveExecution?: () => void;
  className?: string;
}

export const ExecutionRoute: React.FC<ExecutionRouteProps> = ({
  steps,
  decisionTitle,
  onApproveExecution,
  className = '',
}) => {
  return (
    <div className={`p-4 md:p-6 bg-[#141A20] border-2 border-[#D6A84F] pixel-shadow-raised select-none ${className}`}>
      {/* Route Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A333B] pb-3 mb-5">
        <div className="flex items-center gap-2.5">
          <PixelIcon name="route-marker" size={18} color="#D6A84F" />
          <div>
            <span className="font-pixel text-xs text-[#D6A84F] uppercase tracking-widest block">
              FLOWTRACE // STRATEGIC EXECUTION ROUTE
            </span>
            <h3 className="font-mono font-bold text-sm text-[#E8E4D8] mt-0.5">
              RESPONSE TO: {decisionTitle}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PixelBadge variant="brass" size="md">
            BEARING: 4 DEPT COUPLING
          </PixelBadge>
          <PixelBadge variant="info" size="md">
            ROUTE LOCKED
          </PixelBadge>
        </div>
      </div>

      {/* Stepped Navigational Route Line */}
      <div className="relative pl-6 md:pl-10 space-y-6 before:absolute before:left-3 md:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#2A333B]">
        {steps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <div key={step.id} className="relative">
              {/* Waypoint Marker on the vertical route line */}
              <div
                className={`absolute -left-6 md:-left-10 top-0.5 w-6 h-6 flex items-center justify-center pixel-corners-sm text-xs font-pixel ${
                  isCompleted
                    ? 'bg-[#10201B] border border-[#59A66A] text-[#59A66A]'
                    : isActive
                    ? 'bg-[#292010] border border-[#D6A84F] text-[#D6A84F] animate-pulse'
                    : 'bg-[#141A20] border border-[#2A333B] text-[#66727C]'
                }`}
              >
                {isCompleted ? '✓' : isActive ? '●' : step.stepNumber}
              </div>

              {/* Waypoint Detail Box */}
              <div
                className={`p-3.5 border pixel-shadow ${
                  isActive
                    ? 'bg-[#1A2128] border-[#D6A84F]'
                    : isCompleted
                    ? 'bg-[#121A16] border-[#2A333B]'
                    : 'bg-[#101419] border-[#1C242C]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-pixel text-[10px] text-[#D6A84F] tracking-wider uppercase">
                    {step.departmentTitle}
                  </span>
                  <PixelBadge
                    variant={
                      isCompleted ? 'seaFoam' : isActive ? 'brass' : 'muted'
                    }
                    size="sm"
                  >
                    {step.status.toUpperCase()}
                  </PixelBadge>
                </div>

                <h4 className="font-mono font-bold text-xs text-[#E8E4D8] mt-1">
                  {step.actionTitle}
                </h4>

                <p className="text-xs text-[#A9ADA8] font-sans mt-1 leading-relaxed">
                  {step.instruction}
                </p>

                {/* Telemetry Output Line */}
                <div className="mt-2.5 pt-2 border-t border-[#2A333B]/60 font-mono text-[10px] text-[#AFCBC2] flex items-center gap-2">
                  <span className="text-[#66727C]">TELEMETRY:</span>
                  <span>{step.telemetry}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Route Execution Approval Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-[#2A333B] bg-[#101419] p-4">
        <div className="font-mono text-xs">
          <span className="text-[#66727C] block text-[10px]">EXECUTION AUTHORITY</span>
          <span className="text-[#E8E4D8] font-bold">COMMAND CENTER // CAPTAIN BRIDGE</span>
        </div>

        {onApproveExecution && (
          <PixelButton
            variant="primary"
            size="lg"
            onClick={onApproveExecution}
            icon={<PixelIcon name="emblem-blacktide" size={16} />}
          >
            [ APPROVE & TRANSMIT EXECUTION ROUTE ]
          </PixelButton>
        )}
      </div>
    </div>
  );
};
