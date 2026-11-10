CREATE TABLE public.programme_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme text NOT NULL DEFAULT 'funding_programme',
  payer_name text NOT NULL,
  payer_email text NOT NULL,
  payer_phone text NOT NULL DEFAULT '',
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR',
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT ON public.programme_payments TO authenticated;
GRANT ALL ON public.programme_payments TO service_role;
ALTER TABLE public.programme_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read payments" ON public.programme_payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX programme_payments_created_idx ON public.programme_payments (created_at DESC);