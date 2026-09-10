import React, { useState } from 'react';
import type { ImpactResult } from '../../types/domain.ts';
import type { DecisionEvent } from '../../types/events.ts';

interface ImpactSummaryProps {
  event?: DecisionEvent;
  impact?: ImpactResult;
  className?: string;
}

export const ImpactSummary: React.FC<ImpactSummaryProps> = ({
  event,
  impact,
  className = '',
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const affectedCount = impact ? impact.affected_entities.length : 7;
  const deptName = event ? event.department.toUpperCase() : 'FINANCE';

  return (
    <div
      id="impact-summary-card"
      className={`p-5 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-4 select-none ${className}`}
    >
      {/* 1. WHY DOES IT MATTER? */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-[#DDD5C5] pb-2 mb-3">
          <h3 className="font-sans font-bold text-xl text-[#18201D] tracking-tight">
            WHY DOES THIS MATTER?
          </h3>
          <span className="font-mono text-xs text-[#576560]">
            SOURCE: <strong className="text-[#18201D]">{deptName}</strong>
          </span>
        </div>

        {/* Short Explanation */}
        <p className="font-sans text-sm md:text-base text-[#18201D] leading-relaxed bg-[#F3EFE5] p-4 border border-[#DDD5C5] rounded-xs">
          "Sales committed a custom feature to Apex Global while engineering capacity was already constrained. Keeping the full commitment is likely to push delivery beyond the current customer date."
        </p>

        {/* 2–4 Evidence Chips (Not four large metric cards) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3">
          <div className="px-3 py-1.5 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs flex items-center gap-2 text-xs font-sans">
            <span className="w-2 h-2 rounded-full bg-[#C86150]" />
            <span className="text-[#576560]">Capacity Gap:</span>
            <strong className="text-[#18201D]">120h deficit (140% workload)</strong>
          </div>

          <div className="px-3 py-1.5 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs flex items-center gap-2 text-xs font-sans">
            <span className="w-2 h-2 rounded-full bg-[#C86150]" />
            <span className="text-[#576560]">Delivery Exposure:</span>
            <strong className="text-[#18201D]">+8 days projected slip</strong>
          </div>

          <div className="px-3 py-1.5 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs flex items-center gap-2 text-xs font-sans">
            <span className="w-2 h-2 rounded-full bg-[#C89638]" />
            <span className="text-[#576560]">Customer Exposure:</span>
            <strong className="text-[#18201D]">Apex Global commitment exposed</strong>
          </div>
        </div>
      </div>

      {/* 2. SEVERITY — SIMPLE */}
      <div className="pt-3 border-t border-[#DDD5C5] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 font-mono text-xs font-bold bg-[#C86150]/10 text-[#C86150] border border-[#C86150]/30 rounded-2xs uppercase">
            HIGH SEVERITY
          </span>
          <span className="font-sans text-xs md:text-sm text-[#18201D] font-medium">
            "Delivery is likely to slip unless the commitment changes."
          </span>
        </div>

        {/* Compact dimensions */}
        <div className="flex items-center gap-2 text-xs font-sans text-[#718894] flex-wrap">
          <span>Customer: <strong className="text-[#18201D]">High</strong></span>
          <span>·</span>
          <span>Delivery: <strong className="text-[#18201D]">High</strong></span>
          <span>·</span>
          <span>Engineering: <strong className="text-[#18201D]">Medium</strong></span>
        </div>
      </div>

      {/* Technical Evidence Toggle */}
      <div className="pt-1 flex justify-end">
        <button
          onClick={() => setShowTechnicalDetails((prev) => !prev)}
          className="text-xs font-sans text-[#718894] hover:text-[#18201D] transition-colors cursor-pointer"
        >
          {showTechnicalDetails ? '▼ Hide technical evidence' : '▶ View technical propagation details'}
        </button>
      </div>

      {showTechnicalDetails && (
        <div className="p-3 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs font-mono text-xs space-y-1 text-[#576560] animate-in fade-in">
          <div>Propagation model: Deterministic Directed Dependency Traversal</div>
          <div>Risk vector: 0.82 (Materiality threshold: HIGH)</div>
          <div>Active constraints: C-FIN-01 (Budget cap), C-ENG-02 (Weekly capacity limit)</div>
          <div>Affected entities: {affectedCount} nodes across Sales, Product, Engineering, Finance</div>
        </div>
      )}
    </div>
  );
};
