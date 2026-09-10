import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Bot,
  Server,
  Building2,
  Database,
  Radio,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Activity,
  Globe,
  Sliders,
  UserCheck,
  GitFork,
  X,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Save
} from 'lucide-react';
import type {
  WorkflowNodeData,
  WorkflowEdgeData,
  DemoPipelineStage,
  GraphMetric,
  GraphFilter,
  ServiceNodeType
} from '../types';

interface WorkflowGraphProps {
  nodesData: WorkflowNodeData[];
  edgesData?: WorkflowEdgeData[];
  selectedNodeId?: string | null;
  highlightedNodeId?: string | null;
  highlightedEdgeId?: string | null;
  onSelectNode?: (node: WorkflowNodeData | null) => void;
  onViewEvidence?: (nodeId: string) => void;
  onSimulateChange?: () => void;
  onSaveWorkflow?: () => void;
  onAddNode?: () => void;
  onInsertNodeBetween?: (sourceId: string, targetId: string, newNode: WorkflowNodeData) => void;
  stage?: DemoPipelineStage;
  isIncidentState?: boolean;
  initialMetric?: GraphMetric;
  readOnly?: boolean;
  className?: string;
}

interface CustomNodePayload extends WorkflowNodeData {
  stage?: DemoPipelineStage;
  activeMetric: GraphMetric;
  activeFilter: GraphFilter;
  isHovered: boolean;
  isNeighborHovered: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  onHoverNode: (node: WorkflowNodeData | null, event: React.MouseEvent) => void;
}

// ----------------------------------------------------------------------
// Apple-Style Compact Workflow Node Component (n8n / Linear feel)
// ----------------------------------------------------------------------
const EnterpriseWorkflowNode = ({
  data,
  selected
}: {
  data: CustomNodePayload;
  selected: boolean;
}) => {
  const isChanged = data.status === 'changed' || data.isRootCause;
  const isDirectImpact = data.impactClassification === 'direct_impact' || (data.status === 'critical' && data.errorRate > 40);
  const isDownstream = data.impactClassification === 'downstream_impact' || data.isAffected;
  const isPaused = data.stage === 'workflow_paused';

  const getNodeIcon = (type: ServiceNodeType) => {
    switch (type) {
      case 'agent':
        return <Bot className="w-3.5 h-3.5 text-blue-600" />;
      case 'tool':
      case 'api':
        return <Server className="w-3.5 h-3.5 text-amber-600" />;
      case 'database':
        return <Database className="w-3.5 h-3.5 text-indigo-600" />;
      case 'decision':
        return <GitFork className="w-3.5 h-3.5 text-purple-600" />;
      case 'approval':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'stream':
        return <Radio className="w-3.5 h-3.5 text-teal-600" />;
      case 'external':
        return <Globe className="w-3.5 h-3.5 text-violet-600" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  const getCardStyling = () => {
    // Focus / Selection treatment: Apple-style subtle blue ring
    if (selected || data.isHighlighted) {
      return 'border-blue-600 bg-white ring-2 ring-blue-500/70 shadow-sm -translate-y-0.5';
    }

    if (isPaused) {
      if (data.impactClassification === 'unaffected') {
        return 'border-slate-200 bg-white shadow-2xs hover:border-slate-300';
      }
      return 'border-red-300 bg-red-50/20 ring-1 ring-red-200 shadow-2xs';
    }

    if (isChanged) {
      return 'border-amber-400 bg-amber-50/25 ring-1 ring-amber-300/60 shadow-2xs';
    }

    if (isDirectImpact) {
      return 'border-red-400 bg-red-50/25 ring-1 ring-red-300/60 shadow-2xs';
    }

    if (isDownstream) {
      return 'border-rose-300 bg-rose-50/15 shadow-2xs';
    }

    return 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs';
  };

  const getStatusTextAndColor = () => {
    if (isPaused) {
      if (data.impactClassification === 'unaffected') {
        return { text: 'Unaffected', color: 'text-emerald-700', dot: 'bg-emerald-500' };
      }
      return { text: 'Paused • Contained', color: 'text-red-700', dot: 'bg-red-500' };
    }

    if (isChanged) {
      return { text: 'Changed (Drift)', color: 'text-amber-800', dot: 'bg-amber-500' };
    }

    if (isDirectImpact) {
      return { text: 'Direct Impact', color: 'text-red-700', dot: 'bg-red-600' };
    }

    if (isDownstream) {
      return { text: 'Downstream Risk', color: 'text-rose-700', dot: 'bg-rose-500' };
    }

    return { text: 'Healthy', color: 'text-emerald-700', dot: 'bg-emerald-500' };
  };

  const statusInfo = getStatusTextAndColor();

  return (
    <div
      onMouseEnter={(e) => data.onHoverNode(data, e)}
      onMouseLeave={(e) => data.onHoverNode(null, e)}
      className={`relative w-[230px] rounded-lg p-3 border transition-all duration-150 cursor-grab active:cursor-grabbing select-none font-sans ${
        data.isDimmed ? 'opacity-35 grayscale-[20%]' : 'opacity-100'
      } ${getCardStyling()}`}
    >
      {/* Target Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-300 !w-2.5 !h-2.5 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!bg-slate-300 !w-2.5 !h-2.5 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />

      {/* Row 1: Type Pill + Protocol/Version */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-600">
            {getNodeIcon(data.type)}
            <span>{data.type}</span>
          </span>
        </div>
        <span className="text-[9px] font-mono text-slate-400 font-medium truncate max-w-[95px]">
          {data.version || data.modelOrProtocol}
        </span>
      </div>

      {/* Row 2: Node Name */}
      <div className="mb-2">
        <h4 className="text-[11px] font-bold text-slate-900 leading-snug truncate" title={data.label}>
          {data.label}
        </h4>
      </div>

      {/* Row 3: Status & Telemetry Strip */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
          <span className={`font-semibold text-[10px] ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span
            className={`px-1 py-0.2 rounded ${
              data.activeMetric === 'latency'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-500'
            }`}
          >
            {data.latencyMs}ms
          </span>
          <span
            className={`px-1 py-0.2 rounded font-semibold ${
              data.activeMetric === 'errorRate'
                ? 'bg-red-50 text-red-600 font-bold'
                : data.errorRate > 5
                ? 'text-red-600 font-bold'
                : 'text-slate-500'
            }`}
          >
            {data.errorRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Source Connection Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-300 !w-2.5 !h-2.5 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!bg-slate-300 !w-2.5 !h-2.5 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />
    </div>
  );
};

// ----------------------------------------------------------------------
// Internal Graph Component with ReactFlow Controls, Draggable State & Floating Toolbar
// ----------------------------------------------------------------------
const FlowInner: React.FC<WorkflowGraphProps> = ({
  nodesData,
  edgesData,
  selectedNodeId,
  highlightedNodeId,
  highlightedEdgeId,
  onSelectNode,
  onViewEvidence,
  onSimulateChange,
  onSaveWorkflow,
  onAddNode,
  onInsertNodeBetween,
  stage = 'healthy',
  isIncidentState = false,
  initialMetric = 'health',
  className = ''
}) => {
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();

  const [activeMetric, setActiveMetric] = useState<GraphMetric>(initialMetric);
  const [activeFilter, setActiveFilter] = useState<GraphFilter>('all');

  // Tooltip hover states
  const [hoveredNode, setHoveredNode] = useState<{ node: WorkflowNodeData; x: number; y: number } | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ edge: WorkflowEdgeData; x: number; y: number } | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState<boolean>(false);

  // Insert Card / Node Between State
  const [isInsertModalOpen, setIsInsertModalOpen] = useState<boolean>(false);
  const [insertSourceId, setInsertSourceId] = useState<string>('');
  const [insertTargetId, setInsertTargetId] = useState<string>('');
  const [insertNodeName, setInsertNodeName] = useState<string>('Pydantic Schema Adapter');
  const [insertNodeType, setInsertNodeType] = useState<ServiceNodeType>('tool');
  const [insertNodeProtocol, setInsertNodeProtocol] = useState<string>('Pydantic v2 Guardrail');
  const [insertNodeOwner, setInsertNodeOwner] = useState<string>('API Governance Pod');
  const [insertNodeDesc, setInsertNodeDesc] = useState<string>('Validates & normalizes incoming payloads against Pydantic schema contract.');
  const [insertToast, setInsertToast] = useState<string | null>(null);

  // Fullscreen Viewport Mode State using HTML5 Fullscreen API
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [drawerNode, setDrawerNode] = useState<WorkflowNodeData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isDocFullscreen);
      setTimeout(() => {
        fitView({ duration: 250, padding: 0.18 });
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hoveredEdge) setHoveredEdge(null);
        if (hoveredNode) setHoveredNode(null);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, hoveredEdge, hoveredNode, fitView]);

  // Cache dragged positions across renders so nodes stay where dropped
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Sync drawer with selectedNodeId prop
  useEffect(() => {
    if (selectedNodeId) {
      const match = nodesData.find((n) => n.id === selectedNodeId);
      if (match) setDrawerNode(match);
    }
  }, [selectedNodeId, nodesData]);

  const nodeTypes = useMemo(() => ({ workflowNode: EnterpriseWorkflowNode }), []);

  // Standard DAG layout coordinates
  const defaultPositions: Record<string, { x: number; y: number }> = useMemo(
    () => ({
      'customer-identity-api': { x: 40, y: 90 },
      'customer-verification-agent': { x: 330, y: 90 },
      'fraud-assessment-agent': { x: 620, y: 90 },
      'approval-api': { x: 910, y: 90 },
      'audit-telemetry-sink': { x: 330, y: 270 },

      // Additional workflows
      'txn-gateway': { x: 40, y: 90 },
      'fraud-scorer-agent': { x: 340, y: 90 },
      'feature-store': { x: 640, y: 40 },
      'settlement-router': { x: 640, y: 190 },

      'doc-parser-agent': { x: 40, y: 90 },
      'crm-sync-api': { x: 350, y: 90 },
      'welcome-stream': { x: 660, y: 90 },

      'credit-bureau-agent': { x: 40, y: 90 },
      'pricing-calc-api': { x: 350, y: 90 },
      'loan-ledger-db': { x: 660, y: 90 },

      // Draft workflows
      'liquidity-agent': { x: 40, y: 90 },
      'ledger-api': { x: 340, y: 90 },
      'compliance-agent': { x: 640, y: 90 },
      'swift-gateway': { x: 930, y: 90 }
    }),
    []
  );

  const handleHoverNode = useCallback((node: WorkflowNodeData | null, event: React.MouseEvent) => {
    if (!node || isDraggingNode) {
      setHoveredNode(null);
      return;
    }
    if (containerRef.current) {
      const bounds = containerRef.current.getBoundingClientRect();
      setHoveredNode({
        node,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      });
    }
  }, [isDraggingNode]);

  const handleHoverEdge = useCallback(
    (edge: WorkflowEdgeData | null, event: React.MouseEvent) => {
      if (!edge || isDraggingNode) {
        setHoveredEdge(null);
        return;
      }
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        setHoveredEdge({
          edge,
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top
        });
      }
    },
    [isDraggingNode]
  );

  // Connected nodes map for hover neighbor highlighting
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const id = hoveredNode.node.id;
    const connected = new Set<string>([id]);
    const currentEdges = edgesData || [];
    currentEdges.forEach((e) => {
      if (e.source === id) connected.add(e.target);
      if (e.target === id) connected.add(e.source);
    });
    return connected;
  }, [hoveredNode, edgesData]);

  // Generate initial React Flow nodes with saved positions or computed DAG coords
  const buildFlowNodes = useCallback((): Node[] => {
    return nodesData.map((n, index) => {
      const cachedPos = positionsRef.current[n.id];
      const pos = cachedPos || defaultPositions[n.id] || {
        x: 40 + (index % 4) * 290,
        y: 90 + Math.floor(index / 4) * 170
      };

      if (!cachedPos) {
        positionsRef.current[n.id] = pos;
      }

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'changed' && (n.status === 'changed' || n.isRootCause)) ||
        (activeFilter === 'affected' && (n.isAffected || n.status === 'critical')) ||
        (activeFilter === 'healthy' && n.status === 'healthy');

      const isDimmed =
        !matchesFilter ||
        (hoveredNode !== null && !connectedNodeIds.has(n.id));

      const isHighlighted =
        highlightedNodeId === n.id ||
        (selectedNodeId === n.id && !drawerNode);

      return {
        id: n.id,
        type: 'workflowNode',
        position: pos,
        data: {
          ...n,
          stage,
          activeMetric,
          activeFilter,
          isHovered: hoveredNode?.node.id === n.id,
          isNeighborHovered: hoveredNode !== null && connectedNodeIds.has(n.id),
          isDimmed,
          isHighlighted,
          onHoverNode: handleHoverNode
        },
        selected: selectedNodeId === n.id || drawerNode?.id === n.id
      };
    });
  }, [
    nodesData,
    defaultPositions,
    activeFilter,
    activeMetric,
    hoveredNode,
    connectedNodeIds,
    highlightedNodeId,
    selectedNodeId,
    drawerNode,
    stage,
    handleHoverNode
  ]);

  // Build React Flow edges with telemetry and metric weights
  const defaultEdges: WorkflowEdgeData[] = useMemo(
    () => [
      {
        id: 'e1',
        source: 'customer-identity-api',
        target: 'customer-verification-agent',
        sourceLabel: 'Customer Identity API',
        targetLabel: 'Customer Verification Agent',
        protocol: 'REST / JSON',
        latencyMs: 32,
        requestsPerMin: '18.4K / min',
        failureRate: '6.8%',
        propagationType: 'DIRECT',
        isImpactPath: true
      },
      {
        id: 'e2',
        source: 'customer-verification-agent',
        target: 'fraud-assessment-agent',
        sourceLabel: 'Customer Verification Agent',
        targetLabel: 'Fraud Assessment Agent',
        protocol: 'Agentic ToolCall',
        latencyMs: 28,
        requestsPerMin: '14.2K / min',
        failureRate: '4.2%',
        propagationType: 'CASCADE',
        isImpactPath: true
      },
      {
        id: 'e3',
        source: 'fraud-assessment-agent',
        target: 'approval-api',
        sourceLabel: 'Fraud Assessment Agent',
        targetLabel: 'Approval API',
        protocol: 'gRPC v2',
        latencyMs: 24,
        requestsPerMin: '8.6K / min',
        failureRate: '1.8%',
        propagationType: 'CASCADE',
        isImpactPath: true
      },
      {
        id: 'e4',
        source: 'customer-identity-api',
        target: 'audit-telemetry-sink',
        sourceLabel: 'Customer Identity API',
        targetLabel: 'Audit & Compliance Sink',
        protocol: 'Kafka Event',
        latencyMs: 14,
        requestsPerMin: '18.4K / min',
        failureRate: '0.0%',
        propagationType: 'NONE',
        isImpactPath: false
      }
    ],
    []
  );

  const rawEdges = edgesData && edgesData.length > 0 ? edgesData : defaultEdges;

  const buildFlowEdges = useCallback((): Edge[] => {
    return rawEdges.map((e) => {
      const isImpact = isIncidentState && e.isImpactPath;
      const isEdgeHighlighted =
        highlightedEdgeId === e.id ||
        (hoveredNode && (hoveredNode.node.id === e.source || hoveredNode.node.id === e.target)) ||
        hoveredEdge?.edge.id === e.id;

      let edgeStroke = isImpact ? '#dc2626' : '#cbd5e1';
      let strokeWidth = 1.5;
      let labelText = `${e.protocol} • ${e.latencyMs}ms`;

      if (activeMetric === 'latency') {
        labelText = `${e.latencyMs}ms`;
        if (e.latencyMs > 30) edgeStroke = '#2563eb';
      } else if (activeMetric === 'errorRate') {
        labelText = e.failureRate ? `${e.failureRate} errors` : `${e.latencyMs}ms`;
        if (e.failureRate && parseFloat(e.failureRate) > 1) {
          edgeStroke = '#dc2626';
          strokeWidth = 2.5;
        }
      } else if (activeMetric === 'traffic') {
        labelText = e.requestsPerMin || '10K / min';
        strokeWidth = e.requestsPerMin?.includes('42') ? 3 : e.requestsPerMin?.includes('18') ? 2.5 : 1.5;
        edgeStroke = '#2563eb';
      }

      if (isEdgeHighlighted) {
        strokeWidth = 3.5;
        edgeStroke = '#2563eb';
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.target === 'audit-telemetry-sink' ? 'bottom-source' : undefined,
        targetHandle: e.target === 'audit-telemetry-sink' ? 'top-target' : undefined,
        animated: isImpact || isEdgeHighlighted,
        label: labelText,
        labelStyle: {
          fill: isEdgeHighlighted ? '#1e40af' : isImpact ? '#dc2626' : '#64748b',
          fontSize: isEdgeHighlighted ? 10 : 9,
          fontFamily: 'ui-monospace, monospace',
          fontWeight: isImpact || isEdgeHighlighted ? '700' : '500'
        },
        labelBgStyle: isEdgeHighlighted
          ? {
              fill: '#eff6ff',
              fillOpacity: 1,
              stroke: '#3b82f6',
              strokeWidth: 1.5,
              rx: 4,
              ry: 4
            }
          : {
              fill: isImpact ? '#fef2f2' : '#ffffff',
              fillOpacity: 0.96,
              rx: 3,
              ry: 3
            },
        labelBgPadding: isEdgeHighlighted ? ([6, 3] as [number, number]) : ([4, 2] as [number, number]),
        style: {
          stroke: edgeStroke,
          strokeWidth,
          strokeDasharray: isImpact && !isEdgeHighlighted ? '4 4' : undefined,
          filter: isEdgeHighlighted ? 'drop-shadow(0 0 8px rgba(37,99,235,0.7))' : undefined,
          cursor: 'pointer',
          zIndex: isEdgeHighlighted ? 50 : 1
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isEdgeHighlighted ? '#2563eb' : isImpact ? '#dc2626' : '#94a3b8',
          width: isEdgeHighlighted ? 12 : 10,
          height: isEdgeHighlighted ? 12 : 10
        }
      };
    });
  }, [rawEdges, isIncidentState, activeMetric, highlightedEdgeId, hoveredNode, hoveredEdge]);

  // React Flow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(buildFlowNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildFlowEdges());

  // Synchronize when data props change
  useEffect(() => {
    setNodes(buildFlowNodes());
  }, [buildFlowNodes, setNodes]);

  useEffect(() => {
    setEdges(buildFlowEdges());
  }, [buildFlowEdges, setEdges]);

  // Auto-center canvas on highlighted node or edge
  useEffect(() => {
    if (highlightedNodeId) {
      const pos = positionsRef.current[highlightedNodeId] || defaultPositions[highlightedNodeId];
      if (pos) {
        setCenter(pos.x + 85, pos.y + 40, { zoom: 1.15, duration: 400 });
      }
    } else if (highlightedEdgeId) {
      const edge = rawEdges.find((e) => e.id === highlightedEdgeId);
      if (edge) {
        const p1 = positionsRef.current[edge.source] || defaultPositions[edge.source];
        const p2 = positionsRef.current[edge.target] || defaultPositions[edge.target];
        if (p1 && p2) {
          const midX = (p1.x + p2.x) / 2 + 85;
          const midY = (p1.y + p2.y) / 2 + 40;
          setCenter(midX, midY, { zoom: 1.2, duration: 400 });
        }
      }
    }
  }, [highlightedNodeId, highlightedEdgeId, rawEdges, setCenter, defaultPositions]);

  // Sync external node selection with drawer
  useEffect(() => {
    if (selectedNodeId) {
      const match = nodesData.find((n) => n.id === selectedNodeId);
      if (match) setDrawerNode(match);
    }
  }, [selectedNodeId, nodesData]);

  // Intercept node position changes to cache user drag coordinates
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          positionsRef.current[change.id] = change.position;
        }
      });
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Allow connecting nodes interactively (n8n canvas style)
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#2563eb', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#2563eb',
              width: 10,
              height: 10
            }
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const insertionPresets = [
    {
      name: '🛡️ Pydantic Schema Adapter & Guardrail',
      type: 'tool' as ServiceNodeType,
      protocol: 'Pydantic v2 Guardrail',
      owner: 'API Gateway Squad',
      desc: 'Intercepts incoming schema payloads, validates fields, and applies backward compatibility normalization.'
    },
    {
      name: '⚡ Groq FastTrack Triage Agent',
      type: 'agent' as ServiceNodeType,
      protocol: 'Groq / LLaMA 3.3 (Reasoning)',
      owner: 'Autonomous Agent Pod',
      desc: 'Evaluates customer signals and fast-tracks low-risk cases directly to instant fulfillment.'
    },
    {
      name: '🔒 Pre-Verification Compliance Gate',
      type: 'api' as ServiceNodeType,
      protocol: 'Enterprise gRPC / Policy v2',
      owner: 'SecOps & Compliance',
      desc: 'Enforces statutory compliance and identity check guardrails with cryptographic receipt generation.'
    },
    {
      name: '📊 Asynchronous Audit Telemetry Sink',
      type: 'database' as ServiceNodeType,
      protocol: 'Kafka EventStream / Postgres Wire',
      owner: 'Observability & Audit Core',
      desc: 'Captures immutable trace payloads and telemetry snapshots for continuous SLA monitoring.'
    }
  ];

  const handleOpenInsertModal = (source?: string, target?: string) => {
    if (source && target) {
      setInsertSourceId(source);
      setInsertTargetId(target);
    } else if (rawEdges.length > 0) {
      setInsertSourceId(rawEdges[0].source);
      setInsertTargetId(rawEdges[0].target);
    } else if (nodesData.length >= 2) {
      setInsertSourceId(nodesData[0].id);
      setInsertTargetId(nodesData[1].id);
    }
    setInsertNodeName('Pydantic Schema Adapter');
    setInsertNodeType('tool');
    setInsertNodeProtocol('Pydantic v2 Guardrail');
    setInsertNodeOwner('API Gateway Squad');
    setInsertNodeDesc('Intercepts incoming schema payloads, validates fields, and applies backward compatibility normalization.');
    setIsInsertModalOpen(true);
  };

  const handleConfirmInsert = () => {
    if (!insertNodeName.trim()) return;

    const sourceId = insertSourceId || rawEdges[0]?.source || nodesData[0]?.id;
    const targetId = insertTargetId || rawEdges[0]?.target || nodesData[1]?.id;

    const sourceNode = nodesData.find((n) => n.id === sourceId);
    const targetNode = nodesData.find((n) => n.id === targetId);

    const newId = `node-ins-${Date.now().toString(36)}`;
    const newNode: WorkflowNodeData = {
      id: newId,
      label: insertNodeName,
      type: insertNodeType,
      modelOrProtocol: insertNodeProtocol,
      status: 'healthy',
      latencyMs: insertNodeType === 'agent' ? 120 : 25,
      errorRate: 0.0,
      version: 'v1.0.0 (Inserted)',
      owner: insertNodeOwner,
      description: insertNodeDesc || `${insertNodeName} inserted between ${sourceNode?.label || sourceId} and ${targetNode?.label || targetId}.`,
      consumersCount: 1,
      lastEvaluated: 'Just now',
      impactClassification: 'unaffected'
    };

    // Calculate midway position between source and target
    const posSource = positionsRef.current[sourceId] || defaultPositions[sourceId] || { x: 100, y: 90 };
    const posTarget = positionsRef.current[targetId] || defaultPositions[targetId] || { x: 450, y: 90 };
    positionsRef.current[newId] = {
      x: Math.round((posSource.x + posTarget.x) / 2),
      y: Math.round((posSource.y + posTarget.y) / 2)
    };

    if (onInsertNodeBetween) {
      onInsertNodeBetween(sourceId, targetId, newNode);
    } else {
      // Local fallback
      const edge1: Edge = {
        id: `e-ins-${Date.now()}-1`,
        source: sourceId,
        target: newId,
        animated: true,
        style: { stroke: '#2563eb', strokeWidth: 2 }
      };
      const edge2: Edge = {
        id: `e-ins-${Date.now()}-2`,
        source: newId,
        target: targetId,
        animated: true,
        style: { stroke: '#2563eb', strokeWidth: 2 }
      };
      setNodes((prev) => [
        ...prev,
        {
          id: newId,
          type: 'workflowNode',
          position: positionsRef.current[newId],
          data: {
            ...newNode,
            stage,
            activeMetric,
            activeFilter,
            isHovered: false,
            isNeighborHovered: false,
            isDimmed: false,
            isHighlighted: true,
            onHoverNode: handleHoverNode
          }
        }
      ]);
      setEdges((prev) => [...prev.filter((e) => !(e.source === sourceId && e.target === targetId)), edge1, edge2]);
    }

    setInsertToast(`✓ Inserted "${insertNodeName}" in between ${sourceNode?.label || sourceId} and ${targetNode?.label || targetId}`);
    setTimeout(() => setInsertToast(null), 4500);
    setIsInsertModalOpen(false);
  };

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const matchedData = nodesData.find((n) => n.id === node.id) || (node.data as unknown as WorkflowNodeData);
      setDrawerNode(matchedData);
      if (onSelectNode) {
        onSelectNode(matchedData);
      }
    },
    [nodesData, onSelectNode]
  );

  const handleResetLayout = useCallback(() => {
    positionsRef.current = {};
    setNodes(buildFlowNodes());
    setTimeout(() => {
      fitView({ duration: 250, padding: 0.18 });
    }, 50);
  }, [buildFlowNodes, fitView, setNodes]);

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-200 select-none overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen bg-slate-900 border-none rounded-none'
          : `h-full w-full min-h-[440px] bg-slate-50/40 rounded-xl border border-slate-200/80 ${className}`
      }`}
    >
      {/* FULLSCREEN STUDIO HEADER BANNER (When expanded to full device screen) */}
      {isFullscreen && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-slate-900/95 text-white border border-slate-700 shadow-xl flex items-center gap-3 text-xs backdrop-blur-md animate-fadeIn font-mono">
          <span className="flex items-center gap-1.5 text-blue-400 font-bold">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>FULLSCREEN WORKFLOW STUDIO</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 text-[11px] font-sans">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-white">ESC</kbd> or click button to exit
          </span>
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-0.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Minimize2 className="w-3 h-3 text-white" />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      )}

      {/* 1. TOP-LEFT METRIC & FILTER CONTROLS */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-xs border border-slate-200/90 px-3 py-1.5 rounded-lg shadow-2xs text-xs">
        {/* Metric Selector */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-400">Metric:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
            {(['health', 'latency', 'errorRate', 'traffic'] as GraphMetric[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-all cursor-pointer ${
                  activeMetric === metric
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {metric === 'errorRate' ? 'Error Rate' : metric}
              </button>
            ))}
          </div>
        </div>

        <span className="text-slate-200">|</span>

        {/* Filter Selector */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Filter:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
            {(['all', 'changed', 'affected', 'healthy'] as GraphFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-all cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TOP-RIGHT ZOOM / PAN / FULLSCREEN CONTROLS */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-slate-200/90 p-1 rounded-lg shadow-2xs text-xs">
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Zoom Out (−)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
        <button
          onClick={() => fitView({ duration: 200, padding: 0.18 })}
          className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          title="Fit entire workflow in view"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Fit</span>
        </button>
        <button
          onClick={handleResetLayout}
          className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          title="Reset Layout"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          <span>Reset</span>
        </button>
        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
        <button
          onClick={toggleFullscreen}
          className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
            isFullscreen
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
          }`}
          title={isFullscreen ? 'Exit Full Screen Mode (ESC)' : 'Expand to Full Screen of Device'}
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3 text-white" /> : <Maximize2 className="w-3 h-3 text-blue-600" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
        </button>
      </div>

      {/* 3. FLOATING CANVAS TOOLBAR (Bottom Center - Apple / Linear style) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-full shadow-lg text-xs">
        {onAddNode && (
          <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
            <button
              onClick={onAddNode}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Add New Node"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span>Add Node</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenInsertModal()}
            className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Insert an intermediate guardrail, agent, or adapter card in between two steps"
          >
            <GitFork className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Insert Card in Between</span>
          </button>

          {onSimulateChange && (
            <button
              onClick={onSimulateChange}
              className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              <span>Simulate Change</span>
            </button>
          )}

          {onSaveWorkflow && (
            <button
              onClick={onSaveWorkflow}
              className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3 h-3 text-slate-300" />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. BOTTOM-LEFT MINIMAL LEGEND */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-xs border border-slate-200 px-3 py-1 rounded-md shadow-2xs text-[10px] font-medium text-slate-600">
        <span className="font-bold text-slate-800">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Healthy
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Changed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          Affected
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          Nominal
        </span>
      </div>

      {/* 5. REACT FLOW CANVAS WITH NATIVE DRAG & DROP AND PAN/ZOOM */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_e, node) => {
          setHoveredEdge(null);
          handleNodeClick(_e, node);
        }}
        onPaneClick={() => {
          setHoveredEdge(null);
          setHoveredNode(null);
        }}
        onMoveStart={() => {
          setHoveredEdge(null);
          setHoveredNode(null);
        }}
        onNodeDragStart={() => {
          setIsDraggingNode(true);
          setHoveredNode(null);
          setHoveredEdge(null);
        }}
        onNodeDragStop={() => {
          setIsDraggingNode(false);
        }}
        nodeTypes={nodeTypes}
        onEdgeClick={(_e, edge) => {
          const raw = rawEdges.find((re) => re.id === edge.id);
          if (raw) handleHoverEdge(raw, _e);
        }}
        onEdgeMouseEnter={(_e, edge) => {
          const raw = rawEdges.find((re) => re.id === edge.id);
          if (raw) handleHoverEdge(raw, _e);
        }}
        onEdgeMouseLeave={(_e) => handleHoverEdge(null, _e)}
        nodesDraggable={true}
        elementsSelectable={true}
        panOnDrag={true}
        selectionOnDrag={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={true}
        minZoom={0.25}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        className="bg-slate-50/30"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
      </ReactFlow>

      {/* 6. FLOATING NODE TELEMETRY TOOLTIP (On Hover) */}
      {hoveredNode && !drawerNode && !isDraggingNode && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(hoveredNode.x + 12, 680)}px`,
            top: `${Math.max(hoveredNode.y - 80, 20)}px`
          }}
          className="pointer-events-none z-30 w-64 rounded-lg bg-slate-900/95 text-white p-2.5 shadow-xl backdrop-blur-xs border border-slate-800 text-[11px] space-y-1.5 transition-all duration-150 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-white text-xs">{hoveredNode.node.label}</span>
            <span
              className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                hoveredNode.node.status === 'changed'
                  ? 'bg-amber-500 text-slate-900'
                  : hoveredNode.node.status === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {hoveredNode.node.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
            {hoveredNode.node.occurrences !== undefined ? (
              <>
                <div>
                  <span className="text-slate-400 block text-[9px]">Occurrences:</span>
                  <span className="font-bold text-white">{hoveredNode.node.occurrences.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Cases:</span>
                  <span className="font-bold text-blue-400">{hoveredNode.node.casesCount?.toLocaleString() ?? 'All'}</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-slate-400 block text-[9px]">Contract:</span>
                  <span className="text-white truncate">{hoveredNode.node.version}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Consumers:</span>
                  <span className="text-white">{hoveredNode.node.consumersCount ?? 2} active</span>
                </div>
              </>
            )}
            <div>
              <span className="text-slate-400 block text-[9px]">Latency:</span>
              <span className="font-bold text-white">{hoveredNode.node.latencyMs} ms</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Error Rate:</span>
              <span
                className={`font-bold ${
                  hoveredNode.node.errorRate > 5 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {hoveredNode.node.errorRate}%
              </span>
            </div>
          </div>

          {hoveredNode.node.changeSummary && (
            <div className="text-[10px] text-amber-300 border-t border-slate-800 pt-1 leading-tight">
              {hoveredNode.node.changeSummary}
            </div>
          )}
        </div>
      )}

      {/* 7. FLOATING EDGE DEPENDENCY TOOLTIP (On Edge Hover / Click) */}
      {hoveredEdge && !drawerNode && !isDraggingNode && (
        <div
          onMouseLeave={() => setHoveredEdge(null)}
          style={{
            position: 'absolute',
            left: `${Math.min(hoveredEdge.x + 12, 680)}px`,
            top: `${Math.max(hoveredEdge.y - 85, 20)}px`
          }}
          className="pointer-events-auto z-30 w-64 rounded-lg bg-slate-900/95 text-white p-3 shadow-xl backdrop-blur-xs border border-slate-800 text-[11px] space-y-2 transition-all duration-150 animate-fadeIn"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1 truncate max-w-[200px]">
              <span className="text-blue-400 truncate">{hoveredEdge.edge.sourceLabel || hoveredEdge.edge.source}</span>
              <span className="text-slate-500">&rarr;</span>
              <span className="text-blue-400 truncate">{hoveredEdge.edge.targetLabel || hoveredEdge.edge.target}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHoveredEdge(null);
              }}
              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close details"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 text-[10px] font-mono text-slate-300">
            {hoveredEdge.edge.transitionCount !== undefined || hoveredEdge.edge.frequency !== undefined ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Observed:</span>
                  <span className="font-bold text-blue-300">
                    {(hoveredEdge.edge.casesCount || 1).toLocaleString()} cases
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frequency:</span>
                  <span className="font-bold text-white">
                    {(hoveredEdge.edge.transitionCount || hoveredEdge.edge.frequency || 1).toLocaleString()} events
                  </span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between">
              <span className="text-slate-400">Protocol:</span>
              <span className="font-semibold text-white truncate max-w-[140px]">{hoveredEdge.edge.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Throughput:</span>
              <span className="text-white">{hoveredEdge.edge.requestsPerMin || '18.4K / min'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Failure Rate:</span>
              <span className="text-red-400 font-bold">{hoveredEdge.edge.failureRate || '0.0%'}</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenInsertModal(hoveredEdge.edge.source, hoveredEdge.edge.target);
            }}
            className="w-full py-1.5 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Insert Card in Between</span>
          </button>
        </div>
      )}

      {/* 8. SLIDE-OUT RIGHT DETAIL DRAWER (When Node is Clicked) */}
      {drawerNode && (
        <div className="absolute top-0 right-0 bottom-0 w-84 bg-white border-l border-slate-200/90 shadow-xl z-30 p-4.5 flex flex-col justify-between overflow-y-auto animate-slideLeft">
          <div className="space-y-3.5">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                  {drawerNode.type.toUpperCase()} COMPONENT
                </span>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {drawerNode.label}
                </h3>
              </div>
              <button
                onClick={() => {
                  setDrawerNode(null);
                  if (onSelectNode) onSelectNode(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* OVERVIEW METRICS */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Component Posture
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Status</span>
                  <span className="text-[10px] font-bold capitalize text-slate-800">
                    {drawerNode.status}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Risk Score</span>
                  <span className={`text-[10px] font-mono font-bold ${drawerNode.errorRate > 10 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {drawerNode.errorRate > 10 ? '82 / 100' : '12 / 100'}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Health</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700">
                    {drawerNode.errorRate > 10 ? '58%' : '99%'}
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE TELEMETRY */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Live Telemetry
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-medium">LATENCY</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {drawerNode.latencyMs} ms
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-medium">ERROR RATE</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      drawerNode.errorRate > 5 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {drawerNode.errorRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* DEPENDENCIES */}
            <div className="space-y-1 pt-1 border-t border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dependencies &amp; Downstream
              </span>
              <p className="text-[11px] text-slate-600">
                <strong className="text-slate-900">{drawerNode.consumersCount ?? 3} downstream consumers</strong> actively bound to this contract.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                Owner: {drawerNode.owner} &bull; Version: {drawerNode.version}
              </div>
            </div>

            {/* RECENT CHANGE */}
            <div className="space-y-1 pt-1 border-t border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Recent Change Analysis
              </span>
              <div className="p-2 rounded bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                {drawerNode.changeSummary || 'No breaking schema changes detected in last 24h.'}
              </div>
            </div>

            {/* IMPACT */}
            {(drawerNode.isAffected || drawerNode.isRootCause) && (
              <div className="space-y-1 pt-1 border-t border-slate-100 text-xs">
                <span className="text-[10px] font-bold text-red-900 uppercase tracking-wider block">
                  Predicted Impact
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium bg-red-50/50 p-2 rounded border border-red-200">
                  {drawerNode.whyAffected || '3 downstream components potentially affected by propagation.'}
                </p>
              </div>
            )}
          </div>

          {/* Drawer Actions */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {(drawerNode.isAffected || drawerNode.isRootCause) && onViewEvidence && (
              <button
                onClick={() => onViewEvidence(drawerNode.id)}
                className="w-full py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>View Incident Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => {
                setDrawerNode(null);
                if (onSelectNode) onSelectNode(null);
              }}
              className="w-full py-1.5 px-3 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* INSERTION SUCCESS TOAST */}
      {insertToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-emerald-900 text-white font-mono text-xs shadow-xl border border-emerald-700 flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{insertToast}</span>
        </div>
      )}

      {/* INSERT STEP / CARD INTO WORKFLOW MODAL */}
      {isInsertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Insert Card into Workflow</h3>
                  <p className="text-[11px] text-slate-500">
                    Splits the selected path and inserts an intermediary agent, API gateway, or guardrail step.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInsertModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* 1. Insertion Position */}
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                  1. Execution Path Location
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Preceding Step (Source)
                    </label>
                    <select
                      value={insertSourceId}
                      onChange={(e) => setInsertSourceId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {nodesData.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label} ({n.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Succeeding Step (Target)
                    </label>
                    <select
                      value={insertTargetId}
                      onChange={(e) => setInsertTargetId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {nodesData
                        .filter((n) => n.id !== insertSourceId)
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label} ({n.type})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. 1-Click Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  2. Quick-Apply Presets
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {insertionPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setInsertNodeName(preset.name.replace(/^[^\w\s]+/, '').trim());
                        setInsertNodeType(preset.type);
                        setInsertNodeProtocol(preset.protocol);
                        setInsertNodeOwner(preset.owner);
                        setInsertNodeDesc(preset.desc);
                      }}
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
                    >
                      <span className="font-bold text-slate-800 group-hover:text-blue-700 text-[11px] block leading-tight">
                        {preset.name}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                        {preset.protocol}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Card Configuration Form */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  3. Card Configuration
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Card / Node Name
                    </label>
                    <input
                      type="text"
                      value={insertNodeName}
                      onChange={(e) => setInsertNodeName(e.target.value)}
                      placeholder="e.g. Fraud Pattern Guardrail"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Component Type
                    </label>
                    <select
                      value={insertNodeType}
                      onChange={(e) => setInsertNodeType(e.target.value as ServiceNodeType)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none"
                    >
                      <option value="agent">Autonomous Agent (Groq-Powered)</option>
                      <option value="tool">Tool / Guardrail Adapter</option>
                      <option value="api">API / Gateway Service</option>
                      <option value="database">Database / Ledger Sink</option>
                      <option value="approval">Human-in-the-Loop Approval</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Model / Protocol
                    </label>
                    <input
                      type="text"
                      value={insertNodeProtocol}
                      onChange={(e) => setInsertNodeProtocol(e.target.value)}
                      placeholder="e.g. Groq / LLaMA 3.3 (Reasoning)"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Owner Pod
                    </label>
                    <input
                      type="text"
                      value={insertNodeOwner}
                      onChange={(e) => setInsertNodeOwner(e.target.value)}
                      placeholder="e.g. API Gateway Squad"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                    Operational Description
                  </label>
                  <textarea
                    rows={2}
                    value={insertNodeDesc}
                    onChange={(e) => setInsertNodeDesc(e.target.value)}
                    placeholder="Describe how this card operates in the pipeline..."
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsInsertModalOpen(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInsert}
                disabled={!insertNodeName.trim()}
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Card into Workflow</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const WorkflowGraph: React.FC<WorkflowGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
};
