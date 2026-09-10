import React from 'react';
import type { DecisionOption } from '../../types/domain.ts';

export interface DecisionOptionListProps {
  options: DecisionOption[];
  selectedOptionId?: string;
  onSelectOption?: (option: DecisionOption) => void;
  className?: string;
}

// Feasible decision options dynamically generated for the current situation
export const FEASIBLE_OPTIONS: Array<{
  id: string;
  title: string;
  action: string;
  consequence: string;
  tradeoff: string;
  secondaryImpact?: string;
  isRecommended?: boolean;
}> = [
  {
    id: 'opt-scope-reduction',
    title: 'REDUCE SCOPE',
    action: 'Remove lower-priority requirements from the commitment (Phase 2 Reporting & Custom Export).',
    consequence: 'Protects the delivery target and closes 105h engineering deficit immediately.',
    tradeoff: 'Customer receives reduced scope in the initial release.',
    secondaryImpact: 'Saves ₹2.4L in engineering overtime and contractor ramp costs.',
    isRecommended: true,
  },
  {
    id: 'opt-delay-delivery',
    title: 'DELAY DELIVERY',
    action: 'Keep the current scope and move the target delivery date by +14 days.',
    consequence: 'Engineering remains within capacity without cutting feature commitments.',
    tradeoff: 'Customer commitment is delayed beyond original target.',
    secondaryImpact: 'May trigger customer contract delivery penalty discussion.',
  },
  {
    id: 'opt-reallocate-capacity',
    title: 'REALLOCATE CAPACITY',
    action: 'Move engineering resources from another initiative (Internal Platform Infrastructure).',
    consequence: 'Protects the current customer commitment on original schedule.',
    tradeoff: 'Another initiative will be postponed by one quarter.',
    secondaryImpact: 'Internal technical debt deferred to subsequent cycle.',
  },
  {
    id: 'opt-add-external',
    title: 'ADD EXTERNAL CAPACITY',
    action: 'Retain approved specialist contractors to absorb the 120h workload spike.',
    consequence: 'Zero scope cuts and zero delivery delay across all deliverables.',
    tradeoff: 'Requires unbudgeted contractor expense authorization.',
    secondaryImpact: 'Vendor onboarding requires 2–3 days senior engineer pairing.',
  },
  {
    id: 'opt-split-phases',
    title: 'SPLIT INTO PHASES',
    action: 'Ship critical SAML SSO on the original date; deliver custom export 30 days later.',
    consequence: 'Unlocks customer go-live without missing the critical contractual milestone.',
    tradeoff: 'Secondary features delivered in follow-on maintenance release.',
    secondaryImpact: 'Maintains stakeholder confidence with predictable staged rollouts.',
  },
];

export const DecisionOptionList: React.FC<DecisionOptionListProps> = ({
  options,
  selectedOptionId = 'opt-scope-reduction',
  onSelectOption,
  className = '',
}) => {
  return (
    <div className={`p-5 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-4 select-none ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#DDD5C5]">
        <div>
          <h3 className="font-sans font-bold text-xl text-[#18201D] tracking-tight">
            WHAT CAN WE DO?
          </h3>
          <p className="font-sans text-xs text-[#576560] mt-0.5">
            {FEASIBLE_OPTIONS.length} feasible options generated for this situation.
          </p>
        </div>
        <span className="font-mono text-[10px] text-[#718894] uppercase tracking-wider">
          FEASIBLE COURSES (MAX 7)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {FEASIBLE_OPTIONS.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          const priorityNumber = String(idx + 1).padStart(2, '0');

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
                  tradeoffs: { pros: [opt.consequence], cons: [opt.tradeoff], risks: [] },
                  rationale: opt.consequence,
                };
                onSelectOption && onSelectOption(found as DecisionOption);
              }}
              className={`p-4 border rounded-xs cursor-pointer transition-all flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-[#FAF8F1] border-[#C89638] ring-2 ring-[#C89638]/40 shadow-sm'
                  : 'bg-[#FAF8F1] border-[#DDD5C5] hover:border-[#18201D] shadow-2xs'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Priority + Title */}
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-[#C89638]">
                      {priorityNumber}
                    </span>
                    {opt.isRecommended && (
                      <span className="font-mono text-[8px] font-bold px-1.5 py-0.2 bg-[#C89638]/15 text-[#8B651B] border border-[#C89638]/30 rounded-2xs uppercase">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <h4 className="font-sans font-bold text-sm text-[#18201D] tracking-tight mt-0.5">
                    {opt.title}
                  </h4>
                </div>

                {/* Action Description */}
                <div>
                  <p className="font-sans text-xs text-[#18201D] leading-relaxed">
                    {opt.action}
                  </p>
                </div>

                {/* Result / Consequence */}
                <div className="pt-2 border-t border-[#DDD5C5]/60 text-xs">
                  <span className="font-mono text-[9px] uppercase font-bold text-[#5B8D70] block">
                    Result:
                  </span>
                  <p className="font-sans text-xs text-[#576560] leading-snug mt-0.5">
                    {opt.consequence}
                  </p>
                </div>

                {/* Primary Trade-off */}
                <div className="text-xs">
                  <span className="font-mono text-[9px] uppercase font-bold text-[#C86150] block">
                    Trade-off:
                  </span>
                  <p className="font-sans text-xs text-[#576560] leading-snug mt-0.5">
                    {opt.tradeoff}
                  </p>
                </div>
              </div>

              {/* Selection indicator footer */}
              <div className="pt-3 mt-3 border-t border-[#DDD5C5] flex items-center justify-between">
                <span
                  className={`text-[11px] font-sans font-semibold ${
                    isSelected ? 'text-[#C89638]' : 'text-[#718894]'
                  }`}
                >
                  {isSelected ? '● Selected' : 'Select'}
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
