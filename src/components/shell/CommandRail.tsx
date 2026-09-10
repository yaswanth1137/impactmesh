import React from 'react';
import { PixelIcon, type PixelIconType } from '../pixel/PixelIcon.tsx';

export type NavRoute =
  | 'command'
  | 'sales'
  | 'commercial'
  | 'product'
  | 'operations'
  | 'finance'
  | 'flowtrace'
  | 'simulator';

interface CommandRailProps {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  className?: string;
}

interface NavItem {
  id: NavRoute;
  label: string;
  icon: PixelIconType;
  badge?: string;
}

export const CommandRail: React.FC<CommandRailProps> = ({
  currentRoute,
  onNavigate,
  className = '',
}) => {
  const primaryNav: NavItem[] = [
    { id: 'command', label: 'DECISION DESK', icon: 'helm', badge: 'LIVE' },
  ];

  const crewNav: NavItem[] = [
    { id: 'sales', label: 'SALES // LOOKOUT', icon: 'spyglass' },
    { id: 'commercial', label: 'COMMERCIAL // OPS', icon: 'coin' },
    { id: 'product', label: 'PRODUCT // NAVIGATOR', icon: 'compass' },
    { id: 'operations', label: 'OPERATIONS // ENGINEER', icon: 'gear' },
    { id: 'finance', label: 'FINANCE // PURSER', icon: 'ledger' },
  ];

  const toolsNav: NavItem[] = [
    { id: 'simulator', label: 'DEVICE SIMULATOR', icon: 'crosshair' },
  ];

  const executionNav: NavItem[] = [
    { id: 'flowtrace', label: 'FLOWTRACE', icon: 'route-marker', badge: 'READY' },
  ];

  const renderNavGroup = (items: NavItem[], groupHeader?: string) => (
    <div className="space-y-1">
      {groupHeader && (
        <div className="px-3 pt-3 pb-1 font-mono text-[9px] text-[#718894] uppercase tracking-widest font-bold">
          {groupHeader}
        </div>
      )}
      {items.map((item) => {
        const isActive = currentRoute === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2.5 transition-all border rounded-xs cursor-pointer select-none font-sans text-xs ${
              isActive
                ? 'bg-[#F3EFE5] border-[#C89638] text-[#18201D] font-semibold shadow-2xs'
                : 'bg-transparent border-transparent text-[#576560] hover:bg-[#F3EFE5]/70 hover:text-[#18201D]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PixelIcon
                name={item.icon}
                size={14}
                color={isActive ? '#C89638' : '#718894'}
              />
              <span className="truncate tracking-tight text-[12px]">
                {item.label}
              </span>
            </div>

            {item.badge && (
              <span
                className={`font-mono text-[8px] px-1.5 py-0.5 uppercase shrink-0 rounded-2xs font-bold ${
                  isActive
                    ? 'bg-[#C89638] text-[#FAF8F1]'
                    : 'bg-[#DDD5C5] text-[#576560]'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside
      className={`w-60 bg-[#FAF8F1] border-r border-[#DDD5C5] flex flex-col justify-between select-none shadow-xs ${className}`}
    >
      <div className="p-2.5 space-y-2.5 overflow-y-auto">
        {renderNavGroup(primaryNav, 'EXECUTIVE DESK')}
        <div className="border-t border-[#DDD5C5] my-1" />
        {renderNavGroup(crewNav, 'DEPARTMENTS')}
        <div className="border-t border-[#DDD5C5] my-1" />
        {renderNavGroup(toolsNav, 'TEST TOOLS')}
        <div className="border-t border-[#DDD5C5] my-1" />
        {renderNavGroup(executionNav, 'EXECUTION BRIDGE')}
      </div>

      {/* Bottom Station Status */}
      <div className="p-3 border-t border-[#DDD5C5] bg-[#F3EFE5] text-[10px] font-mono text-[#576560]">
        <div className="flex justify-between items-center">
          <span className="text-[#718894]">DESK VIEW:</span>
          <span className="text-[#18201D] font-bold">EXECUTIVE DESK</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[#718894]">MESH SYNC:</span>
          <span className="text-[#5B8D70] font-bold">12ms // VERIFIED</span>
        </div>
      </div>
    </aside>
  );
};
