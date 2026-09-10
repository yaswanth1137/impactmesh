import React from 'react';
import type { DecisionOption } from '../../types/domain.ts';

export interface DecisionOptionListProps {
  options: DecisionOption[];
  selectedOptionId?: string;
  onSelectOption?: (option: DecisionOption) => void;
  className?: string;
}

// 4 Canonical strategic options per Prompt Section 5
export const CANONICAL_OPTIONS: Array<{
  id: string;
  title: string;
  action: string;
  consequence: string;
  tradeoff: string;
  majorRisk: string;
  isRecommended?: boolean;
}> = [
  {
    id: 'opt-scope-reduction',
    title: '1. REDUCE SCOPE',
    action: 'Remove lower-priority feature requirements (Phase 2 Reporting & Custom Export).',
    consequence: 'Closes 105h of engineering deficit immediately; restores sprint balance.',
    tradeoff: 'Secondary features deferred to the subsequent product release.',
    majorRisk: 'Customer sales rep minor pushback regarding Phase 2 timeline.',
    isRecommended: true,
  },
  {
    id: 'opt-delay-delivery',
    title: '2. DELAY DELIVERY',
    action: 'Keep full committed scope and renegotiate the delivery date (+14 days).',
    consequence: 'No feature scope cuts required; existing engineering capacity absorbs work.',
    tradeoff: 'Milestone target slips from Month 1 to Month 2.',
    majorRisk: 'Apex procurement team may enforce formal contractual delivery penalty.',
  },
  {
    id: 'opt-reallocate-capacity',
    title: '3. REALLOCATE CAPACITY',
    action: 'Move senior engineering capacity from internal platform infrastructure.',
    consequence: 'Customer commitment delivered on original schedule with full scope.',
    tradeoff: 'Internal infrastructure tech debt project postponed by one quarter.',
    majorRisk: 'Internal systems maintenance delays increase future sprint defect rate.',
  },
  {
    id: 'opt-add-external',
    title: '4. ADD EXTERNAL CAPACITY',
    action: 'Retain approved specialist contractors to absorb the 120h spike immediately.',
    consequence: 'Zero scope cuts and zero delivery delay across all deliverables.',
    tradeoff: 'Requires unbudgeted contractor expense authorization.',
    majorRisk: 'Vendor onboarding ramp time could still induce minor 2-3 day slippage.',
  },
];

export const DecisionOptionList: React.FC<DecisionOptionListProps> = ({
  options,
  selectedOptionId = 'opt-scope-reduction',
  onSelectOption,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C5]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            STEP 05 // OPTIONS
          </span>
          <span className="text-[#718894]">/</span>
          <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
            WHAT CAN WE DO?
          </h3>
        </div>
        <span className="font-mono text-xs text-[#576560]">
          4 STRATEGIC COURSES
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {CANONICAL_OPTIONS.map((opt) => {
          const isSelected = selectedOptionId === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => {
                const found = options.find((o) => o.id === opt.id) || {
                  id: opt.id,
                  title: opt.title,
                  description: opt.action,
                  action_type: 'accept',
                  projected_metrics: {},
                  feasibility_score: 85,
                  policy_alignment: { ceo: 80, cfo: 80, coo: 80, balanced: 80 },
                  tradeoffs: { pros: [opt.consequence], cons: [opt.tradeoff], risks: [opt.majorRisk] },
                  rationale: opt.consequence,
                };
                onSelectOption && onSelectOption(found as DecisionOption);
              }}
              className={`p-4 border rounded-xs cursor-pointer transition-all flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-[#FAF8F1] border-[#C89638] ring-2 ring-[#C89638]/40 shadow-sm'
                  : 'bg-[#FAF8F1] border-[#DDD5C5] hover:border-[#C89638] shadow-2xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-sans font-bold text-sm text-[#18201D] tracking-tight">
                    {opt.title}
                  </h4>
                  {opt.isRecommended && (
                    <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 bg-[#C89638]/15 text-[#8B651B] border border-[#C89638]/30 rounded-2xs uppercase">
                      RECOMMENDED
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-[#718894] block">Action:</span>
                  <p className="font-sans text-xs text-[#18201D] leading-snug">
                    {opt.action}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-[#5B8D70] block">Primary Consequence:</span>
                  <p className="font-sans text-xs text-[#576560] leading-snug">
                    {opt.consequence}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-[#8B651B] block">Secondary Tradeoff:</span>
                  <p className="font-sans text-xs text-[#576560] leading-snug">
                    {opt.tradeoff}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-[#C86150] block">Major Risk:</span>
                  <p className="font-sans text-xs text-[#C86150] leading-snug">
                    {opt.majorRisk}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#DDD5C5] flex items-center justify-between">
                <span className={`text-[11px] font-sans font-semibold ${isSelected ? 'text-[#C89638]' : 'text-[#718894]'}`}>
                  {isSelected ? '● Selected Course' : 'Click to Choose'}
                </span>
                <span className="font-mono text-[10px] text-[#718894]">→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
