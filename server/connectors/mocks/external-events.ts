/**
 * IMPACTMESH - Mock External Events Fixtures
 * Pure external input fixtures for testing and demonstrating Connector Hub adapters.
 * NOTE: These represent raw external payloads received from third-party systems.
 * They DO NOT contain internal BusinessState or pre-cooked internal DecisionEvents.
 */

import type { SalesforceOpportunityPayload } from '../salesforce/connector.ts';
import type { N8NWebhookPayload } from '../n8n/connector.ts';
import type { GenericWebhookPayload } from '../generic-webhook/connector.ts';

// =============================================================================
// SALESFORCE FIXTURES
// =============================================================================

/**
 * Valid Salesforce Opportunity in Closed Won stage (Enterprise Deal ₹50L).
 */
export const mockSalesforceOpportunityClosedWon: SalesforceOpportunityPayload = {
  id: '006-demo-001',
  type: 'Opportunity',
  stage: 'Closed Won',
  amount: 5000000,
  name: 'Blacktide Enterprise Deal',
  closeDate: '2026-09-10',
  accountId: '001-acc-acme-corp',
  sla_commitments: [
    '99.9% uptime SLA guarantee',
    'Dedicated Solutions Architect',
    '24/7 Severity 1 Response',
  ],
};

/**
 * Valid Salesforce Opportunity in Prospecting stage.
 */
export const mockSalesforceOpportunityProspecting: SalesforceOpportunityPayload = {
  id: '006-demo-002',
  type: 'Opportunity',
  stage: 'Prospecting',
  amount: 2500000,
  name: 'Global Tech Mid-Market Renewal',
  closeDate: '2026-11-15',
  accountId: '001-acc-global-tech',
};

/**
 * Salesforce Opportunity with PascalCase Outbound Message / CDC format.
 */
export const mockSalesforceOpportunityOutboundCDC: SalesforceOpportunityPayload = {
  Id: '006-demo-003',
  type: 'Opportunity',
  StageName: 'Closed Won',
  Amount: 5000000,
  Name: 'Blacktide Defense Division',
  CloseDate: '2026-09-10',
  AccountId: '001-acc-defense-sys',
};

/**
 * INVALID: String numeric amount ("5000000" instead of 5000000).
 * Must be explicitly rejected without coercion!
 */
export const mockSalesforceOpportunityStringAmount: SalesforceOpportunityPayload = {
  id: '006-demo-invalid-str',
  type: 'Opportunity',
  stage: 'Closed Won',
  amount: '5000000' as unknown as number,
  name: 'Invalid String Deal',
};

/**
 * INVALID: Missing required stage and amount.
 */
export const mockSalesforceOpportunityMalformed = {
  id: '006-empty',
  type: 'Opportunity',
};

// =============================================================================
// N8N AUTOMATION FIXTURES
// =============================================================================

/**
 * Valid n8n Deal Accepted webhook event (₹50L).
 */
export const mockN8nDealAccepted: N8NWebhookPayload = {
  event: 'deal.accepted',
  id: 'n8n-demo-001',
  value: 5000000,
  department: 'sales',
  timestamp: '2026-09-10T10:00:00Z',
  workflow_id: 'n8n-wf-sales-intake-v3',
  workflowId: 'n8n-wf-sales-intake-v3',
  execution_id: 'n8n-exec-99238',
};

/**
 * Valid n8n Budget Changed webhook event (₹18L -> ₹11L).
 */
export const mockN8nBudgetChanged: N8NWebhookPayload = {
  event: 'budget.changed',
  id: 'n8n-demo-002',
  department: 'engineering',
  previous_budget: 1800000,
  new_budget: 1100000,
  timestamp: '2026-09-10T10:30:00Z',
  workflow_id: 'n8n-wf-finance-sync',
};

/**
 * Valid n8n Capacity Changed webhook event (420h -> 300h).
 */
export const mockN8nCapacityChanged: N8NWebhookPayload = {
  event: 'capacity.changed',
  id: 'n8n-demo-003',
  team_id: 'team-eng-core',
  previous_capacity_hours: 420,
  new_capacity_hours: 300,
  timestamp: '2026-09-10T11:00:00Z',
  workflow_id: 'n8n-wf-jira-sync',
};

/**
 * Valid n8n Feature Committed webhook event (120h).
 */
export const mockN8nFeatureCommitted: N8NWebhookPayload = {
  event: 'feature.committed',
  id: 'n8n-demo-004',
  feature_id: 'feat-blacktide-security-vault',
  committed_capacity_hours: 120,
  timestamp: '2026-09-10T11:15:00Z',
  workflow_id: 'n8n-wf-linear-sync',
};

/**
 * INVALID: String numeric value ("5000000").
 * Must be rejected without coercion!
 */
export const mockN8nStringValue: N8NWebhookPayload = {
  event: 'deal.accepted',
  id: 'n8n-demo-invalid-str',
  value: '5000000' as unknown as number,
  department: 'sales',
  timestamp: '2026-09-10T10:00:00Z',
};

/**
 * INVALID: Malformed n8n event missing event type.
 */
export const mockN8nMalformed: Record<string, unknown> = {
  id: 'n8n-missing-event',
  source: 'n8n',
  value: 5000000,
};

// =============================================================================
// GENERIC ENTERPRISE WEBHOOK FIXTURES
// =============================================================================

/**
 * Valid Generic Webhook: Deal Accepted (₹50L).
 */
export const mockGenericWebhookDealAccepted: GenericWebhookPayload = {
  source: 'external-system',
  eventType: 'deal_accepted',
  externalId: 'ext-001',
  occurredAt: '2026-09-10T10:00:00Z',
  payload: {
    deal_id: 'deal-ext-001',
    final_value: 5000000,
    close_date: '2026-09-10',
    sla_commitments: ['Enterprise 99.9% Uptime SLA'],
  },
};

/**
 * Valid Generic Webhook: Budget Changed (ERP Sync).
 */
export const mockGenericWebhookBudgetChanged: GenericWebhookPayload = {
  source: 'sap-erp-gateway',
  eventType: 'budget_changed',
  externalId: 'erp-tx-994',
  occurredAt: '2026-09-10T10:45:00Z',
  department: 'finance',
  payload: {
    department: 'finance',
    previous_budget: 1800000,
    new_budget: 1100000,
    fiscal_period: 'Q3-2026',
    rationale: 'Q3 operational spending reduction from ERP',
  },
};

/**
 * Valid Generic Webhook: Capacity Changed (Jira / Linear Sync).
 */
export const mockGenericWebhookCapacityChanged: GenericWebhookPayload = {
  source: 'jira-service-management',
  eventType: 'capacity_changed',
  externalId: 'jira-sprint-update-091',
  occurredAt: '2026-09-10T11:00:00Z',
  department: 'engineering',
  payload: {
    team_id: 'team-eng-core',
    previous_capacity_hours: 420,
    new_capacity_hours: 300,
    effective_date: '2026-09-10',
  },
};

/**
 * INVALID: String numeric value ("5000000").
 * Must be rejected without coercion!
 */
export const mockGenericWebhookStringValue: GenericWebhookPayload = {
  source: 'external-system',
  eventType: 'deal_accepted',
  externalId: 'ext-str-invalid',
  occurredAt: '2026-09-10T10:00:00Z',
  payload: {
    final_value: '5000000' as unknown as number,
  },
};

/**
 * INVALID: Malformed generic webhook missing payload object.
 */
export const mockGenericWebhookMalformed: Record<string, unknown> = {
  source: 'external-system',
  eventType: 'deal_accepted',
  externalId: 'ext-malformed-001',
  payload: null,
};
