/**
 * IMPACTMESH // BLACKTIDE SYSTEMS
 * Unified Error Hierarchy & Error Codes
 */

export type ErrorCode =
  | 'SUPABASE_CONNECTION_ERROR'
  | 'EVENT_INSERT_FAILED'
  | 'EVENT_FETCH_FAILED'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_EVENT'
  | 'STALE_STATE_ERROR'
  | 'REALTIME_SUBSCRIPTION_FAILED'
  | 'DATASET_REQUEST_FAILED'
  | 'DATASET_ENTITY_NOT_FOUND'
  | 'GROQ_REQUEST_FAILED'
  | 'GROQ_AUTH_ERROR'
  | 'GROQ_RATE_LIMIT'
  | 'GROQ_MALFORMED_OUTPUT'
  | 'CONFIG_ERROR';

export class BaseServiceError extends Error {
  public readonly code: ErrorCode;
  public readonly service: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(service: string, code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(`[${service.toUpperCase()}] ${code}: ${message}`);
    this.name = 'BaseServiceError';
    this.code = code;
    this.service = service;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SupabaseConnectionError extends BaseServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('supabase', 'SUPABASE_CONNECTION_ERROR', message, details);
    this.name = 'SupabaseConnectionError';
  }
}

export class EventInsertError extends BaseServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('supabase', 'EVENT_INSERT_FAILED', message, details);
    this.name = 'EventInsertError';
  }
}

export class EventValidationError extends BaseServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('validator', 'VALIDATION_ERROR', message, details);
    this.name = 'EventValidationError';
  }
}

export class DuplicateEventError extends BaseServiceError {
  constructor(eventId: string, details?: Record<string, unknown>) {
    super('events', 'DUPLICATE_EVENT', `Event with ID '${eventId}' has already been processed (idempotency guard).`, {
      eventId,
      ...details
    });
    this.name = 'DuplicateEventError';
  }
}

export class RealtimeSubscriptionError extends BaseServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('realtime', 'REALTIME_SUBSCRIPTION_FAILED', message, details);
    this.name = 'RealtimeSubscriptionError';
  }
}

export class DatasetRequestError extends BaseServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('dataset', 'DATASET_REQUEST_FAILED', message, details);
    this.name = 'DatasetRequestError';
  }
}

export class GroqRequestError extends BaseServiceError {
  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super('groq', code, message, details);
    this.name = 'GroqRequestError';
  }
}
