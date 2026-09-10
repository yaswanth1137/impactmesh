/**
 * IMPACTMESH - System Constants
 * Core constants for Blacktide Systems operational departments and physical device topologies.
 */

import type { DepartmentCode } from '../types/events.ts';
import type { BusinessEntityType } from '../types/entities.ts';

export const COMPANY_NAME = 'BLACKTIDE SYSTEMS';

export const DEPARTMENTS: Record<
  DepartmentCode,
  {
    name: string;
    code: DepartmentCode;
    deviceLabel: string;
    description: string;
  }
> = {
  sales: {
    name: 'Sales & CRM',
    code: 'sales',
    deviceLabel: 'Device 1: Sales / CRM Mobile',
    description: 'Revenue intake, deals, customer relations, contracts and SLAs',
  },
  product: {
    name: 'Product Management',
    code: 'product',
    deviceLabel: 'Device 2: Product Mobile',
    description: 'Roadmaps, feature commitments, scope management and release dates',
  },
  engineering: {
    name: 'Engineering & Operations',
    code: 'engineering',
    deviceLabel: 'Device 3: Engineering / Ops Mobile',
    description: 'Team capacity, sprint velocity, infrastructure constraints and blockers',
  },
  finance: {
    name: 'Finance & Treasury',
    code: 'finance',
    deviceLabel: 'Device 4: Finance Mobile',
    description: 'Budget allocations, burn rates, runways, spending policies',
  },
  command_center: {
    name: 'Command Center',
    code: 'command_center',
    deviceLabel: 'Device 5: Command Center Laptop',
    description: 'Central real-time situational awareness, impact graph, and decision intelligence',
  },
};

export const CORE_ENTITY_TYPES: BusinessEntityType[] = [
  'customer',
  'deal',
  'product',
  'feature',
  'project',
  'resource',
  'budget',
  'supplier',
  'decision',
  'constraint',
  'outcome',
];

export const REALTIME_CHANNELS = {
  BUSINESS_EVENTS: 'impactmesh:events',
  BUSINESS_STATE: 'impactmesh:state',
  DECISIONS: 'impactmesh:decisions',
  RECOMMENDATIONS: 'impactmesh:recommendations',
} as const;

export const DEFAULT_THRESHOLDS = {
  CAPACITY_WARNING_PCT: 85,
  CAPACITY_CRITICAL_PCT: 100,
  BUDGET_PRESSURE_HIGH: 0.75,
  RISK_SCORE_CRITICAL: 0.8,
  MIN_HEALTH_SCORE: 50,
} as const;
