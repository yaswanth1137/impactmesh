import React, { useState } from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { PixelButton } from '../pixel/PixelButton.tsx';
import { PixelIcon } from '../pixel/PixelIcon.tsx';
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
  onToggleFullGraph,
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
      {/* 1. EXECUTIVE BANNER HEADER */}
      <div className="p-4 bg-[#101419] border-2 border-[#D6A84F] pixel-shadow flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PixelIcon name="helm" size={16} color="#D6A84F" />
            <span className="font-pixel text-[11px] text-[#D6A84F] uppercase tracking-wider">
              EXECUTIVE DECISION DESK // TODAY
            </span>
          </div>
          <h2 className="font-mono text-base md:text-lg font-bold text-[#E8E4D8] mt-1">
            {activeSignals.length > 0
              ? `${activeSignals.length} ITEM${activeSignals.length > 1 ? 'S' : ''} NEED YOUR ATTENTION`
              : 'ALL STATIONS NOMINAL // NO PENDING ITEMS'}
          </h2>
        </div>

        {/* Role Perspective Switcher */}
        <div className="flex items-center gap-1.5 bg-[#090B0F] p-1 border border-[#2A333B]">
          {(['ALL', 'CEO', 'CFO', 'COO'] as const).map((role) => (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              className={`px-2.5 py-1 text-[10px] font-pixel transition-colors ${
                activeRole === role
                  ? 'bg-[#D6A84F] text-[#090B0F] font-bold'
                  : 'text-[#A9ADA8] hover:text-[#E8E4D8] hover:bg-[#1A2128]'
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
          <div className="p-6 bg-[#101419] border border-[#2A333B] text-center font-mono text-xs text-[#AFCBC2]">
            ✓ No unhandled signals requiring executive attention. All operational metrics within tolerance.
          </div>
        ) : (
          activeSignals.map((signal) => {
            const isSelected = signal.id === reviewingSignalId;
            const isCritical = signal.severity === 'CRITICAL';

            return (
              <div
                key={signal.id}
                className={`p-4 border transition-all ${
                  isSelected
                    ? 'bg-[#182028] border-[#D6A84F] pixel-shadow-raised'
                    : isCritical
                    ? 'bg-[#141012] border-[#4A2024] hover:border-[#D05A4A]'
                    : 'bg-[#101419] border-[#2A333B] hover:border-[#3A4550]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <PixelBadge variant={isCritical ? 'danger' : 'warning'} size="sm">
                        {signal.priorityRank} // {signal.severity}
                      </PixelBadge>
                      <span className="font-mono text-[10px] text-[#66727C] uppercase tracking-wider">
                        SCOPE: {signal.scopeName} ({signal.scope})
                      </span>
                      {signal.state === 'REVIEWING' && (
                        <PixelBadge variant="seaFoam" size="sm">
                          UNDER REVIEW
                        </PixelBadge>
                      )}
                      {signal.state === 'ACKNOWLEDGED' && (
                        <PixelBadge variant="info" size="sm">
                          ACKNOWLEDGED
                        </PixelBadge>
                      )}
                    </div>

                    <h3 className="font-mono font-bold text-sm md:text-base text-[#E8E4D8]">
                      {signal.title.toUpperCase()}
                    </h3>

                    <p className="font-sans text-xs text-[#A9ADA8]">
                      {signal.summary}
                    </p>

                    {/* Quick Metric strip */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[#AFCBC2]">
                      {signal.evidence.affectedCapacityHours ? (
                        <span>
                          <strong className="text-[#E8E4D8]">Deficit:</strong> {signal.evidence.affectedCapacityHours}h
                        </span>
                      ) : null}
                      {signal.evidence.deliveryDelayDays ? (
                        <span>
                          <strong className="text-[#E8E4D8]">Delivery:</strong> +{signal.evidence.deliveryDelayDays} days
                        </span>
                      ) : null}
                      {signal.evidence.financialExposureINR ? (
                        <span>
                          <strong className="text-[#D6A84F]">Exposure:</strong> ₹{(signal.evidence.financialExposureINR / 100000).toFixed(1)}L
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <PixelButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenReview(signal.id)}
                    >
                      [ REVIEW ]
                    </PixelButton>
                    <PixelButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onAcknowledgeSignal(signal.id)}
                    >
                      [ ACK ]
                    </PixelButton>
                    <PixelButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismissSignal(signal.id)}
                    >
                      [ DISMISS ]
                    </PixelButton>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. SIGNAL REVIEW DRAWER / MODAL (Progressive Disclosure) */}
      {reviewingSignal && (
        <div className="p-5 bg-[#141A20] border-2 border-[#D6A84F] pixel-shadow-raised space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#2A333B] pb-3">
            <div>
              <span className="font-pixel text-[10px] text-[#D6A84F] uppercase tracking-wider block">
                HUMAN REVIEW // {reviewingSignal.scopeName}
              </span>
              <h3 className="font-mono font-bold text-base text-[#E8E4D8]">
                {reviewingSignal.title}
              </h3>
            </div>
            <button
              onClick={handleCloseReview}
              className="font-mono text-xs text-[#66727C] hover:text-[#E8E4D8] px-2 py-1"
            >
              [ ✕ CLOSE ]
            </button>
          </div>

          {/* Causal Chain: Why this matters */}
          <div className="space-y-2">
            <div className="font-pixel text-[10px] text-[#AFCBC2] uppercase">
              // WHY THIS MATTERS
            </div>
            <p className="font-sans text-xs text-[#E8E4D8] bg-[#0D131A] p-3 border border-[#2A333B] leading-relaxed">
              {reviewingSignal.evidence.explanation}
            </p>

            {/* Simplified Visual Causal Chain */}
            <div className="p-3 bg-[#090B0F] border border-[#2A333B]">
              <div className="text-[10px] font-mono text-[#66727C] mb-2 uppercase">
                CAUSAL PROGRESSION:
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#E8E4D8]">
                <span className="px-2 py-1 bg-[#1A2128] border border-[#2A333B] text-[#D6A84F]">
                  BUDGET CUT
                </span>
                <span className="text-[#66727C]">→</span>
                <span className="px-2 py-1 bg-[#1A2128] border border-[#2A333B]">
                  300h CAPACITY
                </span>
                <span className="text-[#66727C]">→</span>
                <span className="px-2 py-1 bg-[#1A2128] border border-[#D05A4A] text-[#D05A4A]">
                  120h DEFICIT
                </span>
                <span className="text-[#66727C]">→</span>
                <span className="px-2 py-1 bg-[#1A2128] border border-[#2A333B]">
                  +8d SLIPPAGE
                </span>
                <span className="text-[#66727C]">→</span>
                <span className="px-2 py-1 bg-[#1A2128] border border-[#D6A84F] text-[#D6A84F]">
                  ₹50L APEX GLOBAL
                </span>
              </div>
            </div>
          </div>

          {/* Missing Context Alert if applicable */}
          {reviewingSignal.evidence.missingContextFields && reviewingSignal.evidence.missingContextFields.length > 0 && (
            <div className="p-3 bg-[#1A1810] border border-[#D6A84F]/40 text-xs font-mono space-y-2">
              <div className="text-[#D6A84F] font-bold flex items-center gap-1.5">
                <span>⚠</span>
                <span>ADDITIONAL CONTEXT REQUESTED:</span>
              </div>
              <ul className="list-disc list-inside text-[#AFCBC2] text-[11px]">
                {reviewingSignal.evidence.missingContextFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Human Review Decision Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2A333B]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Request context (e.g. contractor rates)..."
                value={requestedContextField}
                onChange={(e) => setRequestedContextField(e.target.value)}
                className="bg-[#090B0F] border border-[#2A333B] text-xs font-mono px-3 py-1.5 text-[#E8E4D8] placeholder-[#55606A] focus:outline-none focus:border-[#D6A84F]"
              />
              <PixelButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (requestedContextField.trim()) {
                    onRequestContext(reviewingSignal.id, [requestedContextField.trim()]);
                    setRequestedContextField('');
                  }
                }}
              >
                [ REQUEST CONTEXT ]
              </PixelButton>
            </div>

            <div className="flex items-center gap-2">
              {onToggleFullGraph && (
                <PixelButton
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullGraph}
                >
                  [ VIEW FULL DEPENDENCY MAP ]
                </PixelButton>
              )}
              <PixelButton
                variant="primary"
                size="md"
                onClick={() => onConvertToDecision(reviewingSignal.id)}
                icon={<PixelIcon name="emblem-blacktide" size={14} />}
              >
                [ ANALYZE OPTIONS / CREATE DECISION ]
              </PixelButton>
            </div>
          </div>
        </div>
      )}

      {/* 4. RECENTLY RESOLVED SECTION */}
      <div className="p-3 bg-[#0D131A] border border-[#1C242C] text-xs font-mono space-y-2">
        <div className="text-[#66727C] font-pixel text-[9px] uppercase tracking-wider">
          // RECENTLY RESOLVED (AUDIT LOG)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-[#AFCBC2]">
            <span className="text-[#59A66A]">✓</span>
            <span>Customer commitment preserved (Apex Global scope phased)</span>
          </div>
          <div className="flex items-center gap-2 text-[#AFCBC2]">
            <span className="text-[#59A66A]">✓</span>
            <span>Capacity reallocated to 100% platform ceiling</span>
          </div>
        </div>
      </div>
    </div>
  );
};
