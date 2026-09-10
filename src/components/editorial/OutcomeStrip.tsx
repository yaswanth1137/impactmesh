import React from 'react';

interface OutcomeMetric {
  label: string;
  before: string;
  after: string;
  status: 'positive' | 'neutral' | 'improved';
}

interface OutcomeStripProps {
  decisionTitle?: string;
  outcomeStatus?: string;
  metrics?: OutcomeMetric[];
  className?: string;
}

const DEFAULT_METRICS: OutcomeMetric[] = [
  {
    label: 'ENGINEERING DEMAND',
    before: '420h',
    after: '315h',
    status: 'improved',
  },
  {
    label: 'CAPACITY GAP',
    before: '120h',
    after: '15h',
    status: 'improved',
  },
  {
    label: 'DELIVERY EXPOSURE',
    before: '+8 Days',
    after: '+1 Day',
    status: 'improved',
  },
  {
    label: 'CAPITAL PRESERVED',
    before: '₹0L',
    after: '₹2.4L',
    status: 'positive',
  },
  {
    label: 'CUSTOMER COMMITMENT',
    before: 'AT RISK',
    after: 'PRESERVED',
    status: 'positive',
  },
];

export const OutcomeStrip: React.FC<OutcomeStripProps> = ({
  decisionTitle = 'Reduce Feature Scope (Analytics deferred to Q4)',
  outcomeStatus = 'DECISION COMPLETED // CLOSED-LOOP VERIFIED',
  metrics = DEFAULT_METRICS,
  className = '',
}) => {
  return (
    <div className={`p-4 md:p-5 bg-[#FAF8F1] border border-[#5B8D70]/40 rounded-xs shadow-2xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DDD5C5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5B8D70]" />
            <span className="font-mono text-[9px] text-[#5B8D70] uppercase font-bold tracking-wider">
              {outcomeStatus}
            </span>
          </div>
          <h3 className="font-sans text-base font-bold text-[#18201D] mt-0.5">
            WHAT ACTUALLY HAPPENED?
          </h3>
        </div>
        <div className="font-mono text-xs text-[#576560]">
          Action: <strong className="text-[#18201D]">{decisionTitle}</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-2.5 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs">
            <div className="font-mono text-[9px] text-[#718894] uppercase tracking-wide">
              {m.label}
            </div>
            <div className="flex items-baseline gap-1.5 mt-1 font-mono">
              <span className="text-xs text-[#718894] line-through">{m.before}</span>
              <span className="text-[10px] text-[#576560]">→</span>
              <span className="text-sm font-bold text-[#2D5A40]">{m.after}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
