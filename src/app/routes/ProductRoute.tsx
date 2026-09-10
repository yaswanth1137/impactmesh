import React, { useState } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelBadge } from '../../components/pixel/PixelBadge.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';

export const ProductRoute: React.FC = () => {
  const [scopeReduced, setScopeReduced] = useState(false);

  return (
    <div className="space-y-5 pb-12 max-w-4xl mx-auto select-none">
      {/* 1. Header with Character Identity */}
      <div className="p-4 bg-[#141A20] border border-[#2A333B] flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="navigator" size={48} showTitle />
        </div>

        <div className="text-right font-mono text-xs text-[#66727C]">
          <div>STATION: THE CHART ROOM</div>
          <div className="text-[#557A91]">DEVICE #2 // ACTIVE</div>
        </div>
      </div>

      {/* 2. Primary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#141A20] border border-[#2A333B] p-3 shadow-sm">
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">COMMITTED SCOPE</span>
          <span className="font-mono font-bold text-xl text-[#E8E4D8]">
            {scopeReduced ? '1 CORE' : '3 MODULES'}
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">
            {scopeReduced ? 'Secondary deferred' : 'SSO, Analytics, Audit'}
          </span>
        </div>
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">ENGINEERING LOAD</span>
          <span
            className={`font-mono font-bold text-xl ${
              scopeReduced ? 'text-[#59A66A]' : 'text-[#D05A4A]'
            }`}
          >
            {scopeReduced ? '180h' : '420h'}
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">
            {scopeReduced ? 'Within 300h cap' : '+120h Overload'}
          </span>
        </div>
        <div className="p-2">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CRITICAL PATH</span>
          <span className="font-mono font-bold text-xl text-[#D6A84F]">80% READY</span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Sprint 24 Target</span>
        </div>
      </div>

      {/* 3. Main Workspace: Roadmap Modules Breakdown */}
      <PixelPanel
        title="SPRINT-24 ROADMAP // SCOPE ALLOCATION"
        coordinate="CHART-02"
        badge={
          <PixelButton
            variant="outline"
            size="sm"
            onClick={() => setScopeReduced((prev) => !prev)}
          >
            {scopeReduced ? '[ RESTORE FULL SCOPE ]' : '[ DESCOPE NON-CRITICAL (120h) ]'}
          </PixelButton>
        }
      >
        <div className="space-y-2.5 font-mono text-xs">
          {/* Module 1: SAML SSO */}
          <div className="p-3 bg-[#101419] border border-[#2A333B] flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#59A66A] font-bold">●</span>
                <span className="text-[#E8E4D8] font-bold">Enterprise SAML SSO Integration</span>
                <PixelBadge variant="seaFoam" size="sm">CRITICAL PATH</PixelBadge>
              </div>
              <p className="text-[11px] text-[#A9ADA8] font-sans mt-0.5">
                Contractual requirement for Apex Global enterprise compliance.
              </p>
            </div>
            <span className="font-bold text-[#D6A84F] shrink-0">180h (80 pts)</span>
          </div>

          {/* Module 2: Custom Reports */}
          <div
            className={`p-3 border flex items-center justify-between gap-3 transition-colors ${
              scopeReduced
                ? 'bg-[#090B0F] border-[#1C242C] opacity-40'
                : 'bg-[#101419] border-[#2A333B]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={scopeReduced ? 'text-[#66727C]' : 'text-[#D05A4A]'}>●</span>
                <span className="text-[#E8E4D8] font-bold">Custom Executive Analytics</span>
                <PixelBadge variant={scopeReduced ? 'muted' : 'warning'} size="sm">
                  {scopeReduced ? 'DEFERRED PHASE 2' : 'AT RISK'}
                </PixelBadge>
              </div>
              <p className="text-[11px] text-[#A9ADA8] font-sans mt-0.5">
                Secondary custom visualization requested during intake.
              </p>
            </div>
            <span className="font-bold text-[#A9ADA8] shrink-0">120h (40 pts)</span>
          </div>

          {/* Module 3: Audit Export */}
          <div
            className={`p-3 border flex items-center justify-between gap-3 transition-colors ${
              scopeReduced
                ? 'bg-[#090B0F] border-[#1C242C] opacity-40'
                : 'bg-[#101419] border-[#2A333B]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={scopeReduced ? 'text-[#66727C]' : 'text-[#D05A4A]'}>●</span>
                <span className="text-[#E8E4D8] font-bold">Realtime Audit Telemetry Export</span>
                <PixelBadge variant={scopeReduced ? 'muted' : 'warning'} size="sm">
                  {scopeReduced ? 'DEFERRED PHASE 2' : 'AT RISK'}
                </PixelBadge>
              </div>
              <p className="text-[11px] text-[#A9ADA8] font-sans mt-0.5">
                Cloud compliance telemetry streaming.
              </p>
            </div>
            <span className="font-bold text-[#A9ADA8] shrink-0">120h (35 pts)</span>
          </div>
        </div>
      </PixelPanel>
    </div>
  );
};
