import React, { useState } from 'react';

export interface HumanDecisionPanelProps {
  systemRecommendedOptionId: string;
  systemRecommendedTitle: string;
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
  onConfirmDecision: (chosenOptionId: string, decisionNote: string) => void;
  isConfirmed?: boolean;
}

const DECISION_CHOICES = [
  { id: 'opt-scope-reduction', label: 'Reduce Scope' },
  { id: 'opt-delay-delivery', label: 'Delay Delivery' },
  { id: 'opt-reallocate-capacity', label: 'Reallocate Capacity' },
  { id: 'opt-add-external', label: 'Add External Capacity' },
];

export const HumanDecisionPanel: React.FC<HumanDecisionPanelProps> = ({
  systemRecommendedTitle,
  selectedOptionId,
  onSelectOption,
  onConfirmDecision,
  isConfirmed = false,
}) => {
  const [decisionNote, setDecisionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedChoice = DECISION_CHOICES.find((c) => c.id === selectedOptionId) || DECISION_CHOICES[0];

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmDecision(selectedOptionId, decisionNote);
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div
      id="human-decision-section"
      className="p-5 md:p-6 bg-[#FAF8F1] border-2 border-[#18201D] rounded-xs shadow-md space-y-4 select-none"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD5C5] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            STEP 07 // HUMAN DECISION
          </span>
          <span className="text-[#718894]">/</span>
          <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight">
            Your Decision
          </h3>
        </div>

        {isConfirmed ? (
          <span className="px-3 py-1 font-mono text-xs font-bold bg-[#5B8D70]/15 text-[#2D5A40] border border-[#5B8D70]/40 rounded-xs uppercase flex items-center gap-1.5">
            <span>✓</span>
            <span>Decision Confirmed &amp; Recorded</span>
          </span>
        ) : (
          <span className="px-3 py-1 font-mono text-[11px] font-bold bg-[#C89638]/15 text-[#8B651B] border border-[#C89638]/30 rounded-xs uppercase">
            Human Approval Required
          </span>
        )}
      </div>

      {/* System Recommends vs Your Choice */}
      <div className="p-3 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-mono text-[9px] text-[#718894] uppercase font-bold block">
            SYSTEM RECOMMENDS:
          </span>
          <span className="font-sans font-bold text-sm text-[#18201D]">
            {systemRecommendedTitle}
          </span>
        </div>
        <div className="text-[11px] text-[#576560] font-sans">
          The human operator retains final governance and authority.
        </div>
      </div>

      {/* 4 Clickable Decision Options */}
      <div>
        <div className="font-mono text-[10px] text-[#718894] uppercase font-bold mb-2">
          YOUR DECISION:
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {DECISION_CHOICES.map((choice) => {
            const isSelected = selectedOptionId === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => onSelectOption(choice.id)}
                className={`px-3.5 py-3 text-left rounded-xs border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#18201D] text-[#FAF8F1] border-[#18201D] shadow-sm ring-2 ring-[#C89638]'
                    : 'bg-[#FAF8F1] text-[#18201D] border-[#DDD5C5] hover:border-[#C89638] hover:bg-[#F3EFE5]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-xs">{choice.label}</span>
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#C89638]' : 'bg-[#DDD5C5]'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Decision Note Field */}
      <div>
        <label className="font-mono text-[10px] text-[#718894] uppercase font-bold block mb-1">
          Decision Note (Optional context / directive):
        </label>
        <textarea
          rows={2}
          value={decisionNote}
          onChange={(e) => setDecisionNote(e.target.value)}
          placeholder="e.g. Approved scope deferral of Phase 2 Custom Analytics for Q3 release. Customer success notified."
          className="w-full p-2.5 text-xs font-sans bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs text-[#18201D] placeholder:text-[#718894] focus:outline-none focus:border-[#C89638]"
        />
      </div>

      {/* Confirm Button */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#576560]">
          Selected: <strong className="text-[#18201D]">{selectedChoice.label}</strong>
        </div>

        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider rounded-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
            isConfirmed
              ? 'bg-[#5B8D70] text-[#FAF8F1] hover:bg-[#4E7A60]'
              : 'bg-[#C89638] text-[#FAF8F1] hover:bg-[#B3832B]'
          }`}
        >
          {isSubmitting ? (
            <span>Recording Decision...</span>
          ) : isConfirmed ? (
            <span>✓ Decision Confirmed (Update)</span>
          ) : (
            <span>Confirm Decision →</span>
          )}
        </button>
      </div>
    </div>
  );
};
