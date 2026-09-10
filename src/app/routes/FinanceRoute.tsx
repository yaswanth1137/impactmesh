import React, { useState } from 'react';
import { PixelPanel } from '../../components/pixel/PixelPanel.tsx';
import { PixelBadge } from '../../components/pixel/PixelBadge.tsx';
import { PixelButton } from '../../components/pixel/PixelButton.tsx';
import { PixelIcon } from '../../components/pixel/PixelIcon.tsx';
import { PixelCharacter } from '../../components/pixel/PixelCharacter.tsx';

export const FinanceRoute: React.FC = () => {
  const [budgetCutActive, setBudgetCutActive] = useState(true);

  return (
    <div className="space-y-5 pb-12 max-w-4xl mx-auto select-none">
      {/* 1. Header with Character Identity */}
      <div className="p-4 bg-[#141A20] border border-[#2A333B] flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <PixelCharacter role="purser" size={48} showTitle />
        </div>

        <div className="text-right font-mono text-xs text-[#66727C]">
          <div>STATION: THE TREASURY</div>
          <div className="text-[#59A66A]">DEVICE #4 // ACTIVE</div>
        </div>
      </div>

      {/* 2. Primary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#141A20] border border-[#2A333B] p-3 shadow-sm">
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">AVAILABLE CAPITAL</span>
          <span className="font-mono font-bold text-lg text-[#E8E4D8]">
            {budgetCutActive ? '₹11.0L' : '₹18.0L'}
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">
            {budgetCutActive ? '-39% Reduction' : 'Baseline Allocation'}
          </span>
        </div>
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">COMMITTED COST</span>
          <span className="font-mono font-bold text-lg text-[#E8E4D8]">₹8.7L</span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Committed baseline</span>
        </div>
        <div className="p-2 border-r border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">BUDGET PRESSURE</span>
          <span
            className={`font-mono font-bold text-lg ${
              budgetCutActive ? 'text-[#D05A4A]' : 'text-[#AFCBC2]'
            }`}
          >
            {budgetCutActive ? '79%' : '61%'}
          </span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">
            {budgetCutActive ? 'Ceiling reached' : 'Safe buffer'}
          </span>
        </div>
        <div className="p-2">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CASH RUNWAY</span>
          <span className="font-mono font-bold text-lg text-[#59A66A]">8.2 MO</span>
          <span className="text-[10px] text-[#A9ADA8] font-sans block">Liquidity buffer</span>
        </div>
      </div>

      {/* 3. Capital Allocation Controls */}
      <PixelPanel
        title="CAPITAL CONTROLS // DISCRETIONARY BUDGET CEILING"
        coordinate="TREASURY-04"
        badge={
          <PixelBadge variant={budgetCutActive ? 'danger' : 'seaFoam'} size="sm">
            {budgetCutActive ? 'BUDGET CUT ACTIVE' : 'STANDARD CEILING'}
          </PixelBadge>
        }
      >
        <div className="space-y-4 font-mono text-xs">
          <div className="p-3 bg-[#101419] border border-[#2A333B] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[#66727C] text-[10px] uppercase block">ACTIVE BUDGET CEILING</span>
              <div className="text-xl font-bold text-[#E8E4D8]">
                {budgetCutActive ? '₹11,00,000' : '₹18,00,000'}
              </div>
              <span className="text-[11px] text-[#A9ADA8] font-sans">
                {budgetCutActive
                  ? 'Active status: Capital reduction in effect (-₹7.0L deficit transmitted to engineering).'
                  : 'Baseline status: Full contractor allocation intact.'}
              </span>
            </div>

            <PixelButton
              variant={budgetCutActive ? 'secondary' : 'danger'}
              size="md"
              onClick={() => setBudgetCutActive((prev) => !prev)}
              icon={<PixelIcon name="coin" size={14} />}
            >
              {budgetCutActive
                ? '[ RESTORE BUDGET (₹18.0L) ]'
                : '[ TRANSMIT BUDGET CUT (₹18L → ₹11L) ]'}
            </PixelButton>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <PixelButton variant="secondary" size="sm">[ FREEZE SPEND ]</PixelButton>
            <PixelButton variant="secondary" size="sm">[ CHANGE COST ]</PixelButton>
            <PixelButton variant="secondary" size="sm">[ APPROVE FUND ]</PixelButton>
            <PixelButton variant="secondary" size="sm">[ UPDATE RUNWAY ]</PixelButton>
          </div>
        </div>
      </PixelPanel>
    </div>
  );
};
