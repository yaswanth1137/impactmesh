/**
 * IMPACTMESH - Supabase Database Schema Types
 * Maps Supabase PostgreSQL tables and JSON columns to strongly typed TypeScript contracts.
 * Compatible with @supabase/supabase-js v2 GenericSchema requirements.
 */

import type { BusinessMetrics, DependencyRelationType } from '../../types/domain.ts';
import type { DepartmentCode, ImpactMeshEventType } from '../../types/events.ts';
import type { BusinessEntityType, EntityStatus } from '../../types/entities.ts';
import type { ExecutiveRole } from '../../types/policies.ts';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          department: DepartmentCode;
          email: string;
          full_name: string;
          role: string;
          device_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          department: DepartmentCode;
          email: string;
          full_name: string;
          role?: string;
          device_id?: string | null;
          created_at?: string;
        };
        Update: {
          department?: DepartmentCode;
          email?: string;
          full_name?: string;
          role?: string;
          device_id?: string | null;
        };
        Relationships: [];
      };
      business_entities: {
        Row: {
          id: string;
          organization_id: string;
          entity_type: BusinessEntityType;
          name: string;
          description: string | null;
          department: DepartmentCode;
          status: EntityStatus;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entity_type: BusinessEntityType;
          name: string;
          description?: string | null;
          department: DepartmentCode;
          status?: EntityStatus;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          entity_type?: BusinessEntityType;
          name?: string;
          description?: string | null;
          department?: DepartmentCode;
          status?: EntityStatus;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      decision_events: {
        Row: {
          id: string;
          organization_id: string;
          department: DepartmentCode;
          event_type: ImpactMeshEventType;
          entity_id: string;
          payload: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          department: DepartmentCode;
          event_type: ImpactMeshEventType;
          entity_id: string;
          payload: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          department?: DepartmentCode;
          event_type?: ImpactMeshEventType;
          entity_id?: string;
          payload?: Json;
          created_by?: string;
        };
        Relationships: [];
      };
      dependencies: {
        Row: {
          id: string;
          organization_id: string;
          source_entity_id: string;
          target_entity_id: string;
          relation_type: DependencyRelationType;
          strength: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          source_entity_id: string;
          target_entity_id: string;
          relation_type: DependencyRelationType;
          strength?: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          source_entity_id?: string;
          target_entity_id?: string;
          relation_type?: DependencyRelationType;
          strength?: number;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      business_state: {
        Row: {
          id: string;
          organization_id: string;
          timestamp: string;
          metrics: BusinessMetrics;
          state_hash: string;
          last_event_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          timestamp?: string;
          metrics: BusinessMetrics;
          state_hash: string;
          last_event_id?: string | null;
          created_at?: string;
        };
        Update: {
          metrics?: BusinessMetrics;
          state_hash?: string;
          last_event_id?: string | null;
        };
        Relationships: [];
      };
      decisions: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string;
          department: DepartmentCode;
          status: string;
          trigger_event_id: string;
          impact_result_id: string | null;
          selected_option_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description: string;
          department: DepartmentCode;
          status?: string;
          trigger_event_id: string;
          impact_result_id?: string | null;
          selected_option_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          status?: string;
          impact_result_id?: string | null;
          selected_option_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      impact_results: {
        Row: {
          id: string;
          organization_id: string;
          decision_event_id: string;
          affected_entities: Json;
          metric_deltas: Json;
          cascade_depth: number;
          deterministic_score: number;
          risk_assessment: Json;
          confidence_score: number;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          decision_event_id: string;
          affected_entities: Json;
          metric_deltas: Json;
          cascade_depth: number;
          deterministic_score: number;
          risk_assessment: Json;
          confidence_score: number;
          calculated_at?: string;
        };
        Update: {
          affected_entities?: Json;
          metric_deltas?: Json;
          cascade_depth?: number;
          deterministic_score?: number;
          risk_assessment?: Json;
          confidence_score?: number;
        };
        Relationships: [];
      };
      decision_options: {
        Row: {
          id: string;
          decision_id: string | null;
          event_id: string | null;
          title: string;
          description: string;
          action_type: string;
          projected_metrics: Json;
          feasibility_score: number;
          policy_alignment: Json;
          tradeoffs: Json;
          rationale: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          decision_id?: string | null;
          event_id?: string | null;
          title: string;
          description: string;
          action_type: string;
          projected_metrics: Json;
          feasibility_score: number;
          policy_alignment: Json;
          tradeoffs: Json;
          rationale: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          projected_metrics?: Json;
          feasibility_score?: number;
          policy_alignment?: Json;
          tradeoffs?: Json;
          rationale?: string;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          decision_id: string;
          decision_event_id: string;
          top_option_id: string;
          perspective: ExecutiveRole;
          groq_reasoning: Json | null;
          confidence_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          decision_id: string;
          decision_event_id: string;
          top_option_id: string;
          perspective: ExecutiveRole;
          groq_reasoning?: Json | null;
          confidence_score: number;
          created_at?: string;
        };
        Update: {
          top_option_id?: string;
          perspective?: ExecutiveRole;
          groq_reasoning?: Json | null;
          confidence_score?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
