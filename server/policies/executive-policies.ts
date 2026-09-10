/**
 * IMPACTMESH - Executive Expert Policies
 * Baseline policies representing the perspectives of CEO, CFO, and COO at Blacktide Systems.
 */

import type { ExpertPolicy, ExecutiveRole } from '../../src/types/policies.ts';

export const CEO_POLICY: ExpertPolicy = {
  id: 'policy-ceo-01',
  role: 'ceo',
  name: 'Chief Executive Officer',
  title: 'Strategic Growth & Enterprise Value',
  description: 'Prioritizes enterprise expansion, high ARR deals, strategic market position, and customer satisfaction.',
  weights: {
    growth: 0.35,
    strategic_value: 0.25,
    customer_value: 0.20,
    operational_stability: 0.05,
    capacity: 0.05,
    cost_control: 0.04,
    cash_preservation: 0.03,
    risk: 0.03,
  },
  thresholds: {
    max_acceptable_risk: 0.70,
    min_roi_factor: 2.0,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const CFO_POLICY: ExpertPolicy = {
  id: 'policy-cfo-01',
  role: 'cfo',
  name: 'Chief Financial Officer',
  title: 'Capital Preservation & Fiscal Discipline',
  description: 'Prioritizes cash runway preservation, budget containment, cost efficiency, and low downside risk.',
  weights: {
    cash_preservation: 0.35,
    cost_control: 0.30,
    risk: 0.15,
    growth: 0.08,
    operational_stability: 0.05,
    customer_value: 0.04,
    strategic_value: 0.02,
    capacity: 0.01,
  },
  thresholds: {
    max_acceptable_risk: 0.35,
    min_roi_factor: 3.5,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const COO_POLICY: ExpertPolicy = {
  id: 'policy-coo-01',
  role: 'coo',
  name: 'Chief Operating Officer',
  title: 'Operational Stability & Capacity Integrity',
  description: 'Protects team bandwidth, mitigates delivery delays, avoids burnout, and preserves execution stability.',
  weights: {
    capacity: 0.35,
    operational_stability: 0.30,
    risk: 0.15,
    customer_value: 0.10,
    strategic_value: 0.04,
    cost_control: 0.03,
    cash_preservation: 0.02,
    growth: 0.01,
  },
  thresholds: {
    max_acceptable_risk: 0.45,
    max_capacity_burn: 0.85,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const BALANCED_POLICY: ExpertPolicy = {
  id: 'policy-balanced-01',
  role: 'balanced',
  name: 'Executive Consensus Policy',
  title: 'Balanced Cross-Departmental Equilibrium',
  description: 'Harmonized weights balancing growth, cash runway, and operational capacity equally.',
  weights: {
    growth: 0.15,
    strategic_value: 0.15,
    customer_value: 0.15,
    cash_preservation: 0.15,
    cost_control: 0.10,
    operational_stability: 0.10,
    capacity: 0.10,
    risk: 0.10,
  },
  thresholds: {
    max_acceptable_risk: 0.50,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const EXECUTIVE_POLICIES: Record<ExecutiveRole, ExpertPolicy> = {
  ceo: CEO_POLICY,
  cfo: CFO_POLICY,
  coo: COO_POLICY,
  balanced: BALANCED_POLICY,
};
