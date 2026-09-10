import type { WorkflowDefinition } from '../types';

export const canonicalWorkflow: WorkflowDefinition = {
  id: 'wf-customer-verification',
  name: 'Customer Verification & Approval',
  code: 'WF-CVA-01',
  environment: 'Production',
  description: 'End-to-end automated loan verification and underwriting chain: orchestrating KYC checks, risk intelligence, and core approval API bindings.',
  healthScore: 58,
  riskLevel: 'high',
  totalNodes: 5,
  avgLatencyMs: 115,
  nodes: [
    {
      id: 'customer-identity-api',
      label: 'Customer Identity API',
      type: 'tool',
      modelOrProtocol: 'REST / JSON (v2.5)',
      status: 'changed',
      latencyMs: 45,
      errorRate: 1.2,
      version: 'v2.5.0',
      owner: 'Identity & Auth Platform',
      description: 'Provides government registry verification and customer identity status tokens.',
      consumersCount: 3,
      lastEvaluated: 'Just now',
      changeSummary: 'Schema modified: status changed from string enum to nested object.',
      isRootCause: true,
      isAffected: false,
      impactClassification: 'changed',
      whyAffected: 'Source of schema contract drift. Changed contract without backwards compatibility.'
    },
    {
      id: 'customer-verification-agent',
      label: 'Customer Verification Agent',
      type: 'agent',
      modelOrProtocol: 'Groq / LLaMA 3.3 (Reasoning)',
      status: 'critical',
      latencyMs: 140,
      errorRate: 68.0,
      version: 'v2.1.0',
      owner: 'Customer Onboarding Squad',
      description: 'Orchestrates identity verification, document parsing, and customer attribute checks.',
      consumersCount: 2,
      lastEvaluated: 'Just now',
      isAffected: true,
      impactClassification: 'direct_impact',
      whyAffected: 'Directly consumes Customer Identity API payload; deserialization exceptions spike to 68%.'
    },
    {
      id: 'fraud-assessment-agent',
      label: 'Fraud Assessment Agent',
      type: 'agent',
      modelOrProtocol: 'Groq / LLaMA 3.3 (Risk Engine)',
      status: 'critical',
      latencyMs: 210,
      errorRate: 42.5,
      version: 'v3.0.4',
      owner: 'Risk Intelligence Pod',
      description: 'Analyzes behavioral velocity, device anomalies, and consumer risk profiles.',
      consumersCount: 1,
      lastEvaluated: 'Just now',
      isAffected: true,
      impactClassification: 'downstream_impact',
      whyAffected: 'Receives unverified fallback tokens from verification agent, causing underwriting analysis failures.'
    },
    {
      id: 'approval-api',
      label: 'Approval API / Business System',
      type: 'system',
      modelOrProtocol: 'Enterprise Core gRPC',
      status: 'warning',
      latencyMs: 65,
      errorRate: 18.0,
      version: 'v4.1.2',
      owner: 'Core Banking Systems',
      description: 'Executes automated underwriting decisions and generates account binding tokens.',
      consumersCount: 0,
      lastEvaluated: 'Just now',
      isAffected: true,
      impactClassification: 'downstream_impact',
      whyAffected: 'Final underwriting gate receives incomplete risk scores, triggering automatic approval rejections.'
    },
    {
      id: 'audit-telemetry-sink',
      label: 'Audit & Compliance Sink',
      type: 'system',
      modelOrProtocol: 'Kafka / EventStream',
      status: 'healthy',
      latencyMs: 14,
      errorRate: 0.0,
      version: 'v1.8.0',
      owner: 'SecOps & Compliance',
      description: 'Immutable asynchronous event store logging verification lifecycle records.',
      consumersCount: 0,
      lastEvaluated: 'Just now',
      isAffected: false,
      impactClassification: 'unaffected',
      whyAffected: 'Operates on independent raw event stream with schema isolation.'
    }
  ],
  edges: [
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
  ]
};

export const additionalWorkflows: WorkflowDefinition[] = [
  {
    id: 'wf-payment-fraud',
    name: 'Payment Fraud Detection',
    code: 'WF-PFD-02',
    environment: 'Production',
    description: 'Real-time card transaction velocity scoring and merchant anomaly evaluation pipeline.',
    healthScore: 99,
    riskLevel: 'low',
    totalNodes: 4,
    avgLatencyMs: 42,
    nodes: [
      {
        id: 'txn-gateway',
        label: 'Card Transaction Ingress',
        type: 'api',
        modelOrProtocol: 'ISO 8583 REST Gateway',
        status: 'healthy',
        latencyMs: 18,
        errorRate: 0.01,
        version: 'v3.2.0',
        owner: 'Payment Infra',
        description: 'Ingests global point-of-sale and e-commerce payment payloads.',
        consumersCount: 2,
        lastEvaluated: '4 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      },
      {
        id: 'fraud-scorer-agent',
        label: 'Velocity & Pattern Scorer',
        type: 'agent',
        modelOrProtocol: 'Groq / LLaMA 3.1 Instant',
        status: 'healthy',
        latencyMs: 38,
        errorRate: 0.02,
        version: 'v2.0.1',
        owner: 'Risk Engineering',
        description: 'Computes rolling 5-minute geolocation and card velocity vectors.',
        consumersCount: 1,
        lastEvaluated: '4 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      },
      {
        id: 'feature-store',
        label: 'Redis Feature Store',
        type: 'database',
        modelOrProtocol: 'Redis Cluster',
        status: 'healthy',
        latencyMs: 4,
        errorRate: 0.0,
        version: 'v7.2.4',
        owner: 'Data Platform',
        description: 'Low-latency distributed state for historical merchant transaction baselines.',
        consumersCount: 1,
        lastEvaluated: '4 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      },
      {
        id: 'settlement-router',
        label: 'Settlement Decision Router',
        type: 'system',
        modelOrProtocol: 'gRPC Core',
        status: 'healthy',
        latencyMs: 22,
        errorRate: 0.0,
        version: 'v1.4.0',
        owner: 'Banking Core',
        description: 'Applies automated authorization blocks or passes cleared transactions.',
        consumersCount: 0,
        lastEvaluated: '4 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      }
    ],
    edges: [
      {
        id: 'pfd-e1',
        source: 'txn-gateway',
        target: 'fraud-scorer-agent',
        sourceLabel: 'Card Transaction Ingress',
        targetLabel: 'Velocity & Pattern Scorer',
        protocol: 'gRPC Stream',
        latencyMs: 12,
        requestsPerMin: '42.0K / min',
        failureRate: '0.01%',
        propagationType: 'DIRECT'
      },
      {
        id: 'pfd-e2',
        source: 'fraud-scorer-agent',
        target: 'feature-store',
        sourceLabel: 'Velocity & Pattern Scorer',
        targetLabel: 'Redis Feature Store',
        protocol: 'RESP3 Redis',
        latencyMs: 4,
        requestsPerMin: '42.0K / min',
        failureRate: '0.00%',
        propagationType: 'DIRECT'
      },
      {
        id: 'pfd-e3',
        source: 'fraud-scorer-agent',
        target: 'settlement-router',
        sourceLabel: 'Velocity & Pattern Scorer',
        targetLabel: 'Settlement Decision Router',
        protocol: 'gRPC v2',
        latencyMs: 16,
        requestsPerMin: '41.9K / min',
        failureRate: '0.00%',
        propagationType: 'DIRECT'
      }
    ]
  },
  {
    id: 'wf-customer-onboarding',
    name: 'Customer Onboarding',
    code: 'WF-COB-03',
    environment: 'Production',
    description: 'Document extraction, OCR verification, and automated customer profile synthesis.',
    healthScore: 98,
    riskLevel: 'low',
    totalNodes: 3,
    avgLatencyMs: 88,
    nodes: [
      {
        id: 'doc-parser-agent',
        label: 'Document Extraction Agent',
        type: 'agent',
        modelOrProtocol: 'GPT-4o Vision',
        status: 'healthy',
        latencyMs: 120,
        errorRate: 0.05,
        version: 'v2.8.0',
        owner: 'Onboarding Squad',
        description: 'Extracts structured fields from passports and utility bills.',
        consumersCount: 1,
        lastEvaluated: '7 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      },
      {
        id: 'crm-sync-api',
        label: 'Enterprise CRM Sync API',
        type: 'api',
        modelOrProtocol: 'REST / OAuth2',
        status: 'healthy',
        latencyMs: 48,
        errorRate: 0.0,
        version: 'v4.0.0',
        owner: 'Enterprise Apps',
        description: 'Creates lead and customer records in core Salesforce/HubSpot.',
        consumersCount: 1,
        lastEvaluated: '7 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      },
      {
        id: 'welcome-stream',
        label: 'Customer Notification Stream',
        type: 'stream',
        modelOrProtocol: 'Kafka Event',
        status: 'healthy',
        latencyMs: 10,
        errorRate: 0.0,
        version: 'v1.1.0',
        owner: 'Growth Platform',
        description: 'Triggers personalized onboarding emails and mobile push verification.',
        consumersCount: 0,
        lastEvaluated: '7 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      }
    ],
    edges: [
      {
        id: 'cob-e1',
        source: 'doc-parser-agent',
        target: 'crm-sync-api',
        sourceLabel: 'Document Extraction Agent',
        targetLabel: 'Enterprise CRM Sync API',
        protocol: 'REST / JSON',
        latencyMs: 35,
        requestsPerMin: '2.4K / min',
        failureRate: '0.02%',
        propagationType: 'DIRECT'
      },
      {
        id: 'cob-e2',
        source: 'crm-sync-api',
        target: 'welcome-stream',
        sourceLabel: 'Enterprise CRM Sync API',
        targetLabel: 'Customer Notification Stream',
        protocol: 'Kafka Event',
        latencyMs: 10,
        requestsPerMin: '2.4K / min',
        failureRate: '0.00%',
        propagationType: 'DIRECT'
      }
    ]
  },
  {
    id: 'wf-loan-underwriting',
    name: 'Loan Underwriting',
    code: 'WF-LUW-04',
    environment: 'Production',
    description: 'Credit score aggregation, debt-to-income verification, and loan pricing calculation.',
    healthScore: 95,
    riskLevel: 'low',
    totalNodes: 3,
    avgLatencyMs: 76,
    nodes: [
      {
        id: 'credit-bureau-agent',
        label: 'Credit Bureau Integration',
        type: 'agent',
        modelOrProtocol: 'Groq / LLaMA 3.3 (Reasoning)',
        status: 'healthy',
        latencyMs: 95,
        errorRate: 0.1,
        version: 'v1.9.0',
        owner: 'Lending Platform',
        description: 'Fetches Equifax and Experian telemetry with automated retry policies.',
        consumersCount: 1,
        lastEvaluated: '9 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      },
      {
        id: 'pricing-calc-api',
        label: 'Loan Pricing Calculator API',
        type: 'api',
        modelOrProtocol: 'C++ Fast gRPC',
        status: 'healthy',
        latencyMs: 16,
        errorRate: 0.0,
        version: 'v5.1.0',
        owner: 'Quantitative Finance',
        description: 'Calculates actuarial risk models and APR brackets.',
        consumersCount: 1,
        lastEvaluated: '9 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      },
      {
        id: 'loan-ledger-db',
        label: 'Loan Origination Ledger',
        type: 'database',
        modelOrProtocol: 'CockroachDB SQL',
        status: 'healthy',
        latencyMs: 25,
        errorRate: 0.0,
        version: 'v23.2.0',
        owner: 'Lending Core',
        description: 'Stores approved loan covenants with cryptographic signature hashing.',
        consumersCount: 0,
        lastEvaluated: '9 min ago',
        isAffected: false,
        impactClassification: 'unaffected'
      }
    ],
    edges: [
      {
        id: 'luw-e1',
        source: 'credit-bureau-agent',
        target: 'pricing-calc-api',
        sourceLabel: 'Credit Bureau Integration',
        targetLabel: 'Loan Pricing Calculator API',
        protocol: 'gRPC v2',
        latencyMs: 14,
        requestsPerMin: '5.1K / min',
        failureRate: '0.04%',
        propagationType: 'DIRECT'
      },
      {
        id: 'luw-e2',
        source: 'pricing-calc-api',
        target: 'loan-ledger-db',
        sourceLabel: 'Loan Pricing Calculator API',
        targetLabel: 'Loan Origination Ledger',
        protocol: 'Postgres wire / SQL',
        latencyMs: 22,
        requestsPerMin: '5.1K / min',
        failureRate: '0.00%',
        propagationType: 'DIRECT'
      }
    ]
  }
];

import { bpi2017MinedWorkflow } from './bpi2017Data';

export const allInitialWorkflows: WorkflowDefinition[] = [
  canonicalWorkflow,
  bpi2017MinedWorkflow,
  ...additionalWorkflows
];


