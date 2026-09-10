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
        <div>
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            SYSTEM RECOMMENDATION
          </span>
          <h3 className="font-sans font-bold text-xl text-[#18201D] tracking-tight mt-0.5">
            {topOption.title.toUpperCase()}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 font-mono text-[10px] font-bold bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30 rounded-2xs uppercase">
            Deterministic Analysis
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

      {/* Main Recommendation Briefing */}
      <div>
        <p className="font-sans text-sm md:text-base text-[#18201D] leading-relaxed">
          "Lowest overall impact across delivery, customer commitment and engineering capacity."
        </p>
      </div>

      {/* Concise Evidence Statements */}
      <div className="p-4 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs space-y-2">
        <div className="font-mono text-[10px] text-[#718894] uppercase font-bold tracking-wider">
          WHY THIS IS RECOMMENDED:
        </div>
        <ul className="space-y-1.5 font-sans text-xs md:text-sm text-[#18201D]">
          <li className="flex items-start gap-2">
            <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
            <span><strong>Keeps delivery within current capacity:</strong> Closes 105h deficit immediately without team overload.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
            <span><strong>Avoids customer date slippage:</strong> Protects the committed go-live schedule for core enterprise SSO.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
            <span><strong>Does not disrupt another committed initiative:</strong> Avoids cannibalizing resources from internal infrastructure.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5B8D70] font-bold mt-0.5">✓</span>
            <span><strong>Preserves customer contract:</strong> Retains full Apex Global commitment while phasing secondary reporting.</span>
          </li>
        </ul>
      </div>

      {/* [Deep Analysis] Toggle Button */}
      <div>
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="font-sans text-xs font-semibold text-[#718894] hover:text-[#18201D] flex items-center gap-1.5 cursor-pointer py-1"
        >
          <span className="font-mono text-[9px] text-[#C89638]">{showWhy ? '▼' : '▶'}</span>
          <span>{showWhy ? 'Hide verification coverage' : 'View verification coverage & model metrics'}</span>
        </button>

        {/* Collapsible Deep Analysis Coverage */}
        {showWhy && (
          <div className="mt-2 animate-in fade-in">
            <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#576560]">
              <span className="text-[10px] text-[#718894] font-bold uppercase">ANALYSIS COVERAGE:</span>
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
