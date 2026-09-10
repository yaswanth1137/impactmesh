import React from 'react';
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
      className={`p-5 md:p-6 bg-[#FAF8F1] border-2 border-[#C89638] rounded-xs shadow-sm space-y-5 select-none ${className}`}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD5C5] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            STEP 07 // SYSTEM VIEW
          </span>
          <span className="text-[#718894]">/</span>
          <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
            SYSTEM RECOMMENDATION
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 font-mono text-[10px] font-bold bg-[#C89638]/10 text-[#8B651B] border border-[#C89638]/30 rounded-2xs uppercase">
            CONFIDENCE: {Math.round(recommendation.confidence_score * 100)}%
          </span>
          <span className="px-2.5 py-0.5 font-mono text-[10px] font-bold bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30 rounded-2xs uppercase">
            FEASIBILITY: {topOption.feasibility_score}
          </span>
        </div>
      </div>

      {/* Main Course Action Title & Explanation */}
      <div>
        <div className="font-mono text-[10px] text-[#718894] uppercase font-bold">
          RECOMMENDED COURSE:
        </div>
        <h4 className="font-sans font-bold text-xl md:text-2xl text-[#18201D] tracking-tight mt-0.5">
          {topOption.title}
        </h4>
        <p className="text-sm text-[#576560] font-sans mt-1 leading-relaxed">
          Preserves the ₹50L enterprise customer contract while removing non-critical scope, keeping the team within acceptable delivery tolerances.
        </p>
      </div>

      {/* Business Justification Bullets: WHY THIS RECOMMENDATION */}
      <div className="p-4 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs">
        <div className="font-mono text-[10px] text-[#718894] uppercase font-bold mb-2">
          WHY THE SYSTEM RECOMMENDS THIS:
        </div>
        <ul className="space-y-1.5 font-sans text-xs md:text-sm text-[#18201D]">
          <li className="flex items-start gap-2">
            <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
            <span><strong>Preserves highest-value customer commitment:</strong> Keeps Apex Global contract on track without breaching scope clauses.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
            <span><strong>Removes 88% of engineering deficit:</strong> Closes the capacity gap from 120 hours down to a manageable 15 hours.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
            <span><strong>Avoids a material delivery delay:</strong> Reduces schedule slippage from +8 days down to +1 day (inside SLA tolerance).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
            <span><strong>Reduces capital pressure:</strong> Realizes approximately ₹2.4L in contractor overtime savings.</span>
          </li>
        </ul>
      </div>

      {/* EXPECTED EFFECT DELTA GRID */}
      <div>
        <div className="font-mono text-[10px] text-[#718894] uppercase font-bold mb-2">
          EXPECTED EFFECT IF APPROVED:
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
            <span className="font-mono text-[9px] text-[#718894] uppercase block">Capacity Gap</span>
            <div className="font-mono font-bold text-sm text-[#5B8D70] mt-0.5">
              120h → 15h
            </div>
            <span className="text-[10px] text-[#576560] font-sans">Eliminates deficit</span>
          </div>

          <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
            <span className="font-mono text-[9px] text-[#718894] uppercase block">Delivery Schedule</span>
            <div className="font-mono font-bold text-sm text-[#5B8D70] mt-0.5">
              +8d → +1d
            </div>
            <span className="text-[10px] text-[#576560] font-sans">Inside customer SLA</span>
          </div>

          <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
            <span className="font-mono text-[9px] text-[#718894] uppercase block">Risk Level</span>
            <div className="font-mono font-bold text-sm text-[#C89638] mt-0.5">
              HIGH → MEDIUM
            </div>
            <span className="text-[10px] text-[#576560] font-sans">Controlled exposure</span>
          </div>

          <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
            <span className="font-mono text-[9px] text-[#718894] uppercase block">Capital Saved</span>
            <div className="font-mono font-bold text-sm text-[#5B8D70] mt-0.5">
              ₹2.4L
            </div>
            <span className="text-[10px] text-[#576560] font-sans">Overtime variance cut</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-[#DDD5C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="font-sans text-xs text-[#576560]">
          The human executive retains complete authority. You can accept this course or select an alternative.
        </p>

        <div className="flex items-center gap-2">
          {onSimulate && (
            <button
              onClick={onSimulate}
              className="px-3.5 py-2 bg-[#F3EFE5] hover:bg-[#FAF8F1] text-[#18201D] font-sans text-xs font-semibold border border-[#DDD5C5] rounded-xs transition-colors cursor-pointer"
            >
              SIMULATE IMPACT
            </button>
          )}
          <button
            onClick={onPlotRoute}
            className="px-5 py-2 bg-[#C89638] hover:bg-[#B3832B] text-[#FAF8F1] font-sans text-xs font-bold rounded-xs transition-colors cursor-pointer shadow-2xs"
          >
            PROCEED TO HUMAN DECISION →
          </button>
        </div>
      </div>
    </div>
  );
};
