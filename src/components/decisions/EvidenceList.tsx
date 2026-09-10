import React from 'react';

interface EvidenceListProps {
  pros: string[];
  risks?: string[];
  className?: string;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  pros,
  risks = [],
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="font-pixel text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-[#59A66A]" />
        WHY THIS RECOMMENDATION? // EVIDENCE DOSSIER
      </div>

      <div className="space-y-1 text-xs font-mono">
        {pros.map((pro, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-1.5 bg-[#101419] border border-[#1C242C] text-[#E8E4D8]"
          >
            <span className="text-[#59A66A] font-bold shrink-0">✓</span>
            <span className="leading-snug">{pro}</span>
          </div>
        ))}

        {risks.length > 0 &&
          risks.map((risk, index) => (
            <div
              key={`risk-${index}`}
              className="flex items-start gap-2 p-1.5 bg-[#1A1214] border border-[#2E1618] text-[#D05A4A]"
            >
              <span className="font-bold shrink-0">⚠</span>
              <span className="leading-snug">{risk}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
