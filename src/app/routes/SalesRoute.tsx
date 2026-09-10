import React, { useState, useEffect } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelBadge } from '../../components/pixel/PixelBadge.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelIcon } from '../../components/pixel/PixelIcon.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager } from '../../lib/realtime/subscription-manager.ts';

export const SalesRoute: React.FC = () => {
  const [dealAccepted, setDealAccepted] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = realtimeSubscriptionManager.onEvent<'deal_accepted'>(() => {
      setDealAccepted(true);
    }, 'deal_accepted');

    return () => unsubscribe();
  }, []);

  const handleAcceptDeal = async () => {
    setDealAccepted(true);
    setIsTransmitting(true);

    try {
      await publishDecisionEvent({
        organization_id: '00000000-0000-0000-0000-000000000000',
        department: 'sales',
        event_type: 'deal_accepted',
        entity_id: 'DEAL-APEX-50L',
        payload: {
          deal_id: 'DEAL-APEX-50L',
          final_value: 5000000,
          close_date: '2026-09-30',
          sla_commitments: ['SAML SSO Compliance', '30 Calendar Days Delivery SLA', '3 Custom Modules'],
        },
        created_by: 'lookout_sales_lead',
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
          <PixelCharacter role="lookout" size={48} showTitle />
        </div>

        <div className="text-right font-mono text-xs text-[#66727C]">
          <div>STATION: THE LOOKOUT</div>
          <div className="text-[#AFCBC2]">DEVICE #1 // ACTIVE</div>
        </div>
      </div>

      {/* 2. Primary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#141A20] border border-[#2A333B] p-3 shadow-sm">
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">PIPELINE ARR</span>
          <span className="font-mono font-bold text-xl text-[#E8E4D8]">₹50.0L</span>
          <span className="text-[10px] text-[#59A66A] font-mono block">▲ +8.4% Target</span>
        </div>
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">ACTIVE DEALS</span>
          <span className="font-mono font-bold text-xl text-[#E8E4D8]">2 DEALS</span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Apex Global + Zenith</span>
        </div>
        <div className="p-2">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CUSTOMER SIGNAL</span>
          <span className="font-mono font-bold text-xl text-[#59A66A]">STABLE</span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">15% Churn Ceiling</span>
        </div>
      </div>

      {/* 3. Main Workspace: Enterprise Deal Intake */}
      <PixelPanel
        title="COMMERCIAL QUEUE // ENTERPRISE EXPANSION IN FOCUS"
        badge={
          dealAccepted ? (
            <PixelBadge variant="seaFoam" size="sm">
              DEAL ACCEPTED
            </PixelBadge>
          ) : (
            <PixelBadge variant="warning" size="sm">
              PENDING DECISION
            </PixelBadge>
          )
        }
        coordinate="LOOKOUT-01"
      >
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#2A333B] pb-3">
            <div>
              <span className="text-[10px] text-[#D6A84F] uppercase">CLIENT ACCOUNT</span>
              <h3 className="font-sans font-bold text-base text-[#E8E4D8]">
                Apex Global Financials
              </h3>
              <p className="text-xs text-[#A9ADA8] font-sans mt-0.5">
                Annual expansion license with mandatory SAML SSO compliance.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#66727C] block uppercase">VALUE</span>
              <span className="font-bold text-xl text-[#D6A84F]">₹50,00,000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2 bg-[#101419] border border-[#1C242C]">
              <span className="text-[#66727C] text-[9px] block">DELIVERY SLA</span>
              <span className="text-[#E8E4D8] font-bold">30 CALENDAR DAYS</span>
            </div>
            <div className="p-2 bg-[#101419] border border-[#1C242C]">
              <span className="text-[#66727C] text-[9px] block">CUSTOM FEATURES</span>
              <span className="text-[#E8E4D8] font-bold">3 MODULES</span>
            </div>
            <div className="p-2 bg-[#101419] border border-[#1C242C]">
              <span className="text-[#66727C] text-[9px] block">BREACH PENALTY</span>
              <span className="text-[#D05A4A] font-bold">2.5% / WEEK</span>
            </div>
          </div>

          {/* Decision Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2A333B]">
            <span className="text-[11px] text-[#A9ADA8] font-sans">
              Downstream coupling: Consumes 420h Engineering velocity.
            </span>
            <PixelButton
              variant={dealAccepted ? 'secondary' : 'primary'}
              size="sm"
              disabled={dealAccepted || isTransmitting}
              onClick={handleAcceptDeal}
              icon={<PixelIcon name="emblem-blacktide" size={13} />}
            >
              {isTransmitting
                ? 'TRANSMITTING VIA REALTIME...'
                : dealAccepted
                ? 'DEAL TRANSMITTED (CONTRACT SEALED)'
                : '[ ACCEPT ENTERPRISE DEAL ]'}
            </PixelButton>
          </div>
        </div>
      </PixelPanel>
    </div>
  );
};
