import React from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { PixelButton } from '../pixel/PixelButton.tsx';
import { PixelIcon } from '../pixel/PixelIcon.tsx';
import { EvidenceList } from './EvidenceList.tsx';
import type { Recommendation, DecisionOption } from '../../types/domain.ts';

interface RecommendationCardProps {
  recommendation: Recommendation;
  topOption: DecisionOption;
  onPlotRoute: () => void;
  onSimulate?: () => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  topOption,
  onPlotRoute,
  onSimulate,
  className = '',
}) => {
  return (
    <div
      className={`p-4 md:p-5 bg-[#141A20] border border-[#D6A84F] shadow-sm select-none ${className}`}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A333B] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <PixelIcon name="helm" size={15} color="#D6A84F" />
          <span className="font-pixel text-xs text-[#D6A84F] uppercase tracking-wider">
            RECOMMENDED COURSE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PixelBadge variant="seaFoam" size="sm">
            CONFIDENCE: {Math.round(recommendation.confidence_score * 100)}%
          </PixelBadge>
          <PixelBadge variant="brass" size="sm">
            SCORE: {topOption.feasibility_score}
          </PixelBadge>
        </div>
      </div>

      {/* Main Course Action Title */}
      <div className="mb-3">
        <h3 className="font-mono font-bold text-base text-[#E8E4D8] tracking-tight">
          {topOption.title}
        </h3>
        <p className="text-xs text-[#A9ADA8] font-sans mt-1 leading-relaxed">
          Preserve core customer commitment while removing non-critical custom scope.
        </p>
      </div>

      {/* Tactical Metric Readout Grid (4 clean metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">SAVINGS</span>
          <span className="font-mono font-bold text-xs text-[#59A66A]">₹2.4L</span>
        </div>
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CUSTOMER</span>
          <span className="font-mono font-bold text-xs text-[#AFCBC2]">LOW RISK</span>
        </div>
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">DELIVERY</span>
          <span className="font-mono font-bold text-xs text-[#AFCBC2]">STABLE</span>
        </div>
        <div className="p-2 bg-[#101419] border border-[#2A333B]">
          <span className="font-mono text-[9px] text-[#66727C] uppercase block">CONFIDENCE</span>
          <span className="font-mono font-bold text-xs text-[#D6A84F]">91%</span>
        </div>
      </div>

      {/* Strategic Reasoning Synthesis */}
      {recommendation.groq_reasoning && (
        <div className="p-3 bg-[#101419] border border-[#557A91]/40 mb-3.5">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#557A91] uppercase tracking-wider mb-1 font-bold">
            <span className="w-1.5 h-1.5 bg-[#557A91]" />
            STRATEGIC REASONING // SYNTHESIS
          </div>
          <p className="text-xs font-sans text-[#E8E4D8] leading-relaxed">
            {recommendation.groq_reasoning.executive_synthesis}
          </p>
        </div>
      )}

      {/* Evidence Dossier List */}
      <EvidenceList pros={topOption.tradeoffs.pros} risks={topOption.tradeoffs.risks} />

      {/* Action Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#2A333B]">
        {onSimulate && (
          <PixelButton variant="secondary" size="sm" onClick={onSimulate}>
            [ SIMULATE ]
          </PixelButton>
        )}
        <PixelButton
          variant="primary"
          size="sm"
          onClick={onPlotRoute}
          icon={<PixelIcon name="route-marker" size={13} />}
          className="ml-auto"
        >
          [ PLOT COURSE ]
        </PixelButton>
      </div>
    </div>
  );
};
