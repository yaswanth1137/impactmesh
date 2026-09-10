import React, { useState, useEffect } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { MobileDepartmentSwitcher } from '../../components/mobile/MobileDepartmentSwitcher.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import {
  realtimeSubscriptionManager,
  type RealtimeConnectionState,
} from '../../lib/realtime/subscription-manager.ts';
import {
  securityPolicyService,
  ENTERPRISE_OPERATOR,
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
  const [capacityHours, setCapacityHours] = useState<number>(
    savedState?.capacityHours ?? 300
  );
  const [productionCapacity, setProductionCapacity] = useState<number>(
    savedState?.productionCapacity ?? 70
  );
  const [inventoryUnits, setInventoryUnits] = useState<number>(
    savedState?.inventoryUnits ?? 860
  );
  const [resourceStatus, setResourceStatus] = useState<'AVAILABLE' | 'UNAVAILABLE'>(
    savedState?.equipmentStatus === 'OFFLINE (MAINTENANCE)' ? 'UNAVAILABLE' : 'AVAILABLE'
  );
  const [deliveryStatus, setDeliveryStatus] = useState<'ON TIME' | 'DELAYED'>(
    savedState?.shipmentStatus === 'Delayed' ? 'DELAYED' : 'ON TIME'
  );

  // 2. Connectivity & Feedback
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('CONNECTED');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionFeedback, setTransmissionFeedback] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    eventId?: string;
  }>({
    status: null,
    message: '',
  });

  const [recentEvents, setRecentEvents] = useState<Array<{ id: string; type: string; detail: string; time: string }>>([
    { id: 'ops-init-01', type: 'capacity_changed', detail: `Capacity set to ${capacityHours}h (${productionCapacity}%)`, time: '10:15:00' },
    { id: 'ops-init-02', type: 'inventory_changed', detail: `Inventory at ${inventoryUnits} units`, time: '10:18:22' },
  ]);

  useEffect(() => {
    // Set multi-department operator
    securityPolicyService.setCurrentUser(ENTERPRISE_OPERATOR);

    // Realtime connection listener
    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    // Realtime listener for incoming events
    const unsubEvent = realtimeSubscriptionManager.onEvent((event) => {
      if (event.event_type === 'capacity_changed' && event.payload) {
        const payload = event.payload as any;
        if (payload.new_capacity_hours !== undefined) setCapacityHours(payload.new_capacity_hours);
        if (payload.production_capacity !== undefined) setProductionCapacity(payload.production_capacity);
        if (payload.inventory_units !== undefined) setInventoryUnits(payload.inventory_units);
        if (payload.shipment_status !== undefined) setDeliveryStatus(payload.shipment_status === 'Delayed' ? 'DELAYED' : 'ON TIME');
        if (payload.operations_status !== undefined) setOperationsStatus(payload.operations_status);
      } else if (event.event_type === 'inventory_changed' && event.payload) {
        const payload = event.payload as any;
        if (payload.new_value !== undefined) setInventoryUnits(payload.new_value);
      }
    });

    return () => {
      unsubConn();
      unsubEvent();
    };
  }, []);

  const handleCapacityPreset = (hours: number, pct: number) => {
    setCapacityHours(hours);
    setProductionCapacity(pct);
  };

  /**
   * Primary Action: Submit Operational Changes
   * Emits canonical events: capacity_changed, inventory_changed, and conditionally resource_unavailable / delivery_delay
   */
  const handleSubmitUpdate = async () => {
    const prevCap = savedState?.productionCapacity ?? 100;
    const prevInv = savedState?.inventoryUnits ?? 1240;
    const prevHours = savedState?.capacityHours ?? 420;

    setIsTransmitting(true);
    setTransmissionFeedback({ status: null, message: '' });

    try {
      // 1. Emit capacity_changed event
      const capResult = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'operations',
        event_type: 'capacity_changed',
        entity_id: 'CAP-ENGINEERING-CORE',
        payload: {
          team_id: 'TEAM-OPS-CORE',
          previous_capacity_hours: prevHours,
          new_capacity_hours: capacityHours,
          previous_production_capacity: prevCap,
          production_capacity: productionCapacity,
          effective_date: new Date().toISOString().split('T')[0],
          inventory_units: inventoryUnits,
          previous_inventory_units: prevInv,
          shipment_status: deliveryStatus === 'DELAYED' ? 'Delayed' : 'On Schedule',
          operations_status: operationsStatus,
          equipment_status: resourceStatus === 'UNAVAILABLE' ? 'OFFLINE (MAINTENANCE)' : 'ONLINE',
          notes: `Operations update: capacity ${capacityHours}h (${productionCapacity}%), inventory ${inventoryUnits}u, resources ${resourceStatus}, delivery ${deliveryStatus}`,
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      // 2. Emit inventory_changed event
      const invResult = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'operations',
        event_type: 'inventory_changed',
        entity_id: 'INV-WAREHOUSE-MAIN',
        payload: {
          inventory_id: 'INV-WAREHOUSE-MAIN',
          item_name: 'Core Production Units & Assemblies',
          previous_value: prevInv,
          new_value: inventoryUnits,
          unit: 'units',
          location: 'Central Storage Hub',
          notes: `Inventory adjusted: ${prevInv} → ${inventoryUnits} units`,
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      // 3. Conditionally emit resource_unavailable if marked UNAVAILABLE
      if (resourceStatus === 'UNAVAILABLE') {
        await publishDecisionEvent({
          organization_id: ENTERPRISE_OPERATOR.organizationId,
          department: 'operations',
          event_type: 'resource_unavailable',
          entity_id: 'RES-TURBINE-UNIT',
          payload: {
            resource_id: 'RES-TURBINE-UNIT',
            resource_name: 'Core Production Machine & Engine Line',
            duration_days: 3,
            affected_features: ['Module Assembly', 'Custom Analytics Delivery'],
          },
          created_by: ENTERPRISE_OPERATOR.fullName,
        });
      }

      // 4. Conditionally emit delivery_delay if marked DELAYED
      if (deliveryStatus === 'DELAYED') {
        await publishDecisionEvent({
          organization_id: ENTERPRISE_OPERATOR.organizationId,
          department: 'operations',
          event_type: 'delivery_delay',
          entity_id: 'DEL-PROJECT-APEX',
          payload: {
            project_id: 'DEL-PROJECT-APEX',
            delay_days: 8,
            root_cause: 'Component supply chain bottleneck',
            cascading_impacts: ['Apex Global delivery SLA at risk'],
          },
          created_by: ENTERPRISE_OPERATOR.fullName,
        });
      }

      const updatedState = {
        productionCapacity,
        previousProductionCapacity: prevCap,
        capacityHours,
        previousCapacityHours: prevHours,
        inventoryUnits,
        previousInventoryUnits: prevInv,
        shipmentStatus: deliveryStatus === 'DELAYED' ? 'Delayed' : 'On Schedule',
        operationsStatus,
        equipmentStatus: resourceStatus === 'UNAVAILABLE' ? 'OFFLINE (MAINTENANCE)' : 'ONLINE',
        deliveryDelayDays: deliveryStatus === 'DELAYED' ? 8 : 0,
        lastUpdatedEventId: capResult.event?.id || invResult.event?.id,
        lastUpdatedTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('impactmesh_ops_state', JSON.stringify(updatedState));
        } catch (_e) {}
      }

      const eventId = capResult.event?.id || invResult.event?.id || `evt_${Date.now()}`;
      setTransmissionFeedback({
        status: 'success',
        message: `Operational update broadcasted to CEO Command Center // Verified (Capacity: ${capacityHours}h, Inventory: ${inventoryUnits}u)`,
        eventId,
      });

      setRecentEvents((prevEvents) => [
        {
          id: eventId,
          type: 'capacity_changed',
          detail: `Capacity: ${capacityHours}h (${productionCapacity}%), Inventory: ${inventoryUnits}u, ${deliveryStatus}`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
        ...prevEvents.slice(0, 4),
      ]);
    } catch (err: any) {
      setTransmissionFeedback({
        status: 'error',
        message: err.message || 'Transmission failed.',
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto select-none">
      {/* 1. MOBILE 5-DEPARTMENT SWITCHER & STATUS */}
      <MobileDepartmentSwitcher currentDept="operations" connectionState={connectionState} />

      {/* 2. STATION & CHARACTER BANNER */}
      <div className="p-3 bg-[#141A20] border border-[#2A333B] flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="engineer" size={44} showTitle />
          <div>
            <div className="font-pixel text-[11px] text-[#D6A84F] uppercase">THE ENGINE ROOM</div>
            <div className="text-[11px] font-mono text-[#A9ADA8]">Throughput, Capacity & Logistics</div>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-[#66727C]">
          <div>DEVICE: MOBILE #1</div>
          <div className="text-[#59A66A]">ACTIVE</div>
        </div>
      </div>

      {/* 3. PRIMARY METRICS STRIP */}
      <div className="grid grid-cols-2 gap-2 bg-[#141A20] border border-[#2A333B] p-2.5 shadow-sm">
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CAPACITY</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#E8E4D8]">
            {capacityHours} hrs/wk
          </span>
          <span className="text-[10px] text-[#D6A84F] font-sans block">{productionCapacity}% Nominal</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">INVENTORY</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#E8E4D8]">
            {inventoryUnits} units
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">
            {inventoryUnits < 1000 ? 'Reorder Threshold' : 'Nominal Level'}
          </span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">RESOURCE STATUS</span>
          <span
            className={`font-mono font-bold text-xs ${
              resourceStatus === 'AVAILABLE' ? 'text-[#59A66A]' : 'text-[#D05A4A]'
            }`}
          >
            {resourceStatus}
          </span>
          <span className="text-[10px] text-[#6C727A] font-sans block">Machinery state</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">DELIVERY</span>
          <span
            className={`font-mono font-bold text-xs ${
              deliveryStatus === 'ON TIME' ? 'text-[#59A66A]' : 'text-[#D05A4A]'
            }`}
          >
            {deliveryStatus}
          </span>
          <span className="text-[10px] text-[#6C727A] font-sans block">SLA schedule</span>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: CAPACITY & WORK ACTIONS */}
      <PixelPanel title="OPERATIONS // ENGINE ROOM CONTROLS" coordinate="ENG-01">
        <div className="space-y-3 font-mono text-xs">
          {/* Capacity Section */}
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-[#66727C] uppercase">PRODUCTION CAPACITY</span>
              <span className="font-bold text-sm text-[#D6A84F]">{capacityHours}h ({productionCapacity}%)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleCapacityPreset(420, 100)}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  capacityHours === 420 ? 'bg-[#D6A84F] text-[#090B0F] border-[#D6A84F] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                420h (100%)
              </button>
              <button
                onClick={() => handleCapacityPreset(300, 70)}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  capacityHours === 300 ? 'bg-[#D6A84F] text-[#090B0F] border-[#D6A84F] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                300h (70%)
              </button>
              <button
                onClick={() => handleCapacityPreset(210, 50)}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  capacityHours === 210 ? 'bg-[#D6A84F] text-[#090B0F] border-[#D6A84F] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                210h (50%)
              </button>
            </div>
          </div>

          {/* Inventory Section */}
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-[#66727C] uppercase">INVENTORY LEVEL</span>
              <span className="font-bold text-sm text-[#E8E4D8]">{inventoryUnits} units</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setInventoryUnits(1240)}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  inventoryUnits === 1240 ? 'bg-[#59A66A] text-[#090B0F] border-[#59A66A] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                1,240u (Nominal)
              </button>
              <button
                onClick={() => setInventoryUnits(860)}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  inventoryUnits === 860 ? 'bg-[#D05A4A] text-[#E8E4D8] border-[#D05A4A] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                860u (Reorder)
              </button>
            </div>
          </div>

          {/* Resource & Delivery Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-[#101419] border border-[#2A333B]">
              <span className="text-[9px] text-[#66727C] uppercase block mb-1">RESOURCE STATUS</span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setResourceStatus('AVAILABLE')}
                  className={`py-1.5 text-center font-pixel text-[8px] uppercase cursor-pointer border ${
                    resourceStatus === 'AVAILABLE' ? 'bg-[#59A66A] text-[#090B0F] border-[#59A66A] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                  }`}
                >
                  AVAIL
                </button>
                <button
                  onClick={() => setResourceStatus('UNAVAILABLE')}
                  className={`py-1.5 text-center font-pixel text-[8px] uppercase cursor-pointer border ${
                    resourceStatus === 'UNAVAILABLE' ? 'bg-[#D05A4A] text-[#E8E4D8] border-[#D05A4A] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                  }`}
                >
                  UNAVAIL
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-[#101419] border border-[#2A333B]">
              <span className="text-[9px] text-[#66727C] uppercase block mb-1">DELIVERY SCHEDULE</span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setDeliveryStatus('ON TIME')}
                  className={`py-1.5 text-center font-pixel text-[8px] uppercase cursor-pointer border ${
                    deliveryStatus === 'ON TIME' ? 'bg-[#59A66A] text-[#090B0F] border-[#59A66A] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                  }`}
                >
                  ON TIME
                </button>
                <button
                  onClick={() => setDeliveryStatus('DELAYED')}
                  className={`py-1.5 text-center font-pixel text-[8px] uppercase cursor-pointer border ${
                    deliveryStatus === 'DELAYED' ? 'bg-[#D05A4A] text-[#E8E4D8] border-[#D05A4A] font-bold' : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                  }`}
                >
                  DELAYED
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <PixelButton
              variant="primary"
              size="lg"
              className="w-full justify-center text-center font-bold tracking-wider py-3"
              disabled={isTransmitting}
              onClick={handleSubmitUpdate}
            >
              {isTransmitting ? '[ TRANSMITTING VIA REALTIME... ]' : '[ SUBMIT OPERATIONAL UPDATE ]'}
            </PixelButton>
          </div>
        </div>
      </PixelPanel>

      {/* 5. VERIFIED RECEIPT FEEDBACK */}
      {transmissionFeedback.status && (
        <div
          className={`p-3 border font-mono text-xs ${
            transmissionFeedback.status === 'success'
              ? 'bg-[#122416] border-[#4ADE80] text-[#4ADE80]'
              : 'bg-[#291212] border-[#F87171] text-[#F87171]'
          }`}
        >
          <div className="font-bold font-pixel text-[10px] uppercase">
            {transmissionFeedback.status === 'success' ? '✓ UPDATE RECEIVED & SYNCHRONIZED' : '⚠ TRANSMISSION FAILED'}
          </div>
          <div className="mt-1 text-[11px]">{transmissionFeedback.message}</div>
          {transmissionFeedback.eventId && (
            <div className="text-[9px] opacity-75 mt-1">SUPABASE EVENT ID: {transmissionFeedback.eventId}</div>
          )}
        </div>
      )}

      {/* 6. RECENT OPERATIONS EVENTS LOG */}
      <PixelPanel title="RECENT OPERATIONS EVENTS" coordinate="AUDIT-OPS">
        <div className="space-y-1.5 font-mono text-[11px]">
          {recentEvents.map((evt) => (
            <div key={evt.id} className="p-2 bg-[#101419] border border-[#2A333B] flex justify-between items-center">
              <div>
                <span className="text-[#D6A84F] font-semibold uppercase">{evt.type}</span>
                <div className="text-[#A9ADA8] text-[10px]">{evt.detail}</div>
              </div>
              <span className="text-[#6C727A] text-[9px]">{evt.time}</span>
            </div>
          ))}
        </div>
      </PixelPanel>
    </div>
  );
};
