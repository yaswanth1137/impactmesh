/**
 * IMPACTMESH // BLACKTIDE SYSTEMS
 * Groq Reasoning Service Types & Structured Response Schema
 */

export interface ReasoningContext {
  decisionTitle: string;
  triggerEvent: {
    department: string;
    eventType: string;
    entityId: string;
    previousValue?: unknown;
    newValue: unknown;
  };
  businessPosition: {
    revenueINR: number;
    budgetINR: number;
    engineeringCapacityHours: number;
    allocatedCapacityHours: number;
    riskScore: number;
  };
  impactEvidence: Array<{
    nodeId: string;
    entityType: string;
    metric: string;
    delta: string | number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  feasibleOptions: Array<{
    id: string;
    title: string;
    department: string;
    score: number;
    estimatedSavingsINR?: number;
    riskImpact?: string;
  }>;
}

export interface StrategicRecommendation {
  recommendedOptionId: string;
  title: string;
  rationale: string;
  strategicObjective: string;
  confidenceScore: number; // 0.00 to 1.00
  bearingDeltaDegrees: number; // e.g., -27 degrees
  projectedMetrics: {
    revenueImpactINR: number;
    budgetSavingsINR: number;
    capacityDeficitDeltaHours: number;
    deliveryDelayDeltaDays: number;
  };
  tradeoffs: Array<{
    department: string;
    sacrifice: string;
    benefit: string;
  }>;
  riskMitigations: string[];
  evidenceCitations: string[];
}

export interface GroqReasoningResponse {
  recommendation: StrategicRecommendation;
  executiveBrief: string;
  captainLogEntry: {
    headline: string;
    logText: string;
    severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
    suggestedAction: string;
  };
  modelUsed: string;
  latencyMs: number;
  isMock: boolean;
}

export interface GroqReasoningOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  forceMock?: boolean;
}
