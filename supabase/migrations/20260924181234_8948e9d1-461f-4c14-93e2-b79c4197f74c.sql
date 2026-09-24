DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    EXECUTE 'REVOKE ALL ON public.app_secrets FROM sandbox_exec';
  END IF;
END
$$;