import React, { useState, useEffect } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';
import { MobileDepartmentSwitcher } from '../../components/mobile/MobileDepartmentSwitcher.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';
import { securityPolicyService, ENTERPRISE_OPERATOR } from '../../lib/auth/auth-service.ts';

export const ProductRoute: React.FC = () => {
  const [featureName] = useState<string>('Checkout Redesign');
  const [priority] = useState<'HIGH' | 'CRITICAL' | 'NORMAL'>('HIGH');
  const [scopeState, setScopeState] = useState<'FULL' | 'REDUCED'>('REDUCED');
  const [launchDate, setLaunchDate] = useState<string>('05 Oct');
  const [engineeringLoad, setEngineeringLoad] = useState<number>(180);

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
    { id: 'prod-init-01', type: 'feature_scope_changed', detail: 'Checkout Redesign: Scope reduced to 80 pts', time: '10:08:00' },
  ]);

  useEffect(() => {
    securityPolicyService.setCurrentUser(ENTERPRISE_OPERATOR);

    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    const unsubEvent = realtimeSubscriptionManager.onEvent((event) => {
      if (event.event_type === 'feature_scope_changed' && event.payload) {
        const p = event.payload as any;
        if (p.new_points) {
          setScopeState(p.new_points < 100 ? 'REDUCED' : 'FULL');
          setEngineeringLoad(p.new_points < 100 ? 180 : 420);
        }
      } else if (event.event_type === 'launch_date_changed' && event.payload) {
        const p = event.payload as any;
        if (p.new_launch_date) setLaunchDate(p.new_launch_date);
      }
    });

    return () => {
      unsubConn();
      unsubEvent();
    };
  }, []);

  const handleSaveProductUpdate = async () => {
    setIsTransmitting(true);
    setTransmissionFeedback({ status: null, message: '' });

    try {
      // 1. Emit feature_scope_changed
      const scopeRes = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'product',
        event_type: 'feature_scope_changed',
        entity_id: 'FEAT-CHECKOUT-REDESIGN',
        payload: {
          feature_id: 'FEAT-CHECKOUT-REDESIGN',
          previous_points: scopeState === 'REDUCED' ? 155 : 80,
          new_points: scopeState === 'REDUCED' ? 80 : 155,
          justification: scopeState === 'REDUCED'
            ? 'Reduced secondary custom modules to honor delivery commitments within available capacity'
            : 'Restored full scope for checkout redesign',
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      // 2. Emit launch_date_changed
      const launchRes = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'product',
        event_type: 'launch_date_changed',
        entity_id: 'FEAT-CHECKOUT-REDESIGN',
        payload: {
          feature_id: 'FEAT-CHECKOUT-REDESIGN',
          previous_launch_date: '2026-09-28',
          new_launch_date: launchDate === '05 Oct' ? '2026-10-05' : '2026-09-28',
          slippage_weeks: launchDate === '05 Oct' ? 1 : 0,
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      const eventId = scopeRes.event?.id || launchRes.event?.id || `evt_${Date.now()}`;
      setTransmissionFeedback({
        status: 'success',
        message: `Product update saved: ${featureName} [Scope: ${scopeState}, Launch: ${launchDate}] // Broadcasted via Supabase`,
        eventId,
      });

      setRecentEvents((prev) => [
        {
          id: eventId,
          type: 'feature_scope_changed',
          detail: `${featureName} [${scopeState}, Target: ${launchDate}]`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
        ...prev.slice(0, 4),
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
      <MobileDepartmentSwitcher currentDept="product" connectionState={connectionState} />

      {/* 2. STATION & CHARACTER BANNER */}
      <div className="p-3 bg-[#141A20] border border-[#2A333B] flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="navigator" size={44} showTitle />
          <div>
            <div className="font-pixel text-[11px] text-[#AFCBC2] uppercase">THE CHART ROOM</div>
            <div className="text-[11px] font-mono text-[#A9ADA8]">Roadmap, Feature Scope & Velocity</div>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-[#66727C]">
          <div>DEVICE: MOBILE #5</div>
          <div className="text-[#AFCBC2]">ACTIVE</div>
        </div>
      </div>

      {/* 3. PRIMARY METRICS STRIP */}
      <div className="grid grid-cols-2 gap-2 bg-[#141A20] border border-[#2A333B] p-2.5 shadow-sm">
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">COMMITTED SCOPE</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#E8E4D8]">
            {scopeState === 'REDUCED' ? '1 CORE MODULE' : '3 FULL MODULES'}
          </span>
          <span className="text-[10px] text-[#AFCBC2] font-sans block">
            {scopeState === 'REDUCED' ? 'Reduced (80 pts)' : 'Full (155 pts)'}
          </span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">ENGINEERING LOAD</span>
          <span
            className={`font-mono font-bold text-base sm:text-lg ${
              scopeState === 'REDUCED' ? 'text-[#59A66A]' : 'text-[#D05A4A]'
            }`}
          >
            {engineeringLoad}h
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">
            {scopeState === 'REDUCED' ? 'Balanced under cap' : '+120h Overload'}
          </span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">FEATURE PRIORITY</span>
          <span className="font-mono font-bold text-xs text-[#D6A84F]">
            {priority}
          </span>
          <span className="text-[10px] text-[#6C727A] font-sans block">Sprint 24</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">LAUNCH TARGET</span>
          <span className="font-mono font-bold text-xs text-[#E8E4D8]">
            {launchDate} (Slippage: +1w)
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Target Window</span>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: FEATURE EDITING */}
      <PixelPanel title="PRODUCT // CHART ROOM WORKSPACE" coordinate="CHART-01">
        <div className="space-y-3 font-mono text-xs">
          {/* Feature Header */}
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <span className="text-[10px] text-[#66727C] uppercase block mb-1">ACTIVE FEATURE</span>
            <div className="text-sm font-bold text-[#E8E4D8]">{featureName}</div>
            <span className="text-[11px] text-[#A9ADA8] font-sans block mt-0.5">
              Core transaction checkout flow, payment gateways & analytics
            </span>
          </div>

          {/* Scope Toggle */}
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <span className="text-[10px] text-[#66727C] uppercase block mb-1.5">FEATURE SCOPE</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setScopeState('FULL');
                  setEngineeringLoad(420);
                }}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  scopeState === 'FULL'
                    ? 'bg-[#D6A84F] text-[#090B0F] border-[#D6A84F] font-bold'
                    : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                Full Scope (155 pts)
              </button>
              <button
                onClick={() => {
                  setScopeState('REDUCED');
                  setEngineeringLoad(180);
                }}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  scopeState === 'REDUCED'
                    ? 'bg-[#59A66A] text-[#090B0F] border-[#59A66A] font-bold'
                    : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                Reduced Scope (80 pts)
              </button>
            </div>
          </div>

          {/* Launch Date Toggle */}
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <span className="text-[10px] text-[#66727C] uppercase block mb-1.5">LAUNCH TARGET DATE</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLaunchDate('28 Sep')}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  launchDate === '28 Sep'
                    ? 'bg-[#D6A84F] text-[#090B0F] border-[#D6A84F] font-bold'
                    : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                28 Sep (Original)
              </button>
              <button
                onClick={() => setLaunchDate('05 Oct')}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border ${
                  launchDate === '05 Oct'
                    ? 'bg-[#59A66A] text-[#090B0F] border-[#59A66A] font-bold'
                    : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                05 Oct (+1w Buffer)
              </button>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <PixelButton
              variant="primary"
              size="lg"
              className="w-full justify-center text-center font-bold tracking-wider py-3"
              disabled={isTransmitting}
              onClick={handleSaveProductUpdate}
            >
              {isTransmitting ? '[ TRANSMITTING VIA REALTIME... ]' : '[ SAVE PRODUCT UPDATE ]'}
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
            {transmissionFeedback.status === 'success' ? '✓ PRODUCT UPDATE COMMITTED' : '⚠ TRANSMISSION FAILED'}
          </div>
          <div className="mt-1 text-[11px]">{transmissionFeedback.message}</div>
          {transmissionFeedback.eventId && (
            <div className="text-[9px] opacity-75 mt-1">SUPABASE EVENT ID: {transmissionFeedback.eventId}</div>
          )}
        </div>
      )}

      {/* 6. RECENT PRODUCT EVENTS LOG */}
      <PixelPanel title="RECENT PRODUCT EVENTS" coordinate="AUDIT-PROD">
        <div className="space-y-1.5 font-mono text-[11px]">
          {recentEvents.map((evt) => (
            <div key={evt.id} className="p-2 bg-[#101419] border border-[#2A333B] flex justify-between items-center">
              <div>
                <span className="text-[#AFCBC2] font-semibold uppercase">{evt.type}</span>
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
