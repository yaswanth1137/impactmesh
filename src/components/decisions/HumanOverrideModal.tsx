import React, { useState } from 'react';
import { PixelIcon } from '../pixel/PixelIcon.tsx';

export interface OverrideOptionItem {
  id: string;
  title: string;
  description: string;
  score?: number;
  feasibility_score?: number;
  feasible?: boolean;
}

interface HumanOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: {
    id?: string;
    recommendationId?: string;
    top_option_id?: string;
    selectedOption?: { id: string; title: string; description: string; score: number };
  };
  options: OverrideOptionItem[];
  selectedOptionId: string;
  onConfirmChoice: (chosenOptionId: string, isOverride: boolean, overrideReason?: string) => void;
}

export const HumanOverrideModal: React.FC<HumanOverrideModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  options,
  selectedOptionId,
  onConfirmChoice,
}) => {
  const [chosenId, setChosenId] = useState(selectedOptionId);
  const [overrideReason, setOverrideReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const recommendedId = recommendation.top_option_id || recommendation.selectedOption?.id || options[0]?.id;
  const isOverride = chosenId !== recommendedId;
  const recommendedOpt = options.find((o) => o.id === recommendedId) || options[0];
  const currentChosenOpt = options.find((o) => o.id === chosenId) || recommendedOpt;

  const handleConfirm = () => {
    if (isOverride && !overrideReason.trim()) {
      setError('A human override requires a documented business rationale.');
      return;
    }
    setError('');
    onConfirmChoice(chosenId, isOverride, isOverride ? overrideReason.trim() : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18201D]/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="w-full max-w-xl bg-[#FAF8F1] border-2 border-[#C89638] rounded-xs shadow-xl p-5 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDD5C5] pb-3">
          <div className="flex items-center gap-2">
            <PixelIcon name="helm" size={16} color="#C89638" />
            <span className="font-mono text-xs text-[#C89638] font-bold uppercase tracking-widest">
              YOUR DECISION // HUMAN EXECUTIVE AUTHORITY
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-sans text-xs font-semibold text-[#576560] hover:text-[#18201D] px-2 py-1 cursor-pointer"
          >
            ✕ CANCEL
          </button>
        </div>

        {/* System Recommendation Banner */}
        <div className="p-3.5 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#718894] uppercase font-bold">
              SYSTEM RECOMMENDATION:
            </span>
            <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30 rounded-2xs uppercase">
              SCORE: {recommendedOpt?.score ?? recommendedOpt?.feasibility_score ?? 88}
            </span>
          </div>
          <div className="font-sans font-bold text-sm text-[#18201D]">
            {recommendedOpt?.title}
          </div>
          <p className="text-[#576560] text-xs font-sans">
            {recommendedOpt?.description}
          </p>
        </div>

        {/* Action Selection List */}
        <div className="space-y-2">
          <span className="font-sans text-xs font-bold text-[#18201D] block">
            CHOOSE YOUR ACTION:
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {options.map((opt) => {
              const isSelected = opt.id === chosenId;
              const isRecommended = opt.id === recommendedId;

              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    setChosenId(opt.id);
                    setError('');
                  }}
                  className={`p-3 border rounded-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FAF8F1] border-[#C89638] ring-1 ring-[#C89638]/40 shadow-xs'
                      : 'bg-[#FAF8F1] border-[#DDD5C5] hover:border-[#C89638]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-sans font-bold text-xs text-[#18201D]">
                      {opt.title}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isRecommended ? (
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30 rounded-2xs uppercase">
                          RECOMMENDED
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-[#DDD5C5] text-[#576560] rounded-2xs uppercase">
                          OVERRIDE
                        </span>
                      )}
                      <span className="font-mono text-xs font-semibold text-[#576560]">
                        {opt.score ?? opt.feasibility_score ?? 70}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#576560] font-sans mt-0.5">
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Override Justification Field (Mandatory if selecting non-recommended option) */}
        {isOverride && (
          <div className="p-3 bg-[#FAF8F1] border border-[#C89638] rounded-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold">
                MANDATORY HUMAN OVERRIDE REASON:
              </span>
              <span className="font-mono text-[9px] text-[#C86150] uppercase font-bold">REQUIRED</span>
            </div>
            <textarea
              value={overrideReason}
              onChange={(e) => {
                setOverrideReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Explain why this alternative course was selected over the system recommendation (e.g. Customer contract requires full scope)..."
              rows={2}
              className="w-full p-2 text-xs font-sans bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs text-[#18201D] placeholder:text-[#718894] focus:outline-none focus:border-[#C89638]"
            />
            {error && (
              <span className="font-sans text-xs text-[#C86150] font-semibold block">
                {error}
              </span>
            )}
          </div>
        )}

        {/* Confirmation & Dispatch Controls */}
        <div className="pt-2 border-t border-[#DDD5C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-sans text-xs text-[#576560]">
            Selected: <strong className="text-[#18201D]">{currentChosenOpt.title}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 font-sans text-xs text-[#576560] hover:text-[#18201D] cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 font-sans text-xs font-bold bg-[#C89638] hover:bg-[#B3832B] text-[#FAF8F1] rounded-xs transition-colors cursor-pointer shadow-2xs"
            >
              {isOverride ? 'CONFIRM OVERRIDE & PLOT EXECUTION →' : 'ACCEPT RECOMMENDATION & PLOT →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
