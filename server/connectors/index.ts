/**
 * IMPACTMESH - Connector Hub Integration Layer
 * Unified barrel export for connectors, registry, and normalizer.
 */

import { connectorRegistry } from './connector-registry.ts';
import { salesforceConnector } from './salesforce/connector.ts';
import { n8nConnector } from './n8n/connector.ts';
import { genericWebhookConnector } from './generic-webhook/connector.ts';

// Auto-register built-in enterprise connectors into the singleton registry
connectorRegistry.register(salesforceConnector);
connectorRegistry.register(n8nConnector);
connectorRegistry.register(genericWebhookConnector);

export * from './connector.interface.ts';
export * from './connector-registry.ts';
export * from './event-normalizer.ts';
export * from './salesforce/connector.ts';
export * from './n8n/connector.ts';
export * from './generic-webhook/connector.ts';
export * from './mocks/external-events.ts';
export * from '../api/connector-routes.ts';

/**
 * Factory helper to construct a fresh registry with default connectors attached.
 */
export function createDefaultConnectorRegistry() {
  const registry = new (connectorRegistry.constructor as any)();
  registry.register(salesforceConnector);
  registry.register(n8nConnector);
  registry.register(genericWebhookConnector);
  return registry;
}
