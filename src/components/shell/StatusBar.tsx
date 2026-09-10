import React from 'react';
import { PixelStatusLight } from '../pixel/PixelStatusLight.tsx';

interface StatusBarProps {
  realtimeState?: string;
  activeEventCount?: number;
  healthScore?: number;
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  realtimeState = 'CONNECTED',
  activeEventCount = 4,
  healthScore = 64,
  className = '',
}) => {
  return (
    <footer
      className={`h-8 bg-[#FAF8F1] border-t border-[#DDD5C5] px-4 flex items-center justify-between font-mono text-[10px] text-[#576560] select-none ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <PixelStatusLight color={realtimeState === 'CONNECTED' ? 'green' : 'amber'} size="sm" pulse />
          <span className="text-[#718894]">EVENT MESH:</span>
          <span className="text-[#18201D] font-bold">{realtimeState}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 border-l border-[#DDD5C5] pl-4">
          <span className="text-[#718894]">INGESTED:</span>
          <span className="text-[#C89638] font-bold">{activeEventCount} EVENTS</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[#718894]">BUSINESS HEALTH:</span>
          <span className={`font-bold ${healthScore > 75 ? 'text-[#5B8D70]' : healthScore > 50 ? 'text-[#C89638]' : 'text-[#C86150]'}`}>
            {healthScore}%
          </span>
        </div>
        <div className="border-l border-[#DDD5C5] pl-4 text-[#718894]">
          <span>ORGANIZATION: BLACKTIDE SYSTEMS</span>
        </div>
      </div>
    </footer>
  );
};
