import React from 'react';

export interface ExecutionPlanSectionProps {
  onOpenFlowTrace: () => void;
  decisionTitle?: string;
  isConfirmed?: boolean;
}

const FLOWTRACE_STEPS = [
  {
    sequence: '01',
    title: 'Reduce feature scope',
    dept: 'PRODUCT & ENGINEERING',
    detail: 'Mark Phase 2 Custom Analytics as deferred in backlog; reallocate 105h sprint capacity.',
  },
  {
    sequence: '02',
    title: 'Update product commitment',
    dept: 'PRODUCT',
    detail: 'Update technical SLA and deliverable specifications in release manifest.',
  },
  {
    sequence: '03',
    title: 'Notify sales & account lead',
    dept: 'SALES',
    detail: 'Brief Apex Enterprise account manager on schedule stability and deliverable scope.',
  },
  {
    sequence: '04',
    title: 'Update delivery target',
    dept: 'OPERATIONS',
    detail: 'Align sprint milestone dates to +1 day SLA window in production schedule.',
  },
  {
    sequence: '05',
    title: 'Monitor outcome',
    dept: 'IMPACTMESH',
    detail: 'Verify closed-loop telemetry from operations and telemetry event log.',
  },
];

export const ExecutionPlanSection: React.FC<ExecutionPlanSectionProps> = ({
  onOpenFlowTrace,
  decisionTitle = 'Reduce Scope',
  isConfirmed = true,
}) => {
  return (
    <div
      id="execution-plan-section"
      className="p-5 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-4 select-none"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD5C5] pb-3">
        <div>
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            EXECUTION SEQUENCE
          </span>
          <h3 className="font-sans font-bold text-xl text-[#18201D] tracking-tight mt-0.5">
            EXECUTION PLAN
          </h3>
        </div>

        <span className="px-2.5 py-0.5 font-mono text-[10px] font-bold bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30 rounded-2xs uppercase">
          FlowTrace Bridge: Connected
        </span>
      </div>

      <div className="text-xs text-[#576560]">
        Executing approved course: <strong className="text-[#18201D]">{decisionTitle}</strong>. Below is the multi-department operational execution route mapped to FlowTrace.
      </div>

      {/* 5 Steps Sequence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
        {FLOWTRACE_STEPS.map((step) => (
          <div
            key={step.sequence}
            className="p-3 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs space-y-1.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#C89638]">
                  {step.sequence}
                </span>
                <span className="font-mono text-[8px] text-[#718894] uppercase">
                  {step.dept}
                </span>
              </div>
              <h5 className="font-sans font-bold text-xs text-[#18201D] mt-1 leading-snug">
                {step.title}
              </h5>
              <p className="text-[11px] text-[#576560] font-sans mt-1 leading-normal">
                {step.detail}
              </p>
            </div>
            <div className="pt-2 border-t border-[#DDD5C5]/60 flex items-center justify-between text-[10px] font-mono text-[#5B8D70]">
              <span>Status:</span>
              <span>{isConfirmed ? 'QUEUED' : 'PENDING'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Button to Open FlowTrace */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#718894]">
          {isConfirmed
            ? 'Decision confirmed. Step sequencing ready for automated and human checkpoints in FlowTrace.'
            : 'Confirm decision above to initiate step execution in FlowTrace.'}
        </div>

        <button
          onClick={onOpenFlowTrace}
          className="px-5 py-2.5 bg-[#18201D] hover:bg-[#252E2A] text-[#FAF8F1] border border-[#C89638] font-sans text-xs font-bold uppercase tracking-wider rounded-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Open FlowTrace Execution Studio</span>
          <span className="font-mono text-[10px] text-[#C89638]">→</span>
        </button>
      </div>
    </div>
  );
};
