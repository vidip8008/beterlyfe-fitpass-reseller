-- Secure, key-less server paths so checkout/tracking/webhook work on any host
-- (e.g. Vercel) using only the publishable key. Every privileged write below is
-- gated either by a Razorpay HMAC signature check or by safe-by-design logic.

CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_secrets TO service_role;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
-- No policies: unreachable through the Data API. Only SECURITY DEFINER functions read it.

CREATE OR REPLACE FUNCTION public.app_secret(_key text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT value FROM public.app_secrets WHERE key = _key $$;
REVOKE EXECUTE ON FUNCTION public.app_secret(text) FROM PUBLIC, anon, authenticated;

-- 1. Checkout: duplicate-membership guard + order creation with a server-fixed price.
CREATE OR REPLACE FUNCTION public.checkout_start(
  _customer_name text,
  _whatsapp_number text,
  _email text,
  _city text
)
RETURNS TABLE (
  status text,
  order_uuid uuid,
  order_id text,
  payment_status text,
  voucher_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.orders%ROWTYPE;
  v_new public.orders%ROWTYPE;
BEGIN
  IF _whatsapp_number !~ '^91[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'invalid_whatsapp_number';
  END IF;
  IF length(btrim(coalesce(_customer_name,''))) < 2
     OR length(btrim(coalesce(_city,''))) < 2
     OR coalesce(_email,'') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'invalid_customer_details';
  END IF;

  SELECT * INTO v_existing
  FROM public.orders o
  WHERE o.whatsapp_number = _whatsapp_number
    AND o.payment_status = 'paid'
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'existing'::text, v_existing.id, v_existing.order_id,
                        v_existing.payment_status, v_existing.voucher_status;
    RETURN;
  END IF;

  INSERT INTO public.orders (customer_name, whatsapp_number, email, city, amount, currency)
  VALUES (btrim(_customer_name), _whatsapp_number, lower(btrim(_email)), btrim(_city), 800000, 'INR')
  RETURNING * INTO v_new;

  RETURN QUERY SELECT 'created'::text, v_new.id, v_new.order_id,
                      v_new.payment_status, v_new.voucher_status;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.checkout_start(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkout_start(text, text, text, text) TO anon, authenticated, service_role;

-- 2. Attach the Razorpay order id (only once, only while the order is unpaid).
CREATE OR REPLACE FUNCTION public.checkout_attach_razorpay_order(
  _order_uuid uuid,
  _razorpay_order_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF _razorpay_order_id !~ '^order_[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'invalid_razorpay_order_id';
  END IF;

  UPDATE public.orders
  SET razorpay_order_id = _razorpay_order_id
  WHERE id = _order_uuid
    AND razorpay_order_id IS NULL
    AND payment_status = 'pending';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.checkout_attach_razorpay_order(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkout_attach_razorpay_order(uuid, text) TO anon, authenticated, service_role;

-- 3. Mark paid — ONLY with a valid Razorpay payment signature, verified in the database.
CREATE OR REPLACE FUNCTION public.payment_mark_paid(
  _razorpay_order_id text,
  _razorpay_payment_id text,
  _razorpay_signature text
)
RETURNS TABLE (order_id text, whatsapp_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret text;
  v_expected text;
  v_order public.orders%ROWTYPE;
BEGIN
  v_secret := public.app_secret('razorpay_key_secret');
  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'payments_not_configured';
  END IF;

  v_expected := encode(
    extensions.hmac(_razorpay_order_id || '|' || _razorpay_payment_id, v_secret, 'sha256'),
    'hex'
  );
  IF lower(coalesce(_razorpay_signature, '')) <> v_expected THEN
    RAISE EXCEPTION 'invalid_signature';
  END IF;

  SELECT * INTO v_order FROM public.orders o
  WHERE o.razorpay_order_id = _razorpay_order_id
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  UPDATE public.orders
  SET payment_status = 'paid',
      razorpay_payment_id = _razorpay_payment_id,
      razorpay_signature = _razorpay_signature,
      voucher_status = CASE WHEN voucher_status = 'processing' THEN 'processing' ELSE voucher_status END
  WHERE id = v_order.id
    AND payment_status <> 'paid';

  RETURN QUERY SELECT v_order.order_id, v_order.whatsapp_number;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.payment_mark_paid(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_mark_paid(text, text, text) TO anon, authenticated, service_role;

-- 4. Webhook — signature of the raw body verified in the database, idempotent by event id.
CREATE OR REPLACE FUNCTION public.razorpay_webhook_apply(
  _raw_body text,
  _signature text,
  _event_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret text;
  v_expected text;
  v_payload jsonb;
  v_event_type text;
  v_rz_order_id text;
  v_rz_payment_id text;
  v_inserted int;
BEGIN
  v_secret := public.app_secret('razorpay_webhook_secret');
  IF v_secret IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_configured');
  END IF;

  v_expected := encode(extensions.hmac(_raw_body, v_secret, 'sha256'), 'hex');
  IF lower(coalesce(_signature, '')) <> v_expected THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_signature');
  END IF;

  BEGIN
    v_payload := _raw_body::jsonb;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_payload');
  END;

  v_event_type := coalesce(v_payload->>'event', 'unknown');
  v_rz_order_id := coalesce(
    v_payload#>>'{payload,payment,entity,order_id}',
    v_payload#>>'{payload,order,entity,id}'
  );
  v_rz_payment_id := v_payload#>>'{payload,payment,entity,id}';

  INSERT INTO public.webhook_events (event_id, event_type, razorpay_order_id, payload)
  VALUES (
    coalesce(nullif(_event_id, ''),
             v_event_type || ':' || coalesce(v_rz_order_id,'none') || ':' ||
             coalesce(v_rz_payment_id,'none') || ':' || coalesce(v_payload->>'created_at','')),
    v_event_type,
    v_rz_order_id,
    v_payload
  )
  ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  IF v_rz_order_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'ignored', true);
  END IF;

  IF v_event_type IN ('order.paid', 'payment.captured') THEN
    UPDATE public.orders
    SET payment_status = 'paid',
        razorpay_payment_id = coalesce(v_rz_payment_id, razorpay_payment_id),
        voucher_status = CASE WHEN voucher_status = 'processing' THEN 'processing' ELSE voucher_status END
    WHERE razorpay_order_id = v_rz_order_id
      AND payment_status <> 'paid';
  ELSIF v_event_type = 'payment.failed' THEN
    UPDATE public.orders
    SET payment_status = 'failed'
    WHERE razorpay_order_id = v_rz_order_id
      AND payment_status = 'pending';
  ELSIF v_event_type = 'refund.processed' THEN
    UPDATE public.orders
    SET payment_status = 'refunded'
    WHERE razorpay_order_id = v_rz_order_id
      AND payment_status = 'paid';
  END IF;

  RETURN jsonb_build_object('ok', true, 'event', v_event_type);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.razorpay_webhook_apply(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.razorpay_webhook_apply(text, text, text) TO anon, authenticated, service_role;

-- 5. Customer tracking — safe columns only, never admin notes / voucher codes / Razorpay ids.
CREATE OR REPLACE FUNCTION public.track_order_public(
  _order_id text,
  _whatsapp_number text
)
RETURNS TABLE (
  order_id text,
  customer_name text,
  whatsapp_number text,
  city text,
  amount integer,
  currency text,
  payment_status text,
  voucher_status text,
  whatsapp_status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.order_id, o.customer_name, o.whatsapp_number, o.city, o.amount, o.currency,
         o.payment_status, o.voucher_status, o.whatsapp_status, o.created_at, o.updated_at
  FROM public.orders o
  WHERE o.order_id = upper(btrim(_order_id))
    AND o.whatsapp_number = _whatsapp_number
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.track_order_public(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order_public(text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.track_orders_by_whatsapp_public(
  _whatsapp_number text
)
RETURNS TABLE (
  order_id text,
  customer_name text,
  whatsapp_number text,
  city text,
  amount integer,
  currency text,
  payment_status text,
  voucher_status text,
  whatsapp_status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.order_id, o.customer_name, o.whatsapp_number, o.city, o.amount, o.currency,
         o.payment_status, o.voucher_status, o.whatsapp_status, o.created_at, o.updated_at
  FROM public.orders o
  WHERE o.whatsapp_number = _whatsapp_number
  ORDER BY o.created_at DESC
  LIMIT 10;
$$;
REVOKE EXECUTE ON FUNCTION public.track_orders_by_whatsapp_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_orders_by_whatsapp_public(text) TO anon, authenticated, service_role;