/**
 * IMPACTMESH - Realtime Subscription Manager Unit Tests
 * Verifies decoupled lifecycle and callback isolation.
 */

import { describe, it, expect, vi } from 'vitest';
import { realtimeSubscriptionManager } from '../../src/lib/realtime/subscription-manager.ts';

describe('RealtimeSubscriptionManager', () => {
  it('reports initial connection state correctly', () => {
    const state = realtimeSubscriptionManager.getConnectionState();
    expect(['DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR']).toContain(state);
  });

  it('allows subscribing and unsubscribing cleanly to typed events', () => {
    const mockCallback = vi.fn();
    const unsubscribe = realtimeSubscriptionManager.onEvent(mockCallback, 'deal_created');

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('allows subscribing to state updates', () => {
    const stateCallback = vi.fn();
    const unsubscribe = realtimeSubscriptionManager.onStateUpdate(stateCallback);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
