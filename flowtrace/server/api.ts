import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from './db.ts';
import { runLangGraphAnalysis, runLangGraphProcessPipeline } from './langgraph.ts';
import { datasetEngine } from './datasetEngine.ts';

// Helper to parse JSON body from incoming request
function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body) {
          resolve({} as T);
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

// Helper to send JSON response
function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// ============================================================================
// Main API Request Handler (Vite Middleware & Express compatible)
// ============================================================================
export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void
): Promise<boolean> {
  const url = req.url || '';
  const method = req.method || 'GET';

  // Only handle /api routes
  if (!url.startsWith('/api')) {
    if (next) next();
    return false;
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  try {
    const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. GET /api/overview
    if (pathname === '/api/overview' && method === 'GET') {
      const overview = db.getOverviewData();
      sendJson(res, 200, { success: true, data: overview });
      return true;
    }

    // 2. GET /api/workflows
    if (pathname === '/api/workflows' && method === 'GET') {
      const workflows = db.getWorkflows();
      sendJson(res, 200, { success: true, data: workflows });
      return true;
    }

    // 3. POST /api/workflows
    if (pathname === '/api/workflows' && method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const saved = db.saveWorkflow(body);
      sendJson(res, 201, { success: true, data: saved });
      return true;
    }

    // 4. GET /api/workflows/:id/graph
    if (pathname.startsWith('/api/workflows/') && pathname.endsWith('/graph') && method === 'GET') {
      const id = pathname.replace('/api/workflows/', '').replace('/graph', '');
      const workflow = db.getWorkflowById(id);
      if (!workflow) {
        sendJson(res, 404, { success: false, error: 'Workflow not found' });
      } else {
        sendJson(res, 200, {
          success: true,
          data: {
            nodes: workflow.nodes,
            edges: workflow.edges
          }
        });
      }
      return true;
    }

    // 5. GET /api/workflows/:id
    if (pathname.startsWith('/api/workflows/') && method === 'GET') {
      const id = pathname.replace('/api/workflows/', '');
      const workflow = db.getWorkflowById(id);
      if (!workflow) {
        sendJson(res, 404, { success: false, error: 'Workflow not found' });
      } else {
        sendJson(res, 200, { success: true, data: workflow });
      }
      return true;
    }

    // 5. PUT /api/workflows/:id
    if (pathname.startsWith('/api/workflows/') && method === 'PUT') {
      const body = await parseJsonBody<any>(req);
      const saved = db.saveWorkflow(body);
      sendJson(res, 200, { success: true, data: saved });
      return true;
    }

    // 6. GET /api/incidents
    if (pathname === '/api/incidents' && method === 'GET') {
      const incidents = db.getIncidents();
      sendJson(res, 200, { success: true, data: incidents });
      return true;
    }

    // 7. GET /api/incidents/:id
    if (pathname.startsWith('/api/incidents/') && method === 'GET') {
      const id = pathname.replace('/api/incidents/', '');
      const incident = db.getIncidentById(id);
      if (!incident) {
        sendJson(res, 404, { success: false, error: 'Incident not found' });
      } else {
        sendJson(res, 200, { success: true, data: incident });
      }
      return true;
    }

    // 8. GET /api/risk-events
    if (pathname === '/api/risk-events' && method === 'GET') {
      const riskEvents = db.getRiskEvents();
      sendJson(res, 200, { success: true, data: riskEvents });
      return true;
    }

    // 9. GET /api/audit-log
    if (pathname === '/api/audit-log' && method === 'GET') {
      const auditLogs = db.getAuditLogs();
      sendJson(res, 200, { success: true, data: auditLogs });
      return true;
    }

    // 10. POST /api/analyze-change (LangGraph Orchestration Pipeline)
    if (pathname === '/api/analyze-change' && method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const analysisResult = await runLangGraphAnalysis({
        workflowId: body.workflowId || 'wf-customer-verification',
        componentId: body.componentId || 'customer-identity-api',
        changeType: body.changeType || 'contract_drift',
        customDetails: body.customDetails
      });

      sendJson(res, 200, {
        success: true,
        data: {
          pipelineStage: 'analysis_complete',
          riskScore: analysisResult.riskAssessment?.riskScore || 82,
          failureProbability: analysisResult.impactPrediction?.failureProbability || '68%',
          severity: analysisResult.riskAssessment?.severity || 'high',
          affectedComponentsCount: analysisResult.impactPrediction?.affectedComponentsCount || 3,
          dependenciesTracedCount: analysisResult.dependencyTrace?.dependenciesTracedCount || 5,
          recommendation: analysisResult.recommendation?.action || 'PAUSE',
          recommendationReason: analysisResult.recommendation?.reasoning || 'Prevent invalid verification propagation',
          state: analysisResult
        }
      });
      return true;
    }

    // 11. POST /api/operator-decision
    if (pathname === '/api/operator-decision' && method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const incidentId = body.incidentId || 'INC-94021';
      const decision = body.decision || 'paused';

      db.updateOperatorDecision(incidentId, decision);

      const now = new Date();
      const timeString = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} UTC`;

      db.addAuditLog({
        id: `AUD-${Math.floor(Math.random() * 9000) + 90000}`,
        timestamp: timeString,
        relative_time: 'Just now',
        action: 'Operator Decision',
        category: 'operator_action',
        target: 'Production Approval Gate',
        affected_component: 'Approval API / Business System',
        workflow_id: 'wf-customer-verification',
        workflow_name: 'Customer Verification & Approval',
        workflow_code: 'WF-CVA-01',
        actor: 'Enterprise SRE Operator',
        result: decision === 'paused' ? 'Workflow paused by operator' : 'Workflow execution continued with live monitoring',
        status: 'action_taken',
        severity: 'normal',
        details: `Operator executed governance action: ${decision.toUpperCase()} on Customer Verification & Approval.`,
        is_current_incident: true
      });

      sendJson(res, 200, { success: true, message: `Operator decision recorded: ${decision}` });
      return true;
    }

    // 12. GET /api/source-data & /api/dataset
    if ((pathname === '/api/source-data' || pathname === '/api/dataset') && method === 'GET') {
      const sourceData = db.getSourceData();
      sendJson(res, 200, { success: true, data: sourceData });
      return true;
    }

    // 13. GET /api/telemetry/:workflowId
    if (pathname.startsWith('/api/telemetry/') && method === 'GET') {
      const workflowId = pathname.replace('/api/telemetry/', '');
      const telemetry = db.getTelemetry(workflowId);
      sendJson(res, 200, { success: true, data: telemetry });
      return true;
    }

    // 14. POST /api/demo/run (Run full end-to-end demo scenario)
    if (pathname === '/api/demo/run' && method === 'POST') {
      const analysisResult = await runLangGraphAnalysis({
        workflowId: 'wf-customer-verification',
        componentId: 'customer-identity-api',
        changeType: 'contract_drift'
      });

      sendJson(res, 200, {
        success: true,
        data: {
          pipelineStage: 'analysis_complete',
          riskScore: analysisResult.riskAssessment?.riskScore || 82,
          failureProbability: analysisResult.impactPrediction?.failureProbability || '68%',
          severity: analysisResult.riskAssessment?.severity || 'high',
          affectedComponentsCount: analysisResult.impactPrediction?.affectedComponentsCount || 3,
          dependenciesTracedCount: analysisResult.dependencyTrace?.dependenciesTracedCount || 5,
          recommendation: analysisResult.recommendation?.action || 'PAUSE',
          recommendationReason: analysisResult.recommendation?.reasoning || 'Prevent invalid verification propagation',
          state: analysisResult
        }
      });
      return true;
    }

    // 15. POST /api/demo/reset (Reset state to canonical seed demo scenario)
    if (pathname === '/api/demo/reset' && method === 'POST') {
      db.seed();
      sendJson(res, 200, {
        success: true,
        message: 'Demo scenario reset to canonical seed data successfully.'
      });
      return true;
    }

    // 16. POST /api/dataset/upload (Upload & Parse Real CSV / Event Log)
    if (pathname === '/api/dataset/upload' && method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const filename = body.filename || 'uploaded_eventlog.csv';
      const csvContent = body.csvContent || '';

      if (!csvContent || csvContent.trim().length === 0) {
        sendJson(res, 400, { success: false, error: 'Empty CSV content uploaded.' });
        return true;
      }

      try {
        const metadata = await datasetEngine.parseCsv(filename, csvContent);
        sendJson(res, 200, {
          success: true,
          message: `Successfully ingested ${metadata.totalEvents} records across ${metadata.totalCases} cases.`,
          data: metadata
        });
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err?.message || 'CSV parse error.' });
      }
      return true;
    }

    // 17. POST /api/dataset/upload-chunk (Memory-Safe Chunked Upload for files up to 500MB+)
    if (pathname === '/api/dataset/upload-chunk' && method === 'POST') {
      const uploadId = (req.headers['x-upload-id'] as string) || parsedUrl.searchParams.get('uploadId') || `UP-${Date.now()}`;
      const chunkIndex = parseInt((req.headers['x-chunk-index'] as string) || parsedUrl.searchParams.get('chunkIndex') || '0', 10);
      const totalChunks = parseInt((req.headers['x-total-chunks'] as string) || parsedUrl.searchParams.get('totalChunks') || '1', 10);
      const rawName = (req.headers['x-filename'] as string) || parsedUrl.searchParams.get('filename') || 'dataset.csv';
      const filename = decodeURIComponent(rawName);
      const fileSize = parseInt((req.headers['x-file-size'] as string) || parsedUrl.searchParams.get('fileSize') || '0', 10);

      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(chunk));
      await new Promise<void>((resolve, reject) => {
        req.on('end', () => resolve());
        req.on('error', err => reject(err));
      });

      const chunkBuffer = Buffer.concat(chunks);
      await datasetEngine.appendChunk(uploadId, chunkBuffer);

      if (chunkIndex === totalChunks - 1) {
        try {
          const metadata = await datasetEngine.finalizeUpload(uploadId, filename, fileSize);
          sendJson(res, 200, {
            success: true,
            isComplete: true,
            message: `Dataset processed: ${metadata.totalEvents.toLocaleString()} events across ${metadata.totalCases.toLocaleString()} cases.`,
            data: metadata
          });
        } catch (err: any) {
          sendJson(res, 400, { success: false, error: err?.message || 'Failed to process dataset file.' });
        }
      } else {
        sendJson(res, 200, {
          success: true,
          isComplete: false,
          chunkIndex,
          totalChunks,
          message: `Chunk ${chunkIndex + 1}/${totalChunks} received.`
        });
      }
      return true;
    }

    // 18. GET /api/dataset/metadata
    if (pathname === '/api/dataset/metadata' && method === 'GET') {
      const metadata = datasetEngine.getActiveDataset();
      sendJson(res, 200, { success: true, data: metadata });
      return true;
    }

    // 19. POST /api/dataset/analyze (Run FlowTrace Analysis on Uploaded Dataset via LangGraph Pipeline)
    if (pathname === '/api/dataset/analyze' && method === 'POST') {
      try {
        const analysisResult = await runLangGraphProcessPipeline(datasetEngine);
        sendJson(res, 200, { success: true, data: analysisResult });
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err?.message || 'Analysis error.' });
      }
      return true;
    }

    // 20. GET /api/dataset/analysis
    if (pathname === '/api/dataset/analysis' && method === 'GET') {
      const result = datasetEngine.getLastAnalysisResult();
      sendJson(res, 200, { success: true, data: result });
      return true;
    }

    // Unhandled /api route
    sendJson(res, 404, { success: false, error: 'Endpoint not found' });
    return true;
  } catch (err: any) {
    sendJson(res, 500, { success: false, error: err?.message || 'Internal server error' });
    return true;
  }
}
