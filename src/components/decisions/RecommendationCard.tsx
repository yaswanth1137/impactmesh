/**
 * IMPACTMESH - Recommended Course Component
 * Primary executive recommendation card. Answers:
 * - WHAT DO YOU RECOMMEND?
 * - EXPECTED EFFECT
 * - WHY THIS MATTERS (traceable 6-step causal chain)
 * - Actions: [ SIMULATE ] and [ PLOT EXECUTION ROUTE ]
 */

import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { PixelIcon } from '../pixel/PixelIcon.tsx';
import type { Recommendation, DecisionOption } from '../../types/domain.ts';

interface RecommendationCardProps {
  recommendation: Recommendation;
  topOption: DecisionOption;
  onPlotRoute: () => void;
  onSimulate?: () => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  topOption,
  onPlotRoute,
  onSimulate,
  className = '',
}) => {
  return (
    <div
      id="recommendation-course-card"
      className={`p-5 bg-gradient-to-b from-[#161C24] to-[#101419] border-2 border-[#D6A84F] shadow-xl select-none ${className}`}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A333B] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <PixelIcon name="helm" size={18} color="#D6A84F" />
          <span className="font-pixel text-sm text-[#D6A84F] uppercase tracking-wider">
            RECOMMENDED COURSE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PixelBadge variant="seaFoam" size="sm">
            CONFIDENCE: {Math.round(recommendation.confidence_score * 100)}%
          </PixelBadge>
          <PixelBadge variant="brass" size="sm">
            SCORE: {topOption.feasibility_score}
          </PixelBadge>
        </div>
      </div>

      {/* Main Course Action Title */}
      <div className="mb-4">
        <h3 className="font-sans font-bold text-xl md:text-2xl text-[#F4F1EA] tracking-tight">
          {topOption.title}
        </h3>
        <p className="text-sm text-[#CDC9BE] font-sans mt-1.5 leading-relaxed">
          Preserve the ₹50.0L customer opportunity while removing non-critical scope.
        </p>
      </div>

      {/* EXPECTED EFFECT STRIP (4 crisp deltas) */}
      <div className="mb-5">
        <div className="text-[10px] font-mono text-[#A9ADA8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#59A66A]" />
          <span>EXPECTED EFFECT IF EXECUTED</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2.5 bg-[#0D1217] border border-[#2A333B]">
            <span className="font-mono text-[9px] text-[#A9ADA8] uppercase block">Capacity Deficit</span>
            <div className="font-mono font-bold text-sm text-[#59A66A] mt-0.5">
              120h → 15h
            </div>
            <span className="text-[10px] text-[#66727C] font-sans">Eliminates bottleneck</span>
          </div>

          <div className="p-2.5 bg-[#0D1217] border border-[#2A333B]">
            <span className="font-mono text-[9px] text-[#A9ADA8] uppercase block">Delivery Schedule</span>
            <div className="font-mono font-bold text-sm text-[#59A66A] mt-0.5">
              +8d → +1d
            </div>
            <span className="text-[10px] text-[#66727C] font-sans">Inside customer SLA</span>
          </div>

          <div className="p-2.5 bg-[#0D1217] border border-[#2A333B]">
            <span className="font-mono text-[9px] text-[#A9ADA8] uppercase block">Risk Level</span>
            <div className="font-mono font-bold text-sm text-[#D6A84F] mt-0.5">
              HIGH → MEDIUM
            </div>
            <span className="text-[10px] text-[#66727C] font-sans">0.82 → 0.45 score</span>
          </div>

          <div className="p-2.5 bg-[#0D1217] border border-[#2A333B]">
            <span className="font-mono text-[9px] text-[#A9ADA8] uppercase block">Realized Savings</span>
            <div className="font-mono font-bold text-sm text-[#59A66A] mt-0.5">
              ₹2.4L
            </div>
            <span className="text-[10px] text-[#66727C] font-sans">Contractor overtime cut</span>
          </div>
        </div>
      </div>

      {/* WHY THIS MATTERS // TRACEABLE CAUSAL CHAIN */}
      <div className="p-3.5 bg-[#0D1217] border border-[#2A333B] mb-5">
        <div className="text-[10px] font-mono text-[#D6A84F] uppercase tracking-wider mb-2.5 font-bold flex items-center gap-2">
          <PixelIcon name="anchor" size={13} color="#D6A84F" />
          <span>WHY THIS MATTERS // CAUSAL EVIDENCE CHAIN</span>
        </div>
        <ol className="space-y-1.5 text-xs text-[#E8E4D8] font-sans list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#D6A84F] font-bold shrink-0">1.</span>
            <span>Budget fell by <strong>₹7.0L</strong> (₹18L → ₹11L) in Finance allocation.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#D6A84F] font-bold shrink-0">2.</span>
            <span>Current platform engineering demand is <strong>420h</strong> across 3 committed features.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#D6A84F] font-bold shrink-0">3.</span>
            <span>Available team engineering capacity is <strong>300h</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#D05A4A] font-bold shrink-0">4.</span>
            <span>Therefore the organization has an acute <strong>120h deficit (140% load)</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#D05A4A] font-bold shrink-0">5.</span>
            <span>That deficit threatens delivery schedule by <strong>+8 days slippage</strong> (breaching 5-day SLA).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#59A66A] font-bold shrink-0">6.</span>
            <span>Delivery directly affects the <strong>₹50.0L Apex customer expansion commitment</strong>.</span>
          </li>
        </ol>
      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#2A333B]">
        {onSimulate && (
          <button
            onClick={onSimulate}
            className="w-full sm:w-auto px-4 py-2 border border-[#2A333B] hover:border-[#D6A84F] bg-[#141A20] text-[#CDC9BE] hover:text-[#F4F1EA] font-pixel text-xs tracking-wider uppercase transition-colors cursor-pointer"
          >
            [ SIMULATE ]
          </button>
        )}
        <button
          onClick={onPlotRoute}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#D6A84F] hover:bg-[#C2953E] active:bg-[#AA8030] text-[#0D131A] font-pixel text-xs tracking-wider uppercase transition-all shadow-md font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>[ PLOT EXECUTION ROUTE ]</span>
          <span className="font-mono text-sm">→</span>
        </button>
      </div>
    </div>
  );
};
