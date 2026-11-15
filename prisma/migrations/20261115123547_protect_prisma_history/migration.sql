-- Prisma metadata is not an application API. Supabase's default grants may
-- otherwise expose the history table when Prisma creates it in public.
-- Shadow replay may not have a metadata table, so skip that case explicitly.
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public._prisma_migrations FROM PUBLIC, anon, authenticated;
  END IF;
END;
$$;

