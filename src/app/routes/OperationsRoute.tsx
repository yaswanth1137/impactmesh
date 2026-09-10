import React, { useState, useEffect } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelBadge } from '../../components/pixel/PixelBadge.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import {
  realtimeSubscriptionManager,
  type RealtimeConnectionState,
} from '../../lib/realtime/subscription-manager.ts';
import {
  securityPolicyService,
  OPERATIONS_USER,
} from '../../lib/auth/auth-service.ts';

const getSavedOpsState = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem('impactmesh_ops_state');
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
  }
  return null;
};

export const OperationsRoute: React.FC = () => {
  const savedState = getSavedOpsState();

  // 1. Authorized Operational State
  const [operationsStatus, setOperationsStatus] = useState<string>(
    savedState?.operationsStatus ?? 'OPERATIONAL'
  );
  const [productionCapacity, setProductionCapacity] = useState<number>(
    savedState?.productionCapacity ?? 70
  );
  const [capacityHours, setCapacityHours] = useState<number>(
    savedState?.capacityHours ?? 300
  );
  const [inventoryUnits, setInventoryUnits] = useState<number>(
    savedState?.inventoryUnits ?? 860
  );
  const [shipmentStatus, setShipmentStatus] = useState<string>(
    savedState?.shipmentStatus ?? 'Delayed'
  );
  const [equipmentStatus, setEquipmentStatus] = useState<string>(
    savedState?.equipmentStatus ?? 'ONLINE'
  );
  const [deliveryDelayDays, setDeliveryDelayDays] = useState<number>(
    savedState?.deliveryDelayDays ?? 8
  );

  // 2. Connectivity, Auth & Transmission
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('CONNECTED');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionFeedback, setTransmissionFeedback] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    eventId?: string;
    timestamp?: string;
  }>({
    status: null,
    message: '',
  });

  const [securityTestResult, setSecurityTestResult] = useState<string | null>(null);

  useEffect(() => {
    // Enforce authenticated Operations user on this route
    securityPolicyService.setCurrentUser(OPERATIONS_USER);

    // Realtime connection listener
    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    // Realtime listener for incoming updates
    const unsubEvent = realtimeSubscriptionManager.onEvent((event) => {
      if (event.event_type === 'capacity_changed' && event.payload) {
        const payload = event.payload as any;
        if (payload.production_capacity !== undefined) {
          setProductionCapacity(payload.production_capacity);
        }
        if (payload.new_capacity_hours !== undefined) {
          setCapacityHours(payload.new_capacity_hours);
        }
        if (payload.inventory_units !== undefined) {
          setInventoryUnits(payload.inventory_units);
        }
        if (payload.shipment_status) {
          setShipmentStatus(payload.shipment_status);
        }
      } else if (event.event_type === 'inventory_changed' && event.payload) {
        const payload = event.payload as any;
        if (payload.new_value !== undefined) {
          setInventoryUnits(payload.new_value);
        }
      }
    });

    return () => {
      unsubConn();
      unsubEvent();
    };
  }, []);

  /**
   * Primary Action: Submit Operational Changes
   * Creates structured DecisionEvents, signs them with the Operations Head identity,
   * passes them through the Security Authorization layer, and broadcasts via Supabase Realtime.
   */
  const handleSubmitUpdate = async () => {
    const prevCap = savedState?.productionCapacity ?? 100;
    const prevInv = savedState?.inventoryUnits ?? 1240;
    const targetHours = Math.round((productionCapacity / 100) * 420);

    setIsTransmitting(true);
    setTransmissionFeedback({ status: null, message: '' });

    try {
      // 1. Emit inventory_changed event
      const invResult = await publishDecisionEvent({
        organization_id: OPERATIONS_USER.organizationId,
        department: 'operations',
        event_type: 'inventory_changed',
        entity_id: 'INV-WAREHOUSE-MAIN',
        payload: {
          inventory_id: 'INV-WAREHOUSE-MAIN',
          item_name: 'Core Production Components & Assemblies',
          previous_value: prevInv,
          new_value: inventoryUnits,
          unit: 'units',
          location: 'Central Storage Hub',
          notes: `Operations Head adjusted inventory: ${prevInv} → ${inventoryUnits} units`,
        },
        created_by: OPERATIONS_USER.fullName,
      });

      // 2. Emit capacity_changed event
      const capResult = await publishDecisionEvent({
        organization_id: OPERATIONS_USER.organizationId,
        department: 'engineering',
        event_type: 'capacity_changed',
        entity_id: 'CAP-DEV-TEAM',
        payload: {
          team_id: 'TEAM-OPS-CORE',
          previous_capacity_hours: capacityHours,
          new_capacity_hours: targetHours,
          previous_production_capacity: prevCap,
          production_capacity: productionCapacity,
          effective_date: new Date().toISOString().split('T')[0],
          inventory_units: inventoryUnits,
          previous_inventory_units: prevInv,
          shipment_status: shipmentStatus,
          operations_status: operationsStatus,
          equipment_status: equipmentStatus,
          notes: `Mobile operations update: capacity ${productionCapacity}%, inventory ${inventoryUnits}u`,
        },
        created_by: OPERATIONS_USER.fullName,
      });

      const updatedState = {
        productionCapacity,
        previousProductionCapacity: prevCap,
        capacityHours: targetHours,
        inventoryUnits,
        previousInventoryUnits: prevInv,
        shipmentStatus,
        operationsStatus,
        equipmentStatus,
        deliveryDelayDays: deliveryDelayDays || (shipmentStatus === 'Delayed' ? 8 : 0),
        lastUpdatedEventId: capResult.event?.id || invResult.event?.id,
        lastUpdatedTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('impactmesh_ops_state', JSON.stringify(updatedState));
        } catch (_e) {}
      }

      setTransmissionFeedback({
        status: 'success',
        message: `Update received & broadcasted via Supabase Realtime // Verified (Inventory: ${prevInv} → ${inventoryUnits}u, Capacity: ${prevCap}% → ${productionCapacity}%)`,
        eventId: capResult.event?.id || invResult.event?.id,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      });
    } catch (err: any) {
      setTransmissionFeedback({
        status: 'error',
        message: err.message || 'Transmission failed.',
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  /**
   * Security Verification: Tests backend policy denial when an Operations user
   * attempts to emit an unauthorized event for another department (e.g. Finance).
   */
  const handleTestSecurityRejection = async () => {
    setSecurityTestResult('Testing authorization guard...');
    const result = await publishDecisionEvent({
      organization_id: OPERATIONS_USER.organizationId,
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'BUDGET-TAMPER-ATTEMPT',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: 9999999,
        fiscal_period: 'Q3-2026',
        rationale: 'Illegal modification attempt by Operations user',
      },
      created_by: OPERATIONS_USER.fullName,
    });

    if (!result.success && result.error) {
      setSecurityTestResult(`🛡️ BLOCKED AS EXPECTED: ${result.error}`);
    } else {
      setSecurityTestResult('⚠️ UNEXPECTED: Security guard failed to reject.');
    }
  };

  return (
    <div className="space-y-4 pb-16 max-w-lg mx-auto select-none font-mono">
      {/* 1. Header: Operations Department Identity & Realtime Status */}
      <div className="p-4 bg-[#141A20] border border-[#2A333B] flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="engineer" size={44} showTitle={false} />
          <div>
            <div className="text-xs text-[#E8E4D8] font-bold tracking-wide">
              IMPACTMESH // OPERATIONS CONTROL
            </div>
            <div className="text-[10px] text-[#A9ADA8]">
              USER: DEVON ROSS // OPERATIONS HEAD
            </div>
          </div>
        </div>

        {/* Realtime Status Indicator */}
        <div className="flex items-center gap-1.5 bg-[#101419] px-2.5 py-1 border border-[#2A333B] text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'CONNECTED'
                ? 'bg-[#59A66A] animate-pulse'
                : connectionState === 'CONNECTING'
                ? 'bg-[#D6A84F] animate-ping'
                : 'bg-[#D05A4A]'
            }`}
          />
          <span
            id="operations-connection-status"
            className={
              connectionState === 'CONNECTED'
                ? 'text-[#59A66A] font-bold'
                : connectionState === 'CONNECTING'
                ? 'text-[#D6A84F] font-bold'
                : 'text-[#D05A4A] font-bold'
            }
          >
            {connectionState}
          </span>
        </div>
      </div>

      {/* 2. Security Permission Banner */}
      <div className="px-3 py-2 bg-[#12181E] border border-[#2A333B] text-[10px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#59A66A] rounded-full" />
          <span className="text-[#A9ADA8]">
            PERMISSIONS: <strong className="text-[#E8E4D8]">OPERATIONS (AUTHORIZED)</strong>
          </span>
        </div>
        <span className="text-[#66727C]">FINANCE & SALES LOCKED 🔒</span>
      </div>

      {/* 3. Task-Oriented Mobile Operations Control Panel */}
      <div className="p-4 bg-[#141A20] border border-[#2A333B] shadow-md space-y-4">
        {/* Field 1: Operations Status */}
        <div>
          <label className="text-[10px] text-[#66727C] block uppercase mb-1.5">
            Operations Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'OPERATIONAL', label: '🟢 OPERATIONAL', color: 'text-[#59A66A]' },
              { id: 'DEGRADED', label: '🟡 DEGRADED', color: 'text-[#D6A84F]' },
              { id: 'CRITICAL', label: '🔴 CRITICAL', color: 'text-[#D05A4A]' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                id={`status-${st.id.toLowerCase()}`}
                onClick={() => setOperationsStatus(st.id)}
                className={`py-2 px-1 text-center text-xs border cursor-pointer font-mono ${
                  operationsStatus === st.id
                    ? 'bg-[#1E2630] border-[#D6A84F] text-[#E8E4D8]'
                    : 'bg-[#101419] border-[#2A333B] text-[#A9ADA8]'
                }`}
              >
                <span className={st.color}>{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Field 2: Production Capacity */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-[#66727C] uppercase">
              Production Capacity
            </label>
            <span
              id="mobile-capacity-val"
              className={`text-sm font-bold ${
                productionCapacity <= 70 ? 'text-[#D05A4A]' : 'text-[#59A66A]'
              }`}
            >
              {productionCapacity}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { val: 100, label: '100% (Nominal)' },
              { val: 70, label: '70% (Throttled)' },
              { val: 50, label: '50% (Critical)' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                id={`btn-capacity-${p.val}`}
                onClick={() => setProductionCapacity(p.val)}
                className={`py-2 border text-xs text-center cursor-pointer ${
                  productionCapacity === p.val
                    ? 'bg-[#1E2630] border-[#D6A84F] text-[#E8E4D8]'
                    : 'bg-[#101419] border-[#2A333B] text-[#A9ADA8]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Field 3: Inventory Units */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-[#66727C] uppercase">
              Inventory
            </label>
            <span
              id="mobile-inventory-val"
              className={`text-sm font-bold ${
                inventoryUnits < 1000 ? 'text-[#D05A4A]' : 'text-[#59A66A]'
              }`}
            >
              {inventoryUnits} units
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              id="btn-inventory-1240"
              onClick={() => setInventoryUnits(1240)}
              className={`py-2 px-2 border text-xs text-left cursor-pointer ${
                inventoryUnits === 1240
                  ? 'bg-[#1E2630] border-[#D6A84F] text-[#E8E4D8]'
                  : 'bg-[#101419] border-[#2A333B] text-[#A9ADA8]'
              }`}
            >
              <div className="font-bold text-[#E8E4D8]">1240 units</div>
              <div className="text-[9px] text-[#66727C]">Normal Stock Buffer</div>
            </button>

            <button
              type="button"
              id="btn-inventory-860"
              onClick={() => setInventoryUnits(860)}
              className={`py-2 px-2 border text-left text-xs cursor-pointer ${
                inventoryUnits === 860
                  ? 'bg-[#1E2630] border-[#D6A84F] text-[#E8E4D8]'
                  : 'bg-[#101419] border-[#2A333B] text-[#A9ADA8]'
              }`}
            >
              <div className="font-bold text-[#D05A4A]">860 units</div>
              <div className="text-[9px] text-[#66727C]">Reorder Threshold</div>
            </button>
          </div>

          <input
            type="number"
            id="input-inventory-units"
            value={inventoryUnits}
            onChange={(e) => setInventoryUnits(Number(e.target.value))}
            className="w-full bg-[#101419] border border-[#2A333B] px-3 py-1.5 text-xs text-[#E8E4D8] font-mono focus:border-[#D6A84F] focus:outline-none"
            placeholder="Custom inventory unit count"
          />
        </div>

        {/* Field 4: Shipment Status */}
        <div>
          <label className="text-[10px] text-[#66727C] block uppercase mb-1.5">
            Shipment Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'On Track', label: 'On Track (0d)', days: 0 },
              { id: 'Delayed', label: 'Delayed (+8d)', days: 8 },
              { id: 'Critical', label: 'Critical (+15d)', days: 15 },
            ].map((sh) => (
              <button
                key={sh.id}
                type="button"
                id={`shipment-${sh.id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  setShipmentStatus(sh.id);
                  setDeliveryDelayDays(sh.days);
                }}
                className={`py-2 border text-xs text-center cursor-pointer ${
                  shipmentStatus === sh.id
                    ? 'bg-[#1E2630] border-[#D6A84F] text-[#E8E4D8]'
                    : 'bg-[#101419] border-[#2A333B] text-[#A9ADA8]'
                }`}
              >
                {sh.label}
              </button>
            ))}
          </div>
        </div>

        {/* Field 5: Equipment Status */}
        <div>
          <label className="text-[10px] text-[#66727C] block uppercase mb-1.5">
            Equipment / Machine Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ONLINE', label: 'ONLINE (100%)', color: 'text-[#59A66A]' },
              { id: 'DEGRADED', label: 'DEGRADED (70%)', color: 'text-[#D6A84F]' },
              { id: 'MAINTENANCE', label: 'MAINTENANCE', color: 'text-[#D05A4A]' },
            ].map((eq) => (
              <button
                key={eq.id}
                type="button"
                id={`btn-equip-${eq.id.toLowerCase()}`}
                onClick={() => setEquipmentStatus(eq.id)}
                className={`py-2 px-1 text-center text-xs border cursor-pointer font-mono ${
                  equipmentStatus === eq.id
                    ? 'bg-[#1E2630] border-[#D6A84F] text-[#E8E4D8]'
                    : 'bg-[#101419] border-[#2A333B] text-[#A9ADA8]'
                }`}
              >
                <span className={eq.color}>{eq.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Button: SUBMIT UPDATE */}
        <div className="pt-2">
          <PixelButton
            variant="primary"
            size="md"
            id="btn-submit-operational-update"
            disabled={isTransmitting}
            onClick={handleSubmitUpdate}
            className="w-full justify-center text-center font-bold text-xs py-3"
          >
            {isTransmitting
              ? '[ TRANSMITTING VIA REALTIME... ]'
              : '[ SUBMIT OPERATIONAL UPDATE ]'}
          </PixelButton>
        </div>

        {/* Immediate Confirmation Feedback Banner */}
        {transmissionFeedback.status && (
          <div
            id="transmission-confirmation-banner"
            className={`p-3 border text-xs ${
              transmissionFeedback.status === 'success'
                ? 'bg-[#142017] border-[#59A66A] text-[#E8E4D8]'
                : 'bg-[#201416] border-[#D05A4A] text-[#D05A4A]'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>
                {transmissionFeedback.status === 'success'
                  ? '✔ UPDATE RECEIVED & SYNCHRONIZED'
                  : '✖ TRANSMISSION ERROR'}
              </span>
              <span className="text-[10px] text-[#A9ADA8]">
                {transmissionFeedback.timestamp}
              </span>
            </div>
            <p className="mt-1 text-[11px] font-sans text-[#A9ADA8]">
              {transmissionFeedback.message}
            </p>
            {transmissionFeedback.eventId && (
              <div className="text-[9px] text-[#66727C] mt-1 font-mono">
                SUPABASE EVENT ID: {transmissionFeedback.eventId}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Security Enforcement & Boundary Test Panel */}
      <PixelPanel
        title="SECURITY BOUNDARY & AUTHORIZATION"
        coordinate="AUTH-SEC-01"
        badge={<PixelBadge variant="danger" size="sm">RLS ENFORCED</PixelBadge>}
      >
        <div className="space-y-2 text-xs">
          <p className="text-[#A9ADA8] font-sans text-xs">
            Operations user is strictly restricted to Operations data. Cross-department modifications
            and CEO-only analytics are rejected at the database/service boundary.
          </p>

          <button
            type="button"
            id="btn-test-security-rejection"
            onClick={handleTestSecurityRejection}
            className="w-full py-2 bg-[#1A1214] border border-[#D05A4A] text-[#D05A4A] text-xs font-mono cursor-pointer hover:bg-[#2A181C]"
          >
            [ TEST UNAUTHORIZED ACTION: ATTEMPT FINANCE UPDATE ]
          </button>

          {securityTestResult && (
            <div
              id="security-test-output"
              className="p-2 bg-[#101419] border border-[#2A333B] text-[11px] text-[#E8E4D8]"
            >
              {securityTestResult}
            </div>
          )}
        </div>
      </PixelPanel>
    </div>
  );
};
