-- =============================================================================
-- IMPACTMESH - Seed Data: Blacktide Systems Baseline Scenario
-- Models the operational topology and initial dependency network.
-- =============================================================================

DO $$
DECLARE
    org_id UUID := 'a0000000-0000-0000-0000-000000000001';
    user_sales UUID := 'u0000000-0000-0000-0000-000000000001';
    user_prod UUID := 'u0000000-0000-0000-0000-000000000002';
    user_eng UUID := 'u0000000-0000-0000-0000-000000000003';
    user_fin UUID := 'u0000000-0000-0000-0000-000000000004';
    
    ent_customer_apex UUID := 'c0000000-0000-0000-0000-000000000001';
    ent_deal_apex UUID := 'd0000000-0000-0000-0000-000000000001';
    ent_feature_sso UUID := 'f0000000-0000-0000-0000-000000000001';
    ent_eng_capacity UUID := 'e0000000-0000-0000-0000-000000000001';
    ent_budget_q1 UUID := 'b0000000-0000-0000-0000-000000000001';
    ent_revenue_pipeline UUID := 'r0000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Organization
    INSERT INTO public.organizations (id, name, slug)
    VALUES (org_id, 'Blacktide Systems', 'blacktide-systems')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Department Operators (4 Devices + Command Center)
    INSERT INTO public.users (id, organization_id, department, email, full_name, role, device_id)
    VALUES
        (user_sales, org_id, 'sales', 'sales.lead@blacktide.io', 'Maya Lin (Sales)', 'lead', 'device-sales-mobile'),
        (user_prod, org_id, 'product', 'product.lead@blacktide.io', 'Marcus Vance (Product)', 'lead', 'device-product-mobile'),
        (user_eng, org_id, 'engineering', 'eng.lead@blacktide.io', 'Devon Ross (Engineering)', 'lead', 'device-eng-mobile'),
        (user_fin, org_id, 'finance', 'finance.lead@blacktide.io', 'Priya Sharma (Finance)', 'lead', 'device-finance-mobile')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Core Business Entities
    INSERT INTO public.business_entities (id, organization_id, entity_type, name, description, department, status, metadata)
    VALUES
        (ent_customer_apex, org_id, 'customer', 'Apex Global Financials', 'Tier-1 Enterprise client under annual expansion', 'sales', 'active', '{"tier": "enterprise", "arr": 2400000, "churn_risk": 0.15}'::jsonb),
        (ent_deal_apex, org_id, 'deal', 'Apex Enterprise Security Expansion', 'Annual license expansion contract renewal with SAML mandate', 'sales', 'active', '{"contract_value": 1200000, "stage": "negotiation", "target_date": "2026-10-15"}'::jsonb),
        (ent_feature_sso, org_id, 'feature', 'Enterprise Multi-Tenant SAML SSO', 'Required enterprise identity integration for Apex expansion', 'product', 'active', '{"scope_points": 80, "committed_sprint": "Sprint-24", "critical_path": true}'::jsonb),
        (ent_eng_capacity, org_id, 'resource', 'Core Platform Engineering Team', 'Primary backend platform engineering capacity pool', 'engineering', 'active', '{"capacity_hours": 400, "current_demand": 320, "utilization_pct": 80}'::jsonb),
        (ent_budget_q1, org_id, 'budget', 'Q1 Operational & Platform Budget', 'Quarterly discretionary and committed engineering capital', 'finance', 'active', '{"allocated": 1800000, "committed": 1100000, "available": 700000}'::jsonb),
        (ent_revenue_pipeline, org_id, 'outcome', 'FY26 Q4 Revenue Target', 'Target company ARR expansion goal', 'finance', 'active', '{"target_arr": 5000000, "current_pipeline": 4500000}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Explicit Dependency Graph
    -- Deal -> requires -> Feature
    INSERT INTO public.dependencies (organization_id, source_entity_id, target_entity_id, relation_type, strength, metadata)
    VALUES
        (org_id, ent_deal_apex, ent_feature_sso, 'requires', 1.00, '{"blocker": true, "reason": "Contractual condition for Apex deal"}'::jsonb),
        (org_id, ent_feature_sso, ent_eng_capacity, 'consumes', 0.85, '{"hours_required": 160, "burn_rate": "high"}'::jsonb),
        (org_id, ent_eng_capacity, ent_budget_q1, 'constrained_by', 0.90, '{"hourly_cost_blended": 120}'::jsonb),
        (org_id, ent_deal_apex, ent_revenue_pipeline, 'generates', 1.00, '{"pipeline_addition": 1200000}'::jsonb),
        (org_id, ent_feature_sso, ent_customer_apex, 'affects', 0.95, '{"impact": "Delays will trigger SLA dispute"}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- 5. Baseline Business State
    INSERT INTO public.business_state (organization_id, metrics, state_hash, last_event_id)
    VALUES (
        org_id,
        '{
            "available_budget": 1800000,
            "committed_budget": 1100000,
            "revenue_pipeline": 4500000,
            "engineering_capacity": 400,
            "engineering_demand": 320,
            "capacity_utilization": 80.0,
            "budget_pressure": 0.61,
            "risk_score": 0.28,
            "business_health": 84
        }'::jsonb,
        'genesis-state-hash-v1',
        NULL
    )
    ON CONFLICT DO NOTHING;

END $$;
