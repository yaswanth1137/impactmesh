import type {
  WorkflowDefinition,
  RiskEventItem,
  AuditEntry
} from '../types';
import { allInitialWorkflows } from '../data/workflows';

const API_BASE = '/api';

export interface OverviewData {
  activeWorkflows: number;
  atRiskWorkflows: number;
  nominalWorkflows: number;
  changesAnalyzed: number;
  criticalEvents: number;
  healthDistribution: {
    healthy: number;
    atRisk: number;
    critical: number;
  };
  recentChanges: Array<{
    component: string;
    risk: string;
    severity: string;
    summary: string;
    details: string;
    time: string;
  }>;
}

export interface AnalyzeChangeResponse {
  pipelineStage: string;
  riskScore: number;
  failureProbability: string;
  severity: string;
  affectedComponentsCount: number;
  dependenciesTracedCount: number;
  recommendation: string;
  recommendationReason: string;
  state: any;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

// ============================================================================
// API Client Functions
// ============================================================================

export async function fetchOverview(): Promise<OverviewData> {
  try {
    return await request<OverviewData>('/overview');
  } catch (err) {
    console.warn('Falling back to local overview data:', err);
    return {
      activeWorkflows: 4,
      atRiskWorkflows: 1,
      nominalWorkflows: 3,
      changesAnalyzed: 48,
      criticalEvents: 3,
      healthDistribution: { healthy: 3, atRisk: 1, critical: 3 },
      recentChanges: [
        {
          component: 'Customer Identity API',
          risk: 'HIGH RISK',
          severity: 'high',
          summary: 'Schema contract drift detected (v2.4 → v2.5)',
          details: '3 affected downstream components',
          time: 'Just now'
        }
      ]
    };
  }
}

export async function fetchWorkflows(): Promise<WorkflowDefinition[]> {
  try {
    return await request<WorkflowDefinition[]>('/workflows');
  } catch (err) {
    console.warn('Falling back to local workflows data:', err);
    return allInitialWorkflows;
  }
}

export async function fetchWorkflow(id: string): Promise<WorkflowDefinition> {
  try {
    return await request<WorkflowDefinition>(`/workflows/${id}`);
  } catch (err) {
    console.warn(`Falling back to local workflow ${id}:`, err);
    return allInitialWorkflows.find(w => w.id === id) || allInitialWorkflows[0];
  }
}

export async function saveWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
  return await request<WorkflowDefinition>('/workflows', {
    method: 'POST',
    body: JSON.stringify(workflow)
  });
}

export async function fetchIncidents(): Promise<any[]> {
  try {
    return await request<any[]>('/incidents');
  } catch (err) {
    console.warn('Falling back to local incidents data:', err);
    return [];
  }
}

export async function fetchIncident(id: string): Promise<any> {
  try {
    return await request<any>(`/incidents/${id}`);
  } catch (err) {
    console.warn(`Falling back to local incident ${id}:`, err);
    return null;
  }
}

export async function fetchRiskEvents(): Promise<RiskEventItem[]> {
  try {
    return await request<RiskEventItem[]>('/risk-events');
  } catch (err) {
    console.warn('Falling back to local risk events data:', err);
    return [];
  }
}

export async function fetchAuditLogs(): Promise<AuditEntry[]> {
  try {
    return await request<AuditEntry[]>('/audit-log');
  } catch (err) {
    console.warn('Falling back to local audit logs data:', err);
    return [];
  }
}

export async function analyzeChange(payload: {
  workflowId: string;
  componentId: string;
  changeType?: string;
  customDetails?: string;
}): Promise<AnalyzeChangeResponse> {
  return await request<AnalyzeChangeResponse>('/analyze-change', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function recordOperatorDecision(payload: {
  incidentId: string;
  decision: 'paused' | 'continued';
}): Promise<{ success: boolean; message: string }> {
  return await request<{ success: boolean; message: string }>('/operator-decision', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function resetDemoData(): Promise<{ success: boolean; message: string }> {
  return await request<{ success: boolean; message: string }>('/demo/reset', {
    method: 'POST'
  });
}

export async function fetchSourceData(): Promise<any> {
  try {
    return await request<any>('/source-data');
  } catch (err) {
    console.warn('Falling back to local source data:', err);
    return null;
  }
}

export async function fetchTelemetry(workflowId = 'wf-customer-verification'): Promise<any[]> {
  try {
    return await request<any[]>(`/telemetry/${workflowId}`);
  } catch (err) {
    console.warn('Falling back to local telemetry:', err);
    return [];
  }
}

export async function runDemoScenario(): Promise<AnalyzeChangeResponse> {
  return await request<AnalyzeChangeResponse>('/demo/run', {
    method: 'POST'
  });
}

export async function uploadCsvDataset(filename: string, csvContent: string): Promise<any> {
  return await request<any>('/dataset/upload', {
    method: 'POST',
    body: JSON.stringify({ filename, csvContent })
  });
}

export interface UploadProgressInfo {
  percent: number;
  uploadedBytes: number;
  totalBytes: number;
  uploadedMB: string;
  totalMB: string;
  currentChunk: number;
  totalChunks: number;
}

export async function uploadLargeDataset(
  file: File,
  onProgress?: (progress: UploadProgressInfo) => void
): Promise<any> {
  const chunkSize = 5 * 1024 * 1024; // 5MB memory-safe chunk
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = `UP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const totalMB = (file.size / (1024 * 1024)).toFixed(2);

  let resultData = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunkBlob = file.slice(start, end);

    const response = await fetch('/api/dataset/upload-chunk', {
      method: 'POST',
      headers: {
        'x-upload-id': uploadId,
        'x-chunk-index': chunkIndex.toString(),
        'x-total-chunks': totalChunks.toString(),
        'x-filename': encodeURIComponent(file.name),
        'x-file-size': file.size.toString(),
        'Content-Type': 'application/octet-stream'
      },
      body: chunkBlob
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Chunk ${chunkIndex + 1} upload failed`);
    }

    const json = await response.json();
    if (json.isComplete) {
      resultData = json.data;
    }

    const uploadedBytes = end;
    const uploadedMB = (uploadedBytes / (1024 * 1024)).toFixed(2);
    const percent = Math.min(100, Math.round((uploadedBytes / file.size) * 100));

    if (onProgress) {
      onProgress({
        percent,
        uploadedBytes,
        totalBytes: file.size,
        uploadedMB,
        totalMB,
        currentChunk: chunkIndex + 1,
        totalChunks
      });
    }
  }

  return resultData;
}

export async function fetchDatasetMetadata(): Promise<any> {
  try {
    return await request<any>('/dataset/metadata');
  } catch (err) {
    console.warn('Falling back to local dataset metadata:', err);
    return null;
  }
}

export async function runDatasetAnalysis(): Promise<any> {
  return await request<any>('/dataset/analyze', {
    method: 'POST'
  });
}

export async function fetchDatasetAnalysis(): Promise<any> {
  try {
    return await request<any>('/dataset/analysis');
  } catch (err) {
    console.warn('Falling back to local dataset analysis:', err);
    return null;
  }
}
