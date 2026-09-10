import React from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelIcon } from '../../components/pixel/PixelIcon.tsx';
import { PixelBadge } from '../../components/pixel/PixelBadge.tsx';
import type { NavRoute } from '../../components/shell/CommandRail.tsx';

interface SimulatorRouteProps {
  onSelectRoute: (route: NavRoute) => void;
}

export const SimulatorRoute: React.FC<SimulatorRouteProps> = ({ onSelectRoute }) => {
  const devices = [
    {
      id: 'command' as NavRoute,
      label: 'COMMAND DECK',
      role: 'CENTRAL LAPTOP (COMMAND CENTER)',
      icon: 'helm' as const,
      color: '#AFCBC2',
      description: 'Situational awareness, Impact Map, multi-tier cascade, and strategic reasoning.',
    },
    {
      id: 'sales' as NavRoute,
      label: 'SALES // THE LOOKOUT',
      role: 'DEVICE 1: MOBILE CLIENT #1',
      icon: 'spyglass' as const,
      color: '#D6A84F',
      description: 'Intake deals, accept customer commitments, manage commercial deadlines.',
    },
    {
      id: 'product' as NavRoute,
      label: 'PRODUCT // THE CHART ROOM',
      role: 'DEVICE 2: MOBILE CLIENT #2',
      icon: 'compass' as const,
      color: '#557A91',
      description: 'Feature commitments, roadmap scope allocation, critical path tracking.',
    },
    {
      id: 'operations' as NavRoute,
      label: 'OPERATIONS // THE ENGINE ROOM',
      role: 'DEVICE 3: MOBILE CLIENT #3',
      icon: 'gear' as const,
      color: '#C5B58F',
      description: 'Team capacity hours, machinery burn rate, delivery delays, contractor status.',
    },
    {
      id: 'finance' as NavRoute,
      label: 'FINANCE // THE TREASURY',
      role: 'DEVICE 4: MOBILE CLIENT #4',
      icon: 'ledger' as const,
      color: '#59A66A',
      description: 'Budget ceilings, spend freezes, cash runway, liquidity buffer modifications.',
    },
    {
      id: 'flowtrace' as NavRoute,
      label: 'FLOWTRACE EXECUTION',
      role: 'BRIDGE EXECUTION PROTOCOL',
      icon: 'route-marker' as const,
      color: '#D6A84F',
      description: 'Execution route plotting, cross-department waypoint coordination, signing authority.',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto select-none">
      <div className="p-4 bg-[#141A20] border border-[#2A333B]">
        <div className="flex items-center gap-3">
          <PixelIcon name="crosshair" size={20} color="#D6A84F" />
          <div>
            <span className="font-pixel text-xs text-[#D6A84F] uppercase tracking-wider">
              MULTI-DEVICE SIMULATOR // TOPOLOGY SWITCHER
            </span>
            <h2 className="font-mono font-bold text-base text-[#E8E4D8] mt-0.5">
              BLACKTIDE 5-STATION CLUSTER CONSOLE
            </h2>
          </div>
        </div>
        <p className="text-xs text-[#A9ADA8] font-sans mt-2">
          During hackathon demonstrations, use this simulator to operate the four department mobile devices and the main command center from a single display.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((dev) => (
          <PixelPanel
            key={dev.id}
            title={dev.label}
            badge={<PixelBadge variant="brass" size="sm">{dev.role.split(':')[0]}</PixelBadge>}
          >
            <div className="space-y-3">
              <p className="text-xs text-[#A9ADA8] font-sans">
                {dev.description}
              </p>

              <div className="pt-2 border-t border-[#2A333B] flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#66727C]">
                  TARGET ROUTE: /{dev.id}
                </span>
                <PixelButton
                  variant="primary"
                  size="sm"
                  onClick={() => onSelectRoute(dev.id)}
                  icon={<PixelIcon name={dev.icon} size={14} color="#090B0F" />}
                >
                  [ SWITCH TO STATION ]
                </PixelButton>
              </div>
            </div>
          </PixelPanel>
        ))}
      </div>
    </div>
  );
};
