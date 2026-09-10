import React from 'react';

interface DecisionAlertProps {
  department?: string;
  actionTitle?: string;
  changeDetail?: string;
  effectsCount?: number;
  capacityDeficitHours?: number;
  deliveryExposureDays?: number;
  financialExposure?: string;
  onReviewImpact?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export const DecisionAlert: React.FC<DecisionAlertProps> = ({
  department = 'FINANCE',
  actionTitle = 'A BUDGET CHANGE MAY AFFECT A CUSTOMER COMMITMENT',
  changeDetail = 'Finance reduced the project budget from ₹18L to ₹11L.',
  effectsCount = 7,
  capacityDeficitHours = 120,
  deliveryExposureDays = 8,
  financialExposure = '₹50L',
  onReviewImpact,
  onViewDetails,
  className = '',
}) => {
  return (
    <div
      id="decision-alert-banner"
      className={`bg-[#FAF8F1] border-2 border-[#C89638] rounded-xs shadow-xs p-5 md:p-6 relative overflow-hidden ${className}`}
    >
      {/* Decorative chart coordinate mark */}
      <div className="absolute top-2 right-3 font-mono text-[9px] text-[#718894]/40 select-none">
        REF: DEC-2026-Q3-01 // FINANCE → REVENUE
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
        <div className="space-y-2 flex-1">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C89638] animate-pulse" />
            <span className="font-mono text-[10px] text-[#C89638] font-bold tracking-widest uppercase">
              WHAT HAPPENED?
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#F3EFE5] text-[#576560] border border-[#DDD5C5] rounded-2xs uppercase">
              DEPT: {department}
            </span>
          </div>

          {/* Editorial Headline */}
          <h2 className="font-sans font-bold text-xl md:text-2xl text-[#18201D] tracking-tight max-w-3xl leading-snug">
            {actionTitle}
          </h2>

          {/* Plain Language Description */}
          <p className="font-sans text-sm md:text-base text-[#18201D] leading-relaxed max-w-3xl bg-[#F3EFE5] p-3.5 border border-[#DDD5C5] rounded-xs">
            {changeDetail}
          </p>

          {/* Supporting Executive Metrics Grid */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-[#576560]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#C89638] font-bold">●</span>
              <span><strong>{effectsCount}</strong> downstream effects</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#C86150] font-bold">●</span>
              <span><strong>{capacityDeficitHours}h</strong> capacity gap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#C86150] font-bold">●</span>
              <span>Delivery exposure: <strong>+{deliveryExposureDays} days</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#5B8D70] font-bold">●</span>
              <span>Customer opportunity: <strong>{financialExposure}</strong></span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="shrink-0 flex items-center gap-2.5 w-full sm:w-auto pt-2 lg:pt-0">
          <button
            onClick={onReviewImpact}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#C89638] hover:bg-[#B3832B] text-[#FAF8F1] font-sans text-xs font-bold tracking-wide uppercase transition-all shadow-2xs rounded-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>REVIEW DECISION</span>
            <span className="font-mono text-[10px]">▼</span>
          </button>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="px-3.5 py-2.5 bg-[#F3EFE5] hover:bg-[#FAF8F1] text-[#18201D] font-sans text-xs font-semibold border border-[#DDD5C5] transition-all rounded-xs cursor-pointer"
            >
              VIEW DETAILS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
