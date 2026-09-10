import React from 'react';

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
    <div className={`p-5 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs select-none ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD5C5] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            HISTORICAL TIMELINE
          </span>
          <span className="text-[#718894]">/</span>
          <h3 className="font-sans font-bold text-base md:text-lg text-[#18201D] tracking-tight">
            ORGANIZATIONAL HEALTH & CAPACITY TRAJECTORY
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[#6F8F87] inline-block" />
            <span className="text-[#576560]">HEALTH (64%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[#C86150] inline-block" />
            <span className="text-[#C86150]">CAPACITY DEFICIT (140%)</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Visualization */}
      <div className="relative w-full h-44 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs p-2 chart-grid-bg">
        <svg viewBox="0 0 700 150" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="30" x2="700" y2="30" stroke="#DDD5C5" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="0" y1="75" x2="700" y2="75" stroke="#DDD5C5" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="0" y1="120" x2="700" y2="120" stroke="#DDD5C5" strokeWidth="1" strokeDasharray="3,3" />

          {/* Health Trajectory Line (Muted Sea) */}
          <polyline
            fill="none"
            stroke="#6F8F87"
            strokeWidth="2.5"
            points="20,40 120,36 240,30 360,35 460,55 560,45 660,95"
          />

          {/* Capacity Burn Line (Red) */}
          <polyline
            fill="none"
            stroke="#C86150"
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
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill={pt.isHazard ? '#C86150' : '#C89638'}
                  stroke="#FAF8F1"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fill={pt.isHazard ? '#C86150' : '#18201D'}
                  className="font-mono text-[9px] font-bold uppercase tracking-wider"
                >
                  {pt.decisionLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] font-sans text-[#576560] pt-2.5">
        <span>Timeline spans recent operational events leading to the current budget variance.</span>
        <span className="font-mono text-[10px]">LATEST STATE: HASH-3C4E64F7</span>
      </div>
    </div>
  );
};
