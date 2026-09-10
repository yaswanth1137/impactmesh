import React, { useState, useEffect } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';
import { MobileDepartmentSwitcher } from '../../components/mobile/MobileDepartmentSwitcher.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';
import { securityPolicyService, ENTERPRISE_OPERATOR } from '../../lib/auth/auth-service.ts';

export const FinanceRoute: React.FC = () => {
  const [availableBudget, setAvailableBudget] = useState<number>(1100000);
  const [committedCost] = useState<number>(870000);
  const [spendingFreezeActive, setSpendingFreezeActive] = useState<boolean>(false);
  const [runwayMonths, setRunwayMonths] = useState<number>(8.2);

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
    { id: 'fin-init-01', type: 'budget_changed', detail: 'Budget ceiling set to ₹11,00,000 (-₹7L contraction)', time: '10:12:00' },
  ]);

  useEffect(() => {
    securityPolicyService.setCurrentUser(ENTERPRISE_OPERATOR);

    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    const unsubEvent = realtimeSubscriptionManager.onEvent((event) => {
      if (event.event_type === 'budget_changed' && event.payload) {
        const p = event.payload as any;
        if (p.new_budget) setAvailableBudget(p.new_budget);
      } else if (event.event_type === 'spending_freeze' && event.payload) {
        const p = event.payload as any;
        if (p.effective_immediately !== undefined) setSpendingFreezeActive(p.effective_immediately);
      } else if (event.event_type === 'runway_changed' && event.payload) {
        const p = event.payload as any;
        if (p.new_runway_months) setRunwayMonths(p.new_runway_months);
      }
    });

    return () => {
      unsubConn();
      unsubEvent();
    };
  }, []);

  const handleUpdateBudget = async (targetBudget: number) => {
    const prev = availableBudget;
    setAvailableBudget(targetBudget);
    setIsTransmitting(true);
    setTransmissionFeedback({ status: null, message: '' });

    try {
      const res = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'finance',
        event_type: 'budget_changed',
        entity_id: 'BUDGET-MAIN-TREASURY',
        payload: {
          department: 'finance',
          previous_budget: prev,
          new_budget: targetBudget,
          fiscal_period: 'Q3-2026',
          rationale: targetBudget <= 1100000
            ? 'Discretionary budget contraction (-₹7.0L deficit transmitted to engineering)'
            : 'Baseline budget allocation restored (₹18.0L)',
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      const eventId = res.event?.id || `evt_${Date.now()}`;
      setTransmissionFeedback({
        status: 'success',
        message: `Budget updated: ₹${(prev / 100000).toFixed(1)}L → ₹${(targetBudget / 100000).toFixed(1)}L // Synchronized with CEO Command`,
        eventId,
      });

      setRecentEvents((prevEvents) => [
        {
          id: eventId,
          type: 'budget_changed',
          detail: `Budget: ₹${(prev / 100000).toFixed(1)}L → ₹${(targetBudget / 100000).toFixed(1)}L`,
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

  const handleToggleFreeze = async () => {
    const nextFreeze = !spendingFreezeActive;
    setSpendingFreezeActive(nextFreeze);
    setIsTransmitting(true);

    try {
      const res = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'finance',
        event_type: 'spending_freeze',
        entity_id: 'FREEZE-EXPEDITURE-01',
        payload: {
          department: 'finance',
          effective_immediately: nextFreeze,
          exemptions: nextFreeze ? ['Critical Cloud SLA Infrastructure'] : [],
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      const eventId = res.event?.id || `evt_${Date.now()}`;
      setTransmissionFeedback({
        status: 'success',
        message: `Spending freeze ${nextFreeze ? 'ACTIVATED' : 'LIFTED'} // Broadcasted to Command Center`,
        eventId,
      });

      setRecentEvents((prevEvents) => [
        {
          id: eventId,
          type: 'spending_freeze',
          detail: nextFreeze ? 'Discretionary spending frozen' : 'Spending freeze lifted',
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
      <MobileDepartmentSwitcher currentDept="finance" connectionState={connectionState} />

      {/* 2. STATION & CHARACTER BANNER */}
      <div className="p-3 bg-[#141A20] border border-[#2A333B] flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="purser" size={44} showTitle />
          <div>
            <div className="font-pixel text-[11px] text-[#D6A84F] uppercase">THE TREASURY</div>
            <div className="text-[11px] font-mono text-[#A9ADA8]">Capital Ceiling & Cash Runway</div>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-[#66727C]">
          <div>DEVICE: MOBILE #4</div>
          <div className="text-[#D6A84F]">ACTIVE</div>
        </div>
      </div>

      {/* 3. PRIMARY METRICS STRIP */}
      <div className="grid grid-cols-2 gap-2 bg-[#141A20] border border-[#2A333B] p-2.5 shadow-sm">
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">AVAILABLE BUDGET</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#E8E4D8]">
            ₹{(availableBudget / 100000).toFixed(1)}L
          </span>
          <span className={`text-[10px] font-sans block ${availableBudget <= 1100000 ? 'text-[#D05A4A]' : 'text-[#59A66A]'}`}>
            {availableBudget <= 1100000 ? '-39% Contraction' : 'Standard Baseline'}
          </span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">COMMITTED COST</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#E8E4D8]">
            ₹{(committedCost / 100000).toFixed(1)}L
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Hard Commitments</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">SPENDING FREEZE</span>
          <span
            className={`font-mono font-bold text-xs ${
              spendingFreezeActive ? 'text-[#D05A4A]' : 'text-[#59A66A]'
            }`}
          >
            {spendingFreezeActive ? 'ACTIVE (FROZEN)' : 'UNLOCKED'}
          </span>
          <span className="text-[10px] text-[#6C727A] font-sans block">Policy status</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CASH RUNWAY</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#59A66A]">
            {runwayMonths} MO
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Liquidity Buffer</span>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: BUDGET CEILING CONTROLS */}
      <PixelPanel title="FINANCE // TREASURY CONTROLS" coordinate="TREASURY-01">
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-[#66727C] uppercase">DISCRETIONARY BUDGET CEILING</span>
              <span className="font-bold text-sm text-[#D6A84F]">₹{(availableBudget / 100000).toFixed(1)} Lakhs</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdateBudget(1800000)}
                disabled={isTransmitting}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border transition-all ${
                  availableBudget === 1800000
                    ? 'bg-[#59A66A] text-[#090B0F] border-[#59A66A] font-bold'
                    : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                ₹18,00,000 (Nominal)
              </button>
              <button
                onClick={() => handleUpdateBudget(1100000)}
                disabled={isTransmitting}
                className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border transition-all ${
                  availableBudget === 1100000
                    ? 'bg-[#D05A4A] text-[#E8E4D8] border-[#D05A4A] font-bold'
                    : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                ₹11,00,000 (-₹7L Cut)
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={handleToggleFreeze}
              disabled={isTransmitting}
              className={`w-full py-2.5 px-3 font-pixel text-[10px] uppercase border cursor-pointer transition-all ${
                spendingFreezeActive
                  ? 'bg-[#59A66A] text-[#090B0F] border-[#59A66A] font-bold'
                  : 'bg-[#291212] text-[#F87171] border-[#F87171] hover:bg-[#3D1A1A]'
              }`}
            >
              {spendingFreezeActive ? '[ LIFT SPENDING FREEZE ]' : '[ ACTIVATE SPENDING FREEZE ]'}
            </button>
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
            {transmissionFeedback.status === 'success' ? '✓ TREASURY UPDATE COMMITTED' : '⚠ TRANSMISSION FAILED'}
          </div>
          <div className="mt-1 text-[11px]">{transmissionFeedback.message}</div>
          {transmissionFeedback.eventId && (
            <div className="text-[9px] opacity-75 mt-1">SUPABASE EVENT ID: {transmissionFeedback.eventId}</div>
          )}
        </div>
      )}

      {/* 6. RECENT FINANCE EVENTS LOG */}
      <PixelPanel title="RECENT FINANCE EVENTS" coordinate="AUDIT-FIN">
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
