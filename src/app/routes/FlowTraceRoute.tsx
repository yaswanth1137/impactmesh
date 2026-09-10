import React, { useState } from 'react';
import { ExecutionRoute } from '../../components/flowtrace/ExecutionRoute.tsx';
import { PixelBadge } from '../../components/pixel/PixelBadge.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelIcon } from '../../components/pixel/PixelIcon.tsx';
import { MOCK_FLOWTRACE_STEPS } from '../../mocks/blacktide-mock.ts';

interface FlowTraceRouteProps {
  onBackToCommand: () => void;
}

export const FlowTraceRoute: React.FC<FlowTraceRouteProps> = ({ onBackToCommand }) => {
  const [approved, setApproved] = useState(false);
  const [steps, setSteps] = useState(MOCK_FLOWTRACE_STEPS);

  const handleApprove = () => {
    setApproved(true);
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.stepNumber <= 2 ? 'completed' : s.stepNumber === 3 ? 'active' : 'pending',
      }))
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Navigation breadcrumb bar */}
      <div className="flex items-center justify-between">
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
            EXECUTION LEVEL 01
          </PixelBadge>
          {approved && (
            <PixelBadge variant="seaFoam" size="sm" pulse>
              EXECUTION DISPATCHED
            </PixelBadge>
          )}
        </div>
      </div>

      {/* Main Execution Route Card */}
      <ExecutionRoute
        steps={steps}
        decisionTitle="REDUCE FEATURE SCOPE (RESPONSE TO ₹7.0L BUDGET REDUCTION)"
        onApproveExecution={approved ? undefined : handleApprove}
      />

      {/* Cryptographic Execution Stamp if approved */}
      {approved && (
        <div className="p-4 bg-[#10201B] border-2 border-[#59A66A] text-[#E8E4D8] pixel-shadow font-mono text-xs flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <PixelIcon name="emblem-blacktide" size={24} />
            <div>
              <span className="font-pixel text-[10px] text-[#59A66A] uppercase tracking-wider block">
                EXECUTION ORDER CONFIRMED & SEALED
              </span>
              <span className="text-[11px] text-[#AFCBC2]">
                TRANSMISSION HASH: 0x9b48...c41a • SIGNED BY BRIDGE OPERATOR
              </span>
            </div>
          </div>
          <PixelBadge variant="seaFoam" size="md">
            TRANSMITTED TO 4 CREW CLIENTS
          </PixelBadge>
        </div>
      )}
    </div>
  );
};
