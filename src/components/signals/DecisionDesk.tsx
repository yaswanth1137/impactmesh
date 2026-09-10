import React, { useState } from 'react';
import { PixelCharacter } from '../pixel/PixelCharacter.tsx';
import type { Signal } from '../../../server/engines/signal-engine/signal.interface.ts';

interface DecisionDeskProps {
  signals: Signal[];
  activeRole: 'ALL' | 'CEO' | 'CFO' | 'COO';
  onSelectRole: (role: 'ALL' | 'CEO' | 'CFO' | 'COO') => void;
  onReviewSignal: (signalId: string) => void;
  onAcknowledgeSignal: (signalId: string) => void;
  onDismissSignal: (signalId: string) => void;
  onRequestContext: (signalId: string, fields: string[]) => void;
  onConvertToDecision: (signalId: string) => void;
  onToggleFullGraph?: () => void;
  selectedSignalId?: string | null;
}

export const DecisionDesk: React.FC<DecisionDeskProps> = ({
  signals,
  activeRole,
  onSelectRole,
  onReviewSignal,
  onAcknowledgeSignal,
  onDismissSignal,
  onRequestContext,
  onConvertToDecision,
  selectedSignalId,
}) => {
  const [reviewingSignalId, setReviewingSignalId] = useState<string | null>(selectedSignalId || null);
  const [requestedContextField, setRequestedContextField] = useState('');

  const activeSignals = signals.filter(
    (s) => s.state === 'NEW' || s.state === 'REVIEWING' || s.state === 'ACKNOWLEDGED' || s.state === 'ESCALATED'
  );

  const reviewingSignal = signals.find((s) => s.id === (reviewingSignalId || selectedSignalId));

  const handleOpenReview = (id: string) => {
    setReviewingSignalId(id);
    onReviewSignal(id);
  };

  const handleCloseReview = () => {
    setReviewingSignalId(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. EXECUTIVE BANNER HEADER (Warm Paper & Editorial Asymmetry) */}
      <div className="p-4 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0 p-1.5 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs">
            <PixelCharacter role="captain" size={44} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#C89638] font-bold tracking-widest uppercase">
                BLACKTIDE SYSTEMS // DECISION DESK
              </span>
            </div>
            <h2 className="font-sans text-xl md:text-2xl font-bold text-[#18201D] tracking-tight mt-0.5">
              WHAT NEEDS YOUR ATTENTION?
            </h2>
            <p className="font-sans text-xs text-[#576560] mt-0.5">
              {activeSignals.length > 0
                ? `${activeSignals.length} business decision${activeSignals.length > 1 ? 's' : ''} require executive review today.`
                : 'All operational parameters within normal tolerance. No pending decisions.'}
            </p>
          </div>
        </div>

        {/* Role Perspective Selector */}
        <div className="flex items-center gap-1 bg-[#F3EFE5] p-1 border border-[#DDD5C5] rounded-xs shrink-0 self-start md:self-auto">
          <span className="font-mono text-[9px] text-[#718894] uppercase font-bold px-2">ROLE:</span>
          {(['ALL', 'CEO', 'CFO', 'COO'] as const).map((role) => (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              className={`px-3 py-1 text-xs font-sans font-semibold rounded-xs transition-colors cursor-pointer ${
                activeRole === role
                  ? 'bg-[#C89638] text-[#FAF8F1] shadow-2xs'
                  : 'text-[#576560] hover:text-[#18201D] hover:bg-[#FAF8F1]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ACTIVE SIGNALS LIST */}
      <div className="space-y-3">
        {activeSignals.length === 0 ? (
          <div className="p-8 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs text-center font-sans text-sm text-[#576560]">
            ✓ No unhandled signals requiring executive attention. All operational indicators nominal.
          </div>
        ) : (
          activeSignals.map((signal) => {
            const isSelected = signal.id === reviewingSignalId;
            const isCritical = signal.severity === 'CRITICAL';

            return (
              <div
                key={signal.id}
                className={`p-4 md:p-5 border rounded-xs transition-all ${
                  isSelected
                    ? 'bg-[#FAF8F1] border-[#C89638] shadow-sm ring-1 ring-[#C89638]/30'
                    : isCritical
                    ? 'bg-[#FAF8F1] border-[#C86150]/40 hover:border-[#C86150]'
                    : 'bg-[#FAF8F1] border-[#DDD5C5] hover:border-[#C89638]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-2xs uppercase border ${
                          isCritical
                            ? 'bg-[#C86150]/10 text-[#C86150] border-[#C86150]/30'
                            : 'bg-[#C89638]/10 text-[#8B651B] border-[#C89638]/30'
                        }`}
                      >
                        {signal.priorityRank} // {signal.severity}
                      </span>
                      <span className="font-mono text-[10px] text-[#718894] uppercase">
                        SCOPE: {signal.scopeName} ({signal.scope})
                      </span>
                      {signal.state === 'REVIEWING' && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#718894]/10 text-[#718894] border border-[#718894]/30 rounded-2xs uppercase">
                          UNDER REVIEW
                        </span>
                      )}
                      {signal.state === 'ACKNOWLEDGED' && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30 rounded-2xs uppercase">
                          ACKNOWLEDGED
                        </span>
                      )}
                    </div>

                    <h3 className="font-sans font-bold text-base md:text-lg text-[#18201D] tracking-tight">
                      {signal.title}
                    </h3>

                    <p className="font-sans text-xs md:text-sm text-[#576560] leading-relaxed max-w-3xl">
                      {signal.summary}
                    </p>

                    {/* Metric Fact Strip */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-[#576560]">
                      {signal.evidence.affectedCapacityHours ? (
                        <span>
                          <strong className="text-[#18201D]">Deficit:</strong> {signal.evidence.affectedCapacityHours}h
                        </span>
                      ) : null}
                      {signal.evidence.deliveryDelayDays ? (
                        <span>
                          <strong className="text-[#18201D]">Delivery Pressure:</strong> +{signal.evidence.deliveryDelayDays} days
                        </span>
                      ) : null}
                      {signal.evidence.financialExposureINR ? (
                        <span>
                          <strong className="text-[#C89638]">Customer Exposure:</strong> ₹{(signal.evidence.financialExposureINR / 100000).toFixed(1)}L
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Editorial Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenReview(signal.id)}
                      className="px-3.5 py-1.5 font-sans font-semibold text-xs bg-[#FAF8F1] border border-[#C89638] text-[#18201D] hover:bg-[#F3EFE5] rounded-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      REVIEW DECISION
                    </button>
                    <button
                      onClick={() => onAcknowledgeSignal(signal.id)}
                      className="px-2.5 py-1.5 font-sans text-xs bg-[#F3EFE5] border border-[#DDD5C5] text-[#576560] hover:text-[#18201D] hover:bg-[#FAF8F1] rounded-xs transition-colors cursor-pointer"
                    >
                      ACK
                    </button>
                    <button
                      onClick={() => onDismissSignal(signal.id)}
                      className="px-2.5 py-1.5 font-sans text-xs text-[#718894] hover:text-[#C86150] transition-colors cursor-pointer"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. SIGNAL REVIEW DRAWER (Editorial Progressive Disclosure) */}
      {reviewingSignal && (
        <div className="p-5 md:p-6 bg-[#FAF8F1] border-2 border-[#C89638] rounded-xs shadow-md space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#DDD5C5] pb-3">
            <div>
              <span className="font-mono text-[10px] text-[#C89638] uppercase tracking-widest font-bold block">
                HUMAN REVIEW // {reviewingSignal.scopeName}
              </span>
              <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight mt-0.5">
                {reviewingSignal.title}
              </h3>
            </div>
            <button
              onClick={handleCloseReview}
              className="font-sans text-xs font-semibold text-[#576560] hover:text-[#18201D] px-2.5 py-1 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs cursor-pointer"
            >
              ✕ CLOSE REVIEW
            </button>
          </div>

          {/* Plain Language Rationale: WHY THIS MATTERS */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] text-[#718894] uppercase font-bold tracking-wider">
              WHY THIS MATTERS
            </div>
            <p className="font-sans text-sm text-[#18201D] bg-[#F3EFE5] p-3.5 border border-[#DDD5C5] rounded-xs leading-relaxed">
              {reviewingSignal.evidence.explanation}
            </p>

            {/* Simple Causal Chain Summary */}
            <div className="p-3.5 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs">
              <div className="text-[10px] font-mono text-[#718894] mb-2 uppercase font-bold">
                CAUSAL PROPAGATION:
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#18201D]">
                <span className="px-2 py-1 bg-[#F3EFE5] border border-[#DDD5C5] rounded-2xs font-semibold">
                  1. {reviewingSignal.scopeName} Event
                </span>
                <span className="text-[#718894]">→</span>
                <span className="px-2 py-1 bg-[#F3EFE5] border border-[#DDD5C5] rounded-2xs font-semibold">
                  2. {reviewingSignal.evidence.affectedCapacityHours || 120}h Capacity Deficit
                </span>
                <span className="text-[#718894]">→</span>
                <span className="px-2 py-1 bg-[#F3EFE5] border border-[#DDD5C5] rounded-2xs font-semibold">
                  3. +{reviewingSignal.evidence.deliveryDelayDays || 8} Days Delivery Slip
                </span>
                <span className="text-[#718894]">→</span>
                <span className="px-2 py-1 bg-[#C89638]/10 text-[#8B651B] border border-[#C89638]/30 rounded-2xs font-bold">
                  4. ₹{((reviewingSignal.evidence.financialExposureINR || 5000000) / 100000).toFixed(1)}L Revenue Risk
                </span>
              </div>
            </div>
          </div>

          {/* Missing Context Request Form */}
          {reviewingSignal.evidence.missingContextFields && reviewingSignal.evidence.missingContextFields.length > 0 && (
            <div className="p-3 bg-[#FAF8F1] border border-[#C89638]/40 rounded-xs space-y-1 text-xs">
              <div className="font-mono text-[9px] text-[#C89638] uppercase font-bold">
                MISSING CONTEXT REQUESTED:
              </div>
              <div className="font-sans text-[#576560]">
                {reviewingSignal.evidence.missingContextFields.join(', ')}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 border-t border-[#DDD5C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Request missing field (e.g. Contractor availability)..."
                value={requestedContextField}
                onChange={(e) => setRequestedContextField(e.target.value)}
                className="px-3 py-1.5 text-xs font-sans bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs text-[#18201D] placeholder:text-[#718894] w-64"
              />
              <button
                onClick={() => {
                  if (requestedContextField.trim()) {
                    onRequestContext(reviewingSignal.id, [requestedContextField.trim()]);
                    setRequestedContextField('');
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-sans font-semibold bg-[#F3EFE5] border border-[#DDD5C5] text-[#18201D] hover:bg-[#FAF8F1] rounded-xs cursor-pointer transition-colors"
              >
                REQUEST CONTEXT
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onDismissSignal(reviewingSignal.id)}
                className="px-3 py-1.5 text-xs font-sans text-[#576560] hover:text-[#C86150] cursor-pointer"
              >
                DISMISS
              </button>
              <button
                onClick={() => onConvertToDecision(reviewingSignal.id)}
                className="px-4 py-2 font-sans text-xs font-bold bg-[#C89638] text-[#FAF8F1] hover:bg-[#B3832B] rounded-xs transition-colors cursor-pointer shadow-2xs"
              >
                CONVERT TO DECISION →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
