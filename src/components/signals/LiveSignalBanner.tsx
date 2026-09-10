/**
 * IMPACTMESH - Live Business Signal Banner
 * High-visibility, prominent executive alert surface for live department updates.
 * Visually notifies the executive when a mobile department changes state and interprets
 * cross-functional consequences.
 */

import React from 'react';
import type { LiveBusinessSignal } from '../../lib/realtime/useLiveBusinessSignals.ts';
import { PixelCharacter } from '../pixel/PixelCharacter.tsx';

export interface LiveSignalBannerProps {
  signal: LiveBusinessSignal;
  isEmphasized?: boolean;
  onReview: (signal: LiveBusinessSignal) => void;
  onAcknowledge: (signalId: string) => void;
  onDismiss: (signalId: string) => void;
  className?: string;
}

export const LiveSignalBanner: React.FC<LiveSignalBannerProps> = ({
  signal,
  isEmphasized = false,
  onReview,
  onAcknowledge,
  onDismiss,
  className = '',
}) => {
  const isCritical = signal.severity === 'CRITICAL';

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Live Business Signal"
      className={`p-5 md:p-6 bg-[#18201D] text-[#FAF8F1] border-2 rounded-xs transition-all duration-300 transform select-none ${
        isEmphasized
          ? 'scale-[1.008] border-[#C89638] shadow-2xl ring-4 ring-[#C89638]/40 animate-in fade-in slide-in-from-top-3'
          : isCritical
          ? 'border-[#C86150] shadow-md ring-1 ring-[#C86150]/30'
          : 'border-[#C89638] shadow-md'
      } ${className}`}
    >
      {/* 1. Header Bar / Eyebrow */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27312E] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C89638] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C89638]" />
          </span>
          <span className="font-mono text-[10px] md:text-xs font-bold tracking-widest text-[#C89638] uppercase">
            LIVE BUSINESS SIGNAL
          </span>
          <span className="text-[#576560] hidden sm:inline">•</span>
          <span className="font-mono text-[10px] text-[#A0AFA9] uppercase hidden sm:inline">
            RECEIVED FROM {signal.sourceSystem}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#A0AFA9]">
            {signal.timestamp}
          </span>
          {signal.decisionRequired ? (
            <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-[#C86150]/20 text-[#F87171] border border-[#C86150]/40 rounded-2xs uppercase">
              DECISION REQUIRED
            </span>
          ) : (
            <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-[#C89638]/20 text-[#D6A84F] border border-[#C89638]/40 rounded-2xs uppercase">
              OPERATIONAL SIGNAL
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Department Icon & Change Summary */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0 p-1 bg-[#27312E] border border-[#3E4D48] rounded-xs">
              <PixelCharacter role={signal.sourceRole} size={36} />
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-wider block">
                {signal.sourceDepartmentLabel}
              </span>
              <h3 className="font-sans font-bold text-lg md:text-xl text-[#FAF8F1] tracking-tight mt-0.5">
                {signal.title}
              </h3>
            </div>
          </div>

          {/* Before & After Diff Box */}
          {signal.before && signal.after && (
            <div className="p-3 bg-[#202926] border border-[#2F3B37] rounded-xs flex flex-wrap items-center gap-4 text-xs font-sans">
              <div>
                <span className="text-[10px] font-mono text-[#718894] uppercase block">
                  CUSTOMER
                </span>
                <span className="font-bold text-[#FAF8F1] text-sm">
                  {signal.entityName}
                </span>
              </div>
              <div className="h-7 w-px bg-[#2F3B37] hidden sm:block" />
              <div>
                <span className="text-[10px] font-mono text-[#718894] uppercase block">
                  {signal.changeLabel.toUpperCase()}
                </span>
                <div className="flex items-center gap-2 mt-0.5 font-mono text-xs">
                  <span className="text-[#A0AFA9] line-through">{signal.before}</span>
                  <span className="text-[#C89638] font-bold">→</span>
                  <span className="text-[#FAF8F1] font-bold bg-[#C89638]/20 px-1.5 py-0.5 rounded-2xs border border-[#C89638]/30">
                    {signal.after}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Causal Interpretation (The Intelligence Layer) */}
          <div className="p-3.5 bg-[#121715] border-l-3 border-[#C89638] rounded-r-xs space-y-1">
            <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-[#C89638] block">
              {signal.consequenceTitle}
            </span>
            <p className="font-sans text-xs md:text-sm text-[#DDD5C5] leading-relaxed">
              {signal.consequenceDetail}
            </p>
          </div>

          {/* Affected Areas */}
          <div className="flex items-center gap-2 text-xs font-sans text-[#A0AFA9] pt-0.5">
            <span className="font-semibold text-[#DDD5C5]">Affects:</span>
            <span className="font-mono text-[11px] text-[#D6A84F]">
              {signal.affectedAreas.join(' · ')}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full gap-3 pt-2 lg:pt-0 lg:border-l lg:border-[#27312E] lg:pl-5">
          <div className="space-y-1 text-xs font-sans text-[#A0AFA9] hidden lg:block">
            <span className="font-mono text-[9px] text-[#C89638] uppercase font-bold block">
              ACTION REQUIRED:
            </span>
            <p className="leading-snug">
              Review downstream capacity and schedule implications before confirming changes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full mt-auto">
            <button
              onClick={() => onReview(signal)}
              className="w-full py-2.5 px-4 bg-[#C89638] hover:bg-[#B3832B] text-[#FAF8F1] font-sans font-bold text-xs tracking-wider uppercase rounded-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{signal.decisionRequired ? 'REVIEW DECISION' : 'REVIEW IMPACT'}</span>
              <span className="font-mono text-[10px]">→</span>
            </button>

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => onAcknowledge(signal.id)}
                className="flex-1 py-2 px-3 bg-[#202926] hover:bg-[#27312E] text-[#DDD5C5] hover:text-[#FAF8F1] border border-[#2F3B37] font-sans text-xs rounded-xs transition-colors cursor-pointer text-center"
              >
                Acknowledge
              </button>
              <button
                onClick={() => onDismiss(signal.id)}
                className="px-3 py-2 text-[#718894] hover:text-[#F87171] font-sans text-xs transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
