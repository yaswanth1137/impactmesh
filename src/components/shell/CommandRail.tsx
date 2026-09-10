import React from 'react';
import { PixelIcon, type PixelIconType } from '../pixel/PixelIcon.tsx';

export type NavRoute =
  | 'command'
  | 'sales'
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
    { id: 'command', label: 'COMMAND DECK', icon: 'helm', badge: 'LIVE' },
  ];

  const crewNav: NavItem[] = [
    { id: 'sales', label: 'SALES // LOOKOUT', icon: 'spyglass' },
    { id: 'product', label: 'PRODUCT // CHART', icon: 'compass' },
    { id: 'operations', label: 'OPERATIONS // ENG', icon: 'gear' },
    { id: 'finance', label: 'FINANCE // TREASURY', icon: 'ledger' },
  ];

  const toolsNav: NavItem[] = [
    { id: 'simulator', label: 'DEVICE SIMULATOR', icon: 'crosshair' },
  ];

  const executionNav: NavItem[] = [
    { id: 'flowtrace', label: 'FLOWTRACE', icon: 'route-marker', badge: 'ACTIVE' },
  ];

  const renderNavGroup = (items: NavItem[], groupHeader?: string) => (
    <div className="space-y-0.5">
      {groupHeader && (
        <div className="px-3 pt-2.5 pb-1 font-mono text-[9px] text-[#66727C] uppercase tracking-widest font-bold">
          // {groupHeader}
        </div>
      )}
      {items.map((item) => {
        const isActive = currentRoute === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-2.5 transition-colors border cursor-pointer select-none font-mono text-xs ${
              isActive
                ? 'bg-[#1A2128] border-[#D6A84F] text-[#E8E4D8]'
                : 'bg-transparent border-transparent text-[#A9ADA8] hover:bg-[#141A20] hover:text-[#E8E4D8]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <PixelIcon
                name={item.icon}
                size={13}
                color={isActive ? '#D6A84F' : '#66727C'}
              />
              <span className="truncate tracking-wide text-[11px]">
                {item.label}
              </span>
            </div>

            {item.badge && (
              <span
                className={`font-mono text-[8px] px-1 py-0.2 uppercase shrink-0 ${
                  isActive
                    ? 'bg-[#D6A84F] text-[#090B0F] font-bold'
                    : 'bg-[#1C242C] text-[#AFCBC2]'
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
      className={`w-60 bg-[#101419] border-r border-[#2A333B] flex flex-col justify-between select-none ${className}`}
    >
      <div className="p-2 space-y-2 overflow-y-auto">
        {renderNavGroup(primaryNav, 'BRIDGE CONSOLE')}
        <div className="border-t border-[#1C242C] my-1" />
        {renderNavGroup(crewNav, 'OPERATIONAL CREW')}
        <div className="border-t border-[#1C242C] my-1" />
        {renderNavGroup(toolsNav, 'TOOLS')}
        <div className="border-t border-[#1C242C] my-1" />
        {renderNavGroup(executionNav, 'EXECUTION LAYER')}
      </div>

      {/* Bottom Station Status */}
      <div className="p-3 border-t border-[#2A333B] bg-[#090B0F] text-[10px] font-mono text-[#66727C]">
        <div className="flex justify-between">
          <span>CONSOLE:</span>
          <span className="text-[#A9ADA8]">MAIN COMMAND DECK</span>
        </div>
        <div className="flex justify-between mt-0.5">
          <span>TRANSMISSION:</span>
          <span className="text-[#59A66A]">12ms (ONLINE)</span>
        </div>
      </div>
    </aside>
  );
};
