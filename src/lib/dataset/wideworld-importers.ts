/**
 * IMPACTMESH // BLACKTIDE SYSTEMS
 * WideWorldImporters Realistic Enterprise Dataset
 */

import type {
  EnterpriseCustomer,
  EnterpriseProduct,
  EnterpriseOrder,
  EnterpriseSupplier,
  EnterpriseInventoryItem
} from '../../types/dataset.ts';

export const WIDE_WORLD_CUSTOMERS: EnterpriseCustomer[] = [
  {
    id: 'CUST-001',
    name: 'Apex Global Logistics',
    category: 'Enterprise',
    arrINR: 5000000, // ₹50.0L ARR
    creditLimitINR: 15000000,
    paymentTermsDays: 45,
    riskProfile: 'HIGH', // High exposure due to custom deliverable dependency
    primaryContact: 'Devon Vance, Chief Operations Officer',
    activeContracts: 3,
    industry: 'Maritime Freight & Port Operations'
  },
  {
    id: 'CUST-002',
    name: 'Tailwind Cargo Systems',
    category: 'Corporate',
    arrINR: 3200000, // ₹32.0L ARR
    creditLimitINR: 8000000,
    paymentTermsDays: 30,
    riskProfile: 'MEDIUM',
    primaryContact: 'Elena Rostova, VP Procurement',
    activeContracts: 2,
    industry: 'Air Freight & Cold Chain'
  },
  {
    id: 'CUST-003',
    name: 'Wingtip Oceanic Services',
    category: 'Strategic Partner',
    arrINR: 7800000, // ₹78.0L ARR
    creditLimitINR: 20000000,
    paymentTermsDays: 60,
    riskProfile: 'LOW',
    primaryContact: 'Marcus Sterling, Director of Digital Fleet',
    activeContracts: 5,
    industry: 'Vessel Chartering & Fleet Automation'
  },
  {
    id: 'CUST-004',
    name: 'Consumables Direct Marine',
    category: 'Mid-Market',
    arrINR: 1800000, // ₹18.0L ARR
    creditLimitINR: 4000000,
    paymentTermsDays: 30,
    riskProfile: 'LOW',
    primaryContact: 'Sarah Lin, Supply Chain Lead',
    activeContracts: 1,
    industry: 'Offshore Supply Provisions'
  },
  {
    id: 'CUST-005',
    name: 'Northwind Port Authorities',
    category: 'Enterprise',
    arrINR: 6400000, // ₹64.0L ARR
    creditLimitINR: 18000000,
    paymentTermsDays: 45,
    riskProfile: 'MEDIUM',
    primaryContact: 'Anand Kulkarni, Chief Technology Officer',
    activeContracts: 4,
    industry: 'Terminal Management & Customs Logistics'
  }
];

export const WIDE_WORLD_PRODUCTS: EnterpriseProduct[] = [
  {
    id: 'PROD-001',
    name: 'ImpactMesh Navigation Core Gateway',
    sku: 'IM-CORE-GW-01',
    category: 'Enterprise Platform',
    unitPriceINR: 1200000,
    leadTimeDays: 14,
    stockOnHand: 45,
    reorderLevel: 10,
    isCustomScope: false
  },
  {
    id: 'PROD-002',
    name: 'DeepSea Telemetry Bridge (Edge HW)',
    sku: 'DS-TLM-BR-02',
    category: 'Hardware Gateway',
    unitPriceINR: 450000,
    leadTimeDays: 28,
    stockOnHand: 18,
    reorderLevel: 8,
    isCustomScope: false
  },
  {
    id: 'PROD-003',
    name: 'Apex Custom Port Dispatch Integration Module',
    sku: 'CUST-MOD-APEX-03',
    category: 'Custom Module',
    unitPriceINR: 2400000,
    leadTimeDays: 45,
    stockOnHand: 1,
    reorderLevel: 1,
    isCustomScope: true
  },
  {
    id: 'PROD-004',
    name: 'Fleet Realtime Anomaly Radar Package',
    sku: 'FLT-RADAR-04',
    category: 'Enterprise Platform',
    unitPriceINR: 1600000,
    leadTimeDays: 10,
    stockOnHand: 60,
    reorderLevel: 15,
    isCustomScope: false
  },
  {
    id: 'PROD-005',
    name: 'Mission-Critical 24/7 Ops Desk Support SLA',
    sku: 'SLA-247-CRIT',
    category: 'Support Tier',
    unitPriceINR: 800000,
    leadTimeDays: 1,
    stockOnHand: 999,
    reorderLevel: 0,
    isCustomScope: false
  }
];

export const WIDE_WORLD_SUPPLIERS: EnterpriseSupplier[] = [
  {
    id: 'SUPP-001',
    name: 'Borealis Semiconductor Fab',
    category: 'Hardware Fab',
    reliabilityScore: 0.94,
    leadTimeDays: 21,
    contractStatus: 'ACTIVE',
    contactPerson: 'Erik Lindqvist'
  },
  {
    id: 'SUPP-002',
    name: 'HydroCloud Maritime Data Infrastructure',
    category: 'Cloud Infrastructure',
    reliabilityScore: 0.99,
    leadTimeDays: 2,
    contractStatus: 'ACTIVE',
    contactPerson: 'Tara O’Connor'
  },
  {
    id: 'SUPP-003',
    name: 'Nautical Embedded Systems Lab',
    category: 'Specialist Engineering',
    reliabilityScore: 0.81,
    leadTimeDays: 35,
    contractStatus: 'AT_RISK',
    contactPerson: 'Dr. Hans Richter'
  }
];

export const WIDE_WORLD_ORDERS: EnterpriseOrder[] = [
  {
    id: 'ORD-2026-0041',
    customerId: 'CUST-001',
    customerName: 'Apex Global Logistics',
    orderDate: '2026-08-15',
    totalAmountINR: 5000000,
    status: 'IN_PRODUCTION',
    expectedDelivery: '2026-09-30',
    allocatedCapacityHours: 420,
    items: [
      {
        productId: 'PROD-001',
        productName: 'ImpactMesh Navigation Core Gateway',
        quantity: 1,
        unitPriceINR: 1200000
      },
      {
        productId: 'PROD-003',
        productName: 'Apex Custom Port Dispatch Integration Module',
        quantity: 1,
        unitPriceINR: 2400000
      },
      {
        productId: 'PROD-004',
        productName: 'Fleet Realtime Anomaly Radar Package',
        quantity: 1,
        unitPriceINR: 1400000
      }
    ]
  },
  {
    id: 'ORD-2026-0042',
    customerId: 'CUST-002',
    customerName: 'Tailwind Cargo Systems',
    orderDate: '2026-08-20',
    totalAmountINR: 3200000,
    status: 'CONFIRMED',
    expectedDelivery: '2026-10-15',
    allocatedCapacityHours: 210,
    items: [
      {
        productId: 'PROD-001',
        productName: 'ImpactMesh Navigation Core Gateway',
        quantity: 2,
        unitPriceINR: 1200000
      },
      {
        productId: 'PROD-005',
        productName: 'Mission-Critical 24/7 Ops Desk Support SLA',
        quantity: 1,
        unitPriceINR: 800000
      }
    ]
  },
  {
    id: 'ORD-2026-0043',
    customerId: 'CUST-003',
    customerName: 'Wingtip Oceanic Services',
    orderDate: '2026-09-01',
    totalAmountINR: 7800000,
    status: 'CONFIRMED',
    expectedDelivery: '2026-11-30',
    allocatedCapacityHours: 350,
    items: [
      {
        productId: 'PROD-001',
        productName: 'ImpactMesh Navigation Core Gateway',
        quantity: 4,
        unitPriceINR: 1200000
      },
      {
        productId: 'PROD-002',
        productName: 'DeepSea Telemetry Bridge (Edge HW)',
        quantity: 4,
        unitPriceINR: 450000
      },
      {
        productId: 'PROD-004',
        productName: 'Fleet Realtime Anomaly Radar Package',
        quantity: 1,
        unitPriceINR: 1200000
      }
    ]
  }
];

export const WIDE_WORLD_INVENTORY: EnterpriseInventoryItem[] = [
  {
    productId: 'PROD-001',
    productName: 'ImpactMesh Navigation Core Gateway',
    sku: 'IM-CORE-GW-01',
    availableStock: 38,
    reservedStock: 7,
    allocatedForDeals: 7,
    warehouseLocation: 'Bay 4, Mumbai Logistics Terminal'
  },
  {
    productId: 'PROD-002',
    productName: 'DeepSea Telemetry Bridge (Edge HW)',
    sku: 'DS-TLM-BR-02',
    availableStock: 14,
    reservedStock: 4,
    allocatedForDeals: 4,
    warehouseLocation: 'Bay 1, Rotterdam Naval Hub'
  },
  {
    productId: 'PROD-003',
    productName: 'Apex Custom Port Dispatch Integration Module',
    sku: 'CUST-MOD-APEX-03',
    availableStock: 0,
    reservedStock: 1,
    allocatedForDeals: 1,
    warehouseLocation: 'Software Build Pipeline / Active Sprint'
  }
];
