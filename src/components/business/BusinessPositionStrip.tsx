import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';

interface BusinessPositionStripProps {
  isSimulatingCascade?: boolean;
  className?: string;
}

export const BusinessPositionStrip: React.FC<BusinessPositionStripProps> = ({
  isSimulatingCascade = true,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#141A20] border border-[#2A333B] shadow-sm select-none ${className}`}
    >
      {/* Tactical strip top bar */}
      <div className="px-3 py-1.5 bg-[#101419] border-b border-[#2A333B] flex items-center justify-between text-[10px] font-mono text-[#A9ADA8]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#D6A84F]" />
          <span className="font-pixel text-[10px] text-[#E8E4D8] uppercase tracking-wider">
            BUSINESS POSITION // TACTICAL GAUGES
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[#66727C]">SECTORS 01–04 ACTIVE</span>
          <PixelBadge variant={isSimulatingCascade ? 'danger' : 'seaFoam'} size="sm">
            {isSimulatingCascade ? 'CASCADE STRESS' : 'STABLE COURSE'}
          </PixelBadge>
        </div>
      </div>

      {/* Unified 4-Column Instrument Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#2A333B]">
        {/* 1. REVENUE */}
        <div className="p-3">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#66727C] uppercase">
            <span>REVENUE PIPELINE</span>
            <span className="text-[#59A66A] font-bold">▲ +8.4%</span>
          </div>
          <div className="font-mono font-bold text-xl text-[#E8E4D8] mt-1">
            ₹50.0L
          </div>
          <div className="text-[10px] text-[#A9ADA8] font-sans mt-0.5">
            ARR Expansion Target
          </div>
        </div>

        {/* 2. RISK */}
        <div className="p-3">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#66727C] uppercase">
            <span>ORGANIZATIONAL RISK</span>
            <span className={isSimulatingCascade ? 'text-[#D05A4A] font-bold' : 'text-[#AFCBC2]'}>
              {isSimulatingCascade ? '0.82 CRITICAL' : '0.28 STABLE'}
            </span>
          </div>
          <div
            className={`font-mono font-bold text-xl mt-1 ${
              isSimulatingCascade ? 'text-[#D05A4A]' : 'text-[#E8E4D8]'
            }`}
          >
            {isSimulatingCascade ? 'HIGH' : 'LOW'}
          </div>
          <div className="text-[10px] text-[#A9ADA8] font-sans mt-0.5">
            {isSimulatingCascade ? 'Multi-hop cascade stress' : 'Risk threshold safe'}
          </div>
        </div>

        {/* 3. CAPACITY */}
        <div className="p-3">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#66727C] uppercase">
            <span>ENGINEERING LOAD</span>
            <span className={isSimulatingCascade ? 'text-[#D05A4A] font-bold' : 'text-[#59A66A]'}>
              {isSimulatingCascade ? '+120H DEFICIT' : 'HEALTHY BUFFER'}
            </span>
          </div>
          <div
            className={`font-mono font-bold text-xl mt-1 ${
              isSimulatingCascade ? 'text-[#D05A4A]' : 'text-[#E8E4D8]'
            }`}
          >
            {isSimulatingCascade ? '140%' : '80%'}
          </div>
          <div className="text-[10px] text-[#A9ADA8] font-sans mt-0.5">
            {isSimulatingCascade ? '300h cap / 420h required' : '400h team capacity'}
          </div>
        </div>

        {/* 4. BUDGET */}
        <div className="p-3">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#66727C] uppercase">
            <span>AVAILABLE CAPITAL</span>
            <span className={isSimulatingCascade ? 'text-[#D6A84F] font-bold' : 'text-[#AFCBC2]'}>
              {isSimulatingCascade ? '-39% CUT' : 'Q1 ALLOCATION'}
            </span>
          </div>
          <div className="font-mono font-bold text-xl text-[#E8E4D8] mt-1">
            {isSimulatingCascade ? '₹11.0L' : '₹18.0L'}
          </div>
          <div className="text-[10px] text-[#A9ADA8] font-sans mt-0.5">
            {isSimulatingCascade ? 'Committed: ₹8.7L (79% Pressure)' : 'Committed: ₹8.7L'}
          </div>
        </div>
      </div>
    </div>
  );
};
