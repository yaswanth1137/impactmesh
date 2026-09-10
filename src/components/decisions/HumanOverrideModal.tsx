import React, { useState } from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { PixelButton } from '../pixel/PixelButton.tsx';
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
      setError('Human override requires a documented business rationale.');
      return;
    }
    setError('');
    onConfirmChoice(chosenId, isOverride, isOverride ? overrideReason.trim() : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in">
      <div className="w-full max-w-xl bg-[#101419] border-2 border-[#D6A84F] pixel-shadow-raised p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A333B] pb-3">
          <div className="flex items-center gap-2">
            <PixelIcon name="helm" size={16} color="#D6A84F" />
            <span className="font-pixel text-xs text-[#D6A84F] uppercase tracking-wider">
              HUMAN EXECUTIVE DECISION AUTHORITY
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs text-[#66727C] hover:text-[#E8E4D8] px-2 py-1"
          >
            [ ✕ CANCEL ]
          </button>
        </div>

        {/* System Recommendation vs Human Choice */}
        <div className="p-3 bg-[#0D131A] border border-[#2A333B] space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#66727C]">SYSTEM RECOMMENDATION:</span>
            <PixelBadge variant="brass" size="sm">
              SCORE: {recommendedOpt?.score ?? recommendedOpt?.feasibility_score ?? 88}
            </PixelBadge>
          </div>
          <div className="font-bold text-[#D6A84F] text-sm">
            {recommendedOpt?.title.toUpperCase()}
          </div>
          <p className="text-[#A9ADA8] text-[11px] font-sans">
            {recommendedOpt?.description}
          </p>
        </div>

        {/* Option Selector */}
        <div className="space-y-2 font-mono text-xs">
          <span className="text-[#AFCBC2] font-bold block">SELECT FINAL EXECUTIVE ACTION:</span>
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
                  className={`p-2.5 border cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1A2128] border-[#D6A84F] text-[#E8E4D8]'
                      : 'bg-[#090B0F] border-[#1C242C] text-[#A9ADA8] hover:border-[#2A333B]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{opt.title}</span>
                      {isRecommended && (
                        <span className="text-[9px] px-1 bg-[#231B0E] text-[#D6A84F] border border-[#D6A84F]">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#66727C] mt-0.5">
                      Score: {opt.score ?? opt.feasibility_score ?? 80} • {opt.feasible !== false ? 'Feasible' : 'Infeasible'}
                    </div>
                  </div>
                  <div className="font-pixel text-xs text-[#D6A84F]">
                    {isSelected ? '✓ SELECTED' : '[ SELECT ]'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Override Justification Field (Mandatory if overriding) */}
        {isOverride && (
          <div className="p-3 bg-[#1A1012] border border-[#D05A4A] space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#D05A4A] font-bold">
              <span>⚠</span>
              <span>HUMAN OVERRIDE ACTIVE</span>
            </div>
            <p className="text-[#AFCBC2] text-[11px] font-sans">
              You are overriding the system recommendation ({recommendedOpt?.title}) in favor of{' '}
              <strong className="text-[#E8E4D8]">{currentChosenOpt?.title}</strong>. Please state your business rationale for the audit record.
            </p>
            <textarea
              rows={2}
              value={overrideReason}
              onChange={(e) => {
                setOverrideReason(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              placeholder="e.g. Customer contract requires full feature scope; deferring timeline instead."
              className="w-full bg-[#090B0F] border border-[#2A333B] p-2 text-xs font-mono text-[#E8E4D8] placeholder-[#55606A] focus:outline-none focus:border-[#D05A4A]"
            />
            {error && <div className="text-[#D05A4A] text-[11px] font-bold">{error}</div>}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A333B]">
          <PixelButton variant="secondary" size="md" onClick={onClose}>
            [ CANCEL ]
          </PixelButton>
          <PixelButton
            variant={isOverride ? 'outline' : 'primary'}
            size="md"
            onClick={handleConfirm}
            icon={<PixelIcon name="emblem-blacktide" size={14} />}
          >
            {isOverride ? '[ CONFIRM OVERRIDE & PROCEED ]' : '[ APPROVE RECOMMENDATION ]'}
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
