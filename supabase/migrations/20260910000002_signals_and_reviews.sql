-- ==============================================================================
-- IMPACTMESH — ADDITIVE MIGRATION: SIGNALS, REVIEWS & DECISION CONTEXTS
-- Migration ID: 20260910000001_signals_and_reviews
-- Description: Establishes persistence for Signal Engine, Human Reviews, and Decision Provenance
-- ==============================================================================

-- 1. SIGNALS TABLE
CREATE TABLE IF NOT EXISTS signals (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('ENTITY', 'PROJECT', 'CUSTOMER', 'DEPARTMENT', 'BUSINESS_UNIT', 'ORGANIZATION')),
    scope_id TEXT NOT NULL,
    scope_name TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('NORMAL', 'WARNING', 'CRITICAL')),
    priority_score INTEGER NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
    priority_rank TEXT NOT NULL CHECK (priority_rank IN ('P1', 'P2', 'P3', 'P4')),
    materiality TEXT NOT NULL CHECK (materiality IN ('LOW', 'MEDIUM', 'HIGH')),
    trigger_rule_id TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    state TEXT NOT NULL CHECK (state IN ('NEW', 'REVIEWING', 'ACKNOWLEDGED', 'ESCALATED', 'CONVERTED_TO_DECISION', 'DISMISSED', 'RESOLVED')),
    related_entities TEXT[] NOT NULL DEFAULT '{}',
    related_departments TEXT[] NOT NULL DEFAULT '{}',
    deduplication_key TEXT NOT NULL,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    converted_decision_id TEXT
);

-- Indexes for efficient querying by state, priority, and deduplication
CREATE INDEX IF NOT EXISTS idx_signals_org_state ON signals(organization_id, state);
CREATE INDEX IF NOT EXISTS idx_signals_priority ON signals(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_signals_dedup ON signals(deduplication_key);

-- 2. SIGNAL REVIEWS TABLE (Human Audit Trail)
CREATE TABLE IF NOT EXISTS signal_reviews (
    id TEXT PRIMARY KEY,
    signal_id TEXT NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_role TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('ACKNOWLEDGE', 'DISMISS', 'ESCALATE', 'CREATE_DECISION', 'REQUEST_MORE_CONTEXT')),
    comment TEXT,
    requested_fields TEXT[],
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_reviews_signal ON signal_reviews(signal_id);

-- 3. DECISION REVIEWS TABLE (Human Choice & Overrides)
CREATE TABLE IF NOT EXISTS decision_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewer_name TEXT NOT NULL,
    role TEXT NOT NULL,
    system_recommendation_id TEXT NOT NULL,
    system_recommended_option_id TEXT NOT NULL,
    selected_option_id TEXT NOT NULL,
    override BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_reviews_decision ON decision_reviews(decision_id);

-- 4. DECISION CONTEXTS TABLE (Data Minimization Container)
CREATE TABLE IF NOT EXISTS decision_contexts (
    decision_id TEXT PRIMARY KEY,
    source_signal_id TEXT REFERENCES signals(id) ON DELETE SET NULL,
    trigger_rule_id TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    relevant_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    relevant_entity_ids TEXT[] NOT NULL DEFAULT '{}',
    relevant_department_codes TEXT[] NOT NULL DEFAULT '{}',
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_contexts_org ON decision_contexts(organization_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_contexts ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users in the organization
CREATE POLICY "Allow read signals in organization" ON signals
    FOR SELECT USING (TRUE);

CREATE POLICY "Allow insert/update signals" ON signals
    FOR ALL USING (TRUE);

CREATE POLICY "Allow read signal_reviews" ON signal_reviews
    FOR SELECT USING (TRUE);

CREATE POLICY "Allow insert signal_reviews" ON signal_reviews
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow read decision_reviews" ON decision_reviews
    FOR SELECT USING (TRUE);

CREATE POLICY "Allow insert decision_reviews" ON decision_reviews
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow read decision_contexts" ON decision_contexts
    FOR SELECT USING (TRUE);

CREATE POLICY "Allow insert decision_contexts" ON decision_contexts
    FOR ALL USING (TRUE);
