/**
 * IMPACTMESH - Connector Hub Interface
 * Explicit connector contract defining integration adapters for external systems.
 */

import type { DecisionEvent, DepartmentCode } from '../../src/types/events.ts';

export type ConnectorStatus = 'healthy' | 'degraded' | 'down';

export interface ConnectorHealth {
  status: ConnectorStatus;
  message?: string;
  timestamp?: string;
  details?: Record<string, unknown>;
}

export interface NormalizationContext {
  organizationId?: string;
  createdBy?: string;
  defaultDepartment?: DepartmentCode;
  timestamp?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export class NormalizationError extends Error {
  public readonly code: string;
  public readonly connectorId?: string;
  public readonly field?: string;
  public readonly received?: unknown;

  constructor(
    message: string,
    options?: {
      code?: string;
      connectorId?: string;
      field?: string;
      received?: unknown;
    }
  ) {
    super(message);
    this.name = 'NormalizationError';
    this.code = options?.code || 'NORMALIZATION_FAILED';
    this.connectorId = options?.connectorId;
    this.field = options?.field;
    this.received = options?.received;
    Object.setPrototypeOf(this, NormalizationError.prototype);
  }
}

export interface Connector<TRaw = unknown> {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly version?: string;

  /**
   * Evaluates if this connector can handle the incoming external payload.
   */
  canHandle(input: unknown): boolean;

  /**
   * Transforms raw external payload into one or more canonical DecisionEvent instances.
   * Connectors MUST NOT mutate state, calculate risk/impact, or execute side effects.
   */
  normalize(input: TRaw, context?: NormalizationContext): DecisionEvent[];

  /**
   * Optional health status check for connection/configuration readiness.
   */
  healthCheck?(): Promise<ConnectorHealth>;
}
