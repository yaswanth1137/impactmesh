import React, { useState, useEffect } from 'react';
import { DecisionAlert } from '../../components/decisions/DecisionAlert.tsx';
import { BusinessPositionStrip, type OperationalMetrics } from '../../components/business/BusinessPositionStrip.tsx';
import { ImpactSummary } from '../../components/decisions/ImpactSummary.tsx';
import { ImpactMap } from '../../components/impact-map/ImpactMap.tsx';
import { DecisionOptionList } from '../../components/decisions/DecisionOptionList.tsx';
import { RecommendationCard } from '../../components/decisions/RecommendationCard.tsx';
import { BusinessCourse } from '../../components/course/BusinessCourse.tsx';
import { LiveEventStream } from '../../components/decisions/LiveEventStream.tsx';
import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';
import type { DecisionEvent } from '../../types/events.ts';
import {
  MOCK_ENTITIES,
  MOCK_DEPENDENCIES,
  MOCK_EVENT_LOG,
  MOCK_ACTIVE_DECISION_EVENT,
  MOCK_IMPACT_RESULT,
  MOCK_DECISION_OPTIONS,
  MOCK_RECOMMENDATION,
} from '../../mocks/blacktide-mock.ts';

import { securityPolicyService, CEO_USER } from '../../lib/auth/auth-service.ts';

interface CommandRouteProps {
  onPlotRoute: () => void;
}

const getInitialOperationalMetrics = (): OperationalMetrics => {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('impactmesh_ops_state');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
  }
  return {
    productionCapacity: 100,
    previousProductionCapacity: 100,
    capacityHours: 420,
    inventoryUnits: 1240,
    previousInventoryUnits: 1240,
    equipmentStatus: 'ONLINE',
    inventoryLevel: 'NORMAL',
    deliveryDelayDays: 0,
  };
};

export const CommandRoute: React.FC<CommandRouteProps> = ({ onPlotRoute }) => {
  const [isSimulatingCascade, setIsSimulatingCascade] = useState<boolean>(() => {
    const initialMetrics = getInitialOperationalMetrics();
    return initialMetrics.productionCapacity <= 70 || (initialMetrics.inventoryUnits ?? 1240) < 1000;
  });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('opt-scope-reduction');
  const [events, setEvents] = useState<any[]>(MOCK_EVENT_LOG);
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('CONNECTED');
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics>(getInitialOperationalMetrics);

  useEffect(() => {
    // Set authenticated user to CEO
    securityPolicyService.setCurrentUser(CEO_USER);

    // 1. Connection status listener
    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    // 2. Realtime event listener (deduplicated automatically by RealtimeSubscriptionManager)
    const unsubscribe = realtimeSubscriptionManager.onEvent((incomingEvent: DecisionEvent) => {
      setIsAnalyzing(true);

      const streamEvent = {
        id: incomingEvent.id,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        department: incomingEvent.department.toUpperCase(),
        department_code: incomingEvent.department,
        actor: incomingEvent.created_by,
        action: incomingEvent.event_type.replace(/_/g, ' ').toUpperCase(),
        severity: (incomingEvent.event_type.includes('cut') ||
        incomingEvent.event_type.includes('delay') ||
        incomingEvent.event_type.includes('unavailable') ||
        incomingEvent.event_type.includes('budget') ||
        incomingEvent.event_type.includes('inventory')
          ? 'critical'
          : incomingEvent.event_type.includes('accepted')
          ? 'success'
          : 'warning') as 'critical' | 'warning' | 'success' | 'info',
        details: JSON.stringify(incomingEvent.payload),
      };

      setEvents((prev) => [streamEvent, ...prev]);

      if (incomingEvent.event_type === 'inventory_changed') {
        const payload = incomingEvent.payload as any;
        const newInv = payload?.new_value ?? 860;
        const prevInv = payload?.previous_value ?? 1240;

        setOperationalMetrics((prev) => {
          const updated = {
            ...prev,
            inventoryUnits: newInv,
            previousInventoryUnits: prevInv,
            lastUpdatedEventId: incomingEvent.id,
            lastUpdatedTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
          };
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('impactmesh_ops_state', JSON.stringify(updated));
            } catch {}
          }
          return updated;
        });

        setIsSimulatingCascade(true);
      } else if (incomingEvent.event_type === 'capacity_changed') {
        const payload = incomingEvent.payload as any;
        const newCapacity = payload?.production_capacity ?? Math.round(((payload?.new_hours ?? 300) / 420) * 100);
        const prevCapacity = payload?.previous_production_capacity ?? 100;
        const newInv = payload?.inventory_units ?? 860;
        const prevInv = payload?.previous_inventory_units ?? 1240;

        setOperationalMetrics((prev) => {
          const updated = {
            ...prev,
            productionCapacity: newCapacity,
            previousProductionCapacity: prevCapacity,
            capacityHours: payload?.new_hours ?? 300,
            inventoryUnits: newInv,
            previousInventoryUnits: prevInv,
            shipmentStatus: payload?.shipment_status ?? prev.shipmentStatus,
            operationsStatus: payload?.operations_status ?? prev.operationsStatus,
            equipmentStatus: payload?.equipment_status ?? prev.equipmentStatus,
            lastUpdatedEventId: incomingEvent.id,
            lastUpdatedTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
          };
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('impactmesh_ops_state', JSON.stringify(updated));
            } catch {}
          }
          return updated;
        });

        setIsSimulatingCascade(true);
      } else if ((incomingEvent.event_type as string) === 'contractor_cut') {
        const payload = incomingEvent.payload as any;
        const newHours = payload?.new_hours ?? 300;
        const capacityPercent = Math.round((newHours / 420) * 100);

        setOperationalMetrics((prev) => ({
          ...prev,
          capacityHours: newHours,
          productionCapacity: capacityPercent,
          previousProductionCapacity: 100,
          inventoryUnits: prev.inventoryUnits ?? 860,
          previousInventoryUnits: 1240,
          lastUpdatedEventId: incomingEvent.id,
        }));
        setIsSimulatingCascade(true);
      } else if ((incomingEvent.event_type as string) === 'machine_offline') {
        setOperationalMetrics((prev) => ({
          ...prev,
          equipmentStatus: 'OFFLINE (MAINTENANCE)',
          lastUpdatedEventId: incomingEvent.id,
        }));
        setIsSimulatingCascade(true);
      } else if (incomingEvent.event_type === 'budget_changed') {
        const payload = incomingEvent.payload as any;
        const isCut = (payload?.new_budget ?? 0) <= 1100000;
        setIsSimulatingCascade(isCut);
      } else if (incomingEvent.event_type === 'deal_accepted') {
        setIsSimulatingCascade(true);
      }

      setTimeout(() => {
        setIsAnalyzing(false);
      }, 700);
    });

    return () => {
      unsubConn();
      unsubscribe();
    };
  }, []);

  const handleTriggerSimulation = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsSimulatingCascade((prev) => !prev);
    }, 800);
  };

  const scrollToImpact = () => {
    const el = document.getElementById('impact-map-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const affectedEntityIds = isSimulatingCascade
    ? MOCK_IMPACT_RESULT.affected_entities.map((e) => e.entity_id)
    : [];

  const topOption =
    MOCK_DECISION_OPTIONS.find((o) => o.id === selectedOptionId) ||
    MOCK_DECISION_OPTIONS[0];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* 0. Realtime Link Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#101419] border border-[#2A333B] text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'CONNECTED'
                ? 'bg-[#4ADE80] animate-pulse'
                : connectionState === 'CONNECTING'
                ? 'bg-[#E5A93C] animate-ping'
                : 'bg-[#F87171]'
            }`}
          />
          <span className="text-[#A9ADA8]">REALTIME MESH:</span>
          <span
            className={`font-semibold ${
              connectionState === 'CONNECTED'
                ? 'text-[#4ADE80]'
                : connectionState === 'CONNECTING'
                ? 'text-[#E5A93C]'
                : 'text-[#F87171]'
            }`}
          >
            {connectionState}
          </span>
          <span className="text-[#6C727A] hidden sm:inline">|</span>
          <span className="text-[#6C727A] hidden sm:inline">ROLE:</span>
          <span className="text-[#D6A84F] font-bold hidden sm:inline">CEO / COMMAND CENTER (FULL ACCESS)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#A9ADA8]">
          <span>OPS SYNC: <strong className="text-[#E8E4D8]">{operationalMetrics.productionCapacity}% CAP / {operationalMetrics.inventoryUnits ?? 860}U</strong></span>
          {operationalMetrics.lastUpdatedTime && (
            <span className="text-[#6C727A]">({operationalMetrics.lastUpdatedTime})</span>
          )}
        </div>
      </div>

      {/* 1. DECISION ALERT: Top executive banner immediately below header */}
      <section>
        <DecisionAlert
          department={operationalMetrics.productionCapacity <= 70 ? 'OPERATIONS' : 'FINANCE'}
          actionTitle={
            (operationalMetrics.inventoryUnits ?? 1240) < 1000
              ? `Operations update: Inventory reduced`
              : operationalMetrics.productionCapacity <= 70
              ? 'Operations update: Production capacity reduced'
              : 'Budget reduced'
          }
          changeDetail={
            (operationalMetrics.inventoryUnits ?? 1240) < 1000
              ? `${operationalMetrics.previousInventoryUnits ?? 1240} → ${operationalMetrics.inventoryUnits ?? 860} units`
              : operationalMetrics.productionCapacity <= 70
              ? `${operationalMetrics.previousProductionCapacity ?? 100}% → ${operationalMetrics.productionCapacity}% (${operationalMetrics.capacityHours}h)`
              : '₹18L → ₹11L'
          }
          effectsCount={7}
          capacityDeficitHours={120}
          deliveryExposureDays={8}
          financialExposure="₹50L"
          onReviewImpact={scrollToImpact}
        />
      </section>

      {/* 2. BUSINESS POSITION: Concise executive metric strip with realtime updates */}
      <section>
        <BusinessPositionStrip
          isSimulatingCascade={isSimulatingCascade}
          operationalMetrics={operationalMetrics}
          connectionState={connectionState}
        />
      </section>

      {/* 3. DECISION IMPACT SUMMARY */}
      <section>
        <ImpactSummary
          event={MOCK_ACTIVE_DECISION_EVENT}
          impact={MOCK_IMPACT_RESULT}
        />
      </section>

      {/* 4. IMPACT MAP: What does this decision affect? */}
      <section id="impact-map-section">
        <ImpactMap
          entities={MOCK_ENTITIES}
          dependencies={MOCK_DEPENDENCIES}
          affectedEntityIds={affectedEntityIds}
          isAnalyzing={isAnalyzing}
          isSimulatingCascade={isSimulatingCascade}
          onTriggerSimulation={handleTriggerSimulation}
        />
      </section>

      {/* 5. DECISION ALTERNATIVES: What can we do? */}
      <section>
        <DecisionOptionList
          options={MOCK_DECISION_OPTIONS}
          selectedOptionId={selectedOptionId}
          onSelectOption={(opt) => setSelectedOptionId(opt.id)}
        />
      </section>

      {/* 6. RECOMMENDED COURSE: Visually dominant recommendation card */}
      <section>
        <RecommendationCard
          recommendation={MOCK_RECOMMENDATION}
          topOption={topOption}
          onPlotRoute={onPlotRoute}
          onSimulate={handleTriggerSimulation}
        />
      </section>

      {/* 7. BUSINESS COURSE: Secondary organizational trajectory */}
      <section>
        <BusinessCourse />
      </section>

      {/* 8. LIVE EVENT LOG: Secondary auditability stream */}
      <section>
        <LiveEventStream
          events={events}
          isAnalyzing={isAnalyzing}
        />
      </section>
    </div>
  );
};
