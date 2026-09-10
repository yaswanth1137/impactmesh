import React, { useState } from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import type { RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';
import { MobileChallengeIntake } from './MobileChallengeIntake.tsx';

import type { PixelBadgeVariant } from '../pixel/PixelBadge.tsx';

export type DeptRouteKey = 'finance' | 'sales' | 'commercial' | 'operations' | 'product';

export interface DeptRouteConfig {
  id: DeptRouteKey;
  label: string;
  name: string;
  station: string;
  role: string;
  badgeColor: PixelBadgeVariant;
}

export const DEPARTMENTS: DeptRouteConfig[] = [
  {
    id: 'finance',
    label: 'FIN',
    name: 'Finance',
    station: 'THE TREASURY',
    role: 'Purser',
    badgeColor: 'brass',
  },
  {
    id: 'sales',
    label: 'SALE',
    name: 'Sales',
    station: 'THE LOOKOUT',
    role: 'Lookout',
    badgeColor: 'seaFoam',
  },
  {
    id: 'commercial',
    label: 'COMM',
    name: 'Commercial',
    station: 'COMMERCIAL OPS',
    role: 'Operator',
    badgeColor: 'info',
  },
  {
    id: 'operations',
    label: 'OPER',
    name: 'Operations',
    station: 'THE ENGINE ROOM',
    role: 'Engineer',
    badgeColor: 'brass',
  },
  {
    id: 'product',
    label: 'PROD',
    name: 'Product',
    station: 'THE CHART ROOM',
    role: 'Navigator',
    badgeColor: 'seaFoam',
  },
];

interface MobileDepartmentSwitcherProps {
  currentDept: DeptRouteKey;
  connectionState?: RealtimeConnectionState;
  onNavigate?: (dept: DeptRouteKey) => void;
  className?: string;
}

export const MobileDepartmentSwitcher: React.FC<MobileDepartmentSwitcherProps> = ({
  currentDept,
  connectionState = 'CONNECTED',
  onNavigate,
  className = '',
}) => {
  const [showChallengeIntake, setShowChallengeIntake] = useState<boolean>(false);
  const currentConfig = DEPARTMENTS.find((d) => d.id === currentDept) || DEPARTMENTS[0];

  const handleSelect = (deptId: DeptRouteKey) => {
    if (onNavigate) {
      onNavigate(deptId);
    } else if (typeof window !== 'undefined') {
      const targetUrl = `/${deptId}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  return (
    <div className={`space-y-2.5 select-none ${className}`}>
      {/* 1. OPERATOR & STATION HEADER */}
      <div className="p-3 bg-[#101419] border border-[#2A333B] flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D6A84F] border border-[#141A20]" />
          <div>
            <div className="font-pixel text-[10px] text-[#D6A84F] tracking-wider uppercase leading-none">
              IMPACTMESH // OPERATOR WORKSPACE
            </div>
            <div className="text-[11px] font-mono text-[#E8E4D8] font-bold mt-1">
              {currentConfig.station} <span className="text-[#6C727A] font-normal">({currentConfig.role})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PixelBadge
            variant={connectionState === 'CONNECTED' ? 'seaFoam' : connectionState === 'CONNECTING' ? 'warning' : 'danger'}
            size="sm"
            pulse={connectionState === 'CONNECTED'}
          >
            {connectionState === 'CONNECTED' ? '● ONLINE' : connectionState === 'CONNECTING' ? '◐ SYNC' : '○ OFFLINE'}
          </PixelBadge>
        </div>
      </div>

      {/* 2. FIVE-DEPARTMENT QUICK SWITCHER TABS */}
      <div className="bg-[#141A20] border border-[#2A333B] p-1 grid grid-cols-5 gap-1 shadow-inner">
        {DEPARTMENTS.map((dept) => {
          const isActive = dept.id === currentDept;
          return (
            <button
              key={dept.id}
              onClick={() => handleSelect(dept.id)}
              className={`py-2 px-1 text-center font-pixel text-[9px] sm:text-[10px] uppercase cursor-pointer border transition-all ${
                isActive
                  ? 'bg-[#D6A84F] text-[#090B0F] border-[#D6A84F] font-bold shadow-md shadow-[#D6A84F]/20 scale-[1.02]'
                  : 'bg-[#090B0F] text-[#A9ADA8] border-[#1C242C] hover:text-[#E8E4D8] hover:border-[#2A333B]'
              }`}
            >
              <div className="font-bold">{dept.label}</div>
              <div className="text-[7px] truncate opacity-80 hidden xs:block">{dept.name}</div>
            </button>
          );
        })}
      </div>

      {/* 3. QUICK CHALLENGE / CHANGE BROADCAST BUTTON */}
      <div className="pt-1">
        <button
          onClick={() => setShowChallengeIntake((prev) => !prev)}
          className="w-full py-2 px-3 bg-[#1A222B] hover:bg-[#252F3B] border border-[#D6A84F]/60 text-[#D6A84F] font-pixel text-[11px] tracking-wider uppercase flex items-center justify-between shadow-sm cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[#F59E0B] font-mono text-sm">⚡</span>
            <span>REPORT NEW CHALLENGE / SITUATION</span>
          </div>
          <span className="font-mono text-xs text-[#A9ADA8]">
            {showChallengeIntake ? '▲ CLOSE' : '▼ OPEN INTAKE'}
          </span>
        </button>
      </div>

      {/* 4. EXPANDABLE CHALLENGE INTAKE CONSOLE */}
      {showChallengeIntake && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-2">
          <MobileChallengeIntake
            currentDept={currentDept}
            onSuccess={() => setShowChallengeIntake(false)}
            onClose={() => setShowChallengeIntake(false)}
          />
        </div>
      )}
    </div>
  );
};
