import React, { useState, useEffect } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager } from '../../lib/realtime/subscription-manager.ts';

export const OperationsRoute: React.FC = () => {
  const [capacity, setCapacity] = useState(300);
  const [isTransmitting, setIsTransmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = realtimeSubscriptionManager.onEvent<'capacity_changed'>((event) => {
      if (event.payload) {
        setCapacity(event.payload.new_capacity_hours);
      }
    }, 'capacity_changed');

    return () => unsubscribe();
  }, []);

  const handleToggleCapacity = async () => {
    const nextCapacity = capacity === 300 ? 420 : 300;
    setCapacity(nextCapacity);
    setIsTransmitting(true);

    try {
      await publishDecisionEvent({
        organization_id: '00000000-0000-0000-0000-000000000000',
        department: 'engineering',
        event_type: 'capacity_changed',
        entity_id: 'CAP-DEV-TEAM',
        payload: {
          team_id: 'TEAM-BACKEND-CORE',
          previous_capacity_hours: capacity,
          new_capacity_hours: nextCapacity,
          effective_date: '2026-09-15',
        },
        created_by: 'engineer_ops_lead',
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12 max-w-4xl mx-auto select-none">
      {/* 1. Header with Character Identity */}
      <div className="p-4 bg-[#141A20] border border-[#2A333B] flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="engineer" size={48} showTitle />
        </div>

        <div className="text-right font-mono text-xs text-[#66727C]">
          <div>STATION: THE ENGINE ROOM</div>
          <div className="text-[#C5B58F]">DEVICE #3 // ACTIVE</div>
        </div>
      </div>

      {/* 2. Primary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#141A20] border border-[#2A333B] p-3 shadow-sm">
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">ENGINEERING LOAD</span>
          <span className="font-mono font-bold text-xl text-[#D05A4A]">
            {capacity === 300 ? '140% UTIL' : '100% BALANCED'}
          </span>
          <span className="text-[10px] text-[#D05A4A] font-sans block">
            {capacity === 300 ? '+120h Deficit' : 'Balanced Velocity'}
          </span>
        </div>
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">DELIVERY PRESSURE</span>
          <span className="font-mono font-bold text-xl text-[#D05A4A]">
            {capacity === 300 ? '+8 DAYS' : 'ON TRACK'}
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">SLA penalty clause</span>
        </div>
        <div className="p-2">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">PLATFORM STAFF</span>
          <span className="font-mono font-bold text-xl text-[#E8E4D8]">6 ENGINEERS</span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">1 Dev on emergency leave</span>
        </div>
      </div>

      {/* 3. Main Workspace: Capacity Telemetry */}
      <PixelPanel
        title="CORE PLATFORM POOL // VELOCITY & BOTTLENECK MONITOR"
        coordinate="ENGINE-03"
        badge={
          <PixelButton
            variant="outline"
            size="sm"
            disabled={isTransmitting}
            onClick={handleToggleCapacity}
          >
            {isTransmitting
              ? '[ TRANSMITTING VIA REALTIME... ]'
              : capacity === 300
              ? '[ OVERRIDE SURGE CAPACITY (+120h) ]'
              : '[ REPORT CAPACITY SHORTFALL (300h) ]'}
          </PixelButton>
        }
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-[#101419] border border-[#2A333B] flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-[#E8E4D8]">Core Backend Platform Team</span>
              <p className="text-[11px] text-[#A9ADA8] font-sans mt-0.5">
                Assigned to SAML SSO, Multi-Tenant Partitioning, and Cloud Pipeline.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[#D05A4A] font-bold text-sm">{capacity}h / 420h</span>
              <span className="text-[10px] text-[#66727C] block">
                {capacity === 300 ? 'DEFICIT: 120h' : 'DEFICIT: 0h'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#1A1214] border border-[#D05A4A] flex items-center justify-between gap-3 text-[#D05A4A]">
            <div className="flex items-center gap-2">
              <span className="font-bold">
                {capacity === 300 ? '⚠ BOTTLENECK DETECTED' : '✔ CAPACITY BALANCED'}
              </span>
            </div>
            <span className="font-bold">
              {capacity === 300 ? 'DELIVERY SLIPPAGE: +8 DAYS' : 'DELIVERY ON TIME'}
            </span>
          </div>
        </div>
      </PixelPanel>
    </div>
  );
};
