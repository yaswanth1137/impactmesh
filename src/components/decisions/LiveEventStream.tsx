import React from 'react';
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
  return (
    <div className={`p-4 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-3 select-none ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C5]">
        <div className="flex items-center gap-2">
          <PixelIcon name="signal-flag" size={14} color="#C89638" />
          <span className="font-mono text-xs text-[#18201D] font-bold uppercase tracking-wider">
            LIVE EVENT STREAM // RECENT BUSINESS ACTIVITY
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#2D5A40] flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 bg-[#5B8D70] rounded-full animate-pulse" />
          CONNECTED
        </span>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
        {isAnalyzing && (
          <div className="p-2.5 bg-[#C86150]/10 border border-[#C86150]/30 text-[#C86150] rounded-xs flex items-center justify-between text-xs font-mono animate-pulse">
            <div className="flex items-center gap-2">
              <span className="font-bold">IMPACTMESH // RECALCULATING IMPACT...</span>
            </div>
            <span className="text-[10px] font-bold">IN PROGRESS</span>
          </div>
        )}

        {events.map((evt) => {
          const time = new Date(evt.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div
              key={evt.id}
              className="p-2.5 bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs flex items-center justify-between gap-3 text-xs transition-colors hover:bg-[#FAF8F1]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-[10px] text-[#718894] shrink-0">
                  {time}
                </span>
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-[#DDD5C5] text-[#18201D] rounded-2xs uppercase shrink-0">
                  {evt.department}
                </span>
                <span className="font-sans font-medium text-[#18201D] truncate">
                  {evt.event_type.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              <span className="font-mono text-[9px] text-[#718894] shrink-0">
                {evt.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
