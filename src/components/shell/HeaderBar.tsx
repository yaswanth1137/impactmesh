import React from 'react';
import { PixelIcon } from '../pixel/PixelIcon.tsx';

interface HeaderBarProps {
  systemOnline?: boolean;
  timestamp?: string;
  nodeId?: string;
  userRole?: string;
  userName?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  systemOnline = true,
  timestamp = '09 SEP 2026 // 21:13:42 UTC',
  nodeId = 'BLACKTIDE-01',
  userRole = 'CEO',
  userName = 'Devon Ross',
}) => {
  return (
    <header className="h-14 bg-[#FAF8F1] border-b border-[#DDD5C5] px-4 md:px-8 flex items-center justify-between gap-4 select-none z-30 shadow-xs">
      {/* Left: Brand Identity (Editorial & Clean) */}
      <div className="flex items-center gap-3.5">
        <div className="p-1.5 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs">
          <PixelIcon name="emblem-blacktide" size={20} />
        </div>
        <div className="leading-tight">
          <div className="font-mono text-[10px] text-[#C89638] font-bold tracking-widest uppercase">
            BLACKTIDE SYSTEMS
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-sans font-bold text-sm text-[#18201D] tracking-tight">
              IMPACTMESH
            </span>
            <span className="text-[10px] text-[#6F8F87] font-mono tracking-wider">
              // DECISION IMPACT INTELLIGENCE
            </span>
          </div>
        </div>
      </div>

      {/* Right: Telemetry & Status */}
      <div className="flex items-center gap-3 font-mono text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs text-[11px] font-sans text-[#18201D]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C89638]" />
          <span className="font-semibold text-[#18201D]">{userRole}</span>
          <span className="text-[#718894] hidden md:inline">• {userName}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#576560] border border-[#DDD5C5] px-2.5 py-1 bg-[#F3EFE5] rounded-xs">
          <span className="text-[#718894]">NODE:</span>
          <span className="text-[#18201D] font-bold">{nodeId}</span>
        </div>

        <div className="hidden sm:block text-[11px] text-[#576560]">
          {timestamp}
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-[10px] font-mono font-bold tracking-wide ${
            systemOnline
              ? 'bg-[#5B8D70]/10 border-[#5B8D70]/30 text-[#2D5A40]'
              : 'bg-[#C86150]/10 border-[#C86150]/30 text-[#8B2D20]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              systemOnline ? 'bg-[#5B8D70] animate-pulse' : 'bg-[#C86150]'
            }`}
          />
          {systemOnline ? 'SYSTEM ONLINE' : 'OFFLINE'}
        </div>
      </div>
    </header>
  );
};
