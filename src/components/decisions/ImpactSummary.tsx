import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { PixelIcon } from '../pixel/PixelIcon.tsx';
import type { ImpactResult } from '../../types/domain.ts';
import type { DecisionEvent } from '../../types/events.ts';

interface ImpactSummaryProps {
  event?: DecisionEvent;
  impact?: ImpactResult;
  className?: string;
}

export const ImpactSummary: React.FC<ImpactSummaryProps> = ({
  event,
  impact,
  className = '',
}) => {
  const affectedCount = impact ? impact.affected_entities.length : 7;
  const cascadeDepth = impact ? impact.cascade_depth : 4;
  const deptName = event ? event.department.toUpperCase() : 'FINANCE';

  return (
    <div
      className={`p-4 bg-[#141A20] border border-[#2A333B] shadow-sm select-none ${className}`}
    >
      {/* Alert Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#2A333B] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <PixelIcon name="hazard" size={15} />
          <span className="font-pixel text-xs text-[#E8E4D8] uppercase tracking-wider">
            DECISION IMPACT DETECTED
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PixelBadge variant="danger" size="sm">
            CRITICAL IMPACT
          </PixelBadge>
          <span className="font-mono text-[9px] text-[#66727C]">
            {cascadeDepth} DEPENDENCY HOPS
          </span>
        </div>
      </div>

      {/* Primary Trigger Readout */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#66727C]">
            {deptName} DECISION
          </span>
          <div className="font-mono font-bold text-sm text-[#E8E4D8] mt-0.5">
            BUDGET REDUCED
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] text-[#66727C] block uppercase">CAPITAL CHANGE</span>
          <div className="text-sm font-bold text-[#D05A4A]">
            ₹18.0L → ₹11.0L (-₹7.0L)
          </div>
        </div>
      </div>

      {/* Impact Downstream Summary Readouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#2A333B]">
        <div className="p-2.5 bg-[#101419] border border-[#1C242C]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CAPACITY LOAD</span>
          <span className="font-mono font-bold text-xs text-[#D05A4A] mt-0.5 block">
            120h Deficit (140%)
          </span>
          <span className="font-sans text-[10px] text-[#A9ADA8]">Overtime required</span>
        </div>

        <div className="p-2.5 bg-[#101419] border border-[#1C242C]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">DELIVERY RISK</span>
          <span className="font-mono font-bold text-xs text-[#D05A4A] mt-0.5 block">
            +8 Days Slippage
          </span>
          <span className="font-sans text-[10px] text-[#A9ADA8]">SLA contract pressure</span>
        </div>

        <div className="p-2.5 bg-[#101419] border border-[#1C242C]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CUSTOMER EXPOSURE</span>
          <span className="font-mono font-bold text-xs text-[#D6A84F] mt-0.5 block">
            ₹50.0L Exposure
          </span>
          <span className="font-sans text-[10px] text-[#A9ADA8]">
            {affectedCount} downstream entities
          </span>
        </div>
      </div>
    </div>
  );
};
