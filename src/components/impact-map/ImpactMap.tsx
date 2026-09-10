import React, { useState } from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { PixelButton } from '../pixel/PixelButton.tsx';
import { PixelIcon } from '../pixel/PixelIcon.tsx';
import { BearingIndicator } from '../business/BearingIndicator.tsx';
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
    <div className="w-full flex flex-col bg-[#0D1217] border border-[#2A333B] shadow-sm select-none overflow-hidden">
      {/* 1. Header: Metadata, Bearing, and Simulation Trigger */}
      <div className="px-4 py-2.5 bg-[#101419] border-b border-[#2A333B] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <PixelIcon name="compass" size={15} color="#D6A84F" />
          <span className="font-pixel text-xs text-[#E8E4D8] uppercase tracking-wider">
            BUSINESS NAVIGATION CHART // IMPACT MAP
          </span>
          {isAnalyzing && (
            <PixelBadge variant="danger" size="sm" pulse>
              ANALYZING CASCADE...
            </PixelBadge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Department Filter Tabs */}
          <div className="hidden sm:flex items-center gap-1 border border-[#2A333B] p-0.5 bg-[#141A20]">
            {(['all', 'sales', 'product', 'engineering', 'finance'] as const).map((dept) => (
              <button
                key={dept}
                onClick={() => setFilterDept(dept)}
                className={`px-2 py-0.5 font-mono text-[9px] uppercase cursor-pointer transition-colors ${
                  filterDept === dept
                    ? 'bg-[#D6A84F] text-[#090B0F] font-bold'
                    : 'text-[#A9ADA8] hover:text-white'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {onTriggerSimulation && (
            <PixelButton
              variant={isSimulatingCascade ? 'secondary' : 'primary'}
              size="sm"
              onClick={onTriggerSimulation}
              icon={<PixelIcon name="flare-red" size={12} />}
            >
              {isSimulatingCascade ? '[ RESET CHART ]' : '[ SIMULATE BUDGET CUT ]'}
            </PixelButton>
          )}
        </div>
      </div>

      {/* 2. Top Bearing & Grid Indicator Strip */}
      <div className="px-4 py-1.5 bg-[#0A0E13] border-b border-[#1C242C] flex items-center justify-between text-[10px] font-mono text-[#66727C]">
        <div className="flex items-center gap-4">
          <span>GRID SECTOR: 04-A</span>
          <span>CHART PROJECTION: ORTHOGONAL</span>
        </div>
        <BearingIndicator isSimulating={isSimulatingCascade} />
      </div>

      {/* 3. SVG Navigation Canvas */}
      <div className="relative w-full h-[480px] chart-grid-bg overflow-hidden">
        <svg viewBox="0 0 840 460" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Neutral Route Arrow */}
            <marker
              id="edge-arrow"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <polygon points="0,1 8,4 0,7" fill="#3B4752" />
            </marker>

            {/* Active Brass Propagation Arrow */}
            <marker
              id="edge-arrow-brass"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <polygon points="0,1 8,4 0,7" fill="#D6A84F" />
            </marker>

            {/* Restrained Red Hazard Arrow (Used selectively only on direct critical links) */}
            <marker
              id="edge-arrow-hazard"
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <polygon points="0,1 8,4 0,7" fill="#D05A4A" />
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
                      ? '#8F2823'
                      : isSourceLink || isAffectedLink
                      ? '#D6A84F'
                      : '#2A333B'
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
                    stroke="#D6A84F"
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
                  fill={isCriticalLink ? '#D05A4A' : isAffectedLink ? '#D6A84F' : '#66727C'}
                  className="font-mono text-[8px] uppercase tracking-wider"
                  style={{ textShadow: '0 1px 2px #090B0F' }}
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

            // Clean colors
            let borderColor = '#2A333B';
            let bgFill = '#141A20';
            let titleColor = '#E8E4D8';

            if (isSource) {
              borderColor = '#D6A84F';
              bgFill = '#231B0E';
              titleColor = '#D6A84F';
            } else if (isCritical) {
              borderColor = '#D05A4A';
              bgFill = '#241416';
              titleColor = '#E8E4D8';
            } else if (isAffected) {
              borderColor = '#D6A84F';
              bgFill = '#1C1811';
            }

            if (isSelected) {
              borderColor = '#FFFFFF';
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
                  strokeWidth={isSelected ? 1.5 : 1}
                  className="subtle-cut"
                />

                {/* Header Tag Bar */}
                <rect x="-68" y="-22" width="136" height="14" fill="#0E1217" />

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
          <div className="absolute bottom-3 left-3 max-w-sm bg-[#101419]/95 border border-[#2A333B] p-3 shadow-md backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 border-b border-[#2A333B] pb-1.5 mb-1.5">
              <span className="font-mono text-[9px] text-[#D6A84F] uppercase">
                INSPECTOR // {selectedEntity.entity_type} ({selectedEntity.department})
              </span>
              <PixelBadge
                variant={
                  affectedEntityIds.includes(selectedEntity.id) ? 'danger' : 'seaFoam'
                }
                size="sm"
              >
                {affectedEntityIds.includes(selectedEntity.id) ? 'AFFECTED' : 'STABLE'}
              </PixelBadge>
            </div>
            <h4 className="font-sans font-bold text-xs text-[#E8E4D8]">
              {selectedEntity.name}
            </h4>
            <p className="text-[11px] text-[#A9ADA8] font-sans mt-1 leading-snug">
              {selectedEntity.description}
            </p>
          </div>
        )}

        {/* Tactical Legend (Bottom Right Overlay) */}
        <div className="absolute bottom-3 right-3 hidden md:flex items-center gap-4 bg-[#101419]/90 border border-[#2A333B] px-3 py-1.5 text-[9px] font-mono text-[#A9ADA8]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#A9ADA8] font-bold">◇</span>
            <span>ENTITY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#D6A84F] font-bold">◆</span>
            <span>DECISION</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#AFCBC2] font-bold">◎</span>
            <span>OUTCOME</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-[#2A333B] pl-3">
            <span className="w-1.5 h-1.5 bg-[#D05A4A] inline-block" />
            <span>CRITICAL HAZARD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
