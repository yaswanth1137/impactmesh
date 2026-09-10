export type NavigationPageId = 'overview' | 'workflows' | 'simulator' | 'risks' | 'audit';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ServiceNodeType = 'agent' | 'tool' | 'api' | 'system' | 'database' | 'external' | 'stream' | 'decision' | 'approval';
export type RecommendationAction = 'ALLOW' | 'WARN' | 'PAUSE';

export type GraphMetric = 'health' | 'latency' | 'errorRate' | 'traffic';
export type GraphFilter = 'all' | 'changed' | 'affected' | 'healthy';

export type DemoPipelineStage =
  | 'healthy'
  | 'change_detected'
  | 'tracing_dependencies'
  | 'predicting_impact'
  | 'risk_assessment'
  | 'analysis_complete'
  | 'workflow_paused'
  | 'workflow_continued';

export interface WorkflowNodeData {
  id: string;
  label: string;
  type: ServiceNodeType;
  modelOrProtocol: string;
  status: 'healthy' | 'warning' | 'critical' | 'changed';
  latencyMs: number;
  errorRate: number;
  version: string;
  owner: string;
  description: string;
  consumersCount?: number;
  lastEvaluated?: string;
  changeSummary?: string;
  isRootCause?: boolean;
  isAffected?: boolean;
  impactClassification?: 'changed' | 'direct_impact' | 'downstream_impact' | 'unaffected';
  whyAffected?: string;
  occurrences?: number;
  casesCount?: number;
  frequency?: number;
}

export interface WorkflowEdgeData {
  id: string;
  source: string;
  target: string;
  sourceLabel?: string;
  targetLabel?: string;
  protocol: string;
  latencyMs: number;
  requestsPerMin?: string;
  failureRate?: string;
  propagationType?: 'DIRECT' | 'CASCADE' | 'NONE';
  isImpactPath?: boolean;
  transitionCount?: number;
  frequency?: number;
  casesCount?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  code: string;
  healthScore: number;
  riskLevel: RiskLevel;
  totalNodes: number;
  avgLatencyMs: number;
  environment?: 'Production' | 'Staging' | 'Canary';
  description?: string;
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  isLiveDataset?: boolean;
  datasetFilename?: string;
  datasetId?: string;
  caseCount?: number;
  eventCount?: number;
  activityCount?: number;
  transitionCount?: number;
  timeRange?: { start: string; end: string };
  metrics?: {
    totalEvents: number;
    totalCases: number;
    uniqueActivities: number;
    uniqueResources: number;
    firstActivity?: string;
    finalActivity?: string;
    mostFrequentActivities?: Array<{ activity: string; count: number }>;
    mostFrequentTransitions?: Array<{ transition: string; count: number }>;
    avgEventsPerCase?: string;
    minCaseDuration?: string;
    maxCaseDuration?: string;
    avgCaseDuration?: string;
  };
}

export interface TimeSeriesPoint {
  time: string;
  errorRate: number;
  latencyMs: number;
  isChangePoint?: boolean;
  eventLabel?: string;
}

export interface RiskEventItem {
  id: string;
  timestamp: string;
  detectedTime: string;
  eventType: string;
  workflow: string;
  workflowCode: string;
  affectedComponent: string;
  sourceNode?: string;
  severity: RiskLevel;
  riskScore: number;
  status: 'action_required' | 'investigating' | 'monitored' | 'mitigated' | 'resolved' | 'verified';
  recommendedAction?: RecommendationAction;
  details: string;
  rootCause?: string;
  failureRate?: string;
  impactRadius?: number;
  propagationPath?: string[];
  schemaDiff?: {
    before: string;
    after: string;
  };
  telemetrySnapshot?: {
    latency: string;
    errorRate: string;
    p99Latency?: string;
    traffic?: string;
  };
  isCurrentIncident?: boolean;
}

export type AuditCategory = 'detection' | 'analysis' | 'recommendation' | 'operator_action';

export interface AuditEntry {
  id: string;
  timestamp: string;
  relativeTime?: string;
  action: string;
  category: AuditCategory;
  target: string;
  affectedComponent?: string;
  workflow: string;
  workflowCode: string;
  actor: string;
  result: string;
  status: 'completed' | 'recommended' | 'pending' | 'verified' | 'action_taken';
  severity?: 'critical' | 'high' | 'info' | 'normal';
  details: string;
  stepNumber?: number;
  evidence?: {
    riskScore?: number;
    failureProbability?: string;
    affectedComponentsCount?: number;
    dependenciesTracedCount?: number;
    schemaDiffSummary?: string;
    recommendedAction?: string;
    operatorNote?: string;
  };
  isCurrentIncident?: boolean;
}

export interface TimelinePoint {
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

