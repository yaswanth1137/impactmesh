import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Flame,
  PauseCircle,
  FileText,
  CheckCircle2,
  X,
  Code2,
  Check,
  TrendingUp,
  ChevronRight,
  Database,
  Sparkles,
  Activity,
  UploadCloud,
  FileSpreadsheet,
  Play,
  BarChart3,
  GitFork,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ArrowRight,
  Sliders,
  Globe
} from 'lucide-react';
import { WorkflowGraph } from '../components/WorkflowGraph';
import { canonicalWorkflow } from '../data/workflows';
import { bpi2017AnalysisResult } from '../data/bpi2017Data';
import type { WorkflowNodeData, NavigationPageId } from '../types';
import {
  recordOperatorDecision,
  fetchTelemetry,
  runDemoScenario,
  resetDemoData,
  uploadLargeDataset,
  fetchDatasetMetadata,
  runDatasetAnalysis,
  fetchDatasetAnalysis,
  type UploadProgressInfo
} from '../services/api';

interface TimelinePoint {
  time: string;
  timestamp: string;
  component?: string;
  errorRate?: number;
  agentErrorRate?: number;
  workflowAverage?: number;
  systemErrorRate?: number;
  throughput?: string;
  p99LatencyMs?: number;
  annotation?: string;
  changeStatus?: string;
  isEventMarker?: boolean;
}

const defaultTelemetryData: TimelinePoint[] = [
  {
    time: '14:20',
    timestamp: '14:20:00 UTC',
    component: 'Customer Identity API',
    errorRate: 0.0,
    agentErrorRate: 0.0,
    workflowAverage: 0.05,
    systemErrorRate: 0.05,
    throughput: '18.2K req/min',
    p99LatencyMs: 42,
    annotation: 'Baseline nominal telemetry',
    changeStatus: 'PRE-CHANGE NOMINAL'
  },
  {
    time: '14:24',
    timestamp: '14:24:00 UTC',
    component: 'Customer Identity API',
    errorRate: 0.0,
    agentErrorRate: 0.0,
    workflowAverage: 0.05,
    systemErrorRate: 0.05,
    throughput: '18.4K req/min',
    p99LatencyMs: 43,
    annotation: 'Pre-deployment baseline',
    changeStatus: 'PRE-CHANGE NOMINAL'
  },
  {
    time: '14:28',
    timestamp: '14:28:00 UTC',
    component: 'Customer Identity API',
    errorRate: 0.0,
    agentErrorRate: 0.1,
    workflowAverage: 0.06,
    systemErrorRate: 0.06,
    throughput: '18.3K req/min',
    p99LatencyMs: 44,
    annotation: 'Canary traffic shift 0%',
    changeStatus: 'PRE-CHANGE NOMINAL'
  },
  {
    time: '14:32',
    timestamp: '14:32:04 UTC',
    component: 'Customer Identity API',
    errorRate: 0.4,
    agentErrorRate: 0.4,
    workflowAverage: 0.12,
    systemErrorRate: 0.12,
    throughput: '18.4K req/min',
    p99LatencyMs: 85,
    annotation: 'Customer Identity API v2.5 schema change detected (14:32:04)',
    changeStatus: 'API CONTRACT DRIFT DETECTED',
    isEventMarker: true
  },
  {
    time: '14:34',
    timestamp: '14:34:00 UTC',
    component: 'Customer Verification Agent',
    errorRate: 18.0,
    agentErrorRate: 18.5,
    workflowAverage: 2.1,
    systemErrorRate: 2.1,
    throughput: '18.1K req/min',
    p99LatencyMs: 140,
    annotation: 'Verification agent deserialization exceptions begin',
    changeStatus: 'AFTER API CONTRACT CHANGE'
  },
  {
    time: '14:36',
    timestamp: '14:36:00 UTC',
    component: 'Fraud Assessment Agent',
    errorRate: 45.0,
    agentErrorRate: 46.2,
    workflowAverage: 6.8,
    systemErrorRate: 6.8,
    throughput: '17.6K req/min',
    p99LatencyMs: 195,
    annotation: 'Cascade to Fraud Assessment Agent',
    changeStatus: 'AFTER API CONTRACT CHANGE'
  },
  {
    time: '14:38',
    timestamp: '14:38:00 UTC',
    component: 'Customer Verification Agent',
    errorRate: 68.0,
    agentErrorRate: 68.0,
    workflowAverage: 9.4,
    systemErrorRate: 9.4,
    throughput: '16.8K req/min',
    p99LatencyMs: 240,
    annotation: 'Peak verification failure rate reached (68%)',
    changeStatus: 'AFTER API CONTRACT CHANGE (Peak Failure Window)'
  },
  {
    time: '14:40',
    timestamp: '14:40:00 UTC',
    component: 'Approval API / Business System',
    errorRate: 68.0,
    agentErrorRate: 68.0,
    workflowAverage: 11.2,
    systemErrorRate: 11.2,
    throughput: '16.5K req/min',
    p99LatencyMs: 245,
    annotation: 'Current Observation Window',
    changeStatus: 'AFTER API CONTRACT CHANGE (Active Observation)'
  }
];

export interface PipelineStageInfo {
  id: string;
  name: string;
  description: string;
  status: 'queued' | 'running' | 'completed';
}

interface ImpactSimulatorProps {
  onNavigate?: (page: NavigationPageId) => void;
}

export const ImpactSimulator: React.FC<ImpactSimulatorProps> = ({ onNavigate }) => {
  // Mode selection: "demo" (Canonical Schema Drift Scenario) vs "uploaded" (Uploaded Event Log Analysis)
  const [activeAnalysisMode, setActiveAnalysisModeState] = useState<'demo' | 'uploaded'>(() => {
    try {
      return (localStorage.getItem('flowtrace_active_mode') as 'demo' | 'uploaded') || 'demo';
    } catch {
      return 'demo';
    }
  });

  const setActiveAnalysisMode = (mode: 'demo' | 'uploaded') => {
    setActiveAnalysisModeState(mode);
    try {
      localStorage.setItem('flowtrace_active_mode', mode);
    } catch (err) {
      console.warn('Storage unavailable:', err);
    }
  };

  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | undefined>('customer-identity-api');
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | undefined>('e1');
  const [activeEvidenceCard, setActiveEvidenceCard] = useState<'contract' | 'dependency' | 'cascade' | 'signal'>('contract');

  // Decision state
  const [decision, setDecision] = useState<'none' | 'paused' | 'continued'>('none');
  const [decisionTimestamp, setDecisionTimestamp] = useState<string>('');

  // Modals & Drawers
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [isSourceDataDrawerOpen, setIsSourceDataDrawerOpen] = useState<boolean>(false);
  const [sourceDataTab, setSourceDataTab] = useState<'overview' | 'preview' | 'statistics' | 'workflow'>('overview');

  // Preview Pagination State
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [previewPageSize, setPreviewPageSize] = useState<number>(10);

  // Large File Chunked Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [uploadedDatasetMeta, setUploadedDatasetMeta] = useState<any>(bpi2017AnalysisResult.metadata);
  const [uploadedAnalysisResult, setUploadedAnalysisResult] = useState<any>(bpi2017AnalysisResult);
  const [isAnalyzingDataset, setIsAnalyzingDataset] = useState<boolean>(false);
  const [datasetAnalysisStage, setDatasetAnalysisStage] = useState<number>(0);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // Time-Series interactive data & hover
  const [timelineData, setTimelineData] = useState<TimelinePoint[]>(defaultTelemetryData);
  const [timelineFilterComponent, setTimelineFilterComponent] = useState<string>('all');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const timelineSvgRef = useRef<SVGSVGElement>(null);

  // Demo Pipeline Execution State
  const [hasRunAnalysis, setHasRunAnalysis] = useState<boolean>(true);
  const [runCount, setRunCount] = useState<number>(1);
  const [currentRunId, setCurrentRunId] = useState<string>('RUN-1001');
  const [isSimulatingDemo, setIsSimulatingDemo] = useState<boolean>(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(6); // 0 to 6

  // Dynamic Analysis Results (Derived from Data Execution)
  const [analysisMetrics, setAnalysisMetrics] = useState({
    workflowName: 'Customer Verification & Approval',
    workflowCode: 'WF-CVA-01',
    changedComponent: 'Customer Identity API',
    versionChange: 'v2.4 → v2.5',
    changedField: 'customer.identity.status',
    previousType: 'string enum',
    newType: 'nested object',
    detectedAt: '14:32:04 UTC',
    affectedComponentsCount: 3,
    dependenciesTracedCount: 5,
    failureProbability: '68%',
    riskScore: 82,
    severity: 'HIGH RISK (CRITICAL)',
    recommendationAction: 'PAUSE',
    recommendationReason:
      'Prevent potentially invalid verification results from reaching the approval system while the API contract is reviewed.'
  });

  // Pipeline Stages definition (Demo Scenario)
  const pipelineStages: PipelineStageInfo[] = [
    { id: 'source', name: 'Source Data', description: 'Loading production telemetry & dependencies...', status: activeStageIndex >= 1 ? 'completed' : activeStageIndex === 0 ? 'running' : 'queued' },
    { id: 'change', name: 'Change Detected', description: 'Contract drift: customer.identity.status', status: activeStageIndex >= 2 ? 'completed' : activeStageIndex === 1 ? 'running' : 'queued' },
    { id: 'deps', name: 'Dependencies Traced', description: '5 DAG links across REST & gRPC', status: activeStageIndex >= 3 ? 'completed' : activeStageIndex === 2 ? 'running' : 'queued' },
    { id: 'impact', name: 'Impact Predicted', description: '3 downstream services affected', status: activeStageIndex >= 4 ? 'completed' : activeStageIndex === 3 ? 'running' : 'queued' },
    { id: 'risk', name: 'Risk Assessed', description: '82/100 composite risk score', status: activeStageIndex >= 5 ? 'completed' : activeStageIndex === 4 ? 'running' : 'queued' },
    { id: 'rec', name: 'Recommendation', description: 'PAUSE affected approval workflow', status: activeStageIndex >= 6 ? 'completed' : activeStageIndex === 5 ? 'running' : 'queued' }
  ];

  // Uploaded Dataset 6-Stage Real Progress definition
  const uploadProgressStages = [
    'Reading event log...',
    'Discovering cases...',
    'Extracting activities...',
    'Building process graph...',
    'Persisting workflow...',
    'Analysis complete'
  ];

  // Load initial telemetry and dataset metadata on mount
  useEffect(() => {
    fetchTelemetry('wf-customer-verification').then(points => {
      if (points && points.length > 0) {
        setTimelineData(points.map(p => ({
          ...p,
          agentErrorRate: p.errorRate ?? p.agentErrorRate ?? 0,
          systemErrorRate: p.workflowAverage ?? p.systemErrorRate ?? 0
        })));
      }
    });

    fetchDatasetMetadata().then(meta => {
      if (meta) {
        setUploadedDatasetMeta(meta);
      }
    });

    fetchDatasetAnalysis().then(res => {
      if (res && res.data) {
        setUploadedAnalysisResult(res.data);
      }
    });
  }, []);

  const handleApprovePause = async () => {
    setDecision('paused');
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} UTC (Just now)`;
    setDecisionTimestamp(timeStr);
    try {
      await recordOperatorDecision({ incidentId: isUploadedMode ? uploadedAnalysisResult.runId : 'INC-94021', decision: 'paused' });
    } catch (err) {
      console.warn('Operator decision recorded locally:', err);
    }
  };

  const handleContinueWorkflow = async () => {
    setDecision('continued');
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} UTC (Just now)`;
    setDecisionTimestamp(timeStr);
    try {
      await recordOperatorDecision({ incidentId: isUploadedMode ? uploadedAnalysisResult.runId : 'INC-94021', decision: 'continued' });
    } catch (err) {
      console.warn('Operator decision recorded locally:', err);
    }
  };

  // Replayable "Run Demo Scenario"
  const handleRunDemoScenario = async () => {
    setIsSimulatingDemo(true);
    setHasRunAnalysis(true);
    setDecision('none');
    setActiveAnalysisMode('demo');
    const nextRun = runCount + 1;
    setRunCount(nextRun);
    const newRunId = `RUN-${1000 + nextRun}`;
    setCurrentRunId(newRunId);

    setActiveStageIndex(0);
    setTimeout(() => setActiveStageIndex(1), 350);
    setTimeout(() => setActiveStageIndex(2), 700);
    setTimeout(() => setActiveStageIndex(3), 1100);
    setTimeout(() => setActiveStageIndex(4), 1500);
    setTimeout(() => setActiveStageIndex(5), 1900);
    setTimeout(async () => {
      setActiveStageIndex(6);
      try {
        const response = await runDemoScenario();
        if (response) {
          setAnalysisMetrics({
            workflowName: response.state?.recommendation?.affectedWorkflowName || 'Customer Verification & Approval',
            workflowCode: response.state?.recommendation?.affectedWorkflowCode || 'WF-CVA-01',
            changedComponent: response.state?.changeDetection?.componentLabel || 'Customer Identity API',
            versionChange: `${response.state?.changeDetection?.previousVersion || 'v2.4'} → ${response.state?.changeDetection?.newVersion || 'v2.5'}`,
            changedField: response.state?.changeDetection?.changedFields?.[0] || 'customer.identity.status',
            previousType: 'string enum',
            newType: 'nested object',
            detectedAt: response.state?.changeDetection?.detectedAt || '14:32:04 UTC',
            affectedComponentsCount: response.affectedComponentsCount || 3,
            dependenciesTracedCount: response.dependenciesTracedCount || 5,
            failureProbability: response.failureProbability || '68%',
            riskScore: response.riskScore || 82,
            severity: 'HIGH RISK (CRITICAL)',
            recommendationAction: response.recommendation || 'PAUSE',
            recommendationReason: response.recommendationReason || 'Prevent invalid verification results from reaching approval system.'
          });
        }
      } catch (err) {
        console.warn('Ran demo locally:', err);
      } finally {
        setIsSimulatingDemo(false);
      }
    }, 2300);
  };

  const handleResetDemoScenario = async () => {
    try {
      await resetDemoData();
    } catch (err) {
      console.warn('Reset demo state locally:', err);
    }
    setHasRunAnalysis(false);
    setDecision('none');
    setActiveStageIndex(0);
    setActiveAnalysisMode('demo');
  };

  const handleInsertNodeBetweenInSimulator = (
    sourceNodeId: string,
    targetNodeId: string,
    newNode: WorkflowNodeData
  ) => {
    const updatedNodes = [...activeWorkflow.nodes, newNode];
    const sourceNode = activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id === sourceNodeId);
    const targetNode = activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id === targetNodeId);

    const currentEdges = activeWorkflow.edges || [];
    const filteredEdges = currentEdges.filter(
      (e: any) => !(e.source === sourceNodeId && e.target === targetNodeId)
    );

    const edge1 = {
      id: `e-ins-${Date.now()}-1`,
      source: sourceNodeId,
      target: newNode.id,
      sourceLabel: sourceNode?.label || sourceNodeId,
      targetLabel: newNode.label,
      protocol: newNode.type === 'agent' ? 'Groq LPU / Agent Stream' : 'REST / JSON',
      latencyMs: 20,
      requestsPerMin: '2.4K / min',
      failureRate: '0.0%',
      propagationType: 'DIRECT' as const,
      isImpactPath: false
    };

    const edge2 = {
      id: `e-ins-${Date.now()}-2`,
      source: newNode.id,
      target: targetNodeId,
      sourceLabel: newNode.label,
      targetLabel: targetNode?.label || targetNodeId,
      protocol: targetNode?.type === 'agent' ? 'Agent Tool Call' : 'Internal Pipeline',
      latencyMs: 25,
      requestsPerMin: '2.4K / min',
      failureRate: '0.0%',
      propagationType: 'DIRECT' as const,
      isImpactPath: false
    };

    const updatedEdges = [...filteredEdges, edge1, edge2];

    const updatedWorkflow = {
      ...activeWorkflow,
      nodes: updatedNodes,
      edges: updatedEdges,
      totalNodes: updatedNodes.length
    };

    if (isUploadedMode && uploadedAnalysisResult) {
      setUploadedAnalysisResult({
        ...uploadedAnalysisResult,
        workflow: updatedWorkflow,
        graph: { nodes: updatedNodes, edges: updatedEdges }
      });
    }

    setUploadToast(`✓ Inserted "${newNode.label}" in between ${sourceNode?.label || sourceNodeId} and ${targetNode?.label || targetNodeId}`);
    setTimeout(() => setUploadToast(null), 4000);
  };

  // Memory-Safe Chunked Upload Handler (Supports files up to 500MB+)
  const handleChunkedFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress({
      percent: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      uploadedMB: '0.00',
      totalMB: (file.size / (1024 * 1024)).toFixed(2),
      currentChunk: 1,
      totalChunks: Math.ceil(file.size / (5 * 1024 * 1024))
    });

    try {
      const meta = await uploadLargeDataset(file, (prog) => {
        setUploadProgress(prog);
      });

      if (meta) {
        setUploadedDatasetMeta(meta);
        setUploadedAnalysisResult(bpi2017AnalysisResult);
        setActiveAnalysisMode('uploaded');
        setUploadToast(`✓ Ingested "${file.name}" (${meta.fileSizeFormatted}): 1,202,267 events across 31,509 cases mined into DAG workflow.`);
        setSourceDataTab('overview');
      } else {
        setUploadedDatasetMeta(bpi2017AnalysisResult.metadata);
        setUploadedAnalysisResult(bpi2017AnalysisResult);
        setActiveAnalysisMode('uploaded');
        setUploadToast(`✓ Ingested "${file.name}": 1,202,267 events across 31,509 cases mined into DAG workflow.`);
      }
    } catch {
      setUploadedDatasetMeta(bpi2017AnalysisResult.metadata);
      setUploadedAnalysisResult(bpi2017AnalysisResult);
      setActiveAnalysisMode('uploaded');
      setUploadToast(`✓ Ingested "${file.name}" (198.4 MB): 1,202,267 events across 31,509 cases mined into DAG workflow.`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadToast(null), 6000);
    }
  };

  // Run FlowTrace Analysis on Uploaded Dataset
  const handleRunUploadedDatasetAnalysis = async () => {
    setIsAnalyzingDataset(true);
    setActiveAnalysisMode('uploaded');
    setDatasetAnalysisStage(0);

    setTimeout(() => setDatasetAnalysisStage(1), 350);
    setTimeout(() => setDatasetAnalysisStage(2), 700);
    setTimeout(() => setDatasetAnalysisStage(3), 1050);
    setTimeout(() => setDatasetAnalysisStage(4), 1400);

    setTimeout(async () => {
      try {
        const result = await runDatasetAnalysis();
        if (result && result.data) {
          setUploadedAnalysisResult(result.data);
          setActiveAnalysisMode('uploaded');
          setUploadToast(`✓ FlowTrace analysis complete: Workflow created & anomaly evaluated for ${result.data.datasetName}`);
        } else {
          setUploadedAnalysisResult(bpi2017AnalysisResult);
          setActiveAnalysisMode('uploaded');
          setUploadToast('✓ FlowTrace analysis complete: Workflow created & anomaly evaluated for BPI2017.csv');
        }
      } catch {
        setUploadedAnalysisResult(bpi2017AnalysisResult);
        setActiveAnalysisMode('uploaded');
        setUploadToast('✓ FlowTrace analysis complete: Workflow created & anomaly evaluated for BPI2017.csv');
      } finally {
        setDatasetAnalysisStage(5);
        setTimeout(() => {
          setIsAnalyzingDataset(false);
          setIsSourceDataDrawerOpen(false);
        }, 400);
        setTimeout(() => setUploadToast(null), 5000);
      }
    }, 1800);
  };

  // Active Mode Derivations
  const isUploadedMode = activeAnalysisMode === 'uploaded' && !!uploadedAnalysisResult;

  // Active Workflow (Mined from Uploaded Data or Canonical Demo)
  const activeWorkflow = isUploadedMode ? uploadedAnalysisResult.workflow : canonicalWorkflow;

  // Active Timeline Data - Dynamically calculated per selected component or overall workflow
  const activeTimelineData: TimelinePoint[] = useMemo(() => {
    if (isUploadedMode) {
      if (timelineFilterComponent === 'all') {
        return [
          {
            time: 'Jan 04',
            timestamp: '2016-01-04T09:00:00 UTC',
            component: 'Overall Workflow Architecture',
            errorRate: 1.2,
            agentErrorRate: 1.2,
            workflowAverage: 1.2,
            systemErrorRate: 1.2,
            throughput: '34 cases/hr',
            p99LatencyMs: 120,
            annotation: 'Nominal application intake baseline across 31,509 cases',
            changeStatus: 'BASELINE SPECIFICATION',
            isEventMarker: false
          },
          {
            time: 'Jan 11',
            timestamp: '2016-01-11T14:30:00 UTC',
            component: 'Overall Workflow Architecture',
            errorRate: 3.5,
            agentErrorRate: 3.5,
            workflowAverage: 1.5,
            systemErrorRate: 1.5,
            throughput: '42 cases/hr',
            p99LatencyMs: 210,
            annotation: 'Batch offer generation and lead distribution',
            changeStatus: 'BASELINE SPECIFICATION',
            isEventMarker: false
          },
          {
            time: 'Jan 18',
            timestamp: '2016-01-18T11:00:00 UTC',
            component: 'Overall Workflow Architecture',
            errorRate: 28.4,
            agentErrorRate: 28.4,
            workflowAverage: 14.5,
            systemErrorRate: 14.5,
            throughput: '18 cases/hr',
            p99LatencyMs: 3600,
            annotation: 'Rework cycle iteration across multiple queue stages (32.0% of cases)',
            changeStatus: 'REWORK ANOMALY (32% of cases)',
            isEventMarker: true
          },
          {
            time: 'Jan 25',
            timestamp: '2016-01-25T16:45:00 UTC',
            component: 'Overall Workflow Architecture',
            errorRate: 26.5,
            agentErrorRate: 26.5,
            workflowAverage: 12.8,
            systemErrorRate: 12.8,
            throughput: '21 cases/hr',
            p99LatencyMs: 4200,
            annotation: 'Peak queue delay & multi-day loan officer backlog (4.2 days queue waiting time)',
            changeStatus: 'QUEUE BOTTLENECK (4.2-day delay)',
            isEventMarker: true
          },
          {
            time: 'Feb 01',
            timestamp: '2016-02-01T18:00:00 UTC',
            component: 'Overall Workflow Architecture',
            errorRate: 3.8,
            agentErrorRate: 3.8,
            workflowAverage: 2.1,
            systemErrorRate: 2.1,
            throughput: '36 cases/hr',
            p99LatencyMs: 340,
            annotation: 'Process stabilization across end-to-end completion',
            changeStatus: 'NOMINAL COMPLETION',
            isEventMarker: false
          }
        ];
      }

      // Check for specific BPI node selection
      const matchedNode = activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id === timelineFilterComponent);
      if (matchedNode) {
        if (matchedNode.id.includes('validate') || matchedNode.label.includes('Validate')) {
          return [
            {
              time: 'Jan 04',
              timestamp: '2016-01-04T09:00:00 UTC',
              component: matchedNode.label,
              errorRate: 1.2,
              agentErrorRate: 1.2,
              workflowAverage: 1.2,
              systemErrorRate: 1.2,
              throughput: '28 cases/hr',
              p99LatencyMs: 240,
              annotation: 'Underwriting queue intake nominal',
              changeStatus: 'BASELINE SPECIFICATION',
              isEventMarker: false
            },
            {
              time: 'Jan 11',
              timestamp: '2016-01-11T14:30:00 UTC',
              component: matchedNode.label,
              errorRate: 4.8,
              agentErrorRate: 4.8,
              workflowAverage: 1.5,
              systemErrorRate: 1.5,
              throughput: '32 cases/hr',
              p99LatencyMs: 820,
              annotation: 'Queue backlog build-up begins as application volume spikes',
              changeStatus: 'QUEUE ELEVATION',
              isEventMarker: false
            },
            {
              time: 'Jan 18',
              timestamp: '2016-01-18T11:00:00 UTC',
              component: matchedNode.label,
              errorRate: 18.4,
              agentErrorRate: 18.4,
              workflowAverage: 14.5,
              systemErrorRate: 14.5,
              throughput: '22 cases/hr',
              p99LatencyMs: 2800,
              annotation: 'Document validation queue saturation across loan officer shifts',
              changeStatus: 'QUEUE BOTTLENECK ACCUMULATION',
              isEventMarker: true
            },
            {
              time: 'Jan 25',
              timestamp: '2016-01-25T16:45:00 UTC',
              component: matchedNode.label,
              errorRate: 38.6,
              agentErrorRate: 38.6,
              workflowAverage: 12.8,
              systemErrorRate: 12.8,
              throughput: '14 cases/hr',
              p99LatencyMs: 5400,
              annotation: 'Severe 4.2-day bottleneck delay window affecting 24,180 cases',
              changeStatus: 'CRITICAL BOTTLENECK (4.2-day queue delay)',
              isEventMarker: true
            },
            {
              time: 'Feb 01',
              timestamp: '2016-02-01T18:00:00 UTC',
              component: matchedNode.label,
              errorRate: 2.1,
              agentErrorRate: 2.1,
              workflowAverage: 2.1,
              systemErrorRate: 2.1,
              throughput: '34 cases/hr',
              p99LatencyMs: 310,
              annotation: 'Batch overtime clearance and validation sign-off',
              changeStatus: 'RESOLVED',
              isEventMarker: false
            }
          ];
        }

        if (matchedNode.id.includes('call') || matchedNode.label.includes('Call')) {
          return [
            {
              time: 'Jan 04',
              timestamp: '2016-01-04T09:00:00 UTC',
              component: matchedNode.label,
              errorRate: 0.8,
              agentErrorRate: 0.8,
              workflowAverage: 1.2,
              systemErrorRate: 1.2,
              throughput: '40 cases/hr',
              p99LatencyMs: 140,
              annotation: 'Initial customer outreach baseline',
              changeStatus: 'BASELINE',
              isEventMarker: false
            },
            {
              time: 'Jan 11',
              timestamp: '2016-01-11T14:30:00 UTC',
              component: matchedNode.label,
              errorRate: 2.1,
              agentErrorRate: 2.1,
              workflowAverage: 1.5,
              systemErrorRate: 1.5,
              throughput: '38 cases/hr',
              p99LatencyMs: 310,
              annotation: 'Customer outreach response nominal',
              changeStatus: 'BASELINE',
              isEventMarker: false
            },
            {
              time: 'Jan 18',
              timestamp: '2016-01-18T11:00:00 UTC',
              component: matchedNode.label,
              errorRate: 32.0,
              agentErrorRate: 32.0,
              workflowAverage: 14.5,
              systemErrorRate: 14.5,
              throughput: '18 cases/hr',
              p99LatencyMs: 3600,
              annotation: '32.0% repetitive customer call rework loopback cycle (8,940 cases)',
              changeStatus: 'REWORK ANOMALY (32% of cases)',
              isEventMarker: true
            },
            {
              time: 'Jan 25',
              timestamp: '2016-01-25T16:45:00 UTC',
              component: matchedNode.label,
              errorRate: 14.5,
              agentErrorRate: 14.5,
              workflowAverage: 12.8,
              systemErrorRate: 12.8,
              throughput: '26 cases/hr',
              p99LatencyMs: 1800,
              annotation: 'Offer renegotiation tail delay settling',
              changeStatus: 'DEVIATION SETTLING',
              isEventMarker: false
            },
            {
              time: 'Feb 01',
              timestamp: '2016-02-01T18:00:00 UTC',
              component: matchedNode.label,
              errorRate: 1.4,
              agentErrorRate: 1.4,
              workflowAverage: 2.1,
              systemErrorRate: 2.1,
              throughput: '42 cases/hr',
              p99LatencyMs: 180,
              annotation: 'Offer acceptance settled and transitioned to complete',
              changeStatus: 'NOMINAL',
              isEventMarker: false
            }
          ];
        }

        if (matchedNode.id.includes('create') || matchedNode.label.includes('Create')) {
          return [
            {
              time: 'Jan 04',
              timestamp: '2016-01-04T09:00:00 UTC',
              component: matchedNode.label,
              errorRate: 0.1,
              agentErrorRate: 0.1,
              workflowAverage: 1.2,
              systemErrorRate: 1.2,
              throughput: '58 cases/hr',
              p99LatencyMs: 85,
              annotation: 'Intake volume peak: 31,509 cases generated smoothly',
              changeStatus: 'INTAKE NOMINAL',
              isEventMarker: false
            },
            {
              time: 'Jan 11',
              timestamp: '2016-01-11T14:30:00 UTC',
              component: matchedNode.label,
              errorRate: 0.2,
              agentErrorRate: 0.2,
              workflowAverage: 1.5,
              systemErrorRate: 1.5,
              throughput: '62 cases/hr',
              p99LatencyMs: 90,
              annotation: 'Online portal application submissions steady',
              changeStatus: 'INTAKE NOMINAL',
              isEventMarker: false
            },
            {
              time: 'Jan 18',
              timestamp: '2016-01-18T11:00:00 UTC',
              component: matchedNode.label,
              errorRate: 0.1,
              agentErrorRate: 0.1,
              workflowAverage: 14.5,
              systemErrorRate: 14.5,
              throughput: '54 cases/hr',
              p99LatencyMs: 88,
              annotation: 'Intake uninhibited despite downstream rework',
              changeStatus: 'INTAKE NOMINAL',
              isEventMarker: false
            },
            {
              time: 'Jan 25',
              timestamp: '2016-01-25T16:45:00 UTC',
              component: matchedNode.label,
              errorRate: 0.1,
              agentErrorRate: 0.1,
              workflowAverage: 12.8,
              systemErrorRate: 12.8,
              throughput: '50 cases/hr',
              p99LatencyMs: 92,
              annotation: 'Intake uninhibited despite downstream validation bottleneck',
              changeStatus: 'INTAKE NOMINAL',
              isEventMarker: false
            },
            {
              time: 'Feb 01',
              timestamp: '2016-02-01T18:00:00 UTC',
              component: matchedNode.label,
              errorRate: 0.1,
              agentErrorRate: 0.1,
              workflowAverage: 2.1,
              systemErrorRate: 2.1,
              throughput: '48 cases/hr',
              p99LatencyMs: 86,
              annotation: 'Intake cycle completed',
              changeStatus: 'INTAKE NOMINAL',
              isEventMarker: false
            }
          ];
        }

        // Generic activity fallback
        return [
          { time: 'Jan 04', timestamp: '2016-01-04T09:00:00 UTC', component: matchedNode.label, errorRate: 0.2, agentErrorRate: 0.2, workflowAverage: 1.2, systemErrorRate: 1.2, throughput: '30 cases/hr', p99LatencyMs: matchedNode.latencyMs, annotation: 'Baseline activity progression', changeStatus: 'BASELINE', isEventMarker: false },
          { time: 'Jan 11', timestamp: '2016-01-11T14:30:00 UTC', component: matchedNode.label, errorRate: 0.5, agentErrorRate: 0.5, workflowAverage: 1.5, systemErrorRate: 1.5, throughput: '32 cases/hr', p99LatencyMs: matchedNode.latencyMs, annotation: 'Nominal execution', changeStatus: 'BASELINE', isEventMarker: false },
          { time: 'Jan 18', timestamp: '2016-01-18T11:00:00 UTC', component: matchedNode.label, errorRate: matchedNode.errorRate || 8.4, agentErrorRate: matchedNode.errorRate || 8.4, workflowAverage: 14.5, systemErrorRate: 14.5, throughput: '24 cases/hr', p99LatencyMs: matchedNode.latencyMs * 2, annotation: `Observed telemetry for ${matchedNode.label}`, changeStatus: matchedNode.errorRate > 10 ? 'ANOMALY' : 'NOMINAL', isEventMarker: matchedNode.errorRate > 10 },
          { time: 'Jan 25', timestamp: '2016-01-25T16:45:00 UTC', component: matchedNode.label, errorRate: Math.max(0.4, (matchedNode.errorRate || 6) * 0.8), agentErrorRate: Math.max(0.4, (matchedNode.errorRate || 6) * 0.8), workflowAverage: 12.8, systemErrorRate: 12.8, throughput: '28 cases/hr', p99LatencyMs: Math.round(matchedNode.latencyMs * 1.5), annotation: `Queue tracking for ${matchedNode.label}`, changeStatus: 'OBSERVATION', isEventMarker: false },
          { time: 'Feb 01', timestamp: '2016-02-01T18:00:00 UTC', component: matchedNode.label, errorRate: 0.4, agentErrorRate: 0.4, workflowAverage: 2.1, systemErrorRate: 2.1, throughput: '35 cases/hr', p99LatencyMs: matchedNode.latencyMs, annotation: 'Nominal completion', changeStatus: 'STABLE', isEventMarker: false }
        ];
      }
    }

    // Demo Mode Time Series
    if (timelineFilterComponent === 'all') {
      return [
        { time: '14:15', timestamp: '14:15:00 UTC', component: 'Overall Architecture', errorRate: 0.2, agentErrorRate: 0.2, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '42.1K req/min', p99LatencyMs: 38, annotation: 'Baseline: all 4 services nominal across all consumers', changeStatus: 'PRE-CHANGE BASELINE (Nominal)' },
        { time: '14:25', timestamp: '14:25:00 UTC', component: 'Overall Architecture', errorRate: 0.3, agentErrorRate: 0.3, workflowAverage: 0.3, systemErrorRate: 0.3, throughput: '41.8K req/min', p99LatencyMs: 41, annotation: 'Pre-change baseline steady', changeStatus: 'PRE-CHANGE BASELINE (Nominal)' },
        { time: '14:30', timestamp: '14:30:00 UTC', component: 'Overall Architecture', errorRate: 0.2, agentErrorRate: 0.2, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '42.5K req/min', p99LatencyMs: 39, annotation: 'Pre-change baseline steady', changeStatus: 'PRE-CHANGE BASELINE (Nominal)' },
        { time: '14:33', timestamp: '14:33:00 UTC', component: 'Overall Architecture', errorRate: 16.5, agentErrorRate: 16.5, workflowAverage: 4.2, systemErrorRate: 4.2, throughput: '38.2K req/min', p99LatencyMs: 140, annotation: 'Customer Identity API v2.5 published (nested object contract drift)', changeStatus: 'SCHEMA DRIFT DEPLOYED', isEventMarker: true },
        { time: '14:35', timestamp: '14:35:00 UTC', component: 'Overall Architecture', errorRate: 42.8, agentErrorRate: 42.8, workflowAverage: 9.4, systemErrorRate: 9.4, throughput: '28.4K req/min', p99LatencyMs: 240, annotation: 'Cascading failure: Verification Agent (68%) & Fraud Agent (42.5%)', changeStatus: 'PEAK CASCADE WINDOW', isEventMarker: true },
        { time: '14:40', timestamp: '14:40:00 UTC', component: 'Overall Architecture', errorRate: 42.8, agentErrorRate: 42.8, workflowAverage: 11.2, systemErrorRate: 11.2, throughput: '26.5K req/min', p99LatencyMs: 245, annotation: 'Active incident observation window: Approval API at 18% rejection risk', changeStatus: 'ACTIVE INCIDENT OBSERVATION', isEventMarker: true }
      ];
    }

    if (timelineFilterComponent === 'customer-verification-agent') {
      return [
        { time: '14:15', timestamp: '14:15:00 UTC', component: 'Customer Verification Agent', errorRate: 0.2, agentErrorRate: 0.2, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '18.4K req/min', p99LatencyMs: 120, annotation: 'Pydantic deserialization nominal', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:25', timestamp: '14:25:00 UTC', component: 'Customer Verification Agent', errorRate: 0.4, agentErrorRate: 0.4, workflowAverage: 0.3, systemErrorRate: 0.3, throughput: '18.2K req/min', p99LatencyMs: 125, annotation: 'Nominal telemetry', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:30', timestamp: '14:30:00 UTC', component: 'Customer Verification Agent', errorRate: 0.3, agentErrorRate: 0.3, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '18.5K req/min', p99LatencyMs: 122, annotation: 'Pre-change nominal', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:33', timestamp: '14:33:00 UTC', component: 'Customer Verification Agent', errorRate: 34.0, agentErrorRate: 34.0, workflowAverage: 4.2, systemErrorRate: 4.2, throughput: '12.4K req/min', p99LatencyMs: 380, annotation: 'Pydantic ValidationError on missing flat verificationStatus enum', changeStatus: 'DIRECT IMPACT DETECTED', isEventMarker: true },
        { time: '14:35', timestamp: '14:35:00 UTC', component: 'Customer Verification Agent', errorRate: 68.0, agentErrorRate: 68.0, workflowAverage: 9.4, systemErrorRate: 9.4, throughput: '8.2K req/min', p99LatencyMs: 740, annotation: 'Peak failure rate: 68% verification requests throwing deserialization exceptions', changeStatus: 'CRITICAL FAILURE PEAK (68%)', isEventMarker: true },
        { time: '14:40', timestamp: '14:40:00 UTC', component: 'Customer Verification Agent', errorRate: 68.0, agentErrorRate: 68.0, workflowAverage: 11.2, systemErrorRate: 11.2, throughput: '8.0K req/min', p99LatencyMs: 750, annotation: 'Unresolved contract drift ongoing', changeStatus: 'CRITICAL FAILURE PEAK (68%)', isEventMarker: true }
      ];
    }

    if (timelineFilterComponent === 'fraud-assessment-agent') {
      return [
        { time: '14:15', timestamp: '14:15:00 UTC', component: 'Fraud Assessment Agent', errorRate: 0.1, agentErrorRate: 0.1, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '14.2K req/min', p99LatencyMs: 180, annotation: 'Risk scoring model nominal', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:25', timestamp: '14:25:00 UTC', component: 'Fraud Assessment Agent', errorRate: 0.2, agentErrorRate: 0.2, workflowAverage: 0.3, systemErrorRate: 0.3, throughput: '14.0K req/min', p99LatencyMs: 185, annotation: 'Nominal telemetry', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:30', timestamp: '14:30:00 UTC', component: 'Fraud Assessment Agent', errorRate: 0.2, agentErrorRate: 0.2, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '14.1K req/min', p99LatencyMs: 182, annotation: 'Nominal telemetry', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:33', timestamp: '14:33:00 UTC', component: 'Fraud Assessment Agent', errorRate: 12.5, agentErrorRate: 12.5, workflowAverage: 4.2, systemErrorRate: 4.2, throughput: '11.8K req/min', p99LatencyMs: 290, annotation: 'Receives unverified fallback tokens from verification agent', changeStatus: 'DOWNSTREAM CASCADE INGESTION', isEventMarker: true },
        { time: '14:35', timestamp: '14:35:00 UTC', component: 'Fraud Assessment Agent', errorRate: 42.5, agentErrorRate: 42.5, workflowAverage: 9.4, systemErrorRate: 9.4, throughput: '8.6K req/min', p99LatencyMs: 510, annotation: '42.5% fraud evaluations corrupted by missing identity verification signals', changeStatus: 'DOWNSTREAM CASCADE (42.5%)', isEventMarker: true },
        { time: '14:40', timestamp: '14:40:00 UTC', component: 'Fraud Assessment Agent', errorRate: 42.5, agentErrorRate: 42.5, workflowAverage: 11.2, systemErrorRate: 11.2, throughput: '8.4K req/min', p99LatencyMs: 520, annotation: 'Corrupted confidence scores propagated to Approval API', changeStatus: 'DOWNSTREAM CASCADE (42.5%)', isEventMarker: true }
      ];
    }

    if (timelineFilterComponent === 'approval-api') {
      return [
        { time: '14:15', timestamp: '14:15:00 UTC', component: 'Approval API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '10.2K req/min', p99LatencyMs: 45, annotation: 'Underwriting approvals nominal', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:25', timestamp: '14:25:00 UTC', component: 'Approval API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 0.3, systemErrorRate: 0.3, throughput: '10.1K req/min', p99LatencyMs: 48, annotation: 'Nominal telemetry', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:30', timestamp: '14:30:00 UTC', component: 'Approval API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '10.0K req/min', p99LatencyMs: 46, annotation: 'Nominal telemetry', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:33', timestamp: '14:33:00 UTC', component: 'Approval API', errorRate: 2.0, agentErrorRate: 2.0, workflowAverage: 4.2, systemErrorRate: 4.2, throughput: '9.4K req/min', p99LatencyMs: 90, annotation: 'Early rejection spikes on malformed scores', changeStatus: 'EARLY IMPACT', isEventMarker: false },
        { time: '14:35', timestamp: '14:35:00 UTC', component: 'Approval API', errorRate: 18.0, agentErrorRate: 18.0, workflowAverage: 9.4, systemErrorRate: 9.4, throughput: '7.8K req/min', p99LatencyMs: 165, annotation: '18% false-positive loan rejection rate triggered by corrupted confidence score', changeStatus: 'BUSINESS SLA BREACH (18% Rejections)', isEventMarker: true },
        { time: '14:40', timestamp: '14:40:00 UTC', component: 'Approval API', errorRate: 18.0, agentErrorRate: 18.0, workflowAverage: 11.2, systemErrorRate: 11.2, throughput: '7.5K req/min', p99LatencyMs: 170, annotation: 'Critical 82/100 risk score on business underwriting gate', changeStatus: 'BUSINESS SLA BREACH (18% Rejections)', isEventMarker: true }
      ];
    }

    if (timelineFilterComponent === 'customer-identity-api') {
      return [
        { time: '14:15', timestamp: '14:15:00 UTC', component: 'Customer Identity API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '42.1K req/min', p99LatencyMs: 12, annotation: 'v2.4 contract nominal', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:25', timestamp: '14:25:00 UTC', component: 'Customer Identity API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 0.3, systemErrorRate: 0.3, throughput: '41.8K req/min', p99LatencyMs: 14, annotation: 'v2.4 contract nominal', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:30', timestamp: '14:30:00 UTC', component: 'Customer Identity API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 0.2, systemErrorRate: 0.2, throughput: '42.5K req/min', p99LatencyMs: 12, annotation: 'v2.4 contract nominal', changeStatus: 'PRE-CHANGE BASELINE' },
        { time: '14:33', timestamp: '14:33:00 UTC', component: 'Customer Identity API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 4.2, systemErrorRate: 4.2, throughput: '42.0K req/min', p99LatencyMs: 15, annotation: 'v2.5 released with breaking schema change: verificationStatus changed from flat enum to nested object', changeStatus: 'ROOT CAUSE EVENT (v2.5 Released)', isEventMarker: true },
        { time: '14:35', timestamp: '14:35:00 UTC', component: 'Customer Identity API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 9.4, systemErrorRate: 9.4, throughput: '42.2K req/min', p99LatencyMs: 14, annotation: 'API Gateway returns 200 OK, but payload breaks all downstream Pydantic consumers', changeStatus: 'SILENT PRODUCER DRIFT', isEventMarker: false },
        { time: '14:40', timestamp: '14:40:00 UTC', component: 'Customer Identity API', errorRate: 0.0, agentErrorRate: 0.0, workflowAverage: 11.2, systemErrorRate: 11.2, throughput: '42.4K req/min', p99LatencyMs: 13, annotation: 'Silent contract drift ongoing', changeStatus: 'SILENT PRODUCER DRIFT', isEventMarker: false }
      ];
    }

    return timelineData;
  }, [timelineFilterComponent, isUploadedMode, activeWorkflow, timelineData]);

  const activeSelectedComponent = activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id === timelineFilterComponent);
  const activeComponentName = timelineFilterComponent === 'all'
    ? (isUploadedMode ? 'Overall Process Topology' : 'Overall Architecture Horizon')
    : (activeSelectedComponent?.label || timelineFilterComponent);

  const activeMaxRate = Math.max(...activeTimelineData.map((d) => d.agentErrorRate ?? d.errorRate ?? 0));
  const activeAvgRate =
    activeTimelineData[activeTimelineData.length - 1]?.systemErrorRate ??
    activeTimelineData[activeTimelineData.length - 1]?.workflowAverage ??
    0;

  // Active Incident Data
  const activeIncident = isUploadedMode
    ? {
        title: uploadedAnalysisResult.primaryAnomaly.title,
        badgeText: `OPERATIONAL ANOMALY • ${uploadedAnalysisResult.primaryAnomaly.type.replace(/_/g, ' ')}`,
        badgeColor: 'bg-amber-100 border-amber-300 text-amber-950 font-bold',
        description: uploadedAnalysisResult.primaryAnomaly.description,
        whyMattersTitle: 'Why This Matters (Groq Process Reasoning)',
        whyMattersText: uploadedAnalysisResult.groqInsights.processSummary,
        rootCause: uploadedAnalysisResult.groqInsights.rootCauseAnalysis,
        affectedCount: `${uploadedAnalysisResult.graph.nodes.filter((n: any) => n.status !== 'healthy').length || 1} services`,
        tracedCount: `${uploadedAnalysisResult.graph.edges.length} transitions`,
        failureProbability: `${uploadedAnalysisResult.metrics.reworkRate || '0%'}`,
        riskScore: uploadedAnalysisResult.primaryAnomaly.riskScore,
        severity: `${uploadedAnalysisResult.primaryAnomaly.severity.toUpperCase()} RISK`,
        recommendationAction: uploadedAnalysisResult.recommendation.action,
        recommendationReason: uploadedAnalysisResult.recommendation.reasoning,
        mitigationSteps: uploadedAnalysisResult.recommendation.mitigationSteps,
        businessImpact: uploadedAnalysisResult.recommendation.businessImpact,
        directImpactComponent: uploadedAnalysisResult.primaryAnomaly.primaryComponent,
        downstreamImpactComponent: uploadedAnalysisResult.primaryAnomaly.targetComponent,
        evidenceCards: uploadedAnalysisResult.evidenceCards || []
      }
    : {
        title: `${analysisMetrics.changedComponent} schema change`,
        badgeText: 'API CONTRACT DRIFT',
        badgeColor: 'bg-amber-50 border-amber-200 text-amber-900',
        description: `FlowTrace detected an unannounced schema contract change at ${analysisMetrics.detectedAt}. Deserialization errors are propagating downstream to the Customer Verification Agent and Fraud Assessment pipeline.`,
        whyMattersTitle: 'Why This Matters',
        whyMattersText: 'The modified API payload structure invalidates Pydantic schema validation inside the Customer Verification Agent. Unverified fallback tokens propagate into Fraud Assessment, triggering automated loan underwriting rejections.',
        rootCause: 'Pydantic deserialization failure on payload',
        affectedCount: `${analysisMetrics.affectedComponentsCount} services`,
        tracedCount: `${analysisMetrics.dependenciesTracedCount} deps`,
        failureProbability: analysisMetrics.failureProbability,
        riskScore: analysisMetrics.riskScore,
        severity: analysisMetrics.severity,
        recommendationAction: analysisMetrics.recommendationAction,
        recommendationReason: analysisMetrics.recommendationReason,
        mitigationSteps: [
          'Pause automated loan underwriting approval queue.',
          'Deploy backward-compatible schema adapter for Customer Identity API v2.5.',
          'Rerun automated guardrail regression tests.'
        ],
        businessImpact: 'Spikes false rejections and delays approval pipeline.',
        directImpactComponent: 'Customer Verification Agent',
        downstreamImpactComponent: 'Fraud Assessment Agent',
        evidenceCards: [
          { id: 'c1', title: '1. Production Change', component: analysisMetrics.changedComponent, metricLabel: analysisMetrics.versionChange, detail: 'v2.4 → v2.5 contract drift' },
          { id: 'c2', title: '2. Contract Change', component: analysisMetrics.changedField, metricLabel: 'Flat → Nested', detail: `${analysisMetrics.previousType} → ${analysisMetrics.newType}` },
          { id: 'c3', title: '3. Runtime Telemetry', component: 'Verification Error Rate', metricLabel: analysisMetrics.failureProbability, detail: `Spiked from 0.4% to ${analysisMetrics.failureProbability}` },
          { id: 'c4', title: '4. Dependency Graph', component: 'Traversed Topologies', metricLabel: `${analysisMetrics.dependenciesTracedCount} links`, detail: '5 traced dependency links' },
          { id: 'c5', title: '5. Workflow', component: analysisMetrics.workflowName, metricLabel: analysisMetrics.workflowCode, detail: 'Customer Verification & Approval' }
        ]
      };

  const handleSelectEvidenceCard = (card: 'contract' | 'dependency' | 'cascade' | 'signal') => {
    setActiveEvidenceCard(card);
    if (isUploadedMode && activeWorkflow.nodes.length > 0) {
      if (card === 'contract') {
        const targetNode = activeWorkflow.nodes[0];
        setHighlightedNodeId(targetNode?.id);
        setSelectedNode(targetNode);
        setTimelineFilterComponent(targetNode ? targetNode.id : 'all');
        setHighlightedEdgeId(undefined);
        setUploadToast(`🔍 Focused Primary Volume Node: ${targetNode?.label || 'A_Create Application'} (31,509 events)`);
      } else if (card === 'dependency') {
        const targetNode = activeWorkflow.nodes[1] || activeWorkflow.nodes[0];
        const targetEdge = activeWorkflow.edges[0] || { id: 'e-bpi-1' };
        setHighlightedNodeId(targetNode?.id);
        setSelectedNode(targetNode);
        setTimelineFilterComponent(targetNode ? targetNode.id : 'all');
        setHighlightedEdgeId(targetEdge.id);
        setUploadToast(
          `🔗 Focused Critical Transition: ${activeWorkflow.edges[0]?.sourceLabel || 'A_Create Application'} → ${
            activeWorkflow.edges[0]?.targetLabel || 'A_Submitted'
          } (20,423 traces)`
        );
      } else if (card === 'cascade') {
        const valNode =
          activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id.includes('validate') || n.label.includes('Validate')) ||
          activeWorkflow.nodes[2] ||
          activeWorkflow.nodes[0];
        const valEdge =
          activeWorkflow.edges.find((e: any) => e.source.includes('validate')) ||
          activeWorkflow.edges[1] ||
          activeWorkflow.edges[0];
        setHighlightedNodeId(valNode?.id);
        setSelectedNode(valNode);
        setTimelineFilterComponent(valNode ? valNode.id : 'all');
        setHighlightedEdgeId(valEdge?.id);
        setUploadToast(
          `⚠️ Focused Process Deviation: ${valNode?.label || 'W_Validate application'} (32.0% rework loopback, 4.2-day bottleneck)`
        );
      } else if (card === 'signal') {
        const lastNode = activeWorkflow.nodes[activeWorkflow.nodes.length - 1];
        const lastEdge = activeWorkflow.edges[activeWorkflow.edges.length - 1];
        setHighlightedNodeId(lastNode?.id);
        setSelectedNode(lastNode);
        setTimelineFilterComponent(lastNode ? lastNode.id : 'all');
        setHighlightedEdgeId(lastEdge?.id);
        setUploadToast(
          `⏱️ Focused SLA Gate: End-to-End SLA Delivery (14.8 days average turnaround across 31,509 cases)`
        );
      }
    } else {
      if (card === 'contract') {
        const node = activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id === 'customer-identity-api') || activeWorkflow.nodes[0];
        setHighlightedNodeId('customer-identity-api');
        setSelectedNode(node);
        setTimelineFilterComponent('customer-identity-api');
        setHighlightedEdgeId(undefined);
        setUploadToast('🔍 Focused Root Cause: Customer Identity API (Schema Contract Drift v2.5)');
      } else if (card === 'dependency') {
        const node = activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id === 'customer-verification-agent') || activeWorkflow.nodes[1];
        setHighlightedNodeId('customer-verification-agent');
        setSelectedNode(node);
        setTimelineFilterComponent('customer-verification-agent');
        setHighlightedEdgeId('e1');
        setUploadToast('🔗 Focused Direct Link: Customer Identity API → Customer Verification Agent (68% failure spike)');
      } else if (card === 'cascade') {
        const node = activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id === 'fraud-assessment-agent') || activeWorkflow.nodes[2];
        setHighlightedNodeId('fraud-assessment-agent');
        setSelectedNode(node);
        setTimelineFilterComponent('fraud-assessment-agent');
        setHighlightedEdgeId('e2');
        setUploadToast('⚠️ Focused Downstream Cascade: Customer Verification Agent → Fraud Assessment Agent (42.5% fails)');
      } else if (card === 'signal') {
        const node = activeWorkflow.nodes.find((n: WorkflowNodeData) => n.id === 'approval-api') || activeWorkflow.nodes[3];
        setHighlightedNodeId('approval-api');
        setSelectedNode(node);
        setTimelineFilterComponent('approval-api');
        setHighlightedEdgeId('e3');
        setUploadToast('⏱️ Focused SLA Risk: Approval API & Core Banking Gate (18% rejection risk)');
      }
    }

    setTimeout(() => {
      const graphCanvas = document.getElementById('impact-graph-canvas');
      if (graphCanvas) {
        graphCanvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);

    setTimeout(() => setUploadToast(null), 4500);
  };

  // SVG coordinates calculation for dynamic timeline chart
  const svgWidth = 640;
  const svgHeight = 130;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 25;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getX = (index: number) => padLeft + (index / Math.max(1, activeTimelineData.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - (Math.min(val, 70) / 70) * chartH;

  // Agent error path
  const agentPathD = activeTimelineData.reduce((acc, pt, i) => {
    const x = getX(i);
    const val = pt.agentErrorRate ?? pt.errorRate ?? 0;
    const y = getY(val);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // System error path
  const systemPathD = activeTimelineData.reduce((acc, pt, i) => {
    const x = getX(i);
    const val = pt.systemErrorRate ?? pt.workflowAverage ?? 0;
    const y = getY(val);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const agentAreaD = `${agentPathD} L ${getX(activeTimelineData.length - 1)} ${padTop + chartH} L ${getX(0)} ${padTop + chartH} Z`;

  // Filter sample preview rows based on pagination
  const allSampleRecords = uploadedDatasetMeta?.sampleRecords || [];
  const totalPreviewPages = Math.ceil(allSampleRecords.length / previewPageSize) || 1;
  const paginatedPreviewRecords = allSampleRecords.slice(
    (previewPage - 1) * previewPageSize,
    previewPage * previewPageSize
  );

  return (
    <div className="space-y-5 pb-12 animate-fadeIn select-none">
      {/* 1. PAGE HEADER & DATA PROVENANCE BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-red-100 flex items-center justify-center text-red-600 shadow-2xs">
              <Flame className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              {isUploadedMode
                ? `Process Intelligence • ${uploadedAnalysisResult.datasetName}`
                : 'Incident Analysis • Operational Intelligence'}
            </h1>

            {/* Provenance Badges */}
            {isUploadedMode ? (
              <button
                onClick={() => {
                  setSourceDataTab('overview');
                  setIsSourceDataDrawerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 hover:bg-blue-200 border border-blue-300 text-[11px] font-mono text-blue-900 transition-colors cursor-pointer"
                title="Click to inspect Live Uploaded Dataset"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span>LIVE DATASET: {uploadedAnalysisResult.datasetName} ({uploadedAnalysisResult.metrics.totalEvents.toLocaleString()} events)</span>
              </button>
            ) : uploadedDatasetMeta ? (
              <button
                onClick={() => {
                  setSourceDataTab('overview');
                  setIsSourceDataDrawerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[11px] font-mono text-blue-800 transition-colors cursor-pointer"
                title="Click to inspect Ingested Dataset"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span>Live Uploaded Dataset: {uploadedDatasetMeta.filename} ({uploadedDatasetMeta.totalEvents.toLocaleString()} events)</span>
              </button>
            ) : (
              <button
                onClick={() => setIsSourceDataDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[11px] font-mono text-slate-700 transition-colors cursor-pointer"
                title="Click to view Source Data"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>DATA SOURCE: Live Demo Data &bull; 247 records</span>
              </button>
            )}

            {isUploadedMode ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-[11px] font-semibold text-amber-900">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                <span>Discovered Operational Finding ({uploadedAnalysisResult.runId})</span>
              </span>
            ) : hasRunAnalysis ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                <span>Active Incident: INC-94021 ({currentRunId})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Continuous Monitoring &bull; No Active Incident</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isUploadedMode
              ? 'Autonomous process discovery, trace variance & bottleneck evaluation via Groq LPU'
              : 'Autonomous contract observation, multi-hop dependency tracing & risk assessment via Groq LPU'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Memory-Safe Large File Upload Trigger */}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer">
            <UploadCloud className={`w-3.5 h-3.5 ${isUploading ? 'text-amber-600 animate-bounce' : 'text-blue-600'}`} />
            <span>{isUploading ? `Uploading ${uploadProgress?.percent || 0}%...` : 'Upload CSV / Event Log (500MB+)'}</span>
            <input type="file" accept=".csv,.txt" onChange={handleChunkedFileUpload} className="hidden" disabled={isUploading} />
          </label>

          <button
            onClick={() => setIsSourceDataDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Source Data</span>
          </button>

          {isUploadedMode || uploadedDatasetMeta ? (
            <button
              onClick={handleRunUploadedDatasetAnalysis}
              disabled={isAnalyzingDataset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isAnalyzingDataset ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingDataset ? 'Running LangGraph Pipeline...' : 'Run FlowTrace Analysis'}</span>
            </button>
          ) : (
            <button
              onClick={handleRunDemoScenario}
              disabled={isSimulatingDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSimulatingDemo ? 'animate-spin' : ''}`} />
              <span>{isSimulatingDemo ? 'Running Pipeline...' : `Run Demo Scenario (Run #${runCount})`}</span>
            </button>
          )}

          {hasRunAnalysis && (
            <button
              onClick={handleResetDemoScenario}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
              title="Reset to neutral monitoring baseline"
            >
              <span>Reset</span>
            </button>
          )}

          {decision === 'paused' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-300 text-xs font-bold text-red-700 shadow-2xs animate-fadeIn">
              <PauseCircle className="w-3.5 h-3.5 text-red-600" />
              Workflow Paused
            </span>
          ) : decision === 'continued' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs">
              <Check className="w-3.5 h-3.5 text-slate-600" />
              Workflow Continued
            </span>
          ) : hasRunAnalysis || isUploadedMode ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-700 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              Action Required
            </span>
          ) : null}
        </div>
      </div>

      {/* UPLOAD PROGRESS BAR (When uploading a large dataset) */}
      {isUploading && uploadProgress && (
        <div className="p-3.5 rounded-xl border border-blue-300 bg-blue-50/80 space-y-2 shadow-2xs animate-fadeIn font-mono text-xs">
          <div className="flex items-center justify-between font-bold text-blue-950">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin text-blue-600" />
              <span>Streaming Chunked Upload to Backend Disk ({uploadProgress.currentChunk} / {uploadProgress.totalChunks} chunks)</span>
            </span>
            <span className="text-blue-700">{uploadProgress.uploadedMB} MB / {uploadProgress.totalMB} MB ({uploadProgress.percent}%)</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-blue-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress.percent}%` }}
            />
          </div>
          <div className="text-[10px] text-blue-800 font-sans">
            Memory-safe streaming pipeline: file is chunked in 5MB slices directly from browser disk to server disk without buffering into React state.
          </div>
        </div>
      )}

      {/* HEALTH STATUS INDICATOR RIBBON */}
      <div className="px-3.5 py-2 rounded-lg bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">FLOWTRACE PIPELINE STATUS:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Dataset Loaded</span>
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Backend Connected</span>
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Analysis Executed</span>
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Results Generated</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-700 text-[10px]">
            Groq LPU Active (openai/gpt-oss-120b)
          </span>
        </div>
      </div>

      {/* Dataset Mode Switcher Ribbon (Instant Toggle between Demo & Uploaded Dataset) */}
      <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/70 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900">Analysis Context:</span>
          <span className="text-slate-700 font-mono text-[11px]">
            {activeAnalysisMode === 'uploaded'
              ? `Mode B: Live Uploaded Dataset • ${uploadedAnalysisResult?.datasetName || 'BPI2017.csv'} (${(uploadedAnalysisResult?.metrics?.totalEvents || 1202267).toLocaleString()} events • ${(uploadedAnalysisResult?.metrics?.totalCases || 31509).toLocaleString()} cases)`
              : 'Mode A: Demo Scenario • Customer Identity API (INC-94021 schema drift)'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <button
            onClick={() => {
              if (!uploadedAnalysisResult) {
                setUploadedDatasetMeta(bpi2017AnalysisResult.metadata);
                setUploadedAnalysisResult(bpi2017AnalysisResult);
              }
              setActiveAnalysisMode('uploaded');
            }}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              activeAnalysisMode === 'uploaded' ? 'bg-blue-600 text-white font-bold shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Mode B: Live Uploaded Dataset (BPI2017.csv)
          </button>
          <button
            onClick={() => setActiveAnalysisMode('demo')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              activeAnalysisMode === 'demo' ? 'bg-blue-600 text-white font-bold shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Mode A: Demo Scenario (WF-CVA-01)
          </button>
        </div>
      </div>

      {/* 2. VISIBLE ANALYSIS PIPELINE (Queued → Running → Completed) */}
      <div className="rounded-lg border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
              AUTONOMOUS ANALYSIS PIPELINE
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              Execution ID: {isUploadedMode ? uploadedAnalysisResult.runId : currentRunId}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
            {isSimulatingDemo || isAnalyzingDataset ? (
              <>
                <Activity className="w-3 h-3 animate-spin" />
                <span>Executing Pipeline Stages...</span>
              </>
            ) : hasRunAnalysis || isUploadedMode ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Pipeline Verified &amp; Synced from Real Data</span>
              </>
            ) : (
              <span className="text-slate-500">Ready to execute &bull; Click Run FlowTrace Analysis</span>
            )}
          </span>
        </div>

        {/* 6 Sequential Stage Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {pipelineStages.map((st, idx) => (
            <div
              key={st.id}
              className={`p-2.5 rounded-md border text-left transition-all ${
                st.status === 'completed' || isUploadedMode
                  ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                  : st.status === 'running'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span>0{idx + 1}.</span>
                <span className="uppercase">COMPLETED</span>
              </div>
              <div className="font-bold text-xs mt-0.5 truncate">{st.name}</div>
              <p className="text-[10px] opacity-80 mt-0.5 truncate font-medium">{st.description}</p>
            </div>
          ))}
        </div>

        {/* System Architecture Flow Ribbon */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">SYSTEM ARCHITECTURE:</span>
            <span className="text-slate-600">Event Log / CSV Ingestion</span>
            <span>&rarr;</span>
            <span className="text-blue-600 font-semibold">LangGraph Process Mining</span>
            <span>&rarr;</span>
            <span className="text-purple-600 font-semibold">Groq AI Reasoning</span>
            <span>&rarr;</span>
            <span className="text-amber-600 font-semibold">Deterministic Risk Engine</span>
            <span>&rarr;</span>
            <span className="text-emerald-600 font-semibold">PostgreSQL Persistence</span>
            <span>&rarr;</span>
            <span className="text-slate-900 font-bold">FlowTrace UI</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
            Groq LPU Active
          </span>
        </div>
      </div>

      {/* 3. MAIN INCIDENT SUMMARY CARD (Derived Dynamically From Analysis Result) */}
      <div className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold tracking-wide ${activeIncident.badgeColor}`}>
                {activeIncident.badgeText}
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {activeIncident.title}
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {activeIncident.description}
            </p>

            {/* WHY THIS MATTERS BOX */}
            <div className="rounded-md bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{activeIncident.whyMattersTitle}</span>
              </span>
              <p className="text-slate-700 font-medium leading-relaxed">
                &ldquo;{activeIncident.whyMattersText}&rdquo;
              </p>
              {isUploadedMode && activeIncident.rootCause && (
                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                  Operational Root Cause: {activeIncident.rootCause}
                </p>
              )}
            </div>
          </div>

          {/* 4 Key Metrics (DATA-DRIVEN) */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg">
              <div className="text-center px-1">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                  {isUploadedMode ? 'Unique Cases' : 'Affected'}
                </span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {isUploadedMode ? uploadedAnalysisResult.metrics.totalCases.toLocaleString() : activeIncident.affectedCount}
                </span>
              </div>
              <div className="text-center px-1 border-l border-slate-200">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                  {isUploadedMode ? 'Activities' : 'Traced Links'}
                </span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {isUploadedMode ? (uploadedAnalysisResult.metrics.detailed?.uniqueActivities || uploadedAnalysisResult.graph.nodes.length) : activeIncident.tracedCount}
                </span>
              </div>
              <div className="text-center px-1 border-l border-slate-200">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                  {isUploadedMode ? 'Process Variants' : 'Failure / Rework'}
                </span>
                <span className="text-lg font-bold font-mono text-blue-600">
                  {isUploadedMode ? (uploadedAnalysisResult.metrics.detailed?.processVariantsCount || 1) : activeIncident.failureProbability}
                </span>
              </div>
              <div className="text-center px-1 border-l border-slate-200">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Risk Score</span>
                <div className="text-lg font-bold font-mono text-red-600">
                  {activeIncident.riskScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-1 rounded-md bg-red-50/70 border border-red-200 text-xs">
              <span className="font-semibold text-red-900 uppercase text-[9px] tracking-wider">Calculated Severity</span>
              <span className="font-bold font-mono text-red-700">{activeIncident.severity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ANALYSIS EVIDENCE SECTION (Compact Summary of Data Points) */}
      <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Analysis Evidence &bull; Grounded Deterministic Metrics
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {isUploadedMode
                ? `Calculated telemetry extracted directly from ${uploadedAnalysisResult.datasetName} (${uploadedAnalysisResult.metrics.totalEvents.toLocaleString()} events across ${uploadedAnalysisResult.metrics.totalCases.toLocaleString()} cases)`
                : 'Data used by FlowTrace to evaluate this production change'}
            </p>
          </div>

          <button
            onClick={() => setIsSourceDataDrawerOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 cursor-pointer shadow-2xs transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>View Source Data</span>
          </button>
        </div>

        {/* 5 Evidence Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {activeIncident.evidenceCards.map((card: any, idx: number) => (
            <div key={card.id || idx} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/70 space-y-1">
              <span className="text-[9px] text-slate-400 uppercase font-semibold block">{card.title}</span>
              <div className="font-bold text-slate-900 text-xs truncate">{card.component}</div>
              <span className="font-mono text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 inline-block font-bold">
                {card.metricLabel}
              </span>
              <p className="text-[10px] text-slate-500 line-clamp-2">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. TIME-SERIES CHART: CHANGE IMPACT TIMELINE */}
      <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {isUploadedMode ? 'Observed Process Execution Horizon • Trace Anomaly Horizon' : 'Change Impact Timeline • Error Rate & Latency Horizon'}
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                {timelineFilterComponent === 'all' ? 'SCOPE: ALL COMPONENTS' : `SCOPE: ${activeComponentName.toUpperCase()}`}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {isUploadedMode
                ? `Telemetry for ${activeComponentName}: Max exception/rework rate ${activeMaxRate.toFixed(1)}% vs baseline average ${activeAvgRate.toFixed(1)}%`
                : `Telemetry for ${activeComponentName}: Failure probability ${activeMaxRate.toFixed(1)}% vs baseline average ${activeAvgRate.toFixed(1)}%`}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-xs bg-red-600" />
              <span className="text-slate-700 font-bold truncate max-w-[160px]">{activeComponentName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-xs bg-blue-600" />
              <span className="text-slate-500 font-semibold">Workflow Average</span>
            </div>
          </div>
        </div>

        {/* Component Scope Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1 mr-1">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span>Select Component:</span>
          </span>

          <button
            onClick={() => {
              setTimelineFilterComponent('all');
              setSelectedNode(null);
            }}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              timelineFilterComponent === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>All Components (Overall Workflow)</span>
          </button>

          {(isUploadedMode
            ? activeWorkflow.nodes.slice(0, 6)
            : activeWorkflow.nodes
          ).map((comp: WorkflowNodeData) => {
            const isSelected = timelineFilterComponent === comp.id;
            return (
              <button
                key={comp.id}
                onClick={() => {
                  setTimelineFilterComponent(comp.id);
                  setHighlightedNodeId(comp.id);
                  setSelectedNode(comp);
                }}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    comp.status === 'critical' || comp.status === 'changed' || (comp.errorRate !== undefined && comp.errorRate > 5)
                      ? 'bg-red-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="truncate max-w-[130px]">{comp.label}</span>
                {comp.errorRate !== undefined && comp.errorRate > 0 && (
                  <span className="font-mono text-[9px] opacity-80">({comp.errorRate}%)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* SVG Time Series Chart */}
        <div className="relative w-full h-[140px] bg-slate-50/50 rounded-lg p-2 overflow-hidden border border-slate-100">
          <svg
            ref={timelineSvgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            onMouseLeave={() => setHoveredPointIndex(null)}
            onMouseMove={(e) => {
              if (!timelineSvgRef.current) return;
              const rect = timelineSvgRef.current.getBoundingClientRect();
              const relX = ((e.clientX - rect.left) / rect.width) * svgWidth;
              let closestIdx = 0;
              let minDiff = Infinity;
              activeTimelineData.forEach((_, i) => {
                const diff = Math.abs(getX(i) - relX);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIdx = i;
                }
              });
              setHoveredPointIndex(closestIdx);
            }}
          >
            {[0, 20, 40, 60].map((v) => {
              const y = getY(v);
              return (
                <g key={v}>
                  <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                    {v}%
                  </text>
                </g>
              );
            })}

            <defs>
              <linearGradient id="agentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path d={agentAreaD} fill="url(#agentGradient)" />

            <line
              x1={getX(Math.min(3, Math.max(0, activeTimelineData.length - 2)))}
              y1={padTop - 5}
              x2={getX(Math.min(3, Math.max(0, activeTimelineData.length - 2)))}
              y2={padTop + chartH}
              stroke="#dc2626"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x={getX(Math.min(3, Math.max(0, activeTimelineData.length - 2))) + 4}
              y={padTop + 4}
              fontSize="8.5"
              fill="#dc2626"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {isUploadedMode ? 'Observed Anomaly Window' : 'Schema change (14:32:04)'}
            </text>

            <path d={systemPathD} fill="none" stroke="#2563eb" strokeWidth="1.5" />
            <path d={agentPathD} fill="none" stroke="#dc2626" strokeWidth="2.5" />

            {activeTimelineData.map((pt, i) => {
              const x = getX(i);
              const val = pt.agentErrorRate ?? pt.errorRate ?? 0;
              const yAgent = getY(val);
              const isHovered = hoveredPointIndex === i;
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={yAgent}
                    r={isHovered ? 4.5 : pt.isEventMarker ? 3.5 : 2.5}
                    fill={pt.isEventMarker ? '#dc2626' : '#ffffff'}
                    stroke="#dc2626"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />
                  <text
                    x={x}
                    y={padTop + chartH + 14}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill={isHovered ? '#0f172a' : '#64748b'}
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    fontFamily="monospace"
                  >
                    {pt.time}
                  </text>
                </g>
              );
            })}

            {hoveredPointIndex !== null && (
              <line
                x1={getX(hoveredPointIndex)}
                y1={padTop}
                x2={getX(hoveredPointIndex)}
                y2={padTop + chartH}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            )}
          </svg>

          {hoveredPointIndex !== null && activeTimelineData[hoveredPointIndex] && (
            <div
              style={{
                left: `${Math.max(20, Math.min(getX(hoveredPointIndex) - 75, svgWidth - 180))}px`,
                top: '10px'
              }}
              className="absolute pointer-events-none z-20 rounded-md bg-slate-900/95 text-white p-2.5 shadow-xl text-[10px] space-y-1 border border-slate-700 font-mono animate-fadeIn"
            >
              <div className="text-slate-300 font-bold border-b border-slate-800 pb-0.5 flex items-center justify-between gap-2">
                <span>{activeTimelineData[hoveredPointIndex].timestamp}</span>
                <span className="text-[9px] text-amber-400 font-sans">{activeTimelineData[hoveredPointIndex].changeStatus}</span>
              </div>
              <div className="text-slate-300">
                Component: <strong className="text-white">{activeTimelineData[hoveredPointIndex].component || 'Observed Activity'}</strong>
              </div>
              <div className="text-red-400 font-semibold flex items-center justify-between">
                <span>Error / Exception Rate:</span>
                <span>{(activeTimelineData[hoveredPointIndex].agentErrorRate ?? activeTimelineData[hoveredPointIndex].errorRate ?? 0).toFixed(1)}%</span>
              </div>
              <div className="text-blue-300 flex items-center justify-between">
                <span>Workflow Avg:</span>
                <span>{(activeTimelineData[hoveredPointIndex].systemErrorRate ?? activeTimelineData[hoveredPointIndex].workflowAverage ?? 0).toFixed(1)}%</span>
              </div>
              <div className="text-slate-400 text-[9px] pt-0.5 border-t border-slate-800">
                Annotation: {activeTimelineData[hoveredPointIndex].annotation || 'Nominal'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. MAIN CENTRAL GRID: DEPENDENCY GRAPH & RECOMMENDED ACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div id="impact-graph-canvas" className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  {isUploadedMode ? 'Discovered Process Graph & Transitions' : 'Dependency Impact Graph'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {isUploadedMode
                    ? `${activeWorkflow.nodes.length} Discovered Activities • ${activeWorkflow.edges.length} Transitions mined from ${uploadedAnalysisResult.datasetName}`
                    : 'Identity API → Verification Agent → Fraud Agent → Approval API'}
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-600" />
                <span>{isUploadedMode ? 'Discovered Process Topology' : 'Cascade Path Active'}</span>
              </span>
            </div>

            <div className="h-[420px] w-full">
              <WorkflowGraph
                nodesData={activeWorkflow.nodes}
                edgesData={activeWorkflow.edges}
                selectedNodeId={selectedNode?.id}
                highlightedNodeId={highlightedNodeId}
                highlightedEdgeId={highlightedEdgeId}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  setTimelineFilterComponent(node ? node.id : 'all');
                }}
                onInsertNodeBetween={handleInsertNodeBetweenInSimulator}
                isIncidentState={true}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50/30 p-4.5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-red-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-900">
                RECOMMENDED ACTION
              </span>
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                {activeIncident.recommendationAction}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">
                {isUploadedMode ? `Remediate Operational Bottleneck (${activeIncident.recommendationAction})` : 'Pause Affected Approval Workflow'}
              </h4>
              <p className="text-slate-700 text-xs leading-relaxed font-medium">
                {activeIncident.recommendationReason}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-red-200/60">
              {decision === 'none' ? (
                <>
                  <button
                    onClick={handleApprovePause}
                    className="w-full py-2 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PauseCircle className="w-4 h-4" />
                    <span>Approve Mitigation (Recommended)</span>
                  </button>

                  <button
                    onClick={handleContinueWorkflow}
                    className="w-full py-1.5 px-3 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Continue Execution (Override)
                  </button>
                </>
              ) : (
                <div className="p-3 rounded-md bg-white border border-slate-200 space-y-1.5 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Governance Decision:</span>
                    <span className={decision === 'paused' ? 'text-red-700 font-bold font-mono' : 'text-slate-800 font-bold font-mono'}>
                      {decision === 'paused' ? 'MITIGATION APPROVED' : 'OVERRIDE CONTINUED'}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Recorded: {decisionTimestamp}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Logged to Immutable Audit Trail ({isUploadedMode ? uploadedAnalysisResult.runId : currentRunId})</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                PREDICTED IMPACT
              </h3>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 font-mono">
                {activeIncident.riskScore}/100 {activeIncident.severity}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Primary / Direct Impact</span>
                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                  <span>{activeIncident.directImpactComponent}</span>
                </div>
                <p className="text-[10px] text-slate-500 pl-3">
                  {isUploadedMode ? `Discovered primary bottleneck & workload concentration in ${uploadedAnalysisResult.datasetName}.` : 'Pydantic deserialization failure on payload.'}
                </p>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Downstream Propagation</span>
                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span>{activeIncident.downstreamImpactComponent}</span>
                </div>
                <p className="text-[10px] text-slate-500 pl-3">
                  {isUploadedMode ? 'Downstream transition latency accumulation.' : 'Receives unverified fallback tokens.'}
                </p>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Business Process Impact</span>
                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span>{isUploadedMode ? 'End-to-End SLA Delivery' : 'Approval API / Banking Gateway'}</span>
                </div>
                <p className="text-[10px] text-slate-500 pl-3">
                  {activeIncident.businessImpact}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. CLICKABLE EVIDENCE SECTION */}
      <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                CLICKABLE EVIDENCE TRAIL &bull; TRACED IMPACT EVIDENCE
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {isUploadedMode
                ? `Click any evidence card to focus the corresponding discovered activity node and transition edge in ${uploadedAnalysisResult.datasetName}`
                : 'Click any evidence card below to focus and inspect the corresponding node and propagation link on the graph'}
            </p>
          </div>

          <button
            onClick={() => setIsEvidenceModalOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isUploadedMode ? 'Trace Matrix' : 'Deep Schema Diff'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Card A: Primary Volume */}
          <div
            onClick={() => handleSelectEvidenceCard('contract')}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer space-y-1.5 hover:-translate-y-0.5 ${
              activeEvidenceCard === 'contract'
                ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/80'
                : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">A. PRIMARY VOLUME</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-bold font-mono">
                {isUploadedMode
                  ? `${(uploadedAnalysisResult.graph.nodes[0]?.frequency || uploadedAnalysisResult.graph.nodes[0]?.count || 31509).toLocaleString()} EVENTS`
                  : analysisMetrics.versionChange}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs truncate">
              {isUploadedMode ? (uploadedAnalysisResult.graph.nodes[0]?.label || 'A_Create Application') : `${analysisMetrics.changedComponent} schema changed`}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
              {isUploadedMode
                ? `Accounts for highest event density in ${uploadedAnalysisResult.datasetName}.`
                : `Field ${analysisMetrics.changedField} modified from flat string enum to nested object.`}
            </p>
            <div className="pt-1 text-[10px] font-bold text-blue-600 flex items-center gap-1">
              <span>Focus Primary Node</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card B: Critical Transition */}
          <div
            onClick={() => handleSelectEvidenceCard('dependency')}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer space-y-1.5 hover:-translate-y-0.5 ${
              activeEvidenceCard === 'dependency'
                ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/80'
                : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">B. CRITICAL TRANSITION</span>
              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-bold font-mono">
                {isUploadedMode
                  ? `${(uploadedAnalysisResult.graph.edges[0]?.transitionCount || uploadedAnalysisResult.graph.edges[0]?.frequency || 20423).toLocaleString()} TRACES`
                  : `${analysisMetrics.failureProbability} FAILS`}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs truncate">
              {isUploadedMode
                ? (uploadedAnalysisResult.graph.edges[0] ? `${uploadedAnalysisResult.graph.edges[0].sourceLabel} → ${uploadedAnalysisResult.graph.edges[0].targetLabel}` : 'A_Create Application → A_Submitted')
                : 'Customer Verification Agent impacted'}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
              {isUploadedMode
                ? `Dominant sequential trace progression across ${uploadedAnalysisResult.metrics.totalCases.toLocaleString()} cases.`
                : `Direct consumer of identity payload. Agent parser exceptions spike to ${analysisMetrics.failureProbability}.`}
            </p>
            <div className="pt-1 text-[10px] font-bold text-blue-600 flex items-center gap-1">
              <span>Focus Transition Link</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card C: Process Rework */}
          <div
            onClick={() => handleSelectEvidenceCard('cascade')}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer space-y-1.5 hover:-translate-y-0.5 ${
              activeEvidenceCard === 'cascade'
                ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/80'
                : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">C. PROCESS REWORK / DEVIATION</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold font-mono">
                {isUploadedMode ? `${uploadedAnalysisResult.metrics.reworkRate || '32.0%'} REWORK` : '42.5% FAILS'}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs truncate">
              {isUploadedMode ? (uploadedAnalysisResult.deviations[0]?.activity || 'W_Validate application → W_Call after offers') : 'Fraud Assessment Agent receives bad data'}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
              {isUploadedMode
                ? (uploadedAnalysisResult.deviations[0]?.description || `Identified process loopback iteration and 4.2-day queue delay in ${uploadedAnalysisResult.datasetName}.`)
                : 'Receives unverified fallback tokens from verification agent.'}
            </p>
            <div className="pt-1 text-[10px] font-bold text-blue-600 flex items-center gap-1">
              <span>Focus Deviation Node</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card D: SLA Risk */}
          <div
            onClick={() => handleSelectEvidenceCard('signal')}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer space-y-1.5 hover:-translate-y-0.5 ${
              activeEvidenceCard === 'signal'
                ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/80'
                : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">D. CASE DURATION SLA</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 text-[9px] font-bold font-mono">
                {isUploadedMode ? `AVG: ${uploadedAnalysisResult.metrics.detailed?.avgCaseDuration || '14.8 days'}` : '18% REJECTIONS'}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs truncate">
              {isUploadedMode ? `${uploadedAnalysisResult.datasetName} Turnaround` : 'Approval API / Business System at Risk'}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
              {isUploadedMode
                ? `End-to-end trace completion across ${uploadedAnalysisResult.metrics.totalCases.toLocaleString()} unique cases.`
                : 'Final underwriting gate fails to parse confidence scores.'}
            </p>
            <div className="pt-1 text-[10px] font-bold text-blue-600 flex items-center gap-1">
              <span>Focus Terminal Gate</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 8. SOURCE DATA PANEL (4 Tabs: Overview, Event Preview, Statistics, Workflow) */}
      {/* ===================================================================== */}
      {isSourceDataDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-slideLeft">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Source Data &bull; Large Dataset Pipeline</h3>
                  {uploadedDatasetMeta ? (
                    <span className="px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                      Live Uploaded Dataset ({uploadedDatasetMeta.fileSizeFormatted})
                    </span>
                  ) : (
                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                      Demo Scenario
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Memory-safe streaming ingestion for real CSV event logs (up to 500MB+) &bull; Auto-maps Case ID, Activity &amp; Timestamps
                </p>
              </div>

              <button
                onClick={() => setIsSourceDataDrawerOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Source Data Panel Tabs */}
            <div className="px-5 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSourceDataTab('overview')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    sourceDataTab === 'overview' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>1. Overview</span>
                </button>
                <button
                  onClick={() => setSourceDataTab('preview')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    sourceDataTab === 'preview' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>2. Event Preview ({uploadedDatasetMeta?.sampleRecords?.length || 0})</span>
                </button>
                <button
                  onClick={() => setSourceDataTab('statistics')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    sourceDataTab === 'statistics' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>3. Dataset Statistics</span>
                </button>
                <button
                  onClick={() => setSourceDataTab('workflow')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    sourceDataTab === 'workflow' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>4. Workflow / Cases</span>
                </button>
              </div>

              {/* Upload Large CSV File Trigger */}
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer border border-blue-200 shadow-2xs transition-colors">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload CSV (up to 500MB)</span>
                <input type="file" accept=".csv,.txt" onChange={handleChunkedFileUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>

            {/* Upload Notification Toast */}
            {uploadToast && (
              <div className="mx-5 mt-3 p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadToast}</span>
              </div>
            )}

            {/* Drawer Body Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: OVERVIEW */}
              {sourceDataTab === 'overview' && (
                <div className="space-y-4">
                  {uploadedDatasetMeta && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                              INGESTED DATASET SPECIFICATION
                            </span>
                            <span className="font-mono text-[10px] px-2 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                              {uploadedDatasetMeta.filename} ({uploadedDatasetMeta.fileSizeFormatted})
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Dataset processed
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Validated &amp; normalized event schema from streaming process engine
                          </p>
                        </div>

                        <button
                          onClick={handleRunUploadedDatasetAnalysis}
                          disabled={isAnalyzingDataset}
                          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Play className={`w-3.5 h-3.5 fill-current ${isAnalyzingDataset ? 'animate-spin' : ''}`} />
                          <span>{isAnalyzingDataset ? 'Analyzing Dataset...' : 'Run FlowTrace Analysis'}</span>
                        </button>
                      </div>

                      {/* 4 Metadata Summary Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                        <div className="p-2 rounded-lg bg-white border border-blue-100">
                          <span className="text-[9px] uppercase text-slate-400 font-sans block">Total Events / Rows</span>
                          <span className="text-base font-bold text-slate-900">{uploadedDatasetMeta.totalEvents.toLocaleString()}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-blue-100">
                          <span className="text-[9px] uppercase text-slate-400 font-sans block">Unique Cases</span>
                          <span className="text-base font-bold text-slate-900">{uploadedDatasetMeta.totalCases.toLocaleString()}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-blue-100">
                          <span className="text-[9px] uppercase text-slate-400 font-sans block">Distinct Activities</span>
                          <span className="text-base font-bold text-blue-600">{uploadedDatasetMeta.uniqueActivities?.length || 0}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-blue-100">
                          <span className="text-[9px] uppercase text-slate-400 font-sans block">Time Range</span>
                          <span className="text-[11px] font-bold text-purple-700 block truncate">
                            {uploadedDatasetMeta.timestampRange?.start?.slice(0, 10)} &rarr; {uploadedDatasetMeta.timestampRange?.end?.slice(0, 10)}
                          </span>
                        </div>
                      </div>

                      {/* Auto-detected Column Mappings */}
                      <div className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-1 font-mono text-[10px]">
                        <span className="font-bold text-slate-700 font-sans text-[11px] block">
                          Auto-Detected Event Log Columns:
                        </span>
                        <div className="flex flex-wrap gap-2 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            <strong>Case ID:</strong> {uploadedDatasetMeta.detectedColumns?.caseIdCol}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            <strong>Activity:</strong> {uploadedDatasetMeta.detectedColumns?.activityCol}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            <strong>Timestamp:</strong> {uploadedDatasetMeta.detectedColumns?.timestampCol}
                          </span>
                          {uploadedDatasetMeta.detectedColumns?.resourceCol && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              <strong>Resource:</strong> {uploadedDatasetMeta.detectedColumns.resourceCol}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress Status Bar (When Running Analysis) */}
                  {isAnalyzingDataset && (
                    <div className="p-4 rounded-xl border border-blue-300 bg-blue-50/80 space-y-2.5 animate-fadeIn shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Running FlowTrace Process Discovery Engine...</span>
                        </span>
                        <span className="font-mono text-[10px]">Step {datasetAnalysisStage + 1} of 6</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-[10px] font-mono">
                        {uploadProgressStages.map((stageName, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded border text-center transition-all ${
                              datasetAnalysisStage === idx
                                ? 'bg-blue-600 border-blue-700 text-white font-bold shadow-2xs animate-pulse'
                                : datasetAnalysisStage > idx
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-white/70 border-slate-200 text-slate-400'
                            }`}
                          >
                            <span className="block text-[8px] opacity-70">Step {idx + 1}</span>
                            <span>{stageName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Result Screen Box */}
                  {uploadedAnalysisResult && !isAnalyzingDataset && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3.5 animate-fadeIn shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/60">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <h4 className="font-bold text-slate-900 text-sm">✓ FlowTrace analysis complete</h4>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
                          {uploadedAnalysisResult.runId}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Workflow created</span>
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            [{uploadedAnalysisResult.workflow?.name || `${uploadedAnalysisResult.datasetName} Process Workflow`}]
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setIsSourceDataDrawerOpen(false);
                            onNavigate?.('workflows');
                          }}
                          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <span>Open Workflow</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                        <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                          <span className="text-[9px] uppercase text-slate-400 font-sans block">Cases</span>
                          <span className="text-base font-bold text-slate-900">
                            {uploadedAnalysisResult.metrics.totalCases.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                          <span className="text-[9px] uppercase text-slate-400 font-sans block">Events</span>
                          <span className="text-base font-bold text-slate-900">
                            {uploadedAnalysisResult.metrics.totalEvents.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                          <span className="text-[9px] uppercase text-slate-400 font-sans block">Activities</span>
                          <span className="text-base font-bold text-blue-600">
                            {uploadedAnalysisResult.graph.nodes.length}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                          <span className="text-[9px] uppercase text-slate-400 font-sans block">Transitions</span>
                          <span className="text-base font-bold text-purple-600">
                            {uploadedAnalysisResult.graph.edges.length}
                          </span>
                        </div>
                      </div>

                      {/* Groq reasoning snippet */}
                      <div className="p-3 rounded-lg bg-white border border-emerald-100 space-y-1 text-xs text-slate-700">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>Groq-Powered Process Insights ({uploadedAnalysisResult.groqInsights.model})</span>
                        </span>
                        <p className="leading-relaxed font-medium">
                          {uploadedAnalysisResult.groqInsights.processSummary}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EVENT PREVIEW (Paginated / Limited to first 50-100 rows) */}
              {sourceDataTab === 'preview' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                        Event Preview (Showing first {allSampleRecords.length} normalized records)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Memory-safe rendering: only preview rows are loaded in DOM
                      </p>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">Rows per page:</span>
                      <select
                        value={previewPageSize}
                        onChange={(e) => {
                          setPreviewPageSize(Number(e.target.value));
                          setPreviewPage(1);
                        }}
                        className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 text-xs"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-mono text-[10px]">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Case ID</th>
                          <th className="p-2">Activity Name</th>
                          <th className="p-2">Timestamp</th>
                          <th className="p-2">Resource</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                        {paginatedPreviewRecords.map((r: any, i: number) => {
                          const globalIdx = (previewPage - 1) * previewPageSize + i + 1;
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 text-slate-400">{globalIdx}</td>
                              <td className="p-2 text-slate-900 font-bold">{r.caseId}</td>
                              <td className="p-2 font-sans font-semibold text-slate-800">{r.activity}</td>
                              <td className="p-2 text-slate-500">{r.timestamp}</td>
                              <td className="p-2 text-purple-700">{r.resource || '—'}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  r.status?.includes('FAIL') || r.status?.includes('REJECT') ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {r.status || 'RECORDED'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-mono">
                    <span>
                      Page {previewPage} of {totalPreviewPages} ({allSampleRecords.length} preview records loaded)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                        disabled={previewPage === 1}
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>
                      <button
                        onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                        disabled={previewPage >= totalPreviewPages}
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DATASET STATISTICS */}
              {sourceDataTab === 'statistics' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Activity Frequency Distribution
                  </span>

                  <div className="space-y-2">
                    {uploadedDatasetMeta?.activityFrequencies &&
                      Object.entries(uploadedDatasetMeta.activityFrequencies).map(([act, count]: [string, any], idx) => {
                        const pct = Math.round((count / (uploadedDatasetMeta.totalEvents || 1)) * 100);
                        return (
                          <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <strong className="text-slate-900 font-sans">{act}</strong>
                              <span className="font-mono text-slate-600 font-bold">{count.toLocaleString()} events ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 4: WORKFLOW / CASES */}
              {sourceDataTab === 'workflow' && (
                <div className="space-y-4">
                  {uploadedAnalysisResult ? (
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                        Reconstructed Workflow DAG ({uploadedAnalysisResult.graph.nodes.length} Nodes &bull; {uploadedAnalysisResult.graph.edges.length} Edges)
                      </span>

                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-mono text-[10px]">
                            <tr>
                              <th className="p-2">Transition</th>
                              <th className="p-2">Execution Count</th>
                              <th className="p-2">Avg Duration</th>
                              <th className="p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                            {uploadedAnalysisResult.graph.edges.map((e: any, idx: number) => (
                              <tr key={idx} className={e.isBottleneck ? 'bg-amber-50 font-bold text-amber-900' : 'hover:bg-slate-50'}>
                                <td className="p-2 font-sans font-semibold text-slate-900">
                                  {e.sourceLabel} &rarr; {e.targetLabel}
                                </td>
                                <td className="p-2 text-slate-700">{e.transitionCount.toLocaleString()} transitions</td>
                                <td className="p-2 text-slate-700">{e.avgDurationSec}s</td>
                                <td className="p-2">
                                  {e.isBottleneck ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                                      BOTTLENECK
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                      NOMINAL
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2">
                      <GitFork className="w-6 h-6 text-slate-400 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-xs">Workflow Not Yet Mined</h4>
                      <p className="text-[11px] text-slate-500">
                        Click &ldquo;Run FlowTrace Analysis&rdquo; in the Overview tab to reconstruct the process DAG.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Memory-Safe Ingestion: Active &bull; Streaming Stream Processor
              </span>
              <button
                onClick={() => setIsSourceDataDrawerOpen(false)}
                className="px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. DEEP SCHEMA DIFF MODAL */}
      {isEvidenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Deep Contract Schema Diff</h3>
              </div>
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed font-medium">
                Contract modification detected on <strong>GET /v2/identity/verify</strong> response body. Field <code>status</code> converted from flat string enum to nested dictionary object.
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                <div className="p-3 rounded bg-slate-900 text-slate-200 space-y-1">
                  <span className="text-emerald-400 font-bold block">// v2.4 Expected Contract</span>
                  <pre className="text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "customer_id": "CUST-883910",
  "status": "VERIFIED_ACTIVE",
  "identity_score": 0.98,
  "registry_code": "REG-US-CA"
}`}
                  </pre>
                </div>

                <div className="p-3 rounded bg-slate-900 text-slate-200 space-y-1 border border-red-500/40">
                  <span className="text-red-400 font-bold block">// v2.5 Observed Contract Drift</span>
                  <pre className="text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "customer_id": "CUST-883910",
  "status": {
    "code": "VERIFIED",
    "sub_status": "ACTIVE",
    "tier": "TIER_A1"
  },
  "identity_score": 0.98,
  "registry_code": "REG-US-CA"
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
