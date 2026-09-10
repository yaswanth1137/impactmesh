import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { PixelIcon } from '../pixel/PixelIcon.tsx';
import type { DecisionEvent } from '../../types/events.ts';

interface LiveEventStreamProps {
  events: DecisionEvent[];
  isAnalyzing?: boolean;
  className?: string;
}

export const LiveEventStream: React.FC<LiveEventStreamProps> = ({
  events,
  isAnalyzing = false,
  className = '',
}) => {
  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'sales':
        return 'brass';
      case 'product':
        return 'info';
      case 'engineering':
        return 'warning';
      case 'finance':
        return 'seaFoam';
      default:
        return 'dark';
    }
  };

  return (
    <div className={`space-y-2 select-none ${className}`}>
      <div className="font-pixel text-xs text-[#E8E4D8] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-[#2A333B]">
        <span className="flex items-center gap-1.5">
          <PixelIcon name="signal-flag" size={13} color="#D6A84F" />
          LIVE EVENT STREAM // OPERATIONAL LOG
        </span>
        <span className="font-mono text-[9px] text-[#59A66A] flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-[#59A66A] animate-pulse" />
          LISTENING
        </span>
      </div>

      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
        {/* If analyzing cascade pulse is running */}
        {isAnalyzing && (
          <div className="p-2 bg-[#2B1214] border border-[#D05A4A] text-[#D05A4A] flex items-center justify-between text-xs font-mono animate-pulse">
            <div className="flex items-center gap-2">
              <PixelIcon name="flare-red" size={12} />
              <span className="font-bold">IMPACTMESH // ANALYZING CASCADE...</span>
            </div>
            <span className="text-[10px]">REALTIME</span>
          </div>
        )}

        {events.map((evt) => {
          const time = new Date(evt.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const isCritical =
            evt.event_type === 'budget_changed' || evt.event_type === 'capacity_changed';

          return (
            <div
              key={evt.id}
              className={`p-2 border text-xs font-mono transition-colors ${
                isCritical
                  ? 'bg-[#181214] border-[#D6A84F]/60'
                  : 'bg-[#101419] border-[#1C242C] hover:border-[#2A333B]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#66727C] text-[10px]">{time}</span>
                  <PixelBadge variant={getDeptColor(evt.department)} size="sm">
                    {evt.department}
                  </PixelBadge>
                  <span className="font-bold text-[#E8E4D8] uppercase">
                    {evt.event_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-[10px] text-[#A9ADA8]">{evt.created_by}</span>
              </div>

              {/* Event payload details if relevant */}
              <div className="mt-1 text-[11px] text-[#A9ADA8] font-sans pl-1 border-l-2 border-[#2A333B]">
                {evt.event_type === 'deal_created' && 'Enterprise expansion contract: ₹50.0L ARR target.'}
                {evt.event_type === 'feature_committed' && 'Sprint 24 commitment: 3 custom enterprise modules.'}
                {evt.event_type === 'capacity_changed' && 'Platform capacity deficit: 120h backlog deficit.'}
                {evt.event_type === 'budget_changed' && 'Q1 Capital reduced: ₹18.0L → ₹11.0L (-₹7.0L deficit).'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
