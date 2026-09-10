/**
 * IMPACTMESH - Live Business Signal Hook
 * Decoupled realtime listener that normalizes incoming department events
 * into high-level business signals with causal consequence interpretation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeSubscriptionManager } from './subscription-manager.ts';
import type { DecisionEvent } from '../../types/events.ts';

export interface LiveBusinessSignal {
  id: string;
  eventId: string;
  sourceDepartment: 'sales' | 'product' | 'engineering' | 'finance' | 'operations' | 'commercial';
  sourceDepartmentLabel: string;
  sourceRole: 'lookout' | 'navigator' | 'engineer' | 'purser' | 'captain';
  sourceSystem: string;
  eventType: string;
  timestamp: string;
  title: string;
  entityName: string;
  changeLabel: string;
  before?: string;
  after?: string;
  severity: 'INFO' | 'NOTICE' | 'WARNING' | 'CRITICAL';
  affectedAreas: string[];
  consequenceTitle: string;
  consequenceDetail: string;
  impactSummary?: string;
  decisionRequired: boolean;
  decisionId?: string;
  signalId?: string;
  status: 'NEW' | 'EMPHASIZED' | 'REVIEWED' | 'ACKNOWLEDGED' | 'DISMISSED';
}

export function normalizeEventToLiveSignal(event: DecisionEvent): LiveBusinessSignal {
  const eventId = event.id;
  const payload = (event.payload || {}) as Record<string, any>;
  const dept = (event.department || 'sales').toLowerCase() as LiveBusinessSignal['sourceDepartment'];
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });

  // 1. SALES: Delivery commitment / deadline changed
  if (event.event_type === 'deadline_changed' || (event.event_type as string) === 'customer_commitment_changed') {
    const prev = payload.previous_deadline || 'June 20';
    const next = payload.new_deadline || 'June 12';
    return {
      id: `SIG-LIVE-${eventId}`,
      eventId,
      sourceDepartment: 'sales',
      sourceDepartmentLabel: 'SALES',
      sourceRole: 'lookout',
      sourceSystem: 'Sales Mobile Terminal',
      eventType: event.event_type,
      timestamp: now,
      title: 'SALES CHANGED A CUSTOMER COMMITMENT',
      entityName: payload.customer_name || 'Apex Global',
      changeLabel: 'Delivery commitment',
      before: prev,
      after: next,
      severity: 'CRITICAL',
      affectedAreas: ['Product', 'Engineering', 'Delivery'],
      consequenceTitle: 'IMPACTMESH DETECTED DELIVERY CONFLICT',
      consequenceDetail:
        'Sales moved the customer commitment to June 12. Current engineering capacity cannot support the revised commitment. A delivery decision is required.',
      impactSummary:
        'Sales moved the customer commitment to June 12. Current engineering capacity cannot support the revised commitment. A delivery decision is required.',
      decisionRequired: true,
      decisionId: 'DEC-APEX-EXPANSION-Q3',
      signalId: 'SIG-CAPACITY-OVERLOAD',
      status: 'EMPHASIZED',
    };
  }

  // 2. SALES: Deal accepted / committed
  if (event.event_type === 'deal_accepted' || event.event_type === 'deal_created') {
    const val = payload.final_value || payload.contract_value || 5000000;
    return {
      id: `SIG-LIVE-${eventId}`,
      eventId,
      sourceDepartment: 'sales',
      sourceDepartmentLabel: 'SALES',
      sourceRole: 'lookout',
      sourceSystem: 'Sales Intake Mobile',
      eventType: event.event_type,
      timestamp: now,
      title: 'SALES COMMITTED ENTERPRISE EXPANSION',
      entityName: payload.deal_name || 'Apex Global Enterprise',
      changeLabel: 'Contract commitment',
      before: 'Pending Review',
      after: `₹${(val / 100000).toFixed(1)}L ARR`,
      severity: 'CRITICAL',
      affectedAreas: ['Product', 'Engineering', 'Delivery'],
      consequenceTitle: 'INCREASED SPRINT DEMAND',
      consequenceDetail:
        'New contractual custom scope committed. Engineering sprint demand increases to 420h against 300h available capacity.',
      decisionRequired: true,
      decisionId: 'DEC-APEX-EXPANSION-Q3',
      signalId: 'SIG-CAPACITY-OVERLOAD',
      status: 'EMPHASIZED',
    };
  }

  // 3. ENGINEERING: Capacity changed
  if (event.event_type === 'capacity_changed') {
    const prev = `${payload.previous_capacity_hours || 420}h`;
    const next = `${payload.new_capacity_hours || 300}h`;
    return {
      id: `SIG-LIVE-${eventId}`,
      eventId,
      sourceDepartment: 'engineering',
      sourceDepartmentLabel: 'ENGINEERING',
      sourceRole: 'engineer',
      sourceSystem: 'Engineering Station',
      eventType: event.event_type,
      timestamp: now,
      title: 'ENGINEERING CAPACITY REVISED',
      entityName: 'Core Platform Engineering',
      changeLabel: 'Available sprint capacity',
      before: prev,
      after: next,
      severity: 'CRITICAL',
      affectedAreas: ['Product', 'Delivery', 'Operations'],
      consequenceTitle: 'CAPACITY DEFICIT INDUCED',
      consequenceDetail:
        'Engineering team available capacity dropped to 300h. Committed workload now exceeds capacity by 120h (+40% deficit).',
      decisionRequired: true,
      decisionId: 'DEC-APEX-EXPANSION-Q3',
      signalId: 'SIG-CAPACITY-OVERLOAD',
      status: 'EMPHASIZED',
    };
  }

  // 4. FINANCE: Budget changed
  if ((event.event_type as string) === 'budget_changed' || (event.event_type as string) === 'budget_cut') {
    const prev = payload.previous_budget ? `₹${(payload.previous_budget / 100000).toFixed(1)}L` : '₹18.0L';
    const next = payload.new_budget ? `₹${(payload.new_budget / 100000).toFixed(1)}L` : '₹11.0L';
    return {
      id: `SIG-LIVE-${eventId}`,
      eventId,
      sourceDepartment: 'finance',
      sourceDepartmentLabel: 'FINANCE',
      sourceRole: 'purser',
      sourceSystem: 'Finance Terminal',
      eventType: event.event_type,
      timestamp: now,
      title: 'FINANCE ADJUSTED STRATEGIC BUDGET',
      entityName: 'Q3 Technology & Contractor Budget',
      changeLabel: 'Capital allocation',
      before: prev,
      after: next,
      severity: 'WARNING',
      affectedAreas: ['Engineering', 'Operations'],
      consequenceTitle: 'CONTRACTION RISK',
      consequenceDetail:
        'Reduced contractor allocation limits ability to ramp external engineering headcount to absorb workload surges.',
      decisionRequired: true,
      decisionId: 'DEC-APEX-EXPANSION-Q3',
      signalId: 'SIG-BUDGET-CONTRACTION',
      status: 'EMPHASIZED',
    };
  }

  // 5. PRODUCT: Feature scope changed
  if (event.event_type === 'feature_scope_changed' || event.event_type === 'feature_committed') {
    return {
      id: `SIG-LIVE-${eventId}`,
      eventId,
      sourceDepartment: 'product',
      sourceDepartmentLabel: 'PRODUCT',
      sourceRole: 'navigator',
      sourceSystem: 'Product Backlog Manager',
      eventType: event.event_type,
      timestamp: now,
      title: 'PRODUCT COMMITTED CUSTOM SCOPE',
      entityName: payload.feature_name || 'Custom Enterprise Export & SSO',
      changeLabel: 'Release backlog scope',
      before: 'Standard Modules',
      after: '+3 Custom Modules (120h)',
      severity: 'CRITICAL',
      affectedAreas: ['Engineering', 'Delivery', 'Customer'],
      consequenceTitle: 'DELIVERY TARGET THREATENED',
      consequenceDetail:
        'New feature requirements added to current release sprint without schedule adjustment. Milestone delivery exposed to slippage.',
      decisionRequired: true,
      decisionId: 'DEC-APEX-EXPANSION-Q3',
      signalId: 'SIG-ROADMAP-CONFLICT',
      status: 'EMPHASIZED',
    };
  }

  // 6. Minor updates (e.g. customer_added)
  if (event.event_type === 'customer_added') {
    const custName = payload.name || payload.customer_name || event.entity_id || 'New Account';
    const detail = `Sales recorded new customer profile (${custName}). Low operational impact until deal commitment.`;
    return {
      id: `SIG-LIVE-${eventId}`,
      eventId,
      sourceDepartment: 'sales',
      sourceDepartmentLabel: 'SALES',
      sourceRole: 'lookout',
      sourceSystem: 'Sales Phone Terminal',
      eventType: event.event_type,
      timestamp: now,
      title: 'SALES ADDED NEW ACCOUNT',
      entityName: custName,
      changeLabel: 'Account Registration',
      before: 'Unregistered',
      after: 'Registered',
      severity: 'INFO',
      affectedAreas: ['Commercial'],
      consequenceTitle: 'NEW ACCOUNT PIPELINE ENTRY',
      consequenceDetail: detail,
      impactSummary: detail,
      decisionRequired: false,
      status: 'EMPHASIZED',
    };
  }

  // Generic fallback for any other operational event
  const fallbackDetail = `IMPACTMESH received state event from ${dept}. Evaluating downstream dependencies across the business mesh.`;
  return {
    id: `SIG-LIVE-${eventId}`,
    eventId,
    sourceDepartment: dept,
    sourceDepartmentLabel: dept.toUpperCase(),
    sourceRole: dept === 'product' ? 'navigator' : dept === 'engineering' ? 'engineer' : dept === 'finance' ? 'purser' : 'lookout',
    sourceSystem: `${dept.toUpperCase()} Station`,
    eventType: event.event_type,
    timestamp: now,
    title: `${dept.toUpperCase()} UPDATED OPERATIONAL STATE`,
    entityName: event.entity_id || 'Operational Resource',
    changeLabel: 'Configuration change',
    before: 'Baseline',
    after: 'Updated',
    severity: 'NOTICE',
    affectedAreas: ['Operations', 'Delivery'],
    consequenceTitle: 'OPERATIONAL STATE CHANGE DETECTED',
    consequenceDetail: fallbackDetail,
    impactSummary: fallbackDetail,
    decisionRequired: false,
    status: 'EMPHASIZED',
  };
}

export function useLiveBusinessSignals() {
  const [activeSignal, setActiveSignal] = useState<LiveBusinessSignal | null>(null);
  const [recentSignals, setRecentSignals] = useState<LiveBusinessSignal[]>([]);
  const [isEmphasized, setIsEmphasized] = useState<boolean>(false);

  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const emphasisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeSubscriptionManager.onEvent((incomingEvent: DecisionEvent) => {
      if (!incomingEvent || !incomingEvent.id) return;

      // Deduplicate client-side
      if (processedEventIdsRef.current.has(incomingEvent.id)) {
        return;
      }
      processedEventIdsRef.current.add(incomingEvent.id);

      const signal = normalizeEventToLiveSignal(incomingEvent);

      // Set active signal and trigger visual emphasis
      setActiveSignal(signal);
      setIsEmphasized(true);

      // Add to recent queue (max 5)
      setRecentSignals((prev) => [signal, ...prev.filter((s) => s.id !== signal.id)].slice(0, 5));

      // Settle emphasis after 2000ms (returns background to normal while keeping card prominent)
      if (emphasisTimerRef.current) {
        clearTimeout(emphasisTimerRef.current);
      }
      emphasisTimerRef.current = setTimeout(() => {
        setIsEmphasized(false);
      }, 2200);
    });

    return () => {
      unsubscribe();
      if (emphasisTimerRef.current) {
        clearTimeout(emphasisTimerRef.current);
      }
    };
  }, []);

  const acknowledgeSignal = useCallback((signalId: string) => {
    setActiveSignal((current) => (current && current.id === signalId ? null : current));
    setRecentSignals((prev) =>
      prev.map((s) => (s.id === signalId ? { ...s, status: 'ACKNOWLEDGED' } : s))
    );
  }, []);

  const dismissSignal = useCallback((signalId: string) => {
    setActiveSignal((current) => (current && current.id === signalId ? null : current));
    setRecentSignals((prev) =>
      prev.map((s) => (s.id === signalId ? { ...s, status: 'DISMISSED' } : s))
    );
  }, []);

  const markSignalReviewed = useCallback((signalId: string) => {
    setActiveSignal((current) => (current && current.id === signalId ? null : current));
    setRecentSignals((prev) =>
      prev.map((s) => (s.id === signalId ? { ...s, status: 'REVIEWED' } : s))
    );
  }, []);

  /**
   * Development / Demo Simulator:
   * Emits a realistic department event via the same realtime bus so that
   * the complete visual and domain pipeline reacts identically.
   */
  const simulateLiveDepartmentUpdate = useCallback(
    (preset: 'sales_deadline' | 'engineering_capacity' | 'finance_budget' = 'sales_deadline') => {
      const ts = Date.now();
      let event: DecisionEvent;

      if (preset === 'sales_deadline') {
        event = {
          id: `evt-demo-sales-${ts}`,
          organization_id: 'org-blacktide-core',
          department: 'sales',
          event_type: 'deadline_changed',
          entity_id: 'DEAL-APEX-50L',
          payload: {
            deal_id: 'DEAL-APEX-50L',
            customer_name: 'Apex Global',
            previous_deadline: 'June 20',
            new_deadline: 'June 12',
            reason: 'Customer procurement expedited milestone target',
            penalty_clause_active: true,
          },
          created_by: 'Maya Lin (Sales)',
          created_at: new Date().toISOString(),
        };
      } else if (preset === 'engineering_capacity') {
        event = {
          id: `evt-demo-eng-${ts}`,
          organization_id: 'org-blacktide-core',
          department: 'engineering',
          event_type: 'capacity_changed',
          entity_id: 'TEAM-ENG-CORE',
          payload: {
            team_id: 'TEAM-ENG-CORE',
            previous_capacity_hours: 420,
            new_capacity_hours: 300,
            effective_date: 'Immediate',
          },
          created_by: 'Devon Ross (Engineering)',
          created_at: new Date().toISOString(),
        };
      } else {
        event = {
          id: `evt-demo-fin-${ts}`,
          organization_id: 'org-blacktide-core',
          department: 'finance',
          event_type: 'budget_changed',
          entity_id: 'BUDGET-TECH-Q1',
          payload: {
            department: 'finance',
            previous_budget: 1800000,
            new_budget: 1100000,
            fiscal_period: 'Q3',
          },
          created_by: 'Priya Sharma (Finance)',
          created_at: new Date().toISOString(),
        };
      }

      realtimeSubscriptionManager.emitLocalEvent(event);
    },
    []
  );

  return {
    activeSignal,
    recentSignals,
    isEmphasized,
    acknowledgeSignal,
    dismissSignal,
    markSignalReviewed,
    simulateLiveDepartmentUpdate,
  };
}
