import React, { useState } from 'react';
import type { BusinessEntity } from '../../types/domain.ts';

export interface NodeInspectorProps {
  entity: BusinessEntity | null;
  metric?: string;
  status?: string;
  requiredBy?: string[];
  blockedBy?: string[];
  affectedAreas?: string[];
  evidenceText?: string;
  onClose: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  entity,
  metric = '',
  status = 'At risk',
  requiredBy = ['Apex Enterprise Expansion'],
  blockedBy = ['Core Platform Engineering (120h deficit)'],
  affectedAreas = ['Delivery', 'Customer SLA'],
  evidenceText = 'Scope requirement added following enterprise contract close. Constrained by available platform engineering hours in current sprint.',
  onClose,
}) => {
  const [showEvidence, setShowEvidence] = useState(false);

  if (!entity) return null;

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-[#18201D] text-[#FAF8F1] border-2 border-[#C89638] rounded-xs shadow-xl p-4 space-y-3 font-sans text-xs select-none animate-in fade-in slide-in-from-right-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[#2D3834] pb-2.5">
        <div>
          <span className="font-mono text-[9px] text-[#C89638] uppercase font-bold tracking-wider">
            {entity.entity_type} // {entity.department}
          </span>
          <h4 className="font-bold text-sm text-[#FAF8F1] mt-0.5 leading-tight">
            {entity.name}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-[#889B95] hover:text-[#FAF8F1] px-1.5 py-0.5 rounded cursor-pointer transition-colors text-sm"
          title="Close inspector"
        >
          ✕
        </button>
      </div>

      {/* Key Attributes Grid */}
      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className="p-2 bg-[#101419] border border-[#2D3834] rounded-xs">
          <span className="text-[9px] text-[#889B95] uppercase block">Status</span>
          <span className={`font-bold mt-0.5 block ${status.toLowerCase().includes('risk') || status.toLowerCase().includes('deficit') ? 'text-[#F87171]' : 'text-[#E0AB48]'}`}>
            {status}
          </span>
        </div>

        <div className="p-2 bg-[#101419] border border-[#2D3834] rounded-xs">
          <span className="text-[9px] text-[#889B95] uppercase block">Metric / Value</span>
          <span className="font-bold text-[#FAF8F1] mt-0.5 block truncate">
            {metric || 'Active'}
          </span>
        </div>
      </div>

      {/* Relationships */}
      <div className="space-y-2 text-[11px] pt-1">
        {requiredBy.length > 0 && (
          <div>
            <span className="text-[9px] font-mono text-[#889B95] uppercase block">Required by:</span>
            <span className="text-[#FAF8F1] font-medium">{requiredBy.join(', ')}</span>
          </div>
        )}

        {blockedBy.length > 0 && (
          <div>
            <span className="text-[9px] font-mono text-[#889B95] uppercase block">Blocked by:</span>
            <span className="text-[#F87171] font-medium">{blockedBy.join(', ')}</span>
          </div>
        )}

        {affectedAreas.length > 0 && (
          <div>
            <span className="text-[9px] font-mono text-[#889B95] uppercase block">Affected Areas:</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {affectedAreas.map((area) => (
                <span
                  key={area}
                  className="px-1.5 py-0.5 bg-[#2D3834] text-[#FAF8F1] font-mono text-[10px] rounded-2xs"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evidence Toggle */}
      <div className="pt-2 border-t border-[#2D3834]">
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="w-full text-left font-mono text-[10px] text-[#C89638] hover:text-[#E0AB48] flex items-center justify-between cursor-pointer py-1"
        >
          <span>{showEvidence ? '▼ Hide supporting evidence' : '▶ View supporting evidence'}</span>
        </button>

        {showEvidence && (
          <div className="mt-2 p-2 bg-[#101419] border border-[#2D3834] rounded-xs text-[10px] text-[#AFCBC2] leading-relaxed font-sans animate-in fade-in">
            {evidenceText}
          </div>
        )}
      </div>
    </div>
  );
};
