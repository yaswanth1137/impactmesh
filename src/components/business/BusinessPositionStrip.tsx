import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import type { RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';

export interface OperationalMetrics {
  productionCapacity: number; // e.g. 100, 70
  previousProductionCapacity?: number;
  capacityHours: number; // e.g. 420, 300
  inventoryUnits?: number; // e.g. 1240, 860
  previousInventoryUnits?: number;
  equipmentStatus?: string;
  inventoryLevel?: string;
  shipmentStatus?: string;
  operationsStatus?: string;
  deliveryDelayDays?: number;
  lastUpdatedEventId?: string;
  lastUpdatedTime?: string;
}

interface BusinessPositionStripProps {
  isSimulatingCascade?: boolean;
  className?: string;
  operationalMetrics?: OperationalMetrics;
  connectionState?: RealtimeConnectionState;
}

export const BusinessPositionStrip: React.FC<BusinessPositionStripProps> = ({
  isSimulatingCascade = true,
  className = '',
  operationalMetrics,
  connectionState = 'CONNECTED',
}) => {
  const prodCap = operationalMetrics?.productionCapacity ?? (isSimulatingCascade ? 70 : 100);
  const prevProdCap = operationalMetrics?.previousProductionCapacity ?? (prodCap === 70 ? 100 : 70);
  const capHours = operationalMetrics?.capacityHours ?? (isSimulatingCascade ? 300 : 420);
  const invUnits = operationalMetrics?.inventoryUnits ?? (isSimulatingCascade ? 860 : 1240);
  const prevInvUnits = operationalMetrics?.previousInventoryUnits ?? (invUnits === 860 ? 1240 : 860);

  return (
    <div
      className={`bg-[#141A20] border border-[#2A333B] shadow-sm select-none ${className}`}
    >
      {/* Tactical strip top bar */}
      <div className="px-3 py-1.5 bg-[#101419] border-b border-[#2A333B] flex items-center justify-between text-[10px] font-mono text-[#A9ADA8]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#D6A84F]" />
          <span className="font-pixel text-[10px] text-[#E8E4D8] uppercase tracking-wider">
            CEO COMMAND // ENTERPRISE TACTICAL GAUGES
          </span>
          {operationalMetrics?.lastUpdatedTime && (
            <span className="hidden sm:inline text-[9px] text-[#59A66A] bg-[#142017] px-1.5 py-0.5 border border-[#2A333B]">
              OPS SYNC: {operationalMetrics.lastUpdatedTime}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionState === 'CONNECTED'
                  ? 'bg-[#59A66A] animate-pulse'
                  : connectionState === 'CONNECTING'
                  ? 'bg-[#D6A84F] animate-ping'
                  : 'bg-[#D05A4A]'
              }`}
            />
            <span
              className={
                connectionState === 'CONNECTED'
                  ? 'text-[#59A66A]'
                  : connectionState === 'CONNECTING'
                  ? 'text-[#D6A84F]'
                  : 'text-[#D05A4A]'
              }
            >
              REALTIME: {connectionState}
            </span>
          </div>
          <PixelBadge variant={isSimulatingCascade ? 'danger' : 'seaFoam'} size="sm">
            {isSimulatingCascade ? 'CASCADE STRESS' : 'STABLE COURSE'}
          </PixelBadge>
        </div>
      </div>

      {/* Unified 4-Column Instrument Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#2A333B]">
        {/* 1. REVENUE (Commercial/Sales) */}
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

        {/* 3. OPERATIONS: CAPACITY & INVENTORY */}
        <div className="p-3" id="command-production-capacity">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#66727C] uppercase">
            <span>OPERATIONS // MOBILE SYNC</span>
            <span className={prodCap <= 70 || invUnits < 1000 ? 'text-[#D05A4A] font-bold' : 'text-[#59A66A]'}>
              {invUnits < 1000
                ? `▼ ${prevInvUnits} → ${invUnits}u`
                : prodCap < 100
                ? `▼ ${prevProdCap}% → ${prodCap}%`
                : '▲ 100% NOMINAL'}
            </span>
          </div>
          <div
            id="command-operations-value-display"
            className={`font-mono font-bold text-xl mt-1 ${
              prodCap <= 70 || invUnits < 1000 ? 'text-[#D05A4A]' : 'text-[#E8E4D8]'
            }`}
          >
            {invUnits} <span className="text-xs font-normal text-[#A9ADA8]">UNITS</span> ({prodCap}%)
          </div>
          <div className="text-[10px] text-[#A9ADA8] font-sans mt-0.5">
            {capHours}h cap // Status: {operationalMetrics?.shipmentStatus ?? 'On Track'}
          </div>
        </div>

        {/* 4. BUDGET (Finance) */}
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
