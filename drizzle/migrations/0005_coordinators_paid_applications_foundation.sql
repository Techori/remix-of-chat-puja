CREATE TABLE public.coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  referral_code text NOT NULL UNIQUE CHECK (referral_code ~ '^[A-Z0-9-]{4,24}$'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordinators TO authenticated;
GRANT ALL ON public.coordinators TO service_role;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coordinators" ON public.coordinators FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Public lookup returns only the display name for an exact active code.
CREATE OR REPLACE FUNCTION public.coordinator_name_for_code(_code text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT full_name FROM public.coordinators WHERE referral_code = upper(trim(_code)) AND active LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.coordinator_name_for_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.coordinator_name_for_code(text) TO anon, authenticated, service_role;

CREATE TABLE public.programme_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code text NOT NULL UNIQUE,
  programme text NOT NULL CHECK (programme IN ('funding_programme','prototype_funding')),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  coordinator_code text,
  coordinator_id uuid REFERENCES public.coordinators(id) ON DELETE SET NULL,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  submission_status text NOT NULL DEFAULT 'lead' CHECK (submission_status IN ('lead','submitted')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','approved','rejected')),
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);
GRANT SELECT, UPDATE ON public.programme_applications TO authenticated;
GRANT ALL ON public.programme_applications TO service_role;
ALTER TABLE public.programme_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read programme applications" ON public.programme_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins review programme applications" ON public.programme_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
REVOKE UPDATE ON public.programme_applications FROM authenticated;
GRANT UPDATE (status, admin_notes) ON public.programme_applications TO authenticated;
CREATE INDEX programme_applications_created_idx ON public.programme_applications (created_at DESC);
CREATE INDEX programme_applications_coordinator_idx ON public.programme_applications (coordinator_id);

CREATE TABLE public.foundation_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('scholarship','school_fee','volunteer','partner','donation_pledge','assistance','contact')),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  coordinator_code text,
  coordinator_id uuid REFERENCES public.coordinators(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','approved','rejected')),
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.foundation_submissions TO authenticated;
GRANT UPDATE (status, admin_notes) ON public.foundation_submissions TO authenticated;
GRANT ALL ON public.foundation_submissions TO service_role;
ALTER TABLE public.foundation_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read foundation submissions" ON public.foundation_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins review foundation submissions" ON public.foundation_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX foundation_submissions_created_idx ON public.foundation_submissions (created_at DESC);

ALTER TABLE public.programme_payments
  ADD COLUMN application_id uuid,
  ADD COLUMN application_kind text CHECK (application_kind IN ('programme','young_innovators'));
CREATE INDEX programme_payments_application_idx ON public.programme_payments (application_id);

ALTER TABLE public.young_innovators_registrations
  ADD COLUMN submission_status text NOT NULL DEFAULT 'submitted' CHECK (submission_status IN ('lead','submitted')),
  ADD COLUMN submitted_at timestamptz,
  ADD COLUMN coordinator_code text,
  ADD COLUMN coordinator_id uuid REFERENCES public.coordinators(id) ON DELETE SET NULL;

ALTER TABLE public.registration_applications
  ADD COLUMN coordinator_code text,
  ADD COLUMN coordinator_id uuid REFERENCES public.coordinators(id) ON DELETE SET NULL;
ALTER TABLE public.contact_submissions
  ADD COLUMN coordinator_code text,
  ADD COLUMN coordinator_id uuid REFERENCES public.coordinators(id) ON DELETE SET NULL;

-- Referral counts per coordinator; runs with the caller's rights so admin RLS applies.
CREATE OR REPLACE FUNCTION public.coordinator_referral_stats()
RETURNS TABLE (coordinator_id uuid, submitted bigint, leads bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT c, count(*) FILTER (WHERE s = 'submitted'), count(*) FILTER (WHERE s = 'lead')
  FROM (
    SELECT coordinator_id AS c, submission_status AS s FROM public.programme_applications WHERE coordinator_id IS NOT NULL
    UNION ALL SELECT coordinator_id, submission_status FROM public.young_innovators_registrations WHERE coordinator_id IS NOT NULL
    UNION ALL SELECT coordinator_id, 'submitted' FROM public.registration_applications WHERE coordinator_id IS NOT NULL
    UNION ALL SELECT coordinator_id, 'submitted' FROM public.contact_submissions WHERE coordinator_id IS NOT NULL
    UNION ALL SELECT coordinator_id, 'submitted' FROM public.foundation_submissions WHERE coordinator_id IS NOT NULL
  ) t GROUP BY c
$$;
REVOKE ALL ON FUNCTION public.coordinator_referral_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.coordinator_referral_stats() TO authenticated, service_role;