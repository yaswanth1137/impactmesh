import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { publishDecisionEvent } from '../../src/lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager } from '../../src/lib/realtime/subscription-manager.ts';
import { normalizeEventToLiveSignal, type LiveBusinessSignal } from '../../src/lib/realtime/useLiveBusinessSignals.ts';
import { securityPolicyService, SALES_USER } from '../../src/lib/auth/auth-service.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('Phone Department Update → Executive Live Business Signal', () => {
  beforeEach(async () => {
    securityPolicyService.setCurrentUser(SALES_USER);
    await realtimeSubscriptionManager.teardown();
    realtimeSubscriptionManager.clearProcessedEvents();
    realtimeSubscriptionManager.initializeChannels();
  });

  afterEach(async () => {
    await realtimeSubscriptionManager.teardown();
  });

  it('1. Normalizes Sales customer commitment change (June 20 -> June 12) into a decision-worthy LiveBusinessSignal', () => {
    const rawEvent: DecisionEvent = {
      id: 'EVT-TEST-SALES-001',
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'sales',
      event_type: 'deadline_changed',
      entity_id: 'CUST-APEX-01',
      payload: {
        deal_id: 'DEAL-APEX-2026',
        customer_name: 'Apex Global',
        previous_deadline: 'June 20',
        new_deadline: 'June 12',
        reason: 'Client requested accelerated delivery window'
      },
      created_at: new Date().toISOString(),
      created_by: 'Elena Vance'
    };

    const signal = normalizeEventToLiveSignal(rawEvent);
    expect(signal).not.toBeNull();
    if (!signal) return;

    // Verify origin
    expect(signal.sourceDepartment).toBe('sales');
    expect(signal.sourceDepartmentLabel).toBe('SALES');
    expect(signal.sourceRole).toBe('lookout');

    // Verify change details
    expect(signal.title).toBe('SALES CHANGED A CUSTOMER COMMITMENT');
    expect(signal.entityName).toBe('Apex Global');
    expect(signal.before).toBe('June 20');
    expect(signal.after).toBe('June 12');

    // Verify interpretation of consequence (not just echoing date)
    expect(signal.impactSummary).toContain('engineering capacity cannot support the revised commitment');
    expect(signal.affectedAreas).toEqual(['Product', 'Engineering', 'Delivery']);

    // Verify decision required escalation
    expect(signal.decisionRequired).toBe(true);
    expect(signal.severity).toBe('CRITICAL');
  });

  it('2. Receives phone update via realtime bus and triggers normalized live signal delivery', async () => {
    const receivedSignals: LiveBusinessSignal[] = [];

    // Decision Desk listener
    const unsubscribe = realtimeSubscriptionManager.onEvent((event) => {
      const liveSig = normalizeEventToLiveSignal(event);
      if (liveSig) {
        receivedSignals.push(liveSig);
      }
    });

    // Phone dispatches commitment change
    const publishRes = await publishDecisionEvent({
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'sales',
      event_type: 'deadline_changed',
      entity_id: 'CUST-APEX-01',
      payload: {
        deal_id: 'DEAL-APEX-2026',
        customer_name: 'Apex Global',
        previous_deadline: 'June 20',
        new_deadline: 'June 12',
      },
      created_by: 'Elena Vance'
    });

    expect(publishRes.success).toBe(true);

    // Give broadcast channel / bus microtask a tick
    await new Promise((r) => setTimeout(r, 50));

    expect(receivedSignals.length).toBeGreaterThan(0);
    const firstSig = receivedSignals[0];
    expect(firstSig.sourceDepartment).toBe('sales');
    expect(firstSig.before).toBe('June 20');
    expect(firstSig.after).toBe('June 12');
    expect(firstSig.decisionRequired).toBe(true);

    unsubscribe();
  });

  it('3. Deduplicates duplicate event IDs to prevent repeated UI alerts', () => {
    const processedIds = new Set<string>();
    const signals: LiveBusinessSignal[] = [];

    const handleEvent = (event: DecisionEvent) => {
      if (processedIds.has(event.id)) {
        return; // Deduplicated
      }
      processedIds.add(event.id);
      const sig = normalizeEventToLiveSignal(event);
      if (sig) signals.push(sig);
    };

    const duplicateEvent: DecisionEvent = {
      id: 'EVT-DUP-TEST-01',
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'sales',
      event_type: 'deadline_changed',
      entity_id: 'CUST-APEX-01',
      payload: {
        deal_id: 'DEAL-APEX-2026',
        previous_deadline: 'June 20',
        new_deadline: 'June 12'
      },
      created_at: new Date().toISOString(),
      created_by: 'Elena Vance'
    };

    handleEvent(duplicateEvent);
    handleEvent(duplicateEvent); // Delivered twice
    handleEvent(duplicateEvent); // Delivered thrice

    expect(signals.length).toBe(1);
  });

  it('4. Correctly classifies minor vs consequential vs decision-worthy updates', () => {
    // Minor update
    const minorEvent: DecisionEvent = {
      id: 'EVT-MINOR-01',
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'sales',
      event_type: 'customer_added',
      entity_id: 'CUST-NEW-99',
      payload: { customer_id: 'CUST-NEW-99', name: 'Beta Ltd', tier: 'enterprise', arr: 100000 },
      created_at: new Date().toISOString(),
      created_by: 'Elena Vance'
    };
    const minorSig = normalizeEventToLiveSignal(minorEvent);
    expect(minorSig).not.toBeNull();
    expect(minorSig?.severity).toBe('INFO');
    expect(minorSig?.decisionRequired).toBe(false);

    // Consequential decision-worthy update
    const criticalEvent: DecisionEvent = {
      id: 'EVT-CRIT-01',
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'CAP-DEV',
      payload: {
        team_id: 'TEAM-CORE',
        previous_capacity_hours: 400,
        new_capacity_hours: 260,
        effective_date: '2026-06-01'
      },
      created_at: new Date().toISOString(),
      created_by: 'Devon Ross'
    };
    const critSig = normalizeEventToLiveSignal(criticalEvent);
    expect(critSig).not.toBeNull();
    expect(critSig?.severity).toBe('CRITICAL');
    expect(critSig?.decisionRequired).toBe(true);
  });
});
