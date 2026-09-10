/**
 * IMPACTMESH - Event Normalizer Layer
 * Converts external payloads into canonical DecisionEvent contracts without side-effects.
 * Does NOT mutate BusinessState, calculate risk/impact, or invoke LLMs.
 */

import type { DecisionEvent } from '../../src/types/events.ts';
import { eventValidator } from '../services/validation/event-validator.service.ts';
import {
  type Connector,
  type NormalizationContext,
  NormalizationError,
} from './connector.interface.ts';
import { connectorRegistry, type ConnectorRegistry } from './connector-registry.ts';

export interface EventNormalizerOptions {
  connectorId?: string;
  context?: NormalizationContext;
  validate?: boolean;
}

export class EventNormalizer {
  private readonly registry: ConnectorRegistry;

  constructor(registry: ConnectorRegistry = connectorRegistry) {
    this.registry = registry;
  }

  /**
   * Normalizes an external payload into one or more canonical DecisionEvents.
   * Dispatches to specified connectorId or resolves connector via canHandle().
   */
  public normalize(
    input: unknown,
    options: EventNormalizerOptions = {}
  ): DecisionEvent[] {
    if (input === null || input === undefined) {
      throw new NormalizationError('Payload cannot be null or undefined.', {
        code: 'PAYLOAD_REQUIRED',
        received: input,
      });
    }

    let connector: Connector | undefined;

    if (options.connectorId) {
      connector = this.registry.get(options.connectorId);
      if (!connector) {
        throw new NormalizationError(
          `Connector with id '${options.connectorId}' is not registered.`,
          {
            code: 'CONNECTOR_NOT_FOUND',
            connectorId: options.connectorId,
          }
        );
      }
    } else {
      connector = this.registry.findHandler(input);
      if (!connector) {
        throw new NormalizationError(
          'No registered connector can handle the provided external payload.',
          {
            code: 'UNRECOGNIZED_PAYLOAD',
            received: input,
          }
        );
      }
    }

    const events = connector.normalize(input, options.context);

    if (!Array.isArray(events) || events.length === 0) {
      throw new NormalizationError(
        `Connector '${connector.id}' did not produce any DecisionEvents.`,
        {
          code: 'EMPTY_NORMALIZATION_RESULT',
          connectorId: connector.id,
        }
      );
    }

    // Optional validation against canonical EventValidator
    if (options.validate) {
      for (const event of events) {
        const result = eventValidator.validate(event);
        if (!result.isValid) {
          const firstError = result.errors[0];
          throw new NormalizationError(
            `Normalized event failed canonical validation: ${firstError?.message || 'Invalid schema'}`,
            {
              code: firstError?.code || 'VALIDATION_FAILED',
              connectorId: connector.id,
              field: firstError?.field,
              received: firstError?.received,
            }
          );
        }
      }
    }

    return events;
  }
}

export const eventNormalizer = new EventNormalizer();
