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
      className={`p-5 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-6 ${className}`}
    >
      {/* 1. WHY DOES THIS MATTER? Section */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-[#DDD5C5] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
              STEP 03 // EXPLANATION
            </span>
            <span className="text-[#718894]">/</span>
            <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
              WHY DOES THIS MATTER?
            </h3>
          </div>
          <span className="font-mono text-xs text-[#576560]">
            SOURCE: <strong className="text-[#18201D]">{deptName}</strong>
          </span>
        </div>

        <p className="font-sans text-sm md:text-base text-[#18201D] leading-relaxed bg-[#F3EFE5] p-4 border border-[#DDD5C5] rounded-xs">
          "The budget reduction leaves the project with less funding while committed engineering work remains unchanged.
          Committed engineering work exceeds available capacity by 40%, which puts the upcoming delivery commitment and customer revenue at risk."
        </p>

        {/* Before vs After Metric Comparison Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
          <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
            <div className="font-mono text-[9px] text-[#718894] uppercase">BUDGET ALLOCATION</div>
            <div className="font-mono text-base font-bold text-[#18201D] mt-1">₹18L → ₹11L</div>
            <div className="font-sans text-[11px] text-[#C86150] font-semibold mt-0.5">-₹7L Reduction</div>
          </div>

          <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
            <div className="font-mono text-[9px] text-[#718894] uppercase">ENGINEERING CAPACITY</div>
            <div className="font-mono text-base font-bold text-[#18201D] mt-1">300h / 420h</div>
            <div className="font-sans text-[11px] text-[#C86150] font-semibold mt-0.5">120h Gap (40% Deficit)</div>
          </div>

          <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
            <div className="font-mono text-[9px] text-[#718894] uppercase">DELIVERY EXPOSURE</div>
            <div className="font-mono text-base font-bold text-[#C86150] mt-1">+8 Days</div>
            <div className="font-sans text-[11px] text-[#576560] mt-0.5">Estimated schedule slip</div>
          </div>

          <div className="p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
            <div className="font-mono text-[9px] text-[#718894] uppercase">CUSTOMER OPPORTUNITY</div>
            <div className="font-mono text-base font-bold text-[#C89638] mt-1">₹50L ARR</div>
            <div className="font-sans text-[11px] text-[#576560] mt-0.5">Apex Global Financials</div>
          </div>
        </div>
      </div>

      {/* 2. HOW SERIOUS IS IT? Section */}
      <div className="pt-2 border-t border-[#DDD5C5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
              STEP 05 // SEVERITY
            </span>
            <span className="text-[#718894]">/</span>
            <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
              HOW SERIOUS IS IT?
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#576560]">BUSINESS RISK:</span>
            <span className="px-2.5 py-0.5 font-mono text-xs font-bold bg-[#C86150]/10 text-[#C86150] border border-[#C86150]/30 rounded-2xs uppercase">
              HIGH RISK
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs space-y-2">
          <p className="font-sans text-sm text-[#18201D] font-medium leading-relaxed">
            "Engineering demand is currently 40% above available capacity. Without a deliberate decision to adjust scope,
            schedule, or budget, delivery will slip past contract commitments, triggering SLA exposure."
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-xs text-[#576560]">
            <span><strong>Available:</strong> 300h</span>
            <span>•</span>
            <span><strong>Committed:</strong> 420h</span>
            <span>•</span>
            <span className="text-[#C86150] font-bold"><strong>Deficit:</strong> 120h</span>
            <span>•</span>
            <span className="text-[#C86150] font-bold"><strong>Slip:</strong> +8 Days</span>
            <span>•</span>
            <span><strong>Departments Affected:</strong> 4 ({affectedCount} entities)</span>
          </div>
        </div>

        {/* Technical Disclosure Toggle */}
        <div className="pt-3 flex justify-end">
          <button
            onClick={() => setShowTechnicalDetails((prev) => !prev)}
            className="text-xs font-mono text-[#718894] hover:text-[#18201D] transition-colors cursor-pointer"
          >
            {showTechnicalDetails ? '▼ HIDE TECHNICAL EVIDENCE' : '▶ VIEW ANALYSIS DETAILS'}
          </button>
        </div>

        {showTechnicalDetails && (
          <div className="mt-3 p-3 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs font-mono text-xs space-y-1 text-[#576560] animate-in fade-in">
            <div>Propagation algorithm: Deterministic Directed Dependency Traversal</div>
            <div>Risk vector: 0.82 (Materiality threshold: HIGH)</div>
            <div>Active constraints: C-FIN-01 (Budget cap), C-ENG-02 (Weekly capacity limit)</div>
            <div>Affected entities: {affectedCount} nodes across Sales, Product, Engineering, Finance</div>
          </div>
        )}
      </div>
    </div>
  );
};
