import React, { useState } from 'react';
import type { Recommendation, DecisionOption } from '../../types/domain.ts';

interface RecommendationCardProps {
  recommendation: Recommendation;
  topOption: DecisionOption;
  onSimulate?: () => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  topOption,
  onSimulate,
  className = '',
}) => {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div
      id="recommendation-course-card"
      className={`p-5 md:p-6 bg-[#FAF8F1] border-2 border-[#C89638] rounded-xs shadow-sm space-y-4 select-none ${className}`}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD5C5] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            STEP 06 // RECOMMENDATION
          </span>
          <span className="text-[#718894]">/</span>
          <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
            System Recommendation
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 font-mono text-[10px] font-bold bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30 rounded-2xs uppercase">
            Analysis Quality: High
          </span>
          {onSimulate && (
            <button
              onClick={onSimulate}
              className="px-2.5 py-0.5 text-[11px] font-sans font-semibold bg-[#F3EFE5] border border-[#DDD5C5] text-[#18201D] hover:bg-[#FAF8F1] rounded-xs transition-colors cursor-pointer"
            >
              Simulate Scenario
            </button>
          )}
        </div>
      </div>

      {/* Main Recommendation Course */}
      <div>
        <div className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-wider">
          RECOMMENDED
        </div>
        <h4 className="font-sans font-bold text-xl md:text-2xl text-[#18201D] tracking-tight mt-0.5">
          {topOption.title}
        </h4>
        <p className="text-sm text-[#576560] font-sans mt-1 leading-relaxed">
          The current engineering capacity cannot support the full commitment without increasing delivery risk.
        </p>
      </div>

      {/* [WHY?] Toggle Button */}
      <div>
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="font-sans text-xs font-semibold text-[#C89638] hover:text-[#8B651B] flex items-center gap-1.5 cursor-pointer py-1"
        >
          <span>{showWhy ? '▼' : '▶'}</span>
          <span>{showWhy ? 'Hide supporting rationale' : 'Why? (View supporting evidence)'}</span>
        </button>

        {/* Collapsible Evidence & Analysis Quality */}
        {showWhy && (
          <div className="mt-3 space-y-3 animate-in fade-in">
            <div className="p-4 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs space-y-2">
              <div className="font-mono text-[10px] text-[#718894] uppercase font-bold">
                SYSTEM REASONING & JUSTIFICATION:
              </div>
              <ul className="space-y-1.5 font-sans text-xs text-[#18201D]">
                <li className="flex items-start gap-2">
                  <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
                  <span><strong>Preserves highest-value contract:</strong> Keeps Apex Global enterprise commitment on track without contract breach.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
                  <span><strong>Eliminates 88% of deficit:</strong> Closes capacity gap from 120h down to 15h, preventing team burnout.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
                  <span><strong>Protects milestone schedule:</strong> Compresses schedule slippage from +8 days down to +1 day (inside SLA).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
                  <span><strong>Capital optimization:</strong> Saves ₹2.4L in engineering overtime and contractor fees.</span>
                </li>
              </ul>
            </div>

            {/* Analysis Quality Breakdown */}
            <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#576560]">
              <span className="text-[10px] text-[#718894] font-bold uppercase">ANALYSIS QUALITY:</span>
              <span>Data Coverage: <strong className="text-[#18201D]">92%</strong></span>
              <span>•</span>
              <span>Dependency Coverage: <strong className="text-[#18201D]">87%</strong></span>
              <span>•</span>
              <span>Constraint Coverage: <strong className="text-[#18201D]">100%</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
