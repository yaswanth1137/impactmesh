import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DarkCardNode, type DarkCardNodeData } from './DarkCardNode.tsx';
import { NodeInspector } from './NodeInspector.tsx';
import type { BusinessEntity, Dependency } from '../../types/domain.ts';

export interface InteractiveImpactMapProps {
  entities: BusinessEntity[];
  dependencies: Dependency[];
  affectedEntityIds?: string[];
  isAnalyzing?: boolean;
  isSimulatingCascade?: boolean;
  onTriggerSimulation?: () => void;
  showFullMapDefault?: boolean;
}

const nodeTypes = {
  darkCard: DarkCardNode,
};

// Layout coordinates for clean horizontal process DAG (Celonis-inspired)
const DEFAULT_5_POSITIONS: Record<string, { x: number; y: number; metric: string; status: DarkCardNodeData['status'] }> = {
  'ent-deal-apex': { x: 40, y: 140, metric: '₹50L Contract', status: 'affected' },
  'ent-feat-sso': { x: 280, y: 140, metric: '180h Scope', status: 'affected' },
  'ent-res-eng': { x: 520, y: 140, metric: '140% Load (-120h)', status: 'critical' },
  'ent-outcome-delivery': { x: 760, y: 140, metric: '+8 Days Delay', status: 'critical' },
  'ent-cust-apex': { x: 1000, y: 140, metric: 'At Risk', status: 'affected' },
};

const FULL_POSITIONS: Record<string, { x: number; y: number; metric: string; status: DarkCardNodeData['status'] }> = {
  'ent-deal-apex': { x: 40, y: 80, metric: '₹50L Contract', status: 'affected' },
  'ent-feat-sso': { x: 280, y: 60, metric: '180h Scope', status: 'affected' },
  'ent-feat-reports': { x: 280, y: 220, metric: '120h Scope', status: 'affected' },
  'ent-budget-q1': { x: 520, y: 240, metric: '₹18L → ₹11L', status: 'source' },
  'ent-res-eng': { x: 520, y: 60, metric: '140% Load (-120h)', status: 'critical' },
  'ent-outcome-delivery': { x: 760, y: 60, metric: '+8 Days Delay', status: 'critical' },
  'ent-cust-apex': { x: 1000, y: 60, metric: 'At Risk', status: 'affected' },
  'ent-outcome-rev': { x: 1000, y: 220, metric: '₹50L Target', status: 'affected' },
};

const DEFAULT_5_EDGES = [
  { id: 'e-deal-feat', source: 'ent-deal-apex', target: 'ent-feat-sso' },
  { id: 'e-feat-res', source: 'ent-feat-sso', target: 'ent-res-eng' },
  { id: 'e-res-deliv', source: 'ent-res-eng', target: 'ent-outcome-delivery' },
  { id: 'e-deliv-cust', source: 'ent-outcome-delivery', target: 'ent-cust-apex' },
];

// Helper to construct nodes deterministically
function buildFlowNodes(
  entities: BusinessEntity[],
  showFull: boolean,
  dept: string,
  selectedId: string | null,
  affectedIds: string[],
  isSimulating: boolean
): Node[] {
  const positionMap = showFull ? FULL_POSITIONS : DEFAULT_5_POSITIONS;
  const activeIds = Object.keys(positionMap);

  return entities
    .filter((ent) => activeIds.includes(ent.id))
    .filter((ent) => dept === 'all' || ent.department.toLowerCase() === dept.toLowerCase())
    .map((ent) => {
      const config = positionMap[ent.id] || { x: 200, y: 100, metric: '', status: 'normal' as const };
      const isSelected = ent.id === selectedId;
      const isAffected = affectedIds.includes(ent.id);
      const status =
        isSimulating && ent.id === 'ent-budget-q1'
          ? 'source'
          : isSimulating && (ent.id === 'ent-res-eng' || ent.id === 'ent-outcome-delivery')
          ? 'critical'
          : isAffected
          ? 'affected'
          : config.status;

      return {
        id: ent.id,
        type: 'darkCard',
        position: { x: config.x, y: config.y },
        data: {
          id: ent.id,
          name: ent.name,
          type: ent.entity_type,
          metric: config.metric,
          department: ent.department,
          status,
          isSelected,
        },
      };
    });
}

// Helper to construct edges deterministically
function buildFlowEdges(
  dependencies: Dependency[],
  showFull: boolean,
  visibleIds: Set<string>,
  isSimulating: boolean
): Edge[] {
  if (!showFull) {
    return DEFAULT_5_EDGES
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => ({
        ...e,
        animated: isSimulating,
        style: { stroke: e.source === 'ent-res-eng' ? '#C86150' : '#C89638', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.source === 'ent-res-eng' ? '#C86150' : '#C89638',
          width: 14,
          height: 14,
        },
      }));
  }

  return dependencies
    .filter((dep) => visibleIds.has(dep.source_entity_id) && visibleIds.has(dep.target_entity_id))
    .map((dep) => {
      const isCritical =
        dep.source_entity_id === 'ent-res-eng' &&
        dep.target_entity_id === 'ent-outcome-delivery' &&
        isSimulating;
      const isSource = dep.source_entity_id === 'ent-budget-q1' && isSimulating;
      const color = isCritical ? '#C86150' : isSource ? '#C89638' : '#6F8F87';

      return {
        id: dep.id,
        source: dep.source_entity_id,
        target: dep.target_entity_id,
        animated: isCritical || isSource,
        style: {
          stroke: color,
          strokeWidth: isCritical ? 2 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 14,
          height: 14,
        },
      };
    });
}

// Internal graph canvas component with access to useReactFlow
const FlowCanvas: React.FC<{
  entities: BusinessEntity[];
  dependencies: Dependency[];
  affectedEntityIds?: string[];
  isAnalyzing?: boolean;
  isSimulatingCascade?: boolean;
  onTriggerSimulation?: () => void;
  showFullMapDefault?: boolean;
}> = ({
  entities,
  dependencies,
  affectedEntityIds = [],
  isAnalyzing = false,
  isSimulatingCascade = false,
  onTriggerSimulation,
  showFullMapDefault = false,
}) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [showFullMap, setShowFullMap] = useState<boolean>(showFullMapDefault);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Initial nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(() =>
    buildFlowNodes(entities, showFullMapDefault, 'all', null, affectedEntityIds, isSimulatingCascade)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(() => {
    const initialNodes = buildFlowNodes(entities, showFullMapDefault, 'all', null, affectedEntityIds, isSimulatingCascade);
    return buildFlowEdges(dependencies, showFullMapDefault, new Set(initialNodes.map((n) => n.id)), isSimulatingCascade);
  });

  // Re-synchronize when display parameters change
  useEffect(() => {
    const nextNodes = buildFlowNodes(
      entities,
      showFullMap,
      selectedDept,
      selectedEntityId,
      affectedEntityIds,
      isSimulatingCascade
    );
    const visibleIds = new Set(nextNodes.map((n) => n.id));
    const nextEdges = buildFlowEdges(dependencies, showFullMap, visibleIds, isSimulatingCascade);

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [showFullMap, selectedDept, selectedEntityId, isSimulatingCascade, entities, dependencies, affectedEntityIds, setNodes, setEdges]);

  // Node selection handler
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedEntityId(node.id);
    },
    []
  );

  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  const activePositionMap = showFullMap ? FULL_POSITIONS : DEFAULT_5_POSITIONS;
  const selectedNodeData = useMemo(() => {
    if (!selectedEntityId) return null;
    return activePositionMap[selectedEntityId];
  }, [selectedEntityId, activePositionMap]);

  const handleResetLayout = () => {
    const freshNodes = buildFlowNodes(
      entities,
      showFullMap,
      selectedDept,
      selectedEntityId,
      affectedEntityIds,
      isSimulatingCascade
    );
    setNodes(freshNodes);
    setTimeout(() => {
      fitView({ duration: 300, padding: 0.15 });
    }, 50);
  };

  return (
    <div className="space-y-3 select-none">
      {/* Top Controls & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD5C5] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#C89638] uppercase font-bold tracking-widest">
            INTERACTIVE GRAPH
          </span>
          <span className="text-[#718894]">/</span>
          <h3 className="font-sans font-bold text-base md:text-lg text-[#18201D] tracking-tight">
            Impact Map
          </h3>
          <span className="text-xs text-[#576560] hidden sm:inline">
            (How this decision affects the business)
          </span>
          {isAnalyzing && (
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#C86150]/10 text-[#C86150] border border-[#C86150]/30 rounded-2xs animate-pulse uppercase">
              Analyzing...
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subtle Department Filter */}
          <div className="flex items-center gap-1 text-xs font-mono bg-[#F3EFE5] p-1 border border-[#DDD5C5] rounded-xs">
            <span className="text-[#718894] text-[9px] uppercase px-1 font-bold">Filter:</span>
            {['all', 'sales', 'product', 'engineering', 'finance'].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-2 py-0.5 uppercase text-[10px] rounded-2xs transition-colors cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-[#C89638] text-[#FAF8F1] font-bold shadow-2xs'
                    : 'text-[#576560] hover:text-[#18201D] hover:bg-[#FAF8F1]'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Full Graph Toggle */}
          <button
            onClick={() => {
              setShowFullMap(!showFullMap);
              setTimeout(() => fitView({ duration: 300, padding: 0.15 }), 50);
            }}
            className="px-2.5 py-1 text-xs font-sans font-semibold bg-[#F3EFE5] border border-[#DDD5C5] text-[#18201D] hover:bg-[#FAF8F1] rounded-xs transition-colors cursor-pointer"
          >
            {showFullMap ? 'Simple View (5 Nodes)' : 'View Full Impact Map (8 Nodes)'}
          </button>

          {/* Reset / Fit View Controls */}
          <button
            onClick={handleResetLayout}
            className="px-2 py-1 text-xs font-sans bg-[#F3EFE5] border border-[#DDD5C5] text-[#576560] hover:text-[#18201D] rounded-xs transition-colors cursor-pointer"
            title="Reset node positions and fit view"
          >
            Fit Screen
          </button>

          {onTriggerSimulation && (
            <button
              onClick={onTriggerSimulation}
              className="px-2.5 py-1 text-xs font-sans font-semibold bg-[#F3EFE5] border border-[#C89638] text-[#18201D] hover:bg-[#FAF8F1] rounded-xs transition-colors cursor-pointer"
            >
              Simulate
            </button>
          )}
        </div>
      </div>

      {/* Interactive React Flow Canvas Container (Warm Ivory Background + Dark Black Cards) */}
      <div className="relative w-full h-[460px] bg-[#F3EFE5] border border-[#DDD5C5] rounded-xs overflow-hidden shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.5}
          maxZoom={1.5}
          preventScrolling={false}
          panOnDrag
          zoomOnScroll
          className="bg-[#F3EFE5]"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1.2}
            color="#D8CFBD"
          />
        </ReactFlow>

        {/* Floating Zoom Controls in Canvas */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-[#FAF8F1] border border-[#DDD5C5] p-1 rounded-xs shadow-xs text-xs font-mono">
          <button
            onClick={() => zoomIn({ duration: 200 })}
            className="w-6 h-6 flex items-center justify-center hover:bg-[#F3EFE5] text-[#18201D] font-bold rounded cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => zoomOut({ duration: 200 })}
            className="w-6 h-6 flex items-center justify-center hover:bg-[#F3EFE5] text-[#18201D] font-bold rounded cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => fitView({ duration: 250, padding: 0.18 })}
            className="px-2 h-6 flex items-center justify-center hover:bg-[#F3EFE5] text-[#576560] text-[10px] rounded cursor-pointer"
            title="Fit to Screen"
          >
            Fit
          </button>
        </div>

        {/* Dynamic Node Inspector Panel (Opens on Node Click) */}
        {selectedEntity && (
          <NodeInspector
            entity={selectedEntity}
            metric={selectedNodeData?.metric}
            status={selectedNodeData?.status === 'critical' ? '120h Deficit // Critical' : 'At Risk'}
            requiredBy={
              selectedEntity.id === 'ent-feat-sso'
                ? ['Apex Enterprise Expansion']
                : selectedEntity.id === 'ent-res-eng'
                ? ['Custom Executive Analytics', 'Enterprise SSO']
                : ['Downstream Deliverables']
            }
            blockedBy={
              selectedEntity.id === 'ent-feat-sso' || selectedEntity.id === 'ent-outcome-delivery'
                ? ['Engineering Capacity (120h gap)']
                : []
            }
            affectedAreas={
              selectedEntity.id === 'ent-res-eng'
                ? ['Product', 'Delivery', 'Customer SLA']
                : ['Delivery', 'Sales Commitment']
            }
            onClose={() => setSelectedEntityId(null)}
          />
        )}
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-sans text-[#576560] px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#18201D] border border-[#C89638]" />
            <span>Interactive Node (Draggable &amp; Clickable)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#18201D] border border-[#C86150]" />
            <span>Critical Exposure</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#C89638]" />
            <span>Causal Link</span>
          </span>
        </div>
        <span className="text-[#718894] font-mono text-[10px]">
          Click any card to inspect dependencies • Drag to rearrange
        </span>
      </div>
    </div>
  );
};

export const InteractiveImpactMap: React.FC<InteractiveImpactMapProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
};
