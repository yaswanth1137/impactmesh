import React from 'react';
import { PixelIcon } from '../pixel/PixelIcon.tsx';

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
    id: 'budget',
    stage: '01. SOURCE EVENT',
    label: 'BUDGET',
    figure: '₹18L → ₹11L',
    subtext: '₹7L allocation reduction',
    status: 'tension',
    icon: 'ledger',
  },
  {
    id: 'scope',
    stage: '02. PRODUCT',
    label: 'FEATURE SCOPE',
    figure: '3 Commitments',
    subtext: 'SAML, Analytics, Audit',
    status: 'normal',
    icon: 'compass',
  },
  {
    id: 'engineering',
    stage: '03. CAPACITY',
    label: 'ENGINEERING',
    figure: '300h / 420h',
    subtext: '120h deficit (40% overload)',
    status: 'critical',
    icon: 'gear',
  },
  {
    id: 'delivery',
    stage: '04. OPERATIONS',
    label: 'DELIVERY',
    figure: '+8 Days',
    subtext: 'SLA milestone pressure',
    status: 'risk',
    icon: 'route-marker',
  },
  {
    id: 'customer',
    stage: '05. REVENUE',
    label: 'CUSTOMER',
    figure: '₹50L Value',
    subtext: 'Apex Global Financials',
    status: 'risk',
    icon: 'spyglass',
  },
];

export const CausalChain: React.FC<CausalChainProps> = ({
  steps = DEFAULT_STEPS,
  onToggleFullGraph,
  showFullGraph = false,
}) => {
  const getStatusColor = (status: CausalStep['status']) => {
    switch (status) {
      case 'critical':
        return {
          border: 'border-[#C86150]',
          badge: 'bg-[#C86150]/10 text-[#C86150] border-[#C86150]/30',
          accent: 'text-[#C86150]',
        };
      case 'risk':
        return {
          border: 'border-[#C89638]',
          badge: 'bg-[#C89638]/10 text-[#C89638] border-[#C89638]/30',
          accent: 'text-[#C89638]',
        };
      case 'tension':
        return {
          border: 'border-[#B97B63]',
          badge: 'bg-[#B97B63]/10 text-[#B97B63] border-[#B97B63]/30',
          accent: 'text-[#B97B63]',
        };
      case 'normal':
      default:
        return {
          border: 'border-[#DDD5C5]',
          badge: 'bg-[#DDD5C5]/30 text-[#576560] border-[#DDD5C5]',
          accent: 'text-[#18201D]',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Horizontal / Responsive Causal Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {steps.map((step, idx) => {
          const colors = getStatusColor(step.status);
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex flex-col">
              <div
                className={`flex-1 p-3.5 bg-[#FAF8F1] border rounded-xs shadow-2xs transition-all hover:shadow-xs ${colors.border}`}
              >
                {/* Stage Tag */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="font-mono text-[9px] text-[#718894] uppercase tracking-wider font-bold">
                    {step.stage}
                  </span>
                  <PixelIcon name={step.icon} size={13} color="#718894" />
                </div>

                {/* Node Label */}
                <div className="font-sans font-bold text-xs text-[#18201D] tracking-tight">
                  {step.label}
                </div>

                {/* Prominent Business Figure */}
                <div className={`font-mono text-base font-bold my-1 tracking-tight ${colors.accent}`}>
                  {step.figure}
                </div>

                {/* Supporting Explanation */}
                <div className="font-sans text-[11px] text-[#576560] leading-tight mt-0.5">
                  {step.subtext}
                </div>
              </div>

              {/* Arrow connector between cards on desktop */}
              {!isLast && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 bg-[#F3EFE5] border border-[#DDD5C5] rounded-full items-center justify-center text-[10px] text-[#718894] font-bold">
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
