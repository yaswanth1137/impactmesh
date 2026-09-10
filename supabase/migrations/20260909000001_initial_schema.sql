-- =============================================================================
-- IMPACTMESH - Database Migration Foundation (Phase 1)
-- Team PIRATE | Blacktide Systems Operational Data Model
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Users (Operators on the 4 Mobile Clients and Command Center)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    department TEXT NOT NULL CHECK (department IN ('sales', 'product', 'engineering', 'finance', 'command_center')),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    device_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Business Entities (Extensible: customer, deal, feature, budget, etc.)
CREATE TABLE IF NOT EXISTS public.business_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Decision Events (Immutable append-only event stream from department devices)
CREATE TABLE IF NOT EXISTS public.decision_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    department TEXT NOT NULL CHECK (department IN ('sales', 'product', 'engineering', 'finance', 'command_center')),
    event_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Dependencies (Dynamic business relationships graph)
CREATE TABLE IF NOT EXISTS public.dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL, -- 'requires', 'consumes', 'constrained_by', 'generates', 'affects'
    strength NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (strength >= 0.0 AND strength <= 1.0),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Business State (Evolving organizational snapshots)
CREATE TABLE IF NOT EXISTS public.business_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    state_hash TEXT NOT NULL,
    last_event_id UUID REFERENCES public.decision_events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Decisions (Formal organizational decisions triggered by events)
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposed',
    trigger_event_id UUID NOT NULL REFERENCES public.decision_events(id) ON DELETE CASCADE,
    impact_result_id UUID,
    selected_option_id TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Impact Results (Deterministic calculations from Layer 1 Impact Engine)
CREATE TABLE IF NOT EXISTS public.impact_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    decision_event_id UUID NOT NULL REFERENCES public.decision_events(id) ON DELETE CASCADE,
    affected_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    metric_deltas JSONB NOT NULL DEFAULT '[]'::jsonb,
    cascade_depth INTEGER NOT NULL DEFAULT 0,
    deterministic_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    risk_assessment JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 0.95,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Decision Options (Alternatives generated by Layer 2 Decision Engine)
CREATE TABLE IF NOT EXISTS public.decision_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.decision_events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action_type TEXT NOT NULL,
    projected_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    feasibility_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    policy_alignment JSONB NOT NULL DEFAULT '{}'::jsonb,
    tradeoffs JSONB NOT NULL DEFAULT '{}'::jsonb,
    rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Recommendations (Layer 3 Strategic Reasoning output)
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
    decision_event_id UUID NOT NULL REFERENCES public.decision_events(id) ON DELETE CASCADE,
    top_option_id TEXT NOT NULL,
    perspective TEXT NOT NULL DEFAULT 'balanced',
    groq_reasoning JSONB,
    confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 0.90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- INDEXES FOR LOW-LATENCY REALTIME LOOKUPS
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_decision_events_org_created 
    ON public.decision_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decision_events_dept 
    ON public.decision_events(department);

CREATE INDEX IF NOT EXISTS idx_dependencies_source 
    ON public.dependencies(source_entity_id);

CREATE INDEX IF NOT EXISTS idx_dependencies_target 
    ON public.dependencies(target_entity_id);

CREATE INDEX IF NOT EXISTS idx_business_state_org_time 
    ON public.business_state(organization_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_business_entities_org_dept 
    ON public.business_entities(organization_id, department);

-- =============================================================================
-- REALTIME PUBLICATION CONFIGURATION
-- Enables live Supabase Realtime broadcast on critical operational tables
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.decision_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recommendations;
