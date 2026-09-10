/**
 * IMPACTMESH - Salesforce Connector & Normalizer
 * Normalizes Salesforce Opportunity and Account events into canonical DecisionEvents.
 */

import type { IConnector, RawExternalPayload, ExternalSourceType } from './connector.interface.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

export interface SalesforceOpportunityPayload {
  OpportunityId: string;
  AccountId: string;
  AccountName: string;
  StageName: string; // e.g. 'Closed Won'
  Amount: number;    // In INR or converted
  CloseDate: string;
  CustomEngineeringHoursRequired?: number;
  RequiredFeatures?: string[];
}

export class SalesforceConnector implements IConnector {
  public readonly id = 'connector-salesforce-crm';
  public readonly sourceType: ExternalSourceType = 'SALESFORCE';
  private connected = false;

  public async connect(): Promise<boolean> {
    this.connected = true;
    return true;
  }

  public async disconnect(): Promise<boolean> {
    this.connected = false;
    return true;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Normalizes raw Salesforce event payload into a canonical Blacktide DecisionEvent.
   */
  public normalizePayload(payload: RawExternalPayload): DecisionEvent {
    const opp = payload.rawRecord as unknown as SalesforceOpportunityPayload;
    const isClosedWon = opp.StageName === 'Closed Won';

    if (isClosedWon) {
      return {
        id: `EVT-SF-${payload.externalEventId}`,
        organization_id: '00000000-0000-0000-0000-000000000000',
        department: 'sales',
        event_type: 'deal_accepted',
        entity_id: opp.AccountId || 'CUST-APEX',
        payload: {
          deal_id: opp.OpportunityId || 'DEAL-APEX-Q3',
          final_value: opp.Amount || 5000000,
          close_date: opp.CloseDate || '2026-09-30',
          sla_commitments: opp.RequiredFeatures || ['SAML SSO', 'Custom Analytics'],
          contract_value_inr: opp.Amount || 5000000,
          required_engineering_hours: opp.CustomEngineeringHoursRequired || 420,
        } as any,
        created_by: 'Salesforce Outbound Connector',
        created_at: payload.timestamp || new Date().toISOString(),
      };
    }

    return {
      id: `EVT-SF-${payload.externalEventId}`,
      organization_id: '00000000-0000-0000-0000-000000000000',
      department: 'sales',
      event_type: 'deal_created',
      entity_id: opp.AccountId || 'CUST-APEX',
      payload: {
        deal_id: opp.OpportunityId || 'DEAL-APEX-Q3',
        deal_name: opp.AccountName || 'Apex Global Financials Expansion',
        customer_id: opp.AccountId || 'CUST-APEX',
        contract_value: opp.Amount || 5000000,
        expected_close_date: opp.CloseDate || '2026-09-30',
        requested_features: opp.RequiredFeatures || ['SAML SSO'],
      },
      created_by: 'Salesforce Outbound Connector',
      created_at: payload.timestamp || new Date().toISOString(),
    };
  }
}

export const salesforceConnector = new SalesforceConnector();
