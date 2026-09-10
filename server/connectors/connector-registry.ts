/**
 * IMPACTMESH - Connector Registry
 * Deterministic registry managing external connectors and routing incoming payloads.
 */

import type { Connector } from './connector.interface.ts';

export class ConnectorRegistry {
  private readonly connectors = new Map<string, Connector>();

  /**
   * Registers a connector adapter.
   */
  public register(connector: Connector): void {
    if (!connector || !connector.id) {
      throw new Error('[ConnectorRegistry] Cannot register invalid connector: id is required.');
    }
    this.connectors.set(connector.id, connector);
  }

  /**
   * Removes a connector from the registry by its ID.
   */
  public unregister(id: string): boolean {
    return this.connectors.delete(id);
  }

  /**
   * Retrieves a registered connector by its unique identifier.
   */
  public get(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  /**
   * Returns a list of all registered connectors.
   */
  public list(): Connector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Discovers the first registered connector whose canHandle(input) returns true.
   */
  public findHandler(input: unknown): Connector | undefined {
    for (const connector of this.connectors.values()) {
      try {
        if (connector.canHandle(input)) {
          return connector;
        }
      } catch {
        // Continue iterating if canHandle throws
        continue;
      }
    }
    return undefined;
  }

  /**
   * Clears all registered connectors (useful for clean test isolation).
   */
  public clear(): void {
    this.connectors.clear();
  }

  /**
   * Returns the count of registered connectors.
   */
  public size(): number {
    return this.connectors.size;
  }
}

export const connectorRegistry = new ConnectorRegistry();
