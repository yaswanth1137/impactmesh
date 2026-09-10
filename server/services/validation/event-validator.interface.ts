/**
 * IMPACTMESH - Event Validation Layer Interfaces
 * Defines structured validation errors and validation contracts.
 */

import type { BusinessState, BusinessEntity } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';

export type ValidationErrorCode =
  | 'INVALID_SCHEMA'
  | 'INVALID_DEPARTMENT'
  | 'INVALID_EVENT_TYPE'
  | 'INVALID_PAYLOAD'
  | 'ENTITY_NOT_FOUND'
  | 'ORGANIZATION_NOT_FOUND'
  | 'STALE_STATE'
  | 'INVALID_NUMERIC_VALUE'
  | 'INVALID_TIMESTAMP';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field?: string;
  expected?: unknown;
  received?: unknown;
  entity?: string;
  entityId?: string;
  eventId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface IEventValidator {
  validate(
    event: DecisionEvent,
    currentState?: BusinessState,
    entityRegistry?: Map<string, BusinessEntity> | Record<string, BusinessEntity>
  ): ValidationResult;
}
