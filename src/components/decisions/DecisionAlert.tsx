/**
 * IMPACTMESH - Decision Alert Component
 * Primary tactical alert placed immediately below the Command Deck header.
 * Instantly answers "WHAT CHANGED?" and "HOW SERIOUS IS IT?" for executives.
 */

import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';

interface DecisionAlertProps {
  department?: string;
  actionTitle?: string;
  changeDetail?: string;
  effectsCount?: number;
  capacityDeficitHours?: number;
  deliveryExposureDays?: number;
  financialExposure?: string;
  onReviewImpact?: () => void;
  className?: string;
}

export const DecisionAlert: React.FC<DecisionAlertProps> = ({
  department = 'FINANCE',
  actionTitle = 'Budget reduced',
  changeDetail = '₹18L → ₹11L',
  effectsCount = 7,
  capacityDeficitHours = 120,
  deliveryExposureDays = 8,
  financialExposure = '₹50L',
  onReviewImpact,
  className = '',
}) => {
  return (
    <div
      id="decision-alert-banner"
      className={`bg-gradient-to-r from-[#17130E] via-[#1A1813] to-[#12161A] border-2 border-[#D6A84F] shadow-lg p-4 md:p-5 relative overflow-hidden ${className}`}
    >
      {/* Decorative maritime accent corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#D6A84F]/5 rotate-45 transform translate-x-12 -translate-y-12 pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        {/* Left: Tactical Alert Identification */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block w-2.5 h-2.5 bg-[#D6A84F] animate-pulse" />
            <span className="font-pixel text-[11px] text-[#D6A84F] tracking-wider uppercase">
              A DECISION NEEDS ATTENTION
            </span>
            <PixelBadge variant="brass" size="sm">
              {department}
            </PixelBadge>
            <PixelBadge variant="danger" size="sm">
              ACTION REQUIRED
            </PixelBadge>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-sans font-bold text-xl md:text-2xl text-[#F4F1EA] tracking-tight">
              {actionTitle}
            </h2>
            <span className="font-mono text-lg md:text-xl text-[#D6A84F] font-semibold">
              {changeDetail}
            </span>
            <span className="text-xs text-[#A9ADA8] font-mono">
              (-₹7.0L Capital Allocation)
            </span>
          </div>

          {/* Core downstream executive facts */}
          <div className="flex items-center gap-4 text-xs md:text-sm text-[#CDC9BE] flex-wrap pt-1">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#D6A84F] font-bold">●</span>
              <span><strong>{effectsCount}</strong> downstream effects detected</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#D05A4A] font-bold">●</span>
              <span><strong>{capacityDeficitHours}h</strong> engineering deficit</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#D05A4A] font-bold">●</span>
              <span>Delivery exposure: <strong>+{deliveryExposureDays} days</strong></span>
            </div>
            <div className="flex items-center gap-1.5 font-mono hidden sm:flex">
              <span className="text-[#AFCBC2] font-bold">●</span>
              <span>Opportunity at risk: <strong>{financialExposure} ARR</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Direct CTA to review impact */}
        <div className="shrink-0 pt-2 lg:pt-0 w-full sm:w-auto">
          <button
            onClick={onReviewImpact}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#D6A84F] hover:bg-[#C2953E] active:bg-[#AA8030] text-[#0D131A] font-pixel text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>[ REVIEW IMPACT ]</span>
            <span className="font-mono text-xs">▼</span>
          </button>
        </div>
      </div>
    </div>
  );
};
