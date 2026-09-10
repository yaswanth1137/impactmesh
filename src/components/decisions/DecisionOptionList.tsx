import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import type { DecisionOption } from '../../types/domain.ts';

interface DecisionOptionListProps {
  options: DecisionOption[];
  selectedOptionId?: string;
  onSelectOption?: (option: DecisionOption) => void;
  className?: string;
}

export const DecisionOptionList: React.FC<DecisionOptionListProps> = ({
  options,
  selectedOptionId,
  onSelectOption,
  className = '',
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="font-pixel text-xs text-[#E8E4D8] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-[#2A333B]">
        <span>DECISION ALTERNATIVES // RANKED CANDIDATES</span>
        <span className="font-mono text-[9px] text-[#66727C]">{options.length} OPTIONS</span>
      </div>

      <div className="space-y-2">
        {options.map((opt, index) => {
          const isSelected = selectedOptionId === opt.id || index === 0;
          const isRecommended = index === 0;

          return (
            <div
              key={opt.id}
              onClick={() => onSelectOption && onSelectOption(opt)}
              className={`p-3 border pixel-shadow cursor-pointer transition-colors ${
                isRecommended
                  ? 'bg-[#181E19] border-[#D6A84F]'
                  : isSelected
                  ? 'bg-[#1A2128] border-[#AFCBC2]'
                  : 'bg-[#141A20] border-[#2A333B] hover:border-[#475664]'
              }`}
            >
              {/* Header line: Index, Title, Score */}
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs text-[#D6A84F]">
                    0{index + 1}
                  </span>
                  <h4 className="font-mono font-bold text-xs text-[#E8E4D8]">
                    {opt.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isRecommended && (
                    <PixelBadge variant="brass" size="sm">
                      RECOMMENDED
                    </PixelBadge>
                  )}
                  <span className="font-mono font-bold text-xs text-[#59A66A]">
                    {opt.feasibility_score}
                  </span>
                </div>
              </div>

              {/* Rationale & tradeoffs summary */}
              <p className="text-[11px] text-[#A9ADA8] mt-1 font-sans leading-snug">
                {opt.rationale}
              </p>

              {/* Metrics micro row */}
              <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-[#2A333B]/60 text-[10px] font-mono text-[#66727C]">
                <span>
                  ACTION: <strong className="text-[#E8E4D8]">{opt.action_type.toUpperCase()}</strong>
                </span>
                <span>
                  ALIGNMENT: CEO {opt.policy_alignment.ceo} / CFO {opt.policy_alignment.cfo} / COO {opt.policy_alignment.coo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
