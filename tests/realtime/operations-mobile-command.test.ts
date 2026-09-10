/**
 * OPERATIONS MOBILE ↔ SUPABASE REALTIME ↔ COMMAND CENTER INTEGRATION TESTS
 *
 * Requirements:
 * 1. Mobile submits Production Capacity (100 -> 70), Command Center receives automatically without refresh.
 * 2. Multiple sequential Operations updates (capacity, equipment, delays, incidents).
 * 3. Disconnect and Reconnect handling with status state tracking (CONNECTED, CONNECTING, DISCONNECTED).
 * 4. Deduplication via unique Event IDs (identical event IDs rejected).
 * 5. Multiple clients connected simultaneously (Mobile & Desktop).
 * 6. Subscription cleanup and resubscription.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { publishDecisionEvent } from '../../src/lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager } from '../../src/lib/realtime/subscription-manager.ts';
import { securityPolicyService, OPERATIONS_USER } from '../../src/lib/auth/auth-service.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('Operations Mobile ↔ Command Center Realtime Connection', () => {
  beforeEach(async () => {
    securityPolicyService.setCurrentUser(OPERATIONS_USER);
    await realtimeSubscriptionManager.teardown();
    realtimeSubscriptionManager.clearProcessedEvents();
    realtimeSubscriptionManager.initializeChannels();
  });

  afterEach(async () => {
    await realtimeSubscriptionManager.teardown();
  });

  it('1. Mobile updates Production Capacity (100 -> 70) and Command Center receives it automatically', async () => {
    // Desktop Command Center state
    let commandCenterCapacity = 100;
    let commandCenterHours = 420;
    let receivedEventId: string | null = null;
    let receivedPayload: any = null;

    // Command Center subscribes to Realtime events
    const unsubscribeCommandCenter = realtimeSubscriptionManager.onEvent<'capacity_changed'>((event) => {
      if (event.payload) {
        receivedEventId = event.id;
        receivedPayload = event.payload;
        if (event.payload.production_capacity !== undefined) {
          commandCenterCapacity = event.payload.production_capacity;
        }
        if (event.payload.new_capacity_hours !== undefined) {
          commandCenterHours = event.payload.new_capacity_hours;
        }
      }
    }, 'capacity_changed');

    // Mobile (/operations) submits: Production Capacity 100 -> 70
    const publishResult = await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV-TEAM',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        previous_production_capacity: 100,
        production_capacity: 70,
        effective_date: '2026-09-15',
        notes: 'Mobile operations terminal reduced capacity from 100 to 70',
      },
      created_by: 'mobile_ops_lead',
    });

    expect(publishResult.success).toBe(true);
    expect(publishResult.event).toBeDefined();

    // Command Center state updated immediately without page refresh
    expect(commandCenterCapacity).toBe(70);
    expect(commandCenterHours).toBe(300);
    expect(receivedEventId).toBe(publishResult.event?.id);
    expect(receivedPayload.production_capacity).toBe(70);
    expect(receivedPayload.previous_production_capacity).toBe(100);

    unsubscribeCommandCenter();
  });

  it('2. Multiple sequential Operations updates are received in realtime', async () => {
    const receivedCapacities: number[] = [];
    const receivedEquipmentStatuses: string[] = [];

    const unsubscribe = realtimeSubscriptionManager.onEvent((event) => {
      if (event.event_type === 'capacity_changed' && event.payload) {
        const payload = event.payload as any;
        if (payload.production_capacity !== undefined) {
          receivedCapacities.push(payload.production_capacity);
        }
        if (payload.equipment_status) {
          receivedEquipmentStatuses.push(payload.equipment_status);
        }
      }
    });

    // Step A: 100 -> 70
    await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV-TEAM',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        previous_production_capacity: 100,
        production_capacity: 70,
        effective_date: '2026-09-15',
        equipment_status: 'ONLINE',
      },
      created_by: 'mobile_ops_lead',
    });

    // Step B: 70 -> 50 (Critical Emergency)
    await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV-TEAM',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 300,
        new_capacity_hours: 210,
        previous_production_capacity: 70,
        production_capacity: 50,
        effective_date: '2026-09-16',
        equipment_status: 'DEGRADED',
      },
      created_by: 'mobile_ops_lead',
    });

    // Step C: 50 -> 100 (Restored)
    await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV-TEAM',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 210,
        new_capacity_hours: 420,
        previous_production_capacity: 50,
        production_capacity: 100,
        effective_date: '2026-09-17',
        equipment_status: 'ONLINE',
      },
      created_by: 'mobile_ops_lead',
    });

    expect(receivedCapacities).toEqual([70, 50, 100]);
    expect(receivedEquipmentStatuses).toEqual(['ONLINE', 'DEGRADED', 'ONLINE']);

    unsubscribe();
  });

  it('3. Disconnect and reconnect state transitions', async () => {
    const states: string[] = [];
    const unsub = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      states.push(state);
    });

    // Disconnect
    await realtimeSubscriptionManager.disconnect();
    expect(realtimeSubscriptionManager.getConnectionState()).toBe('DISCONNECTED');

    // Reconnect
    await realtimeSubscriptionManager.reconnect();
    expect(['CONNECTING', 'CONNECTED']).toContain(realtimeSubscriptionManager.getConnectionState());

    unsub();
  });

  it('4. Event Deduplication prevents processing duplicate event IDs', async () => {
    const eventCounts: Record<string, number> = {};

    const unsubscribe = realtimeSubscriptionManager.onEvent((event) => {
      eventCounts[event.id] = (eventCounts[event.id] || 0) + 1;
    });

    const testEvent: DecisionEvent = {
      id: 'duplicate-test-event-uuid-001',
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-TEST',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        previous_production_capacity: 100,
        production_capacity: 70,
        effective_date: '2026-09-15',
      },
      created_by: 'mobile_ops_lead',
      created_at: new Date().toISOString(),
    };

    // Emit the same event 3 times
    realtimeSubscriptionManager.emitLocalEvent(testEvent);
    realtimeSubscriptionManager.emitLocalEvent(testEvent);
    realtimeSubscriptionManager.emitLocalEvent(testEvent);

    // Should be processed exactly once
    expect(eventCounts['duplicate-test-event-uuid-001']).toBe(1);
    expect(realtimeSubscriptionManager.isEventProcessed('duplicate-test-event-uuid-001')).toBe(true);

    unsubscribe();
  });

  it('5. Two clients connected simultaneously (Device 1 Mobile & Device 2 Desktop)', async () => {
    const mobileReceived: string[] = [];
    const desktopReceived: string[] = [];

    // Device 1 (Mobile) listener
    const unsubMobile = realtimeSubscriptionManager.onEvent((evt) => {
      mobileReceived.push(evt.id);
    });

    // Device 2 (Desktop Command Center) listener
    const unsubDesktop = realtimeSubscriptionManager.onEvent((evt) => {
      desktopReceived.push(evt.id);
    });

    // Mobile emits event
    const publishRes = await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV-TEAM',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        previous_production_capacity: 100,
        production_capacity: 70,
        effective_date: '2026-09-15',
      },
      created_by: 'mobile_ops_lead',
    });

    const eventId = publishRes.event!.id;

    // Both devices received the event simultaneously
    expect(mobileReceived).toContain(eventId);
    expect(desktopReceived).toContain(eventId);

    unsubMobile();
    unsubDesktop();
  });

  it('6. Subscription cleanup and resubscription', async () => {
    let callCount = 0;
    const unsub = realtimeSubscriptionManager.onEvent(() => {
      callCount++;
    });

    // Emit event 1
    await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV-TEAM',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        effective_date: '2026-09-15',
      },
      created_by: 'mobile_ops_lead',
    });

    expect(callCount).toBe(1);

    // Unsubscribe
    unsub();

    // Emit event 2 - should NOT increment callCount
    await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV-TEAM',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 300,
        new_capacity_hours: 420,
        effective_date: '2026-09-16',
      },
      created_by: 'mobile_ops_lead',
    });

    expect(callCount).toBe(1);

    // Resubscribe with new listener
    let newCallCount = 0;
    const unsubNew = realtimeSubscriptionManager.onEvent(() => {
      newCallCount++;
    });

    // Emit event 3 - new listener should receive it
    await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV-TEAM',
      payload: {
        team_id: 'TEAM-OPS-CORE',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        effective_date: '2026-09-17',
      },
      created_by: 'mobile_ops_lead',
    });

    expect(callCount).toBe(1); // Old listener remained unsubscribed
    expect(newCallCount).toBe(1); // New listener received event

    unsubNew();
  });
});
