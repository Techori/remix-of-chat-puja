ALTER TABLE public.programme_payments
  ADD COLUMN provider text NOT NULL DEFAULT 'razorpay' CHECK (provider IN ('razorpay','zoho')),
  ADD COLUMN provider_reference text UNIQUE,
  ADD COLUMN provider_payment_id text;
UPDATE public.programme_payments SET provider_reference = razorpay_order_id, provider_payment_id = razorpay_payment_id WHERE provider_reference IS NULL;
ALTER TABLE public.programme_payments ALTER COLUMN razorpay_order_id DROP NOT NULL;
COMMENT ON COLUMN public.programme_payments.razorpay_order_id IS 'DEPRECATED: replaced by provider_reference';
COMMENT ON COLUMN public.programme_payments.razorpay_payment_id IS 'DEPRECATED: replaced by provider_payment_id';

CREATE TABLE public.payment_provider_tokens (
  provider text PRIMARY KEY,
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL
);
GRANT ALL ON public.payment_provider_tokens TO service_role;
ALTER TABLE public.payment_provider_tokens ENABLE ROW LEVEL SECURITY;