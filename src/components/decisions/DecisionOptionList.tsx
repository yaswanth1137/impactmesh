import React from 'react';
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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C5]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            STEP 06 // ALTERNATIVES
          </span>
          <span className="text-[#718894]">/</span>
          <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
            WHAT CAN WE DO?
          </h3>
        </div>
        <span className="font-mono text-xs text-[#576560]">
          {options.length} CANDIDATE COURSES
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {options.map((opt, index) => {
          const isSelected = selectedOptionId === opt.id || (index === 0 && !selectedOptionId);
          const isRecommended = index === 0;

          // Plain language expectation facts per option
          const expectedStats =
            index === 0
              ? { gap: '120h → 15h', customer: 'Low Risk', delivery: '+1 Day', savings: '₹2.4L' }
              : index === 1
              ? { gap: 'Spread over 8d', customer: 'Medium Risk', delivery: '+8 Days', savings: '₹2.7L' }
              : { gap: 'Capacity Unchanged', customer: 'Low Risk', delivery: '0 Days', savings: '-₹3.5L Spend' };

          return (
            <div
              key={opt.id}
              onClick={() => onSelectOption && onSelectOption(opt)}
              className={`p-4 border rounded-xs cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#FAF8F1] border-[#C89638] shadow-sm ring-1 ring-[#C89638]/40'
                  : 'bg-[#FAF8F1] border-[#DDD5C5] hover:border-[#C89638] shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-[#C89638] font-bold">
                    0{index + 1}
                  </span>
                  {isRecommended && (
                    <span className="font-mono text-[9px] font-bold px-2 py-0.5 bg-[#C89638]/10 text-[#8B651B] border border-[#C89638]/30 rounded-2xs uppercase">
                      SYSTEM CHOICE
                    </span>
                  )}
                </div>

                <h4 className="font-sans font-bold text-sm text-[#18201D] tracking-tight">
                  {opt.title}
                </h4>

                <p className="font-sans text-xs text-[#576560] mt-1.5 leading-relaxed">
                  {opt.rationale}
                </p>
              </div>

              {/* Plain Language Fact Grid */}
              <div className="mt-3 pt-3 border-t border-[#DDD5C5] space-y-1.5 font-sans text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#718894] font-medium">Expected Gap:</span>
                  <span className="font-mono font-bold text-[#18201D]">{expectedStats.gap}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#718894] font-medium">Customer Impact:</span>
                  <span className="font-mono font-medium text-[#18201D]">{expectedStats.customer}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#718894] font-medium">Delivery Impact:</span>
                  <span className="font-mono font-bold text-[#18201D]">{expectedStats.delivery}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#718894] font-medium">Financial Impact:</span>
                  <span className="font-mono font-bold text-[#5B8D70]">{expectedStats.savings}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
