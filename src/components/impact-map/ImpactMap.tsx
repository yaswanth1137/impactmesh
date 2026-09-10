import React, { useState } from 'react';
import type { BusinessEntity, Dependency } from '../../types/domain.ts';

export interface ImpactMapProps {
  entities: BusinessEntity[];
  dependencies: Dependency[];
  affectedEntityIds?: string[];
  isAnalyzing?: boolean;
  isSimulatingCascade?: boolean;
  onSelectEntity?: (entity: BusinessEntity) => void;
  onTriggerSimulation?: () => void;
}

type NodeClass = 'entity' | 'decision' | 'outcome';

interface VisualNode {
  id: string;
  x: number;
  y: number;
  name: string;
  type: string;
  metric: string;
  department: string;
  nodeClass: NodeClass;
  status: 'normal' | 'affected' | 'critical' | 'source';
}

export const ImpactMap: React.FC<ImpactMapProps> = ({
  entities,
  dependencies,
  affectedEntityIds = [],
  isAnalyzing = false,
  isSimulatingCascade = false,
  onSelectEntity,
  onTriggerSimulation,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('ent-budget-q1');
  const [filterDept, setFilterDept] = useState<string>('all');

  // Exact coordinates designed to prevent route overlapping or interior crossing
  const nodeLayoutConfig: Record<
    string,
    { x: number; y: number; metric: string; nodeClass: NodeClass }
  > = {
    'ent-cust-apex': { x: 130, y: 70, metric: '₹24L ARR', nodeClass: 'entity' },
    'ent-deal-apex': { x: 380, y: 70, metric: '₹50L EXPANSION', nodeClass: 'entity' },
    'ent-feat-sso': { x: 380, y: 185, metric: '180h SCOPE (SAML)', nodeClass: 'entity' },
    'ent-feat-reports': { x: 130, y: 185, metric: '120h NON-CRITICAL', nodeClass: 'entity' },
    'ent-budget-q1': { x: 670, y: 185, metric: '₹18L → ₹11L', nodeClass: 'decision' },
    'ent-res-eng': { x: 440, y: 295, metric: '140% UTILIZATION', nodeClass: 'entity' },
    'ent-outcome-delivery': { x: 230, y: 395, metric: '+8 DAYS SLIPPAGE', nodeClass: 'outcome' },
    'ent-outcome-rev': { x: 650, y: 395, metric: '₹50L ARR TARGET', nodeClass: 'outcome' },
  };

  const nodes: VisualNode[] = entities
    .map((ent) => {
      const config = nodeLayoutConfig[ent.id] || {
        x: 400,
        y: 200,
        metric: '',
        nodeClass: 'entity' as NodeClass,
      };

      const isAffected = affectedEntityIds.includes(ent.id);
      const isSource = ent.id === 'ent-budget-q1' && isSimulatingCascade;

      let status: VisualNode['status'] = 'normal';
      if (isSource) status = 'source';
      else if (isAffected && (ent.id === 'ent-res-eng' || ent.id === 'ent-outcome-delivery'))
        status = 'critical';
      else if (isAffected) status = 'affected';

      return {
        id: ent.id,
        x: config.x,
        y: config.y,
        name: ent.name,
        type: ent.entity_type,
        metric: config.metric,
        department: ent.department,
        nodeClass: config.nodeClass,
        status,
      };
    })
    .filter((n) => filterDept === 'all' || n.department === filterDept);

  const selectedEntity = entities.find((e) => e.id === selectedNodeId);

  // Exact anchor points calculation for 136x44 nodes (half width = 68, half height = 22)
  const getAnchor = (
    srcX: number,
    srcY: number,
    tgtX: number,
    tgtY: number
  ) => {
    const dx = tgtX - srcX;
    const dy = tgtY - srcY;

    // Anchor on edge of rectangle
    let x1 = srcX;
    let y1 = srcY;
    let x2 = tgtX;
    let y2 = tgtY;

    if (Math.abs(dx) > Math.abs(dy)) {
      x1 = dx > 0 ? srcX + 68 : srcX - 68;
      x2 = dx > 0 ? tgtX - 68 : tgtX + 68;
    } else {
      y1 = dy > 0 ? srcY + 22 : srcY - 22;
      y2 = dy > 0 ? tgtY - 22 : tgtY + 22;
    }

    return { x1, y1, x2, y2 };
  };

  return (
    <div className="p-4 md:p-5 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-xs space-y-3 select-none">
      {/* Chart Plotter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD5C5] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            STEP 04 // TOPOLOGY
          </span>
          <span className="text-[#718894]">/</span>
          <h3 className="font-sans font-bold text-base md:text-lg text-[#18201D] tracking-tight">
            ORGANIZATIONAL DEPENDENCY MAP
          </h3>
          {isAnalyzing && (
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#C86150]/10 text-[#C86150] border border-[#C86150]/30 rounded-2xs animate-pulse uppercase">
              ANALYZING...
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by Department */}
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className="text-[#718894] text-[10px] mr-1 uppercase">FILTER:</span>
            {['all', 'sales', 'product', 'engineering', 'finance'].map((dept) => (
              <button
                key={dept}
                onClick={() => setFilterDept(dept)}
                className={`px-2 py-0.5 uppercase text-[10px] rounded-2xs transition-colors cursor-pointer ${
                  filterDept === dept
                    ? 'bg-[#C89638] text-[#FAF8F1] font-bold'
                    : 'text-[#576560] hover:text-[#18201D] hover:bg-[#F3EFE5]'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {onTriggerSimulation && (
            <button
              onClick={onTriggerSimulation}
              className="px-2.5 py-1 text-xs font-sans font-semibold bg-[#F3EFE5] border border-[#DDD5C5] text-[#18201D] hover:bg-[#FAF8F1] rounded-xs transition-colors cursor-pointer"
            >
              {isSimulatingCascade ? 'RESET' : 'SIMULATE'}
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full h-[460px] bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs overflow-hidden chart-grid-bg">
        <svg
          viewBox="0 0 800 460"
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        >
          {/* Definitions for Markers & Gradients */}
          <defs>
            {/* Subtle Neutral Edge Arrowhead */}
            <marker
              id="edge-arrow"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <polygon points="0,1 8,4 0,7" fill="#DDD5C5" />
            </marker>

            {/* Active Brass Edge Arrowhead */}
            <marker
              id="edge-arrow-brass"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <polygon points="0,1 8,4 0,7" fill="#C89638" />
            </marker>

            {/* Restrained Red Hazard Arrow */}
            <marker
              id="edge-arrow-hazard"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <polygon points="0,1 8,4 0,7" fill="#C86150" />
            </marker>
          </defs>

          {/* Clean Calculated Navigation Routes (Edges) */}
          {dependencies.map((dep) => {
            const src = nodes.find((n) => n.id === dep.source_entity_id);
            const tgt = nodes.find((n) => n.id === dep.target_entity_id);
            if (!src || !tgt) return null;

            const { x1, y1, x2, y2 } = getAnchor(src.x, src.y, tgt.x, tgt.y);

            // Determine if route is part of active cascade
            const isSourceLink =
              dep.source_entity_id === 'ent-budget-q1' && isSimulatingCascade;
            const isCriticalLink =
              (dep.source_entity_id === 'ent-res-eng' &&
                dep.target_entity_id === 'ent-outcome-delivery') &&
              isSimulatingCascade;
            const isAffectedLink =
              affectedEntityIds.includes(dep.source_entity_id) &&
              affectedEntityIds.includes(dep.target_entity_id);

            // Midpoint coordinates for small, unobtrusive edge label
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={dep.id}>
                {/* Route Base Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isCriticalLink
                      ? '#C86150'
                      : isSourceLink || isAffectedLink
                      ? '#C89638'
                      : '#DDD5C5'
                  }
                  strokeWidth={isCriticalLink ? 2 : isAffectedLink ? 1.5 : 1}
                  markerEnd={
                    isCriticalLink
                      ? 'url(#edge-arrow-hazard)'
                      : isSourceLink || isAffectedLink
                      ? 'url(#edge-arrow-brass)'
                      : 'url(#edge-arrow)'
                  }
                />

                {/* Animated Signal Pulse along active route */}
                {(isSourceLink || isAffectedLink) && (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#C89638"
                    strokeWidth="1.5"
                    strokeDasharray="4,8"
                    className="route-pulse-brass"
                  />
                )}

                {/* Tiny, Unobtrusive Relationship Text Sitting Beside Edge (Not giant boxes) */}
                <text
                  x={midX}
                  y={midY - 4}
                  textAnchor="middle"
                  fill={isCriticalLink ? '#C86150' : isAffectedLink ? '#C89638' : '#718894'}
                  className="font-mono text-[8px] uppercase tracking-wider font-semibold"
                >
                  {dep.relation_type}
                </text>
              </g>
            );
          })}

          {/* Three Visual Classes of Nodes: ◇ Entity, ◆ Decision, ◎ Outcome */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isSource = node.status === 'source';
            const isCritical = node.status === 'critical';
            const isAffected = node.status === 'affected';

            // Distinct node class markers
            const classSymbol =
              node.nodeClass === 'decision'
                ? '◆'
                : node.nodeClass === 'outcome'
                ? '◎'
                : '◇';

            // Clean light theme colors
            let borderColor = '#DDD5C5';
            let bgFill = '#FAF8F1';
            let titleColor = '#18201D';

            if (isSource) {
              borderColor = '#C89638';
              bgFill = '#FAF8F1';
              titleColor = '#C89638';
            } else if (isCritical) {
              borderColor = '#C86150';
              bgFill = '#FAF8F1';
              titleColor = '#C86150';
            } else if (isAffected) {
              borderColor = '#C89638';
              bgFill = '#FAF8F1';
            }

            if (isSelected) {
              borderColor = '#18201D';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  const ent = entities.find((e) => e.id === node.id);
                  if (ent && onSelectEntity) onSelectEntity(ent);
                }}
                className={`cursor-pointer ${isCritical || isSource ? 'node-hazard-pulse' : ''}`}
              >
                {/* Node Box Enclosure (136x44) */}
                <rect
                  x="-68"
                  y="-22"
                  width="136"
                  height="44"
                  fill={bgFill}
                  stroke={borderColor}
                  strokeWidth={isSelected ? 2 : 1}
                  className="subtle-cut"
                />

                {/* Header Tag Bar */}
                <rect x="-68" y="-22" width="136" height="14" fill="#F3EFE5" />

                {/* Node Class Symbol & Type */}
                <text
                  x="-60"
                  y="-12"
                  fill={
                    node.nodeClass === 'decision'
                      ? '#D6A84F'
                      : node.nodeClass === 'outcome'
                      ? '#AFCBC2'
                      : '#A9ADA8'
                  }
                  className="font-mono font-bold text-[8px] uppercase tracking-wider"
                >
                  {classSymbol} {node.type}
                </text>

                {/* Department Code Tag */}
                <text
                  x="60"
                  y="-12"
                  textAnchor="end"
                  fill="#66727C"
                  className="font-mono text-[7px] uppercase"
                >
                  {node.department}
                </text>

                {/* Entity Name (Clean Modern Sans for maximum legibility) */}
                <text
                  x="-60"
                  y="4"
                  fill={titleColor}
                  className="font-sans font-semibold text-[10px]"
                >
                  {node.name.length > 17 ? `${node.name.substring(0, 16)}…` : node.name}
                </text>

                {/* Metric Readout (Monospace) */}
                <text
                  x="-60"
                  y="16"
                  fill={isCritical ? '#D05A4A' : isAffected ? '#D6A84F' : '#AFCBC2'}
                  className="font-mono text-[9px] font-semibold"
                >
                  {node.metric}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Entity Inspector Panel (Bottom Left Overlay) */}
        {selectedEntity && (
          <div className="absolute bottom-3 left-3 max-w-sm bg-[#FAF8F1]/95 border border-[#DDD5C5] p-3 shadow-md rounded-xs backdrop-blur-xs">
            <div className="flex items-center justify-between gap-2 border-b border-[#DDD5C5] pb-1.5 mb-1.5">
              <span className="font-mono text-[9px] text-[#C89638] uppercase font-bold">
                INSPECTOR // {selectedEntity.entity_type} ({selectedEntity.department})
              </span>
              <span
                className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-2xs uppercase ${
                  affectedEntityIds.includes(selectedEntity.id)
                    ? 'bg-[#C86150]/10 text-[#C86150] border border-[#C86150]/30'
                    : 'bg-[#5B8D70]/10 text-[#2D5A40] border border-[#5B8D70]/30'
                }`}
              >
                {affectedEntityIds.includes(selectedEntity.id) ? 'AFFECTED' : 'STABLE'}
              </span>
            </div>
            <h4 className="font-sans font-bold text-xs text-[#18201D]">
              {selectedEntity.name}
            </h4>
            <p className="text-[11px] text-[#576560] font-sans mt-1 leading-snug">
              {selectedEntity.description}
            </p>
          </div>
        )}

        {/* Legend (Bottom Right Overlay) */}
        <div className="absolute bottom-3 right-3 hidden md:flex items-center gap-4 bg-[#FAF8F1]/90 border border-[#DDD5C5] px-3 py-1.5 text-[9px] font-mono text-[#576560] rounded-xs shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#718894] font-bold">◇</span>
            <span>ENTITY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#C89638] font-bold">◆</span>
            <span>DECISION</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#718894] font-bold">◎</span>
            <span>OUTCOME</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-[#DDD5C5] pl-3">
            <span className="w-1.5 h-1.5 bg-[#C86150] inline-block rounded-full" />
            <span className="text-[#C86150] font-bold">CRITICAL DEFICIT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
