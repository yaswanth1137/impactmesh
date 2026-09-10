import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';

interface BusinessCoursePoint {
  time: string;
  health: number;
  capacityUtil: number;
  decisionLabel?: string;
  isHazard?: boolean;
}

const COURSE_HISTORY: BusinessCoursePoint[] = [
  { time: '20:00', health: 86, capacityUtil: 80 },
  { time: '20:30', health: 88, capacityUtil: 82 },
  { time: '21:04', health: 91, capacityUtil: 95, decisionLabel: '◆ DEAL ACCEPTED' },
  { time: '21:05', health: 88, capacityUtil: 110, decisionLabel: '◆ SCOPE COMMITTED' },
  { time: '21:07', health: 79, capacityUtil: 125 },
  { time: '21:08', health: 84, capacityUtil: 115 },
  { time: '21:13', health: 64, capacityUtil: 140, decisionLabel: '◆ BUDGET CUT (-₹7L)', isHazard: true },
];

export const BusinessCourse: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 bg-[#141A20] border border-[#2A333B] pixel-shadow select-none ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A333B] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#D6A84F] inline-block" />
          <span className="font-pixel text-xs text-[#E8E4D8] uppercase tracking-wider">
            BUSINESS COURSE // ORGANIZATIONAL HEALTH & CAPACITY TRAJECTORY
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[#AFCBC2] inline-block" />
            <span className="text-[#A9ADA8]">HEALTH (64)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[#D05A4A] inline-block" />
            <span className="text-[#D05A4A]">UTILIZATION (140%)</span>
          </div>
          <PixelBadge variant="danger" size="sm">
            COURSE DEFLECTION
          </PixelBadge>
        </div>
      </div>

      {/* SVG Chart Visualization */}
      <div className="relative w-full h-44 chart-grid-bg border border-[#1C242C] p-2">
        <svg viewBox="0 0 700 150" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="30" x2="700" y2="30" stroke="#1C242C" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="0" y1="75" x2="700" y2="75" stroke="#1C242C" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="0" y1="120" x2="700" y2="120" stroke="#1C242C" strokeWidth="1" strokeDasharray="3,3" />

          {/* Health Trajectory Line (Cyan/Sea Foam) */}
          <polyline
            fill="none"
            stroke="#AFCBC2"
            strokeWidth="2.5"
            points="20,40 120,36 240,30 360,35 460,55 560,45 660,95"
          />

          {/* Capacity Burn Line (Red) */}
          <polyline
            fill="none"
            stroke="#D05A4A"
            strokeWidth="2"
            strokeDasharray="4,2"
            points="20,110 120,105 240,90 360,70 460,50 560,65 660,25"
          />

          {/* Decision Waypoint Markers */}
          {COURSE_HISTORY.map((pt, idx) => {
            if (!pt.decisionLabel) return null;
            const x = idx === 2 ? 240 : idx === 3 ? 360 : 660;
            const y = idx === 6 ? 95 : 35;

            return (
              <g key={idx}>
                <line x1={x} y1="10" x2={x} y2="140" stroke="#475664" strokeWidth="1" strokeDasharray="2,2" />
                <rect
                  x={x - 4}
                  y={y - 4}
                  width="8"
                  height="8"
                  fill={pt.isHazard ? '#D05A4A' : '#D6A84F'}
                  className="rotate-45"
                />
                <rect
                  x={x - 55}
                  y={y > 80 ? y - 32 : y + 10}
                  width="110"
                  height="18"
                  fill="#101419"
                  stroke={pt.isHazard ? '#D05A4A' : '#D6A84F'}
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y > 80 ? y - 20 : y + 22}
                  textAnchor="middle"
                  fill={pt.isHazard ? '#D05A4A' : '#D6A84F'}
                  className="font-pixel text-[8px] uppercase tracking-wider"
                >
                  {pt.decisionLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
