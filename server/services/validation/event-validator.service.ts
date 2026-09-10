/**
 * IMPACTMESH - Event Validation Layer Implementation
 * Deterministic validation engine: verifies schema, types, departments,
 * numeric bounds, entity references, and state freshness.
 */

import type { BusinessState, BusinessEntity } from '../../../src/types/domain.ts';
import type { DecisionEvent, DepartmentCode, ImpactMeshEventType } from '../../../src/types/events.ts';
import type { IEventValidator, ValidationError, ValidationResult } from './event-validator.interface.ts';

const VALID_DEPARTMENTS: DepartmentCode[] = [
  'sales',
  'product',
  'engineering',
  'finance',
  'command_center',
  'operations',
  'commercial',
];

const EVENT_DEPARTMENT_MAP: Record<ImpactMeshEventType, DepartmentCode[]> = {
  // Commercial
  pipeline_adjusted: ['commercial', 'sales', 'command_center'],
  commercial_terms_changed: ['commercial', 'sales', 'command_center'],
  // Sales
  customer_added: ['sales', 'command_center'],
  deal_created: ['sales', 'command_center'],
  deal_value_changed: ['sales', 'command_center'],
  deadline_changed: ['sales', 'command_center'],
  deal_accepted: ['sales', 'command_center'],
  customer_risk_changed: ['sales', 'command_center'],
  // Product
  feature_requested: ['product', 'command_center'],
  feature_committed: ['product', 'command_center'],
  feature_scope_changed: ['product', 'command_center'],
  feature_deprioritized: ['product', 'command_center'],
  launch_date_changed: ['product', 'command_center'],
  priority_changed: ['product', 'command_center'],
  // Engineering / Operations
  capacity_changed: ['engineering', 'command_center', 'operations'],
  inventory_changed: ['engineering', 'command_center', 'operations'],
  resource_unavailable: ['engineering', 'command_center', 'operations'],
  delivery_delay: ['engineering', 'command_center', 'operations'],
  infrastructure_cost_changed: ['engineering', 'finance', 'command_center'],
  supplier_delay: ['engineering', 'command_center', 'operations'],
  // Finance
  budget_changed: ['finance', 'command_center'],
  cost_changed: ['finance', 'command_center'],
  spending_freeze: ['finance', 'command_center'],
  funding_approved: ['finance', 'command_center'],
  runway_changed: ['finance', 'command_center'],
};

export class EventValidator implements IEventValidator {
  public validate(
    event: DecisionEvent,
    currentState?: BusinessState,
    entityRegistry?: Map<string, BusinessEntity> | Record<string, BusinessEntity>
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. Root schema validation
    if (!event || typeof event !== 'object') {
      return {
        isValid: false,
        errors: [{ code: 'INVALID_SCHEMA', message: 'Event must be a non-null object.' }],
      };
    }

    if (!event.id || typeof event.id !== 'string' || event.id.trim() === '') {
      errors.push({
        code: 'INVALID_SCHEMA',
        field: 'id',
        message: 'Event ID must be a non-empty string.',
        eventId: event?.id,
      });
    }

    if (!event.organization_id || typeof event.organization_id !== 'string' || event.organization_id.trim() === '') {
      errors.push({
        code: 'ORGANIZATION_NOT_FOUND',
        field: 'organization_id',
        message: 'Organization ID is missing or invalid.',
        eventId: event.id,
      });
    }

    if (!event.created_by || typeof event.created_by !== 'string' || event.created_by.trim() === '') {
      errors.push({
        code: 'INVALID_SCHEMA',
        field: 'created_by',
        message: 'created_by must be a non-empty string.',
        eventId: event.id,
      });
    }

    // Timestamp validation
    if (!event.created_at || typeof event.created_at !== 'string' || isNaN(Date.parse(event.created_at))) {
      errors.push({
        code: 'INVALID_TIMESTAMP',
        field: 'created_at',
        message: 'created_at must be a valid ISO-8601 date string.',
        received: event.created_at,
        eventId: event.id,
      });
    }

    // 2. Department validation
    if (!VALID_DEPARTMENTS.includes(event.department)) {
      errors.push({
        code: 'INVALID_DEPARTMENT',
        field: 'department',
        message: `Department '${event.department}' is not a recognized operational department.`,
        expected: VALID_DEPARTMENTS,
        received: event.department,
        eventId: event.id,
      });
    }

    // 3. Event Type validation
    const allowedDepartments = EVENT_DEPARTMENT_MAP[event.event_type as ImpactMeshEventType];
    if (!allowedDepartments) {
      errors.push({
        code: 'INVALID_EVENT_TYPE',
        field: 'event_type',
        message: `Unknown or unhandled event type '${event.event_type}'.`,
        received: event.event_type,
        eventId: event.id,
      });
      return { isValid: false, errors };
    }

    // 4. Department matches Event Type
    if (event.department && !allowedDepartments.includes(event.department)) {
      errors.push({
        code: 'INVALID_DEPARTMENT',
        field: 'department',
        message: `Event type '${event.event_type}' cannot be emitted by department '${event.department}'. Allowed: ${allowedDepartments.join(', ')}`,
        expected: allowedDepartments,
        received: event.department,
        eventId: event.id,
      });
    }

    // 5. Payload validation
    if (!event.payload || typeof event.payload !== 'object') {
      errors.push({
        code: 'INVALID_PAYLOAD',
        field: 'payload',
        message: 'Event payload must be a non-null object.',
        eventId: event.id,
      });
      return { isValid: false, errors };
    }

    const payload = (event.payload || {}) as unknown as Record<string, unknown>;

    // 6. Specific payload schema & numeric checks per event type
    this.validatePayloadByEventType(event, payload, errors);

    // 7. Stale state validation (Concurrency check against currentState)
    if (currentState) {
      this.validateStateFreshness(event, payload, currentState, errors);
    }

    // 8. Entity reference validation
    if (entityRegistry) {
      this.validateEntityReferences(event, entityRegistry, errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validatePayloadByEventType(
    event: DecisionEvent,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    const isNumber = (val: unknown): val is number =>
      typeof val === 'number' && !isNaN(val) && isFinite(val);

    switch (event.event_type) {
      case 'budget_changed': {
        const prev = payload.previous_budget ?? payload.previousBudget;
        const next = payload.new_budget ?? payload.newBudget;
        if (!isNumber(prev) || prev < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'previous_budget',
            message: 'previous_budget must be a non-negative number.',
            received: prev,
            eventId: event.id,
          });
        }
        if (!isNumber(next) || next < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'new_budget',
            message: 'new_budget must be a non-negative number.',
            received: next,
            eventId: event.id,
          });
        }
        break;
      }

      case 'capacity_changed': {
        const prev = payload.previous_capacity_hours ?? payload.previousCapacity;
        const next = payload.new_capacity_hours ?? payload.newCapacity;
        if (!isNumber(prev) || prev < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'previous_capacity_hours',
            message: 'previous_capacity_hours must be a non-negative number.',
            received: prev,
            eventId: event.id,
          });
        }
        if (!isNumber(next) || next < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'new_capacity_hours',
            message: 'new_capacity_hours must be a non-negative number.',
            received: next,
            eventId: event.id,
          });
        }
        break;
      }

      case 'deal_created': {
        if (!payload.deal_id || typeof payload.deal_id !== 'string') {
          errors.push({
            code: 'INVALID_PAYLOAD',
            field: 'deal_id',
            message: 'deal_id is required in deal_created payload.',
            eventId: event.id,
          });
        }
        const val = payload.contract_value;
        if (!isNumber(val) || val < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'contract_value',
            message: 'contract_value must be a non-negative number.',
            received: val,
            eventId: event.id,
          });
        }
        break;
      }

      case 'deal_value_changed': {
        if (!payload.deal_id || typeof payload.deal_id !== 'string') {
          errors.push({
            code: 'INVALID_PAYLOAD',
            field: 'deal_id',
            message: 'deal_id is required in deal_value_changed payload.',
            eventId: event.id,
          });
        }
        const prev = payload.previous_value;
        const next = payload.new_value;
        if (!isNumber(prev) || prev < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'previous_value',
            message: 'previous_value must be a non-negative number.',
            received: prev,
            eventId: event.id,
          });
        }
        if (!isNumber(next) || next < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'new_value',
            message: 'new_value must be a non-negative number.',
            received: next,
            eventId: event.id,
          });
        }
        break;
      }

      case 'deal_accepted': {
        if (!payload.deal_id || typeof payload.deal_id !== 'string') {
          errors.push({
            code: 'INVALID_PAYLOAD',
            field: 'deal_id',
            message: 'deal_id is required in deal_accepted payload.',
            eventId: event.id,
          });
        }
        const finalVal = payload.final_value ?? payload.finalValue;
        if (!isNumber(finalVal) || finalVal < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'final_value',
            message: 'final_value must be a non-negative number.',
            received: finalVal,
            eventId: event.id,
          });
        }
        break;
      }

      case 'customer_added': {
        if (!payload.customer_id || typeof payload.customer_id !== 'string') {
          errors.push({
            code: 'INVALID_PAYLOAD',
            field: 'customer_id',
            message: 'customer_id is required.',
            eventId: event.id,
          });
        }
        if (payload.arr !== undefined && (!isNumber(payload.arr) || (payload.arr as number) < 0)) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'arr',
            message: 'arr must be a non-negative number.',
            received: payload.arr,
            eventId: event.id,
          });
        }
        break;
      }

      case 'feature_committed': {
        if (!payload.feature_id || typeof payload.feature_id !== 'string') {
          errors.push({
            code: 'INVALID_PAYLOAD',
            field: 'feature_id',
            message: 'feature_id is required in feature_committed payload.',
            eventId: event.id,
          });
        }
        const hours = payload.committed_capacity_hours ?? payload.committedCapacityHours;
        if (!isNumber(hours) || hours < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'committed_capacity_hours',
            message: 'committed_capacity_hours must be a non-negative number.',
            received: hours,
            eventId: event.id,
          });
        }
        break;
      }

      case 'feature_scope_changed': {
        if (!payload.feature_id || typeof payload.feature_id !== 'string') {
          errors.push({
            code: 'INVALID_PAYLOAD',
            field: 'feature_id',
            message: 'feature_id is required in feature_scope_changed payload.',
            eventId: event.id,
          });
        }
        const prev = payload.previous_points;
        const next = payload.new_points;
        if (!isNumber(prev) || prev < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'previous_points',
            message: 'previous_points must be a non-negative number.',
            received: prev,
            eventId: event.id,
          });
        }
        if (!isNumber(next) || next < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'new_points',
            message: 'new_points must be a non-negative number.',
            received: next,
            eventId: event.id,
          });
        }
        break;
      }

      case 'feature_deprioritized': {
        const freed = payload.freed_capacity_hours;
        if (!isNumber(freed) || freed < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'freed_capacity_hours',
            message: 'freed_capacity_hours must be a non-negative number.',
            received: freed,
            eventId: event.id,
          });
        }
        break;
      }

      case 'cost_changed': {
        const deltaAmount = payload.delta_amount;
        if (!isNumber(deltaAmount)) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'delta_amount',
            message: 'delta_amount must be a valid number.',
            received: deltaAmount,
            eventId: event.id,
          });
        }
        break;
      }

      case 'funding_approved': {
        const amount = payload.approved_amount;
        if (!isNumber(amount) || amount <= 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'approved_amount',
            message: 'approved_amount must be a positive number.',
            received: amount,
            eventId: event.id,
          });
        }
        break;
      }

      case 'runway_changed': {
        const prev = payload.previous_runway_months;
        const next = payload.new_runway_months;
        if (!isNumber(prev) || prev < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'previous_runway_months',
            message: 'previous_runway_months must be a non-negative number.',
            received: prev,
            eventId: event.id,
          });
        }
        if (!isNumber(next) || next < 0) {
          errors.push({
            code: 'INVALID_NUMERIC_VALUE',
            field: 'new_runway_months',
            message: 'new_runway_months must be a non-negative number.',
            received: next,
            eventId: event.id,
          });
        }
        break;
      }
    }
  }

  private validateStateFreshness(
    event: DecisionEvent,
    payload: Record<string, unknown>,
    currentState: BusinessState,
    errors: ValidationError[]
  ): void {
    if (event.event_type === 'budget_changed') {
      const prev = payload.previous_budget ?? payload.previousBudget;
      if (prev !== undefined && prev !== null) {
        const currentBudget = currentState.metrics.available_budget ?? currentState.metrics.availableBudget;
        if (currentBudget !== undefined && prev !== currentBudget) {
          errors.push({
            code: 'STALE_STATE',
            message: `Budget change rejected: current available budget is ₹${currentBudget}, but incoming event expected ₹${prev}.`,
            expected: currentBudget,
            received: prev,
            entity: 'availableBudget',
            eventId: event.id,
          });
        }
      }
    } else if (event.event_type === 'capacity_changed') {
      const prev = payload.previous_capacity_hours ?? payload.previousCapacity;
      if (prev !== undefined && prev !== null) {
        const currentCap = currentState.metrics.engineering_capacity ?? currentState.metrics.engineeringCapacity;
        if (currentCap !== undefined && prev !== currentCap) {
          errors.push({
            code: 'STALE_STATE',
            message: `Capacity change rejected: current engineering capacity is ${currentCap}h, but incoming event expected ${prev}h.`,
            expected: currentCap,
            received: prev,
            entity: 'engineeringCapacity',
            eventId: event.id,
          });
        }
      }
    } else if (event.event_type === 'runway_changed') {
      const prev = payload.previous_runway_months;
      if (prev !== undefined && prev !== null && currentState.metrics.runway_months !== undefined) {
        if (prev !== currentState.metrics.runway_months) {
          errors.push({
            code: 'STALE_STATE',
            message: `Runway change rejected: current runway is ${currentState.metrics.runway_months} months, but incoming event expected ${prev}.`,
            expected: currentState.metrics.runway_months,
            received: prev,
            entity: 'runwayMonths',
            eventId: event.id,
          });
        }
      }
    }
  }

  private validateEntityReferences(
    event: DecisionEvent,
    entityRegistry: Map<string, BusinessEntity> | Record<string, BusinessEntity>,
    errors: ValidationError[]
  ): void {
    const getEntity = (id: string): BusinessEntity | undefined => {
      if (entityRegistry instanceof Map) {
        return entityRegistry.get(id);
      }
      return entityRegistry[id];
    };

    // If registry is empty, treat as lenient/uninitialized
    const registrySize = entityRegistry instanceof Map ? entityRegistry.size : Object.keys(entityRegistry).length;
    if (registrySize === 0) return;

    if (event.entity_id && !getEntity(event.entity_id)) {
      // Check if entity is expected to exist
      if (event.event_type !== 'customer_added' && event.event_type !== 'deal_created' && event.event_type !== 'feature_requested') {
        errors.push({
          code: 'ENTITY_NOT_FOUND',
          message: `Referenced entity '${event.entity_id}' not found in organization business registry.`,
          entityId: event.entity_id,
          eventId: event.id,
        });
      }
    }
  }
}

export const eventValidator = new EventValidator();
