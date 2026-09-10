import React from 'react';
import { PixelCharacter } from '../pixel/PixelCharacter.tsx';
import { PixelButton } from '../pixel/PixelButton.tsx';

interface CaptainLogProps {
  headline?: string;
  entry?: string;
  summary?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const CaptainLog: React.FC<CaptainLogProps> = ({
  headline = 'NEW DECISION REQUIRES REVIEW',
  entry = 'Finance reduced available capital allocation from ₹18.0L to ₹11.0L. The action immediately stresses platform engineering bandwidth and cascades into customer contract deadlines.',
  summary = '7 downstream effects detected across 4 operational tiers.',
  actionLabel = '[ REVIEW IMPACT ]',
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-4 bg-[#141A20] border border-[#2A333B] shadow-sm select-none ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#2A333B] pb-2 mb-3">
        <div className="flex items-center gap-2 font-pixel text-xs text-[#D6A84F] tracking-wider uppercase">
          <span className="w-1.5 h-1.5 bg-[#D6A84F]" />
          CAPTAIN'S LOG // DISPATCH 09-SEP
        </div>
        <span className="font-mono text-[10px] text-[#66727C]">LOGGED 21:13:42 UTC</span>
      </div>

      {/* Body with Portrait & Narrative */}
      <div className="flex items-start gap-3.5">
        <PixelCharacter role="captain" size={44} />

        <div className="flex-1 min-w-0">
          <h4 className="font-mono font-bold text-xs text-[#E8E4D8] uppercase tracking-wide">
            {headline}
          </h4>

          <p className="text-xs text-[#A9ADA8] font-sans mt-1.5 leading-relaxed">
            "{entry}"
          </p>

          <div className="mt-2.5 pt-2 border-t border-[#1C242C] flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-[#D6A84F] font-semibold">
              {summary}
            </span>

            {onAction && (
              <PixelButton variant="primary" size="sm" onClick={onAction}>
                {actionLabel}
              </PixelButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
