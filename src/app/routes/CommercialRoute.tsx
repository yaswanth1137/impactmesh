import React, { useState, useEffect } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';
import { MobileDepartmentSwitcher } from '../../components/mobile/MobileDepartmentSwitcher.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../../lib/realtime/subscription-manager.ts';
import { securityPolicyService, ENTERPRISE_OPERATOR } from '../../lib/auth/auth-service.ts';

export const CommercialRoute: React.FC = () => {
  const [pipelineValue, setPipelineValue] = useState<number>(5000000);
  const [committedRevenue] = useState<number>(5000000);
  const [customerExposure] = useState<string>('Apex Global (72%)');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30');
  const [slaPenaltyExposure, setSlaPenaltyExposure] = useState<number>(500000);

  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('CONNECTED');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    eventId?: string;
  }>({
    status: null,
    message: '',
  });

  const [recentEvents, setRecentEvents] = useState<Array<{ id: string; type: string; detail: string; time: string }>>([
    { id: 'comm-init-01', type: 'pipeline_adjusted', detail: 'Baseline pipeline established at ₹50.0L', time: '10:20:00' },
  ]);

  useEffect(() => {
    securityPolicyService.setCurrentUser(ENTERPRISE_OPERATOR);

    const unsubConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    const unsubEvent = realtimeSubscriptionManager.onEvent((event) => {
      if (event.event_type === 'pipeline_adjusted' && event.payload) {
        const p = event.payload as any;
        if (p.new_pipeline_value) setPipelineValue(p.new_pipeline_value);
      } else if (event.event_type === 'commercial_terms_changed' && event.payload) {
        const p = event.payload as any;
        if (p.payment_terms) setPaymentTerms(p.payment_terms);
        if (p.sla_penalty_exposure) setSlaPenaltyExposure(p.sla_penalty_exposure);
      }
    });

    return () => {
      unsubConn();
      unsubEvent();
    };
  }, []);

  const handleAdjustPipeline = async (targetValue: number) => {
    const prev = pipelineValue;
    setPipelineValue(targetValue);
    setIsTransmitting(true);
    setFeedback({ status: null, message: '' });

    try {
      const res = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'commercial',
        event_type: 'pipeline_adjusted',
        entity_id: 'PIPE-COMMERCIAL-MAIN',
        payload: {
          pipeline_id: 'PIPE-COMMERCIAL-MAIN',
          deal_name: 'Apex Global & Strategic Expansion Pipeline',
          previous_pipeline_value: prev,
          new_pipeline_value: targetValue,
          weighted_pipeline: Math.round(targetValue * 0.8),
          active_deal_count: 4,
          stage: targetValue >= 5000000 ? 'Expansion' : 'Contracted',
          notes: `Commercial operator adjusted pipeline: ₹${(prev / 100000).toFixed(1)}L → ₹${(targetValue / 100000).toFixed(1)}L`,
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      const eventId = res.event?.id || `evt_${Date.now()}`;
      setFeedback({
        status: 'success',
        message: `Pipeline adjusted to ₹${(targetValue / 100000).toFixed(1)}L // Broadcasted via Supabase Realtime`,
        eventId,
      });

      setRecentEvents((prevEvents) => [
        {
          id: eventId,
          type: 'pipeline_adjusted',
          detail: `Pipeline ₹${(prev / 100000).toFixed(1)}L → ₹${(targetValue / 100000).toFixed(1)}L`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
        ...prevEvents.slice(0, 4),
      ]);
    } catch (err: any) {
      setFeedback({
        status: 'error',
        message: err.message || 'Transmission failed.',
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleUpdateTerms = async (terms: string, penalty: number) => {
    setPaymentTerms(terms);
    setSlaPenaltyExposure(penalty);
    setIsTransmitting(true);

    try {
      const res = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: 'commercial',
        event_type: 'commercial_terms_changed',
        entity_id: 'TERMS-APEX-GLOBAL',
        payload: {
          deal_id: 'DEAL-APEX-50L',
          customer_name: 'Apex Global',
          contract_value: committedRevenue,
          payment_terms: terms,
          sla_penalty_exposure: penalty,
          discount_applied_percent: terms === 'Net 60' ? 5 : 0,
          notes: `Commercial terms updated to ${terms} with ₹${(penalty / 100000).toFixed(1)}L exposure`,
        },
        created_by: ENTERPRISE_OPERATOR.fullName,
      });

      const eventId = res.event?.id || `evt_${Date.now()}`;
      setFeedback({
        status: 'success',
        message: `Commercial terms committed: ${terms} (SLA exposure ₹${(penalty / 100000).toFixed(1)}L)`,
        eventId,
      });

      setRecentEvents((prevEvents) => [
        {
          id: eventId,
          type: 'commercial_terms_changed',
          detail: `Terms: ${terms}, Penalty: ₹${(penalty / 100000).toFixed(1)}L`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
        ...prevEvents.slice(0, 4),
      ]);
    } catch (err: any) {
      setFeedback({
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
      <MobileDepartmentSwitcher currentDept="commercial" connectionState={connectionState} />

      {/* 2. STATION & CHARACTER BANNER */}
      <div className="p-3 bg-[#141A20] border border-[#2A333B] flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="lookout" size={44} showTitle />
          <div>
            <div className="font-pixel text-[11px] text-[#AFCBC2] uppercase">COMMERCIAL DESK</div>
            <div className="text-[11px] font-mono text-[#A9ADA8]">Contract Terms & Portfolio Exposure</div>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-[#66727C]">
          <div>DEVICE: MOBILE #3</div>
          <div className="text-[#AFCBC2]">ACTIVE</div>
        </div>
      </div>

      {/* 3. PRIMARY COMMERCIAL METRICS STRIP */}
      <div className="grid grid-cols-2 gap-2 bg-[#141A20] border border-[#2A333B] p-2.5 shadow-sm">
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">PIPELINE VALUE</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#E8E4D8]">
            ₹{(pipelineValue / 100000).toFixed(1)}L
          </span>
          <span className="text-[10px] text-[#AFCBC2] font-sans block">Weighted: ₹{((pipelineValue * 0.8) / 100000).toFixed(1)}L</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">COMMITTED REVENUE</span>
          <span className="font-mono font-bold text-base sm:text-lg text-[#59A66A]">
            ₹{(committedRevenue / 100000).toFixed(1)}L
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">SLA Locked</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CUSTOMER EXPOSURE</span>
          <span className="font-mono font-bold text-xs text-[#D6A84F] truncate block">
            {customerExposure}
          </span>
          <span className="text-[10px] text-[#6C727A] font-sans block">High dependency</span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">PAYMENT TERMS</span>
          <span className="font-mono font-bold text-xs text-[#E8E4D8] block">
            {paymentTerms} (Exposure: ₹{(slaPenaltyExposure / 100000).toFixed(1)}L)
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Penalty clause active</span>
        </div>
      </div>

      {/* 4. WORK ACTION: ADJUST PIPELINE VALUE */}
      <PixelPanel title="PIPELINE VOLUME CONTROLS" coordinate="COMM-01">
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-[#66727C] uppercase">TARGET PIPELINE CAPACITY</span>
              <span className="font-bold text-sm text-[#AFCBC2]">₹{(pipelineValue / 100000).toFixed(1)} Lakhs</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[3500000, 5000000, 6500000].map((val) => (
                <button
                  key={val}
                  onClick={() => handleAdjustPipeline(val)}
                  disabled={isTransmitting}
                  className={`py-2 px-1 text-center font-pixel text-[9px] uppercase cursor-pointer border transition-all ${
                    pipelineValue === val
                      ? 'bg-[#AFCBC2] text-[#090B0F] border-[#AFCBC2] font-bold'
                      : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B] hover:text-[#E8E4D8]'
                  }`}
                >
                  ₹{(val / 100000).toFixed(0)}L {val === 5000000 ? '(Baseline)' : val < 5000000 ? '(Deficit)' : '(Expansion)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PixelPanel>

      {/* 5. WORK ACTION: CONTRACT TERMS & SLA EXPOSURE */}
      <PixelPanel title="COMMERCIAL CONTRACT TERMS" coordinate="COMM-02">
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-[#101419] border border-[#2A333B]">
            <span className="text-[10px] text-[#66727C] uppercase block mb-2">TERMS & SLA PENALTY SCHEDULE</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdateTerms('Net 30', 500000)}
                disabled={isTransmitting}
                className={`py-2 px-2 text-left font-pixel text-[9px] uppercase cursor-pointer border ${
                  paymentTerms === 'Net 30'
                    ? 'bg-[#D6A84F] text-[#090B0F] border-[#D6A84F] font-bold'
                    : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                <div>[ NET 30 STANDARD ]</div>
                <div className="text-[8px] font-mono mt-0.5 opacity-80">SLA Penalty: ₹5.0L max</div>
              </button>

              <button
                onClick={() => handleUpdateTerms('Net 60', 1000000)}
                disabled={isTransmitting}
                className={`py-2 px-2 text-left font-pixel text-[9px] uppercase cursor-pointer border ${
                  paymentTerms === 'Net 60'
                    ? 'bg-[#D05A4A] text-[#E8E4D8] border-[#D05A4A] font-bold'
                    : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B]'
                }`}
              >
                <div>[ NET 60 EXTENDED ]</div>
                <div className="text-[8px] font-mono mt-0.5 opacity-80">SLA Penalty: ₹10.0L (+Risk)</div>
              </button>
            </div>
          </div>
        </div>
      </PixelPanel>

      {/* 6. VERIFIED TRANSMISSION RECEIPT */}
      {feedback.status && (
        <div
          className={`p-3 border font-mono text-xs ${
            feedback.status === 'success'
              ? 'bg-[#122416] border-[#4ADE80] text-[#4ADE80]'
              : 'bg-[#291212] border-[#F87171] text-[#F87171]'
          }`}
        >
          <div className="font-bold font-pixel text-[10px] uppercase">
            {feedback.status === 'success' ? '✓ COMMERCIAL UPDATE COMMITTED' : '⚠ TRANSMISSION FAILED'}
          </div>
          <div className="mt-1 text-[11px]">{feedback.message}</div>
          {feedback.eventId && (
            <div className="text-[9px] opacity-75 mt-1">SUPABASE EVENT ID: {feedback.eventId}</div>
          )}
        </div>
      )}

      {/* 7. RECENT COMMERCIAL EVENTS LOG */}
      <PixelPanel title="RECENT COMMERCIAL EVENTS" coordinate="AUDIT-COMM">
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
