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
      className={`h-8 bg-[#101419] border-t border-[#2A333B] px-4 flex items-center justify-between font-mono text-[10px] text-[#A9ADA8] select-none ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <PixelStatusLight color={realtimeState === 'CONNECTED' ? 'green' : 'amber'} size="sm" pulse />
          <span className="text-[#66727C]">POSTGRES REALTIME:</span>
          <span className="text-[#E8E4D8]">{realtimeState}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 border-l border-[#2A333B] pl-4">
          <span className="text-[#66727C]">INGESTED EVENTS:</span>
          <span className="text-[#D6A84F]">{activeEventCount} EVENTS</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[#66727C]">VESSEL HEALTH:</span>
          <span className={`font-bold ${healthScore > 75 ? 'text-[#59A66A]' : healthScore > 50 ? 'text-[#D6A84F]' : 'text-[#D05A4A]'}`}>
            {healthScore}%
          </span>
        </div>
        <div className="border-l border-[#2A333B] pl-4 text-[#66727C]">
          <span>SECTOR: BLACKTIDE-01</span>
        </div>
      </div>
    </footer>
  );
};
