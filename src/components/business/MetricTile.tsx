import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';

export interface MetricTileProps {
  label: string;
  value: string;
  subValue?: string;
  indicator?: 'up' | 'down' | 'hazard' | 'stable';
  statusBadge?: string;
  statusVariant?: 'brass' | 'seaFoam' | 'danger' | 'warning' | 'info';
  coordinate?: string;
  progressPct?: number;
  highlight?: boolean;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  subValue,
  indicator,
  statusBadge,
  statusVariant = 'brass',
  coordinate,
  progressPct,
  highlight = false,
}) => {
  return (
    <div
      className={`relative p-3.5 bg-[#141A20] border pixel-shadow select-none transition-colors ${
        highlight
          ? 'border-[#D05A4A] bg-[#1A1416]'
          : 'border-[#2A333B] hover:border-[#475664]'
      }`}
    >
      {/* Corner crosshairs */}
      <div className="absolute -top-1 -left-1 w-1 h-1 bg-[#D6A84F]" />
      <div className="absolute -top-1 -right-1 w-1 h-1 bg-[#D6A84F]" />

      {/* Top row: Label & Coordinate / Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-pixel text-[10px] text-[#A9ADA8] uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1 h-1 bg-[#D6A84F]" />
          {label}
        </span>
        {statusBadge && (
          <PixelBadge variant={statusVariant} size="sm">
            {statusBadge}
          </PixelBadge>
        )}
        {coordinate && !statusBadge && (
          <span className="font-mono text-[9px] text-[#66727C]">{coordinate}</span>
        )}
      </div>

      {/* Value readout */}
      <div className="flex items-baseline justify-between mt-1">
        <div className="font-mono font-bold text-2xl md:text-3xl tracking-tight text-[#E8E4D8]">
          {value}
        </div>
        {indicator && (
          <span
            className={`font-mono text-xs font-semibold ${
              indicator === 'up'
                ? 'text-[#59A66A]'
                : indicator === 'down'
                ? 'text-[#D05A4A]'
                : indicator === 'hazard'
                ? 'text-[#D05A4A] animate-pulse'
                : 'text-[#AFCBC2]'
            }`}
          >
            {indicator === 'up' && '▲'}
            {indicator === 'down' && '▼'}
            {indicator === 'hazard' && '⚠'}
            {indicator === 'stable' && '◆'}
          </span>
        )}
      </div>

      {/* Progress / gauge indicator if provided */}
      {progressPct !== undefined && (
        <div className="w-full bg-[#101419] h-1.5 mt-2 border border-[#2A333B] overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progressPct > 100
                ? 'bg-[#D05A4A]'
                : progressPct > 75
                ? 'bg-[#D6A84F]'
                : 'bg-[#AFCBC2]'
            }`}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      )}

      {/* Subtitle / delta */}
      {subValue && (
        <div className="font-mono text-[10px] text-[#A9ADA8] mt-1.5 flex items-center justify-between">
          <span>{subValue}</span>
          {progressPct !== undefined && progressPct > 100 && (
            <span className="text-[#D05A4A] font-pixel text-[9px]">OVERLOAD</span>
          )}
        </div>
      )}
    </div>
  );
};
