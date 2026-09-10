/**
 * IMPACTMESH // BLACKTIDE SYSTEMS
 * Enterprise Dataset Service (WideWorldImporters Access Layer)
 */

import type {
  EnterpriseCustomer,
  EnterpriseProduct,
  EnterpriseOrder,
  EnterpriseSupplier,
  EnterpriseInventoryItem,
  EnterpriseDatasetQuery
} from '../../types/dataset.ts';
import {
  WIDE_WORLD_CUSTOMERS,
  WIDE_WORLD_PRODUCTS,
  WIDE_WORLD_ORDERS,
  WIDE_WORLD_SUPPLIERS,
  WIDE_WORLD_INVENTORY
} from './wideworld-importers.ts';
import { DatasetRequestError } from '../../types/errors.ts';

export class EnterpriseDatasetService {
  public async getCustomers(query?: EnterpriseDatasetQuery): Promise<EnterpriseCustomer[]> {
    try {
      let results = [...WIDE_WORLD_CUSTOMERS];

      if (query?.category) {
        results = results.filter(c => c.category === query.category);
      }
      if (query?.riskProfile) {
        results = results.filter(c => c.riskProfile === query.riskProfile);
      }
      if (query?.minArrINR) {
        results = results.filter(c => c.arrINR >= query.minArrINR!);
      }
      if (query?.search) {
        const s = query.search.toLowerCase();
        results = results.filter(c => c.name.toLowerCase().includes(s) || c.industry.toLowerCase().includes(s));
      }

      if (query?.offset) {
        results = results.slice(query.offset);
      }
      if (query?.limit) {
        results = results.slice(0, query.limit);
      }

      return results;
    } catch (err) {
      throw new DatasetRequestError(
        `Failed to fetch customers: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  public async getCustomerById(id: string): Promise<EnterpriseCustomer | null> {
    const customer = WIDE_WORLD_CUSTOMERS.find(c => c.id === id || c.name.toLowerCase().includes(id.toLowerCase()));
    return customer || null;
  }

  public async getProducts(query?: { category?: string; search?: string }): Promise<EnterpriseProduct[]> {
    let results = [...WIDE_WORLD_PRODUCTS];

    if (query?.category) {
      results = results.filter(p => p.category === query.category);
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      results = results.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }

    return results;
  }

  public async getProductById(id: string): Promise<EnterpriseProduct | null> {
    return WIDE_WORLD_PRODUCTS.find(p => p.id === id || p.sku === id) || null;
  }

  public async getOrders(query?: { customerId?: string; status?: string }): Promise<EnterpriseOrder[]> {
    let results = [...WIDE_WORLD_ORDERS];

    if (query?.customerId) {
      results = results.filter(o => o.customerId === query.customerId);
    }
    if (query?.status) {
      results = results.filter(o => o.status === query.status);
    }

    return results;
  }

  public async getOrderById(id: string): Promise<EnterpriseOrder | null> {
    return WIDE_WORLD_ORDERS.find(o => o.id === id) || null;
  }

  public async getSuppliers(): Promise<EnterpriseSupplier[]> {
    return [...WIDE_WORLD_SUPPLIERS];
  }

  public async getInventory(): Promise<EnterpriseInventoryItem[]> {
    return [...WIDE_WORLD_INVENTORY];
  }
}

export const enterpriseDatasetService = new EnterpriseDatasetService();
