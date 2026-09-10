/**
 * IMPACTMESH - Connector Abstraction
 * Decouples external telemetry sources (Salesforce, SAP, Jira, Webhooks) from canonical DecisionEvents.
 */

import type { DecisionEvent } from '../../src/types/events.ts';

export type ExternalSourceType =
  | 'SALESFORCE'
  | 'SAP'
  | 'ORACLE'
  | 'JIRA'
  | 'HUBSPOT'
  | 'SERVICENOW'
  | 'N8N'
  | 'WEBHOOK'
  | 'GENERIC_REST';

export interface ConnectorConfig {
  sourceId: string;
  sourceType: ExternalSourceType;
  endpointUrl?: string;
  pollIntervalSeconds?: number;
  enabled: boolean;
}

export interface RawExternalPayload {
  sourceId: string;
  sourceType: ExternalSourceType;
  externalEventId: string;
  entityType: string;
  action: string;
  timestamp: string;
  rawRecord: Record<string, unknown>;
}

export interface IEventNormalizer<T = unknown> {
  normalize(raw: T): DecisionEvent;
}

export interface IConnector {
  readonly id: string;
  readonly sourceType: ExternalSourceType;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  normalizePayload(payload: RawExternalPayload): DecisionEvent;
}
