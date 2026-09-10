/**
 * IMPACTMESH // BLACKTIDE SYSTEMS
 * WideWorldImporters Enterprise Dataset Models
 */

export interface EnterpriseCustomer {
  id: string;
  name: string;
  category: 'Enterprise' | 'Corporate' | 'Mid-Market' | 'Strategic Partner';
  arrINR: number; // in INR (Lakhs / Crores scale)
  creditLimitINR: number;
  paymentTermsDays: number;
  riskProfile: 'LOW' | 'MEDIUM' | 'HIGH';
  primaryContact: string;
  activeContracts: number;
  industry: string;
}

export interface EnterpriseProduct {
  id: string;
  name: string;
  sku: string;
  category: 'Enterprise Platform' | 'Custom Module' | 'Hardware Gateway' | 'Support Tier';
  unitPriceINR: number;
  leadTimeDays: number;
  stockOnHand: number;
  reorderLevel: number;
  isCustomScope: boolean;
}

export interface EnterpriseOrder {
  id: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  totalAmountINR: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'DELIVERED' | 'DELAYED';
  expectedDelivery: string;
  allocatedCapacityHours: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPriceINR: number;
  }>;
}

export interface EnterpriseSupplier {
  id: string;
  name: string;
  category: 'Cloud Infrastructure' | 'Hardware Fab' | 'Specialist Engineering' | 'Consulting';
  reliabilityScore: number; // 0.00 to 1.00
  leadTimeDays: number;
  contractStatus: 'ACTIVE' | 'AT_RISK' | 'EXPIRING';
  contactPerson: string;
}

export interface EnterpriseInventoryItem {
  productId: string;
  productName: string;
  sku: string;
  availableStock: number;
  reservedStock: number;
  allocatedForDeals: number;
  warehouseLocation: string;
}

export interface EnterpriseDatasetQuery {
  category?: string;
  riskProfile?: string;
  minArrINR?: number;
  search?: string;
  limit?: number;
  offset?: number;
}
