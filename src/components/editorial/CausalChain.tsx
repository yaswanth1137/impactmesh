import React from 'react';

interface CausalStep {
  id: string;
  stage: string;
  label: string;
  figure: string;
  subtext: string;
  status: 'normal' | 'tension' | 'risk' | 'critical';
  icon: 'ledger' | 'compass' | 'gear' | 'route-marker' | 'spyglass';
}

interface CausalChainProps {
  steps?: CausalStep[];
  onToggleFullGraph?: () => void;
  showFullGraph?: boolean;
}

const DEFAULT_STEPS: CausalStep[] = [
  {
    id: 'sales',
    stage: 'SALES',
    label: 'Sales commitment',
    figure: 'Apex Expansion',
    subtext: 'Custom feature committed',
    status: 'tension',
    icon: 'spyglass',
  },
  {
    id: 'scope',
    stage: 'PRODUCT',
    label: 'Product scope',
    figure: '3 Modules',
    subtext: 'Added to release backlog',
    status: 'normal',
    icon: 'compass',
  },
  {
    id: 'engineering',
    stage: 'ENGINEERING',
    label: 'Engineering capacity',
    figure: 'Constrained',
    subtext: 'Capacity constrained',
    status: 'critical',
    icon: 'gear',
  },
  {
    id: 'delivery',
    stage: 'DELIVERY',
    label: 'Delivery target',
    figure: 'At Risk',
    subtext: 'Target at risk (+8 days)',
    status: 'critical',
    icon: 'route-marker',
  },
  {
    id: 'customer',
    stage: 'CUSTOMER',
    label: 'Customer outcome',
    figure: 'Exposed',
    subtext: 'Commitment exposed',
    status: 'risk',
    icon: 'ledger',
  },
];

export const CausalChain: React.FC<CausalChainProps> = ({
  steps = DEFAULT_STEPS,
  onToggleFullGraph,
  showFullGraph = false,
}) => {
  const getStatusStyle = (status: CausalStep['status']) => {
    switch (status) {
      case 'critical':
        return {
          border: 'border-[#C86150]/60 bg-[#FAF8F1]',
          statusText: 'text-[#C86150]',
        };
      case 'risk':
        return {
          border: 'border-[#C89638]/60 bg-[#FAF8F1]',
          statusText: 'text-[#C89638]',
        };
      case 'tension':
        return {
          border: 'border-[#B97B63]/60 bg-[#FAF8F1]',
          statusText: 'text-[#B97B63]',
        };
      case 'normal':
      default:
        return {
          border: 'border-[#DDD5C5] bg-[#FAF8F1]',
          statusText: 'text-[#576560]',
        };
    }
  };

  return (
    <div className="space-y-3">
      {/* Simple Causal Chain: Name + Short Status/Value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {steps.map((step, idx) => {
          const style = getStatusStyle(step.status);
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex flex-col">
              <div
                className={`p-3.5 border rounded-xs shadow-2xs transition-all hover:border-[#18201D] flex flex-col justify-between min-h-[82px] ${style.border}`}
              >
                {/* Node Name */}
                <div className="font-mono text-[10px] text-[#718894] uppercase tracking-wider font-bold">
                  {step.stage}
                </div>

                <div className="font-sans font-bold text-xs md:text-sm text-[#18201D] tracking-tight mt-0.5">
                  {step.label}
                </div>

                {/* Short Status / Value */}
                <div className={`font-sans text-xs font-semibold mt-1 ${style.statusText}`}>
                  {step.subtext}
                </div>
              </div>

              {/* Arrow connector between nodes */}
              {!isLast && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 bg-[#FAF8F1] border border-[#DDD5C5] rounded-full items-center justify-center text-[9px] text-[#718894] font-bold">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progressive Disclosure Toggle */}
      {onToggleFullGraph && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#576560] font-sans">
            Showing core business causal chain. Expand below to inspect granular organizational dependencies.
          </p>
          <button
            onClick={onToggleFullGraph}
            className="px-3 py-1.5 bg-[#FAF8F1] border border-[#C89638] text-[#18201D] font-sans text-xs font-semibold hover:bg-[#F3EFE5] rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>{showFullGraph ? 'HIDE FULL IMPACT MAP' : 'VIEW FULL IMPACT MAP'}</span>
            <span className="font-mono text-[10px] text-[#C89638]">{showFullGraph ? '▲' : '▼'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
