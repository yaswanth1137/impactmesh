/**
 * IMPACTMESH - Impact Summary Component
 * Clearly answers:
 * - WHAT CHANGED?
 * - WHAT WAS AFFECTED?
 * - WHAT IS AT RISK?
 * - FINANCIAL EXPOSURE / WHY IT MATTERS
 * In non-technical executive language.
 */

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
  const deptName = event ? event.department.toUpperCase() : 'FINANCE';

  return (
    <div
      id="impact-summary-card"
      className={`p-4 md:p-5 bg-[#141A20] border border-[#2A333B] shadow-sm select-none ${className}`}
    >
      {/* Executive Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#2A333B] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <PixelIcon name="hazard" size={16} />
          <span className="font-pixel text-xs md:text-sm text-[#E8E4D8] uppercase tracking-wider">
            IMPACT ASSESSMENT // EXECUTIVE SUMMARY
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PixelBadge variant="danger" size="sm">
            CRITICAL EXPOSURE
          </PixelBadge>
          <span className="font-mono text-[10px] text-[#A9ADA8]">
            4 DEPARTMENTS
          </span>
        </div>
      </div>

      {/* 4 Clear Executive Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. WHAT CHANGED */}
        <div className="p-3.5 bg-[#101419] border border-[#2A333B] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#A9ADA8] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#D6A84F]" />
              <span>WHAT CHANGED</span>
            </div>
            <div className="font-sans font-bold text-base text-[#F4F1EA] mt-1.5">
              Budget reduced by ₹7.0L
            </div>
          </div>
          <div className="font-mono text-xs text-[#D6A84F] mt-2 pt-2 border-t border-[#1C242C]">
            ₹18.0L → ₹11.0L ({deptName})
          </div>
        </div>

        {/* 2. WHAT WAS AFFECTED */}
        <div className="p-3.5 bg-[#101419] border border-[#2A333B] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#A9ADA8] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#D6A84F]" />
              <span>AFFECTED</span>
            </div>
            <div className="font-sans font-bold text-base text-[#F4F1EA] mt-1.5">
              {affectedCount} operational entities
            </div>
          </div>
          <div className="font-sans text-xs text-[#A9ADA8] mt-2 pt-2 border-t border-[#1C242C]">
            Across Sales, Product, Ops, Finance
          </div>
        </div>

        {/* 3. WHAT IS AT RISK */}
        <div className="p-3.5 bg-[#101419] border border-[#2A333B] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#A9ADA8] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#D05A4A]" />
              <span>AT RISK</span>
            </div>
            <div className="font-sans font-bold text-base text-[#D05A4A] mt-1.5">
              Capacity & Delivery SLA
            </div>
          </div>
          <div className="font-mono text-xs text-[#CDC9BE] mt-2 pt-2 border-t border-[#1C242C]">
            120h deficit • +8 days slippage
          </div>
        </div>

        {/* 4. FINANCIAL EXPOSURE */}
        <div className="p-3.5 bg-[#101419] border border-[#2A333B] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#A9ADA8] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#59A66A]" />
              <span>FINANCIAL EXPOSURE</span>
            </div>
            <div className="font-sans font-bold text-base text-[#59A66A] mt-1.5">
              ₹50.0L Opportunity
            </div>
          </div>
          <div className="font-sans text-xs text-[#A9ADA8] mt-2 pt-2 border-t border-[#1C242C]">
            Apex Enterprise contract on critical path
          </div>
        </div>
      </div>
    </div>
  );
};
