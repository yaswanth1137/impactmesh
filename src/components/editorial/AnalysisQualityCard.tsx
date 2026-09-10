import React from 'react';

interface AnalysisQualityCardProps {
  quality?: 'GOOD' | 'MODERATE' | 'LOW';
  dataCoverage?: number;
  dependencyCoverage?: number;
  constraintCoverage?: number;
  missingFields?: string[];
  onRequestMoreContext?: () => void;
  className?: string;
}

export const AnalysisQualityCard: React.FC<AnalysisQualityCardProps> = ({
  quality = 'GOOD',
  dataCoverage = 92,
  dependencyCoverage = 87,
  constraintCoverage = 100,
  missingFields = [],
  onRequestMoreContext,
  className = '',
}) => {
  const isGood = quality === 'GOOD';

  return (
    <div
      className={`p-4 bg-[#FAF8F1] border rounded-xs shadow-2xs ${
        isGood ? 'border-[#DDD5C5]' : 'border-[#C89638]'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DDD5C5]/80">
        <div>
          <div className="font-mono text-[9px] text-[#718894] tracking-widest uppercase font-bold">
            CONFIDENCE & TRUST
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-sans text-sm font-bold text-[#18201D]">
              ANALYSIS QUALITY:
            </span>
            <span
              className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded-2xs uppercase ${
                isGood
                  ? 'bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30'
                  : 'bg-[#C89638]/10 text-[#8B651B] border border-[#C89638]/30'
              }`}
            >
              {quality}
            </span>
          </div>
        </div>

        {missingFields.length > 0 && onRequestMoreContext && (
          <button
            onClick={onRequestMoreContext}
            className="px-2.5 py-1 text-xs font-sans font-semibold bg-[#F3EFE5] border border-[#C89638] text-[#18201D] hover:bg-[#FAF8F1] rounded-xs transition-colors cursor-pointer"
          >
            REQUEST MORE CONTEXT
          </button>
        )}
      </div>

      {/* Coverage Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center sm:text-left">
        <div>
          <div className="font-mono text-[9px] text-[#718894] uppercase">DATA COVERAGE</div>
          <div className="font-mono text-base font-bold text-[#18201D] mt-0.5">{dataCoverage}%</div>
        </div>

        <div>
          <div className="font-mono text-[9px] text-[#718894] uppercase">DEPENDENCY COVERAGE</div>
          <div className="font-mono text-base font-bold text-[#18201D] mt-0.5">{dependencyCoverage}%</div>
        </div>

        <div>
          <div className="font-mono text-[9px] text-[#718894] uppercase">CONSTRAINT COVERAGE</div>
          <div className="font-mono text-base font-bold text-[#18201D] mt-0.5">{constraintCoverage}%</div>
        </div>

        <div>
          <div className="font-mono text-[9px] text-[#718894] uppercase">CONTEXT AUDIT</div>
          <div
            className={`font-mono text-xs font-bold mt-1 ${
              missingFields.length === 0 ? 'text-[#5B8D70]' : 'text-[#C89638]'
            }`}
          >
            {missingFields.length === 0 ? 'COMPLETE' : `${missingFields.length} FIELD(S) PENDING`}
          </div>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#DDD5C5]/60 text-xs font-sans text-[#576560]">
          <span className="font-bold text-[#18201D]">Missing inputs: </span>
          {missingFields.join(', ')}
        </div>
      )}
    </div>
  );
};
