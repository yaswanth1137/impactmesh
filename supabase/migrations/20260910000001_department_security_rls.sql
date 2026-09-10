-- =============================================================================
-- IMPACTMESH - Row Level Security (RLS) & Departmental Authorization Policies
-- Enforces strict separation between:
-- 1. CEO (Full access to all departments and company-wide analytics)
-- 2. Operations Head (Access strictly limited to Operations/Engineering data)
-- =============================================================================

-- 1. Enable Row Level Security on core operational tables
ALTER TABLE public.decision_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR USER AUTHORIZATION LOOKUP
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND (users.role = 'ceo' OR users.department = 'command_center')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_auth_department()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT department FROM public.users
  WHERE users.id = auth.uid()
  LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- 1. DECISION EVENTS POLICIES
-- CEO: Full read access to events across all departments
-- Operations Head: Can only read and emit Operations/Engineering events
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "ceo_read_all_events" ON public.decision_events;
CREATE POLICY "ceo_read_all_events" ON public.decision_events
    FOR SELECT
    USING (public.is_ceo());

DROP POLICY IF EXISTS "operations_read_own_events" ON public.decision_events;
CREATE POLICY "operations_read_own_events" ON public.decision_events
    FOR SELECT
    USING (
      department IN ('operations', 'engineering')
      AND public.get_auth_department() IN ('operations', 'engineering')
    );

DROP POLICY IF EXISTS "operations_insert_own_events" ON public.decision_events;
CREATE POLICY "operations_insert_own_events" ON public.decision_events
    FOR INSERT
    WITH CHECK (
      department IN ('operations', 'engineering')
      AND public.get_auth_department() IN ('operations', 'engineering')
    );

-- -----------------------------------------------------------------------------
-- 2. BUSINESS ENTITIES POLICIES
-- CEO: Can inspect entities across Sales, Finance, Product, Operations
-- Operations Head: Can only inspect & update Operations entities
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "ceo_read_all_entities" ON public.business_entities;
CREATE POLICY "ceo_read_all_entities" ON public.business_entities
    FOR SELECT
    USING (public.is_ceo());

DROP POLICY IF EXISTS "operations_read_own_entities" ON public.business_entities;
CREATE POLICY "operations_read_own_entities" ON public.business_entities
    FOR SELECT
    USING (
      department IN ('operations', 'engineering')
      AND (public.get_auth_department() IN ('operations', 'engineering') OR public.is_ceo())
    );

DROP POLICY IF EXISTS "operations_update_own_entities" ON public.business_entities;
CREATE POLICY "operations_update_own_entities" ON public.business_entities
    FOR UPDATE
    USING (
      department IN ('operations', 'engineering')
      AND public.get_auth_department() IN ('operations', 'engineering')
    )
    WITH CHECK (
      department IN ('operations', 'engineering')
      AND public.get_auth_department() IN ('operations', 'engineering')
    );

-- -----------------------------------------------------------------------------
-- 3. CEO-ONLY ANALYTICS POLICIES (business_state, impact_results, recommendations)
-- Operations user is strictly blocked from reading CEO analytics
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "ceo_only_business_state" ON public.business_state;
CREATE POLICY "ceo_only_business_state" ON public.business_state
    FOR ALL
    USING (public.is_ceo());

DROP POLICY IF EXISTS "ceo_only_impact_results" ON public.impact_results;
CREATE POLICY "ceo_only_impact_results" ON public.impact_results
    FOR ALL
    USING (public.is_ceo());

DROP POLICY IF EXISTS "ceo_only_recommendations" ON public.recommendations;
CREATE POLICY "ceo_only_recommendations" ON public.recommendations
    FOR ALL
    USING (public.is_ceo());
