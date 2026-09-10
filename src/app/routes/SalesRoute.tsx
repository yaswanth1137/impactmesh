import React, { useState, useEffect } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';
import { MobileDepartmentSwitcher } from '../../components/mobile/MobileDepartmentSwitcher.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';
import { securityPolicyService, ENTERPRISE_OPERATOR } from '../../lib/auth/auth-service.ts';

export const SalesRoute: React.FC = () => {
  const [dealAccepted, setDealAccepted] = useState(true);
  const [dealValue, setDealValue] = useState<number>(5000000);
  const [deadline, setDeadline] = useState<string>('2026-09-30');
  const [customerRisk] = useState<'LOW' | 'MEDIUM' | 'ELEVATED'>('ELEVATED');

  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('CONNECTED');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionFeedback, setTransmissionFeedback] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    eventId?: string;
  }>({
    status: null,
    message: '',
  });

  const [recentEvents, setRecentEvents] = useState<Array<{ id: string; type: string; detail: string; time: string }>>([
    { id: 'sale-init-01', type: 'deal_accepted', detail: 'Apex Global ₹50L expansion contract committed', time: '10:05:00' },
  ]);

  useEffect(() => {
    securityPolicyService.setCurrentUser(ENTERPRISE_OPERATOR);

    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    const unsubEvent = realtimeSubscriptionManager.onEvent((event) => {
      if (event.event_type === 'deal_accepted') {
        setDealAccepted(true);
      } else if (event.event_type === 'deal_value_changed' && event.payload) {
        const p = event.payload as any;
        if (p.new_value) setDealValue(p.new_value);
      } else if (event.event_type === 'deadline_changed' && event.payload) {
        const p = event.payload as any;
        if (p.new_deadline) setDeadline(p.new_deadline);
      }
    });

    return () => {
      unsubConn();
      unsubEvent();
    };
  }, []);

  const handleAcceptDeal = async () => {
    setIsTransmitting(true);
    setTransmissionFeedback({ status: null, message: '' });

    try {
      const res = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'sales',
        event_type: 'deal_accepted',
        entity_id: 'DEAL-APEX-50L',
        payload: {
          deal_id: 'DEAL-APEX-50L',
          final_value: dealValue,
          close_date: deadline,
          sla_commitments: ['SAML SSO Compliance', '30 Calendar Days Delivery SLA', '3 Custom Modules'],
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      const eventId = res.event?.id || `evt_${Date.now()}`;
      setDealAccepted(true);
      setTransmissionFeedback({
        status: 'success',
        message: `Deal accepted: Apex Global ₹${(dealValue / 100000).toFixed(1)}L // Synchronized to CEO Command Center`,
        eventId,
      });

      setRecentEvents((prev) => [
        {
          id: eventId,
          type: 'deal_accepted',
          detail: `Apex Global ₹${(dealValue / 100000).toFixed(1)}L deal committed`,
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

  const handleCreateDeal = async (name: string, value: number) => {
    setIsTransmitting(true);
    try {
      const res = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'sales',
        event_type: 'deal_created',
        entity_id: `DEAL-${Date.now().toString().slice(-4)}`,
        payload: {
          deal_id: `DEAL-${Date.now().toString().slice(-4)}`,
          deal_name: name,
          customer_id: 'CUST-NEW-01',
          contract_value: value,
          expected_close_date: '2026-10-15',
          requested_features: ['Custom SSO', 'Analytics'],
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      const eventId = res.event?.id || `evt_${Date.now()}`;
      setTransmissionFeedback({
        status: 'success',
        message: `New deal logged: ${name} (₹${(value / 100000).toFixed(1)}L) // Broadcasted via Supabase`,
        eventId,
      });

      setRecentEvents((prev) => [
        {
          id: eventId,
          type: 'deal_created',
          detail: `${name} (₹${(value / 100000).toFixed(1)}L)`,
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
      <MobileDepartmentSwitcher currentDept="sales" connectionState={connectionState} />

      {/* 2. STATION & CHARACTER BANNER */}
      <div className="p-3 bg-[#141A20] border border-[#2A333B] flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="lookout" size={44} showTitle />
          <div>
            <div className="font-pixel text-[11px] text-[#59A66A] uppercase">THE LOOKOUT</div>
            <div className="text-[11px] font-mono text-[#A9ADA8]">Deal Intake & Pipeline Horizon</div>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-[#66727C]">
          <div>DEVICE: MOBILE #2</div>
          <div className="text-[#59A66A]">ACTIVE</div>
        </div>
      </div>

      {/* 3. PRIMARY METRICS STRIP */}
      <div className="grid grid-cols-2 gap-2 bg-[#141A20] border border-[#2A333B] p-2.5 shadow-sm">
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">ACTIVE CONTRACT</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#E8E4D8]">
            ₹{(dealValue / 100000).toFixed(1)}L
          </span>
          <span className="text-[10px] text-[#59A66A] font-sans block">Apex Global Expansion</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CLOSE TARGET</span>
          <span className="font-mono font-bold text-xs text-[#D6A84F] block mt-1">
            {deadline}
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">30d Hard SLA</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">DEAL STATUS</span>
          <span
            className={`font-mono font-bold text-xs ${
              dealAccepted ? 'text-[#59A66A]' : 'text-[#D6A84F]'
            }`}
          >
            {dealAccepted ? 'COMMITTED (LOCKED)' : 'PENDING APPROVAL'}
          </span>
          <span className="text-[10px] text-[#6C727A] font-sans block">Legal signature</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CLIENT RISK</span>
          <span className="font-mono font-bold text-xs text-[#D05A4A]">
            {customerRisk} RISK
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Penalty clause</span>
        </div>
      </div>

      {/* 4. WORK ACTIONS: DEALS & COMMITS */}
      <PixelPanel title="SALES // DEAL WORKSPACE" coordinate="LOOKOUT-01">
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-[#66727C] uppercase">APEX GLOBAL EXPANSION</span>
              <span className="font-bold text-sm text-[#59A66A]">₹50,00,000</span>
            </div>
            <button
              onClick={handleAcceptDeal}
              disabled={isTransmitting}
              className={`w-full py-2.5 px-3 font-pixel text-[10px] uppercase border cursor-pointer transition-all ${
                dealAccepted
                  ? 'bg-[#122416] text-[#4ADE80] border-[#4ADE80] font-bold'
                  : 'bg-[#59A66A] text-[#090B0F] border-[#59A66A] hover:bg-[#4E945D]'
              }`}
            >
              {isTransmitting
                ? '[ TRANSMITTING VIA REALTIME... ]'
                : dealAccepted
                ? '[ RE-COMMIT APEX DEAL (₹50.0L) ]'
                : '[ ACCEPT APEX GLOBAL DEAL (₹50.0L) ]'}
            </button>
          </div>

          {/* Interactive Customer Delivery Commitment change for Demo Scenario */}
          <div className="p-3 bg-[#101419] border border-[#D6A84F]/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#D6A84F] uppercase font-bold tracking-wider">
                CUSTOMER DELIVERY COMMITMENT
              </span>
              <span className="text-[10px] text-[#A0AFA9] font-mono">
                Apex Global
              </span>
            </div>

            <p className="text-[11px] font-sans text-[#A9ADA8] leading-tight">
              Customer requested expedited milestone delivery for core enterprise deployment.
            </p>

            <div className="p-2 bg-[#141A20] border border-[#2A333B] flex items-center justify-between text-xs font-mono">
              <span className="text-[#A9ADA8]">Commitment:</span>
              <div className="flex items-center gap-2">
                <span className={deadline === 'June 20' ? 'text-[#D6A84F] font-bold' : 'text-[#6C727A] line-through'}>
                  June 20
                </span>
                <span className="text-[#A9ADA8]">→</span>
                <span className={deadline === 'June 12' ? 'text-[#4ADE80] font-bold bg-[#4ADE80]/15 px-1.5 py-0.5 border border-[#4ADE80]/30' : 'text-[#A9ADA8]'}>
                  June 12
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                setIsTransmitting(true);
                const prevDate = deadline === 'June 12' ? 'June 12' : 'June 20';
                const nextDate = deadline === 'June 12' ? 'June 20' : 'June 12';

                try {
                  const res = await publishDecisionEvent({
                    organization_id: ENTERPRISE_OPERATOR.organizationId,
                    department: 'sales',
                    event_type: 'deadline_changed',
                    entity_id: 'DEAL-APEX-50L',
                    payload: {
                      deal_id: 'DEAL-APEX-50L',
                      customer_name: 'Apex Global',
                      previous_deadline: prevDate,
                      new_deadline: nextDate,
                      reason: 'Customer procurement requested expedited rollout timeline',
                      penalty_clause_active: true,
                    },
                    created_by: ENTERPRISE_OPERATOR.fullName,
                  });

                  setDeadline(nextDate);
                  const eventId = res.event?.id || `evt_${Date.now()}`;
                  setTransmissionFeedback({
                    status: 'success',
                    message: `Saved. Delivery commitment changed to ${nextDate}. Broadcasted to Executive Decision Desk.`,
                    eventId,
                  });

                  setRecentEvents((prev) => [
                    {
                      id: eventId,
                      type: 'deadline_changed',
                      detail: `Apex Global commitment moved: ${prevDate} → ${nextDate}`,
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
              }}
              disabled={isTransmitting}
              className="w-full py-2.5 px-3 font-pixel text-[10px] uppercase border cursor-pointer bg-[#D6A84F] text-[#090B0F] hover:bg-[#C2953E] border-[#D6A84F] font-bold transition-all shadow-sm"
            >
              {isTransmitting
                ? '[ SAVING & BROADCASTING... ]'
                : deadline === 'June 12'
                ? '[ RESET COMMITMENT TO JUNE 20 ]'
                : '[ SAVE CHANGE: EXPEDITE TO JUNE 12 ]'}
            </button>
          </div>

          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <span className="text-[10px] text-[#66727C] uppercase block mb-1.5">INTAKE NEW PIPELINE OPPORTUNITY</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCreateDeal('Helios Capital License', 3500000)}
                disabled={isTransmitting}
                className="py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border bg-[#141A20] text-[#A9ADA8] border-[#2A333B] hover:text-[#E8E4D8]"
              >
                + Helios (₹35L)
              </button>
              <button
                onClick={() => handleCreateDeal('Vanguard Security Add-on', 2000000)}
                disabled={isTransmitting}
                className="py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border bg-[#141A20] text-[#A9ADA8] border-[#2A333B] hover:text-[#E8E4D8]"
              >
                + Vanguard (₹20L)
              </button>
            </div>
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
            {transmissionFeedback.status === 'success' ? '✓ SALES UPDATE COMMITTED' : '⚠ TRANSMISSION FAILED'}
          </div>
          <div className="mt-1 text-[11px]">{transmissionFeedback.message}</div>
          {transmissionFeedback.eventId && (
            <div className="text-[9px] opacity-75 mt-1">SUPABASE EVENT ID: {transmissionFeedback.eventId}</div>
          )}
        </div>
      )}

      {/* 6. RECENT SALES EVENTS LOG */}
      <PixelPanel title="RECENT SALES EVENTS" coordinate="AUDIT-SALE">
        <div className="space-y-1.5 font-mono text-[11px]">
          {recentEvents.map((evt) => (
            <div key={evt.id} className="p-2 bg-[#101419] border border-[#2A333B] flex justify-between items-center">
              <div>
                <span className="text-[#59A66A] font-semibold uppercase">{evt.type}</span>
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
