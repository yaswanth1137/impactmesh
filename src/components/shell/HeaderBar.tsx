import React from 'react';
import { PixelIcon } from '../pixel/PixelIcon.tsx';
import { PixelBadge } from '../pixel/PixelBadge.tsx';

interface HeaderBarProps {
  systemOnline?: boolean;
  timestamp?: string;
  nodeId?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  systemOnline = true,
  timestamp = '09 SEP 2026 // 21:13:42 UTC',
  nodeId = 'BLACKTIDE-01',
}) => {
  return (
    <header className="h-13 bg-[#101419] border-b border-[#2A333B] px-4 md:px-6 flex items-center justify-between gap-4 select-none z-30">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="p-1 bg-[#1A2128] border border-[#2A333B]">
          <PixelIcon name="emblem-blacktide" size={18} />
        </div>
        <div className="leading-tight">
          <div className="font-pixel text-[11px] text-[#D6A84F] tracking-widest uppercase">
            BLACKTIDE SYSTEMS
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono font-bold text-xs text-[#E8E4D8]">
              IMPACTMESH
            </span>
            <span className="text-[9px] text-[#66727C] font-mono tracking-wider">
              // DECISION IMPACT INTELLIGENCE
            </span>
          </div>
        </div>
      </div>

      {/* Right: Telemetry & Status */}
      <div className="flex items-center gap-3 font-mono text-xs">
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#66727C] border border-[#1C242C] px-2 py-0.5 bg-[#090B0F]">
          <span>NODE:</span>
          <span className="text-[#AFCBC2]">{nodeId}</span>
        </div>

        <div className="hidden sm:block text-[10px] text-[#A9ADA8]">
          {timestamp}
        </div>

        <PixelBadge variant={systemOnline ? 'seaFoam' : 'danger'} size="sm" pulse={systemOnline}>
          {systemOnline ? '● SYSTEM ONLINE' : 'OFFLINE'}
        </PixelBadge>
      </div>
    </header>
  );
};
