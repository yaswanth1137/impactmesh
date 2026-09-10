/**
 * IMPACTMESH - Permission & Security Model Verification Test Suite
 *
 * Enforces:
 * 1. CEO (Full access to all departmental data and company-wide analytics)
 * 2. Operations Head (Access strictly limited to Operations data)
 *
 * Verification Matrix:
 * Operations user → Operations data      ✅
 * Operations user → Finance data         ❌
 * Operations user → Sales data           ❌
 * Operations user → CEO-only data       ❌
 *
 * CEO → Operations data                  ✅
 * CEO → Finance data                     ✅
 * CEO → Sales data                       ✅
 * CEO → Company-wide data                ✅
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  securityPolicyService,
  CEO_USER,
  OPERATIONS_USER,
  SecurityPolicyViolationError,
} from '../../src/lib/auth/auth-service.ts';
import { publishDecisionEvent } from '../../src/lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager } from '../../src/lib/realtime/subscription-manager.ts';

describe('Security & Permission Model (CEO vs Operations Head)', () => {
  beforeEach(async () => {
    await realtimeSubscriptionManager.teardown();
    realtimeSubscriptionManager.clearProcessedEvents();
    realtimeSubscriptionManager.initializeChannels();
  });

  it('1. Operations user can read and modify Operations/Engineering data', () => {
    expect(securityPolicyService.canReadDepartment(OPERATIONS_USER, 'operations')).toBe(true);
    expect(securityPolicyService.canReadDepartment(OPERATIONS_USER, 'engineering')).toBe(true);
    expect(securityPolicyService.canModifyDepartment(OPERATIONS_USER, 'operations')).toBe(true);
    expect(securityPolicyService.canModifyDepartment(OPERATIONS_USER, 'engineering')).toBe(true);

    // Should not throw
    expect(() => {
      securityPolicyService.assertCanReadDepartment(OPERATIONS_USER, 'operations');
      securityPolicyService.assertCanEmitEvent(OPERATIONS_USER, 'operations');
    }).not.toThrow();
  });

  it('2. Operations user CANNOT read or modify Finance data (403 Forbidden)', async () => {
    expect(securityPolicyService.canReadDepartment(OPERATIONS_USER, 'finance')).toBe(false);
    expect(securityPolicyService.canModifyDepartment(OPERATIONS_USER, 'finance')).toBe(false);

    expect(() => {
      securityPolicyService.assertCanReadDepartment(OPERATIONS_USER, 'finance');
    }).toThrow(SecurityPolicyViolationError);

    expect(() => {
      securityPolicyService.assertCanEmitEvent(OPERATIONS_USER, 'finance');
    }).toThrow(SecurityPolicyViolationError);

    // Testing real event publisher rejection
    securityPolicyService.setCurrentUser(OPERATIONS_USER);
    const result = await publishDecisionEvent({
      organization_id: OPERATIONS_USER.organizationId,
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'BUDGET-ATTEMPT',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: 9999999,
        fiscal_period: 'Q3-2026',
      },
      created_by: OPERATIONS_USER.fullName,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('403 Forbidden');
  });

  it('3. Operations user CANNOT read or modify Sales data (403 Forbidden)', async () => {
    expect(securityPolicyService.canReadDepartment(OPERATIONS_USER, 'sales')).toBe(false);
    expect(securityPolicyService.canModifyDepartment(OPERATIONS_USER, 'sales')).toBe(false);

    expect(() => {
      securityPolicyService.assertCanReadDepartment(OPERATIONS_USER, 'sales');
    }).toThrow(SecurityPolicyViolationError);

    expect(() => {
      securityPolicyService.assertCanEmitEvent(OPERATIONS_USER, 'sales');
    }).toThrow(SecurityPolicyViolationError);

    // Testing real event publisher rejection
    securityPolicyService.setCurrentUser(OPERATIONS_USER);
    const result = await publishDecisionEvent({
      organization_id: OPERATIONS_USER.organizationId,
      department: 'sales',
      event_type: 'deal_accepted',
      entity_id: 'DEAL-TAMPER',
      payload: {
        deal_id: 'DEAL-TAMPER',
        final_value: 9999999,
        close_date: '2026-10-01',
        sla_commitments: [],
      },
      created_by: OPERATIONS_USER.fullName,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('403 Forbidden');
  });

  it('4. Operations user CANNOT access CEO-only company analytics', () => {
    expect(securityPolicyService.canAccessCEOAnalytics(OPERATIONS_USER)).toBe(false);
  });

  it('5. CEO has full access to Operations, Finance, Sales, Product, and company analytics', () => {
    expect(securityPolicyService.canReadDepartment(CEO_USER, 'operations')).toBe(true);
    expect(securityPolicyService.canReadDepartment(CEO_USER, 'finance')).toBe(true);
    expect(securityPolicyService.canReadDepartment(CEO_USER, 'sales')).toBe(true);
    expect(securityPolicyService.canReadDepartment(CEO_USER, 'product')).toBe(true);
    expect(securityPolicyService.canReadDepartment(CEO_USER, 'command_center')).toBe(true);
    expect(securityPolicyService.canAccessCEOAnalytics(CEO_USER)).toBe(true);
  });

  it('6. Entity filtering respects department boundaries for Operations user', () => {
    const mockEntities = [
      { id: '1', department: 'operations' as const, name: 'Assembly Line' },
      { id: '2', department: 'finance' as const, name: 'Q1 Capex Budget' },
      { id: '3', department: 'sales' as const, name: 'Apex Global Deal' },
      { id: '4', department: 'engineering' as const, name: 'Core Platform Team' },
    ];

    const operationsAuthorized = securityPolicyService.filterAuthorizedEntities(
      OPERATIONS_USER,
      mockEntities
    );
    expect(operationsAuthorized.length).toBe(2);
    expect(operationsAuthorized.map((e) => e.department)).toEqual(['operations', 'engineering']);

    const ceoAuthorized = securityPolicyService.filterAuthorizedEntities(CEO_USER, mockEntities);
    expect(ceoAuthorized.length).toBe(4);
  });

  it('7. Operations Head submits Inventory: 1240 -> 860, and CEO Command Center receives it in realtime', async () => {
    let receivedInventoryValue: number | null = null;
    let receivedPreviousValue: number | null = null;

    // CEO Command Center subscribes
    const unsub = realtimeSubscriptionManager.onEvent<'inventory_changed'>((event) => {
      if (event.payload) {
        receivedInventoryValue = event.payload.new_value;
        receivedPreviousValue = event.payload.previous_value;
      }
    }, 'inventory_changed');

    // Operations Head submits from Mobile
    securityPolicyService.setCurrentUser(OPERATIONS_USER);
    const publishRes = await publishDecisionEvent({
      organization_id: OPERATIONS_USER.organizationId,
      department: 'operations',
      event_type: 'inventory_changed',
      entity_id: 'INV-WAREHOUSE-MAIN',
      payload: {
        inventory_id: 'INV-WAREHOUSE-MAIN',
        item_name: 'Core Assemblies',
        previous_value: 1240,
        new_value: 860,
        unit: 'units',
      },
      created_by: OPERATIONS_USER.fullName,
    });

    expect(publishRes.success).toBe(true);
    expect(publishRes.event).toBeDefined();

    // CEO Command Center received the update without refresh
    expect(receivedInventoryValue).toBe(860);
    expect(receivedPreviousValue).toBe(1240);

    unsub();
  });
});
