import React from 'react';
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
  const capHours = operationalMetrics?.capacityHours ?? (isSimulatingCascade ? 300 : 420);
  const invUnits = operationalMetrics?.inventoryUnits ?? (isSimulatingCascade ? 860 : 1240);

  return (
    <div
      className={`bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-2xs select-none ${className}`}
    >
      {/* Editorial strip top bar */}
      <div className="px-3.5 py-2 bg-[#F3EFE5] border-b border-[#DDD5C5] flex items-center justify-between text-[10px] font-mono text-[#576560]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C89638]" />
          <span className="font-mono text-[10px] text-[#18201D] font-bold uppercase tracking-wider">
            ORGANIZATIONAL POSITION // CORE OPERATING METRICS
          </span>
          {operationalMetrics?.lastUpdatedTime && (
            <span className="hidden sm:inline text-[9px] text-[#2D5A40] bg-[#5B8D70]/10 px-1.5 py-0.5 border border-[#5B8D70]/30 rounded-2xs">
              SYNC: {operationalMetrics.lastUpdatedTime}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionState === 'CONNECTED'
                  ? 'bg-[#5B8D70] animate-pulse'
                  : connectionState === 'CONNECTING'
                  ? 'bg-[#C89638] animate-ping'
                  : 'bg-[#C86150]'
              }`}
            />
            <span
              className={
                connectionState === 'CONNECTED'
                  ? 'text-[#2D5A40] font-semibold'
                  : connectionState === 'CONNECTING'
                  ? 'text-[#8B651B]'
                  : 'text-[#C86150]'
              }
            >
              REALTIME: {connectionState}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-2xs font-bold text-[9px] uppercase border ${
              isSimulatingCascade
                ? 'bg-[#C86150]/10 text-[#C86150] border-[#C86150]/30'
                : 'bg-[#5B8D70]/10 text-[#2D5A40] border-[#5B8D70]/30'
            }`}
          >
            {isSimulatingCascade ? 'CAPACITY DEFICIT' : 'STABLE POSITION'}
          </span>
        </div>
      </div>

      {/* 4-Column Business Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#DDD5C5]">
        {/* 1. REVENUE */}
        <div className="p-3.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#718894] uppercase">
            <span>REVENUE PIPELINE</span>
            <span className="text-[#5B8D70] font-bold">▲ +8.4%</span>
          </div>
          <div className="font-mono font-bold text-xl text-[#18201D] mt-1">
            ₹50.0L
          </div>
          <div className="text-[11px] text-[#576560] font-sans mt-0.5">
            ARR Expansion Target
          </div>
        </div>

        {/* 2. BUDGET ALLOCATION */}
        <div className="p-3.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#718894] uppercase">
            <span>AVAILABLE BUDGET</span>
            <span className="text-[#C86150] font-bold">▼ -38.8%</span>
          </div>
          <div className="font-mono font-bold text-xl text-[#C86150] mt-1">
            ₹11.0L
          </div>
          <div className="text-[11px] text-[#576560] font-sans mt-0.5">
            Reduced from ₹18.0L (-₹7.0L)
          </div>
        </div>

        {/* 3. ENGINEERING CAPACITY */}
        <div className="p-3.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#718894] uppercase">
            <span>PRODUCTION CAPACITY</span>
            <span className={prodCap <= 70 ? 'text-[#C86150] font-bold' : 'text-[#5B8D70] font-bold'}>
              {prodCap <= 70 ? '▼ 40% DEFICIT' : '▲ 100%'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`font-mono font-bold text-xl ${prodCap <= 70 ? 'text-[#C86150]' : 'text-[#18201D]'}`}>
              {capHours}h
            </span>
            <span className="font-mono text-xs text-[#718894]">/ 420h required</span>
          </div>
          <div className="text-[11px] text-[#576560] font-sans mt-0.5">
            {prodCap <= 70 ? `${420 - capHours}h capacity deficit` : 'Demand matches capacity'}
          </div>
        </div>

        {/* 4. INVENTORY & INTAKE */}
        <div className="p-3.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#718894] uppercase">
            <span>INVENTORY UNITS</span>
            <span className={invUnits < 1000 ? 'text-[#C86150] font-bold' : 'text-[#5B8D70] font-bold'}>
              {invUnits < 1000 ? '▼ -30.6%' : '▲ OPTIMAL'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`font-mono font-bold text-xl ${invUnits < 1000 ? 'text-[#C86150]' : 'text-[#18201D]'}`}>
              {invUnits}
            </span>
            <span className="font-mono text-xs text-[#718894]">units</span>
          </div>
          <div className="text-[11px] text-[#576560] font-sans mt-0.5">
            {invUnits < 1000 ? 'Low safety stock buffer' : '1,240 baseline units'}
          </div>
        </div>
      </div>
    </div>
  );
};
