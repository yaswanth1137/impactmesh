import React, { useState } from 'react';
import { PixelCharacter } from '../pixel/PixelCharacter.tsx';
import type { Signal } from '../../../server/engines/signal-engine/signal.interface.ts';

interface DecisionDeskProps {
  signals: Signal[];
  activeRole?: 'ALL' | 'CEO' | 'CFO' | 'COO';
  onSelectRole?: (role: 'ALL' | 'CEO' | 'CFO' | 'COO') => void;
  onReviewSignal: (signalId: string) => void;
  onAcknowledgeSignal: (signalId: string) => void;
  onDismissSignal: (signalId: string) => void;
  onRequestContext?: (signalId: string, fields: string[]) => void;
  onConvertToDecision?: (signalId: string) => void;
  onToggleFullGraph?: () => void;
  selectedSignalId?: string | null;
}

export const DecisionDesk: React.FC<DecisionDeskProps> = ({
  signals,
  onReviewSignal,
  onAcknowledgeSignal,
  onDismissSignal,
  onRequestContext,
  onConvertToDecision,
  selectedSignalId,
}) => {
  const [reviewingSignalId, setReviewingSignalId] = useState<string | null>(selectedSignalId || null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [requestedContextField, setRequestedContextField] = useState('');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  // Active attention queue: by default shows NEW and REVIEWING signals
  const activeSignals = signals.filter((s) => {
    if (showAcknowledged) {
      return s.state === 'NEW' || s.state === 'REVIEWING' || s.state === 'ACKNOWLEDGED';
    }
    return s.state === 'NEW' || s.state === 'REVIEWING';
  });

  const acknowledgedCount = signals.filter((s) => s.state === 'ACKNOWLEDGED').length;
  const reviewingSignal = signals.find((s) => s.id === (reviewingSignalId || selectedSignalId));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const handleOpenReview = (id: string) => {
    setReviewingSignalId(id);
    onReviewSignal(id);
    // Smooth scroll to the causal and impact sections
    const impactSec = document.getElementById('decision-story-section') || document.getElementById('impact-map-section');
    if (impactSec) {
      impactSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAcknowledge = (id: string) => {
    onAcknowledgeSignal(id);
    showToast('Signal acknowledged. Moved to background tracking.');
  };

  const handleDismiss = (id: string) => {
    onDismissSignal(id);
    showToast('Signal dismissed.');
    if (reviewingSignalId === id) {
      setReviewingSignalId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#18201D] text-[#FAF8F1] border border-[#C89638] px-4 py-2.5 rounded-xs shadow-lg font-sans text-xs animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-[#5B8D70]" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[#DDD5C5] hover:text-[#FAF8F1] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER: Clean Executive Banner (No prominent hero role switcher) */}
      <div className="p-5 md:p-6 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              What needs your attention?
            </h2>
            <p className="font-sans text-xs text-[#576560] mt-0.5">
              {activeSignals.length > 0
                ? `${activeSignals.length} decision${activeSignals.length > 1 ? 's' : ''} require review.`
                : 'Nothing requires attention right now. All commitments are within normal tolerances.'}
            </p>
          </div>
        </div>

        {/* Quiet toggle to view acknowledged signals */}
        {acknowledgedCount > 0 && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowAcknowledged((prev) => !prev)}
              className="text-[11px] font-sans px-2.5 py-1 bg-[#F3EFE5] hover:bg-[#FAF8F1] border border-[#DDD5C5] text-[#576560] rounded-xs cursor-pointer transition-colors"
            >
              {showAcknowledged ? 'Hide Acknowledged' : `Show Acknowledged (${acknowledgedCount})`}
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1 — IMPORTANT SIGNALS */}
      <div className="space-y-3">
        {activeSignals.length === 0 ? (
          <div className="p-8 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs text-center font-sans space-y-1">
            <div className="text-sm font-semibold text-[#18201D]">
              Nothing requires attention right now.
            </div>
            <p className="text-xs text-[#576560]">
              No active deviations, capacity bottlenecks, or exposed customer commitments detected.
            </p>
          </div>
        ) : (
          activeSignals.map((signal) => {
            const isSelected = signal.id === (reviewingSignalId || selectedSignalId);
            const isCritical = signal.severity === 'CRITICAL';
            const isAcknowledged = signal.state === 'ACKNOWLEDGED';

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
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Badge line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-2xs uppercase border ${
                          isCritical
                            ? 'bg-[#C86150]/10 text-[#C86150] border-[#C86150]/30'
                            : 'bg-[#C89638]/10 text-[#8B651B] border-[#C89638]/30'
                        }`}
                      >
                        {signal.severity} PRIORITY
                      </span>
                      <span className="font-mono text-[10px] text-[#718894] uppercase">
                        {signal.scopeName} ({signal.scope})
                      </span>
                      {isAcknowledged && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30 rounded-2xs uppercase">
                          ACKNOWLEDGED
                        </span>
                      )}
                      {signal.state === 'REVIEWING' && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#718894]/10 text-[#718894] border border-[#718894]/30 rounded-2xs uppercase">
                          IN REVIEW
                        </span>
                      )}
                    </div>

                    {/* Clean Title */}
                    <h3 className="font-sans font-bold text-base md:text-lg text-[#18201D] tracking-tight">
                      {signal.title}
                    </h3>

                    {/* 1-Line Explanation */}
                    <p className="font-sans text-xs md:text-sm text-[#576560] leading-relaxed max-w-3xl">
                      {signal.summary}
                    </p>

                    {/* Small Facts Row */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-[#576560]">
                      {signal.evidence.affectedCapacityHours ? (
                        <span>
                          <strong className="text-[#18201D]">Demand:</strong> 420h
                          <span className="text-[#718894] mx-1">/</span>
                          <strong className="text-[#18201D]">Capacity:</strong> 300h
                          <span className="text-[#C86150] font-bold ml-1">
                            (-{signal.evidence.affectedCapacityHours}h deficit)
                          </span>
                        </span>
                      ) : null}
                      {signal.evidence.deliveryDelayDays ? (
                        <span>
                          <strong className="text-[#18201D]">Delay risk:</strong> +{signal.evidence.deliveryDelayDays} days
                        </span>
                      ) : null}
                      {signal.evidence.financialExposureINR ? (
                        <span>
                          <strong className="text-[#C89638]">Contract value:</strong> ₹{(signal.evidence.financialExposureINR / 100000).toFixed(1)}L
                        </span>
                      ) : null}
                    </div>

                    {/* Affected Areas */}
                    <div className="pt-1 text-[11px] font-sans text-[#718894]">
                      <span className="font-semibold text-[#576560]">Impact:</span> Customer commitments · Product delivery · Engineering workload
                    </div>
                  </div>

                  {/* Actions: REVIEW / ACKNOWLEDGE / DISMISS */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <button
                      onClick={() => handleOpenReview(signal.id)}
                      className="px-4 py-2 font-sans font-semibold text-xs bg-[#FAF8F1] border border-[#C89638] text-[#18201D] hover:bg-[#F3EFE5] rounded-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <span>REVIEW</span>
                      <span className="font-mono text-[10px]">→</span>
                    </button>
                    {!isAcknowledged && (
                      <button
                        onClick={() => handleAcknowledge(signal.id)}
                        className="px-3 py-2 font-sans text-xs bg-[#F3EFE5] border border-[#DDD5C5] text-[#576560] hover:text-[#18201D] hover:bg-[#FAF8F1] rounded-xs transition-colors cursor-pointer"
                        title="Acknowledge signal and monitor"
                      >
                        ACKNOWLEDGE
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(signal.id)}
                      className="px-2.5 py-2 font-sans text-xs text-[#718894] hover:text-[#C86150] transition-colors cursor-pointer"
                      title="Dismiss this signal"
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

      {/* Signal Context Review Panel */}
      {reviewingSignal && (
        <div className="p-5 md:p-6 bg-[#FAF8F1] border-2 border-[#C89638] rounded-xs shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#DDD5C5] pb-3">
            <div>
              <span className="font-mono text-[10px] text-[#C89638] uppercase tracking-widest font-bold block">
                SIGNAL REVIEW // {reviewingSignal.scopeName}
              </span>
              <h3 className="font-sans font-bold text-lg text-[#18201D] tracking-tight mt-0.5">
                {reviewingSignal.title}
              </h3>
            </div>
            <button
              onClick={() => setReviewingSignalId(null)}
              className="font-sans text-xs font-semibold text-[#576560] hover:text-[#18201D] px-2.5 py-1 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-[10px] text-[#718894] uppercase font-bold tracking-wider">
              WHY THIS MATTERS
            </div>
            <p className="font-sans text-sm text-[#18201D] bg-[#F3EFE5] p-3.5 border border-[#DDD5C5] rounded-xs leading-relaxed">
              {reviewingSignal.evidence.explanation}
            </p>
          </div>

          {/* Missing context fields if requested */}
          {reviewingSignal.evidence.missingContextFields && reviewingSignal.evidence.missingContextFields.length > 0 && (
            <div className="p-3 bg-[#FAF8F1] border border-[#C89638]/40 rounded-xs space-y-1 text-xs">
              <div className="font-mono text-[9px] text-[#C89638] uppercase font-bold">
                Requested Context:
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
                placeholder="Request context field (e.g. Contractor availability)..."
                value={requestedContextField}
                onChange={(e) => setRequestedContextField(e.target.value)}
                className="px-3 py-1.5 text-xs font-sans bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs text-[#18201D] placeholder:text-[#718894] w-64"
              />
              <button
                onClick={() => {
                  if (requestedContextField.trim() && onRequestContext) {
                    onRequestContext(reviewingSignal.id, [requestedContextField.trim()]);
                    setRequestedContextField('');
                    showToast('Context request logged.');
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-sans font-semibold bg-[#F3EFE5] border border-[#DDD5C5] text-[#18201D] hover:bg-[#FAF8F1] rounded-xs cursor-pointer transition-colors"
              >
                Request Context
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDismiss(reviewingSignal.id)}
                className="px-3 py-1.5 text-xs font-sans text-[#576560] hover:text-[#C86150] cursor-pointer"
              >
                Dismiss
              </button>
              {onConvertToDecision && (
                <button
                  onClick={() => {
                    onConvertToDecision(reviewingSignal.id);
                    showToast('Converted to active decision in review.');
                  }}
                  className="px-4 py-2 font-sans text-xs font-bold bg-[#C89638] text-[#FAF8F1] hover:bg-[#B3832B] rounded-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Convert to Decision →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
