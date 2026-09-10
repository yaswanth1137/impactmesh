import React from 'react';
import { PixelIcon } from '../pixel/PixelIcon.tsx';

interface BearingIndicatorProps {
  currentBearing?: string;     // e.g. "314° NW"
  simulatedBearing?: string;   // e.g. "287° W"
  deltaAngle?: string;         // e.g. "-27°"
  isSimulating?: boolean;
  className?: string;
}

export const BearingIndicator: React.FC<BearingIndicatorProps> = ({
  currentBearing = '314° NW',
  simulatedBearing = '287° W',
  deltaAngle = '-27°',
  isSimulating = false,
  className = '',
}) => {
  return (
    <div
      className={`p-2.5 bg-[#101419] border border-[#2A333B] flex items-center justify-between gap-4 select-none font-mono ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <PixelIcon name="compass" size={16} color="#D6A84F" />
        <div>
          <span className="text-[9px] text-[#66727C] block uppercase tracking-wider">
            ORGANIZATIONAL BEARING
          </span>
          <span className="text-xs font-bold text-[#E8E4D8] tracking-tight">
            {isSimulating ? simulatedBearing : currentBearing}
          </span>
        </div>
      </div>

      {isSimulating && (
        <div className="flex items-center gap-3 text-right border-l border-[#2A333B] pl-3">
          <div>
            <span className="text-[9px] text-[#D05A4A] block uppercase">COURSE DEFLECTION</span>
            <span className="text-xs font-bold text-[#D05A4A]">{deltaAngle}</span>
          </div>
          <span className="text-[10px] text-[#A9ADA8]">
            BASE: {currentBearing}
          </span>
        </div>
      )}
    </div>
  );
};
