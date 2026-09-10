import React, { useState } from 'react';

export interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScenarioToDecision?: (optionId: string) => void;
}

interface ScenarioConfig {
  id: string;
  title: string;
  description: string;
  correspondingOptionId?: string;
  baseline: {
    capacityHours: string;
    utilization: string;
    deliveryDelay: string;
    customerRisk: string;
    financialVariance: string;
  };
  projected: {
    capacityHours: string;
    utilization: string;
    deliveryDelay: string;
    customerRisk: string;
    financialVariance: string;
    isBetter: boolean;
  };
  summary: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'scen-reduce-scope',
    title: 'Reduce Scope (Recommended)',
    description: 'Remove lower-priority feature requirements (Phase 2 Reporting & Custom Export) to protect delivery timeline.',
    correspondingOptionId: 'opt-scope-reduction',
    baseline: {
      capacityHours: '420h demand / 300h cap (120h gap)',
      utilization: '140% (Over capacity)',
      deliveryDelay: '+8 days schedule slip',
      customerRisk: '₹50.0L contract at risk',
      financialVariance: '₹0.0L baseline budget',
    },
    projected: {
      capacityHours: '315h demand / 300h cap (15h gap)',
      utilization: '105% (Nominal load)',
      deliveryDelay: '+1 day (Inside customer SLA)',
      customerRisk: 'Contract preserved with scope addendum',
      financialVariance: '₹2.4L contractor overtime saved',
      isBetter: true,
    },
    summary: 'Eliminates 88% of engineering deficit and keeps customer delivery on schedule without additional capital spend.',
  },
  {
    id: 'scen-delay-delivery',
    title: 'Delay Delivery',
    description: 'Keep the full committed scope and renegotiate the delivery date by extending the deadline +14 days.',
    correspondingOptionId: 'opt-delay-delivery',
    baseline: {
      capacityHours: '420h demand / 300h cap (120h gap)',
      utilization: '140% (Over capacity)',
      deliveryDelay: '+8 days schedule slip',
      customerRisk: '₹50.0L contract at risk',
      financialVariance: '₹0.0L baseline budget',
    },
    projected: {
      capacityHours: '420h demand / 400h expanded sprint',
      utilization: '105% (Normalized across 6 weeks)',
      deliveryDelay: '+14 days renegotiated date',
      customerRisk: 'Customer procurement approval required',
      financialVariance: '₹0.0L (Zero external contractor cost)',
      isBetter: false,
    },
    summary: 'Protects team from overtime but moves delivery friction directly onto customer expectations and contract terms.',
  },
  {
    id: 'scen-reallocate-capacity',
    title: 'Reallocate Internal Capacity',
    description: 'Move engineering capacity from internal infrastructure initiative over to customer deliverables.',
    correspondingOptionId: 'opt-reallocate-capacity',
    baseline: {
      capacityHours: '420h demand / 300h cap (120h gap)',
      utilization: '140% (Over capacity)',
      deliveryDelay: '+8 days schedule slip',
      customerRisk: '₹50.0L contract at risk',
      financialVariance: '₹0.0L baseline budget',
    },
    projected: {
      capacityHours: '420h demand / 410h augmented cap',
      utilization: '102% (Balanced)',
      deliveryDelay: '+2 days (Within grace period)',
      customerRisk: 'Contract fully satisfied',
      financialVariance: 'Internal tech debt postponed 1 quarter',
      isBetter: true,
    },
    summary: 'Satisfies commercial commitment on time, but delays internal platform migration by one fiscal quarter.',
  },
  {
    id: 'scen-add-external',
    title: 'Add External Capacity (Contractors)',
    description: 'Retain approved specialist contractors to absorb the 120h spike immediately.',
    correspondingOptionId: 'opt-add-external',
    baseline: {
      capacityHours: '420h demand / 300h cap (120h gap)',
      utilization: '140% (Over capacity)',
      deliveryDelay: '+8 days schedule slip',
      customerRisk: '₹50.0L contract at risk',
      financialVariance: '₹0.0L baseline budget',
    },
    projected: {
      capacityHours: '420h demand / 420h matched cap',
      utilization: '100% (Normal load)',
      deliveryDelay: '0 days (On-time milestone)',
      customerRisk: 'Zero delivery exposure',
      financialVariance: '+₹3.6L unbudgeted vendor expense',
      isBetter: false,
    },
    summary: 'Guarantees on-time release and full scope, but incurs ₹3.6L in immediate unbudgeted contractor spend.',
  },
  {
    id: 'scen-budget-cut',
    title: 'Adjust Budget / Enforce Strict Spend Limit',
    description: 'Maintain strict capital reduction without authorizing any overtime or additional contractor spend.',
    correspondingOptionId: 'opt-cancel-commitment',
    baseline: {
      capacityHours: '420h demand / 300h cap (120h gap)',
      utilization: '140% (Over capacity)',
      deliveryDelay: '+8 days schedule slip',
      customerRisk: '₹50.0L contract at risk',
      financialVariance: '₹0.0L baseline budget',
    },
    projected: {
      capacityHours: '420h demand / 300h capped',
      utilization: '140% (High risk of engineer burnout)',
      deliveryDelay: '+18 days compounded delay',
      customerRisk: 'Critical contract breach penalty',
      financialVariance: '₹7.0L liquidity preserved',
      isBetter: false,
    },
    summary: 'Maximizes short-term fiscal discipline at severe risk to commercial relationships and staff retention.',
  },
];

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  onApplyScenarioToDecision,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-reduce-scope');

  if (!isOpen) return null;

  const currentScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  const handleApply = () => {
    if (currentScenario.correspondingOptionId && onApplyScenarioToDecision) {
      onApplyScenarioToDecision(currentScenario.correspondingOptionId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[#FAF8F1] border-2 border-[#C89638] rounded-xs shadow-2xl max-w-4xl w-full overflow-hidden text-[#18201D] font-sans">
        {/* Modal Header */}
        <div className="bg-[#18201D] text-[#FAF8F1] p-4 flex items-center justify-between border-b border-[#C89638]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C89638] animate-pulse" />
            <div>
              <span className="font-mono text-[10px] text-[#C89638] uppercase tracking-widest font-bold block">
                SCENARIO SIMULATOR // NON-DESTRUCTIVE EXPLORER
              </span>
              <h3 className="font-bold text-base text-[#FAF8F1] tracking-tight">
                Simulate Organizational Consequences
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#889B95] hover:text-[#FAF8F1] text-lg px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Scenario Tabs / Cards */}
          <div>
            <div className="font-mono text-[10px] text-[#718894] uppercase font-bold mb-2">
              SELECT SCENARIO TO TEST:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {SCENARIOS.map((scen) => {
                const isSelected = scen.id === selectedScenarioId;
                return (
                  <button
                    key={scen.id}
                    onClick={() => setSelectedScenarioId(scen.id)}
                    className={`text-left p-3 border rounded-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF8F1] border-[#C89638] ring-1 ring-[#C89638] shadow-xs'
                        : 'bg-[#F3EFE5] border-[#DDD5C5] hover:border-[#C89638]/50 hover:bg-[#FAF8F1]'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#18201D] truncate">
                      {scen.title}
                    </div>
                    <div className="text-[11px] text-[#576560] line-clamp-2 mt-1 leading-snug">
                      {scen.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Comparison: Current Baseline vs Simulated Scenario */}
          <div className="p-4 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD5C5] pb-2">
              <div>
                <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold">
                  PROJECTED TRADE-OFF ANALYSIS
                </span>
                <h4 className="font-bold text-sm text-[#18201D] mt-0.5">
                  {currentScenario.title}
                </h4>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 bg-[#F3EFE5] border border-[#DDD5C5] rounded-2xs text-[#576560]">
                Production state remains untouched
              </span>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CURRENT BASELINE */}
              <div className="p-3.5 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#718894]">
                    CURRENT BASELINE
                  </span>
                  <span className="text-[10px] font-mono text-[#C86150] font-bold">
                    UNRESOLVED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#718894] block text-[10px] font-mono">Demand vs Capacity:</span>
                    <strong className="text-[#18201D] font-mono">{currentScenario.baseline.capacityHours}</strong>
                  </div>
                  <div>
                    <span className="text-[#718894] block text-[10px] font-mono">Team Utilization:</span>
                    <strong className="text-[#C86150] font-mono">{currentScenario.baseline.utilization}</strong>
                  </div>
                  <div>
                    <span className="text-[#718894] block text-[10px] font-mono">Schedule Status:</span>
                    <strong className="text-[#C86150] font-mono">{currentScenario.baseline.deliveryDelay}</strong>
                  </div>
                  <div>
                    <span className="text-[#718894] block text-[10px] font-mono">Customer Exposure:</span>
                    <strong className="text-[#18201D] font-mono">{currentScenario.baseline.customerRisk}</strong>
                  </div>
                </div>
              </div>

              {/* SIMULATED SCENARIO */}
              <div className="p-3.5 bg-[#FAF8F1] border-2 border-[#C89638] rounded-xs space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#C89638]">
                    SIMULATED OUTCOME
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-2xs ${
                      currentScenario.projected.isBetter
                        ? 'bg-[#5B8D70]/15 text-[#2D5A40]'
                        : 'bg-[#C86150]/15 text-[#C86150]'
                    }`}
                  >
                    {currentScenario.projected.isBetter ? 'FAVORABLE DELTA' : 'TRADEOFF COMPROMISE'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#718894] block text-[10px] font-mono">Projected Capacity:</span>
                    <strong className="text-[#18201D] font-mono">{currentScenario.projected.capacityHours}</strong>
                  </div>
                  <div>
                    <span className="text-[#718894] block text-[10px] font-mono">Projected Utilization:</span>
                    <strong
                      className={`font-mono ${
                        currentScenario.projected.isBetter ? 'text-[#2D5A40]' : 'text-[#C86150]'
                      }`}
                    >
                      {currentScenario.projected.utilization}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#718894] block text-[10px] font-mono">Projected Schedule:</span>
                    <strong
                      className={`font-mono ${
                        currentScenario.projected.isBetter ? 'text-[#2D5A40]' : 'text-[#8B651B]'
                      }`}
                    >
                      {currentScenario.projected.deliveryDelay}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#718894] block text-[10px] font-mono">Customer Outcome:</span>
                    <strong className="text-[#18201D] font-mono">{currentScenario.projected.customerRisk}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Insight Banner */}
            <div className="p-3 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs text-xs text-[#576560] leading-relaxed">
              <strong className="text-[#18201D]">Executive Insight: </strong>
              {currentScenario.summary}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#F3EFE5] border-t border-[#DDD5C5] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-sans font-semibold bg-[#FAF8F1] border border-[#DDD5C5] text-[#576560] hover:text-[#18201D] rounded-xs transition-colors cursor-pointer"
          >
            Cancel Simulation
          </button>

          <div className="flex items-center gap-2">
            {currentScenario.correspondingOptionId && onApplyScenarioToDecision && (
              <button
                onClick={handleApply}
                className="px-5 py-2 text-xs font-sans font-bold bg-[#C89638] text-[#FAF8F1] hover:bg-[#B3832B] rounded-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Select &quot;{currentScenario.title}&quot; in Human Decision</span>
                <span className="font-mono text-[10px]">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
