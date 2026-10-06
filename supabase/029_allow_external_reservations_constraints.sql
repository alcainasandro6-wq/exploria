-- Some databases carry extra CHECK constraints on reservations that require a
-- customer (e.g. "reservations_customer_or_guest": customer_id OR guest data).
-- Imported TuriTop bookings have no Exploria customer, so every CHECK that
-- mentions customer_id is rewritten as:   external_source IS NOT NULL OR (<original rule>)
-- Ordinary bookings keep exactly the same rule as before. Safe to re-run.

DO $$
DECLARE
  c RECORD;
  expr TEXT;
BEGIN
  FOR c IN
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%customer_id%'
      AND pg_get_constraintdef(oid) NOT ILIKE '%external_source%'
  LOOP
    expr := regexp_replace(c.def, '^CHECK ', '');
    expr := regexp_replace(expr, ' NOT VALID$', '');
    EXECUTE format('ALTER TABLE public.reservations DROP CONSTRAINT %I', c.conname);
    EXECUTE format(
      'ALTER TABLE public.reservations ADD CONSTRAINT %I CHECK (external_source IS NOT NULL OR %s)',
      c.conname, expr
    );
    RAISE NOTICE 'Relaxed constraint % (was %)', c.conname, c.def;
  END LOOP;
END $$;
