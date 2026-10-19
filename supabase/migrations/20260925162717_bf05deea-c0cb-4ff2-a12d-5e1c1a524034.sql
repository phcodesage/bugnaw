DO $do$
DECLARE def text;
BEGIN
  def := pg_get_functiondef('public.seed_demo_workspace()'::regprocedure);
  def := replace(def, 'streets[(zi - 1) * 2 + 1 + (bcount % 2)]', '(((bcount * 37) % 190) + 3)::text || regexp_replace(streets[(zi - 1) * 2 + 1 + (bcount % 2)], ''^\d+'', '''')');
  EXECUTE def;
END $do$;
REVOKE EXECUTE ON FUNCTION public.seed_demo_workspace() FROM PUBLIC, anon, authenticated;
SELECT public.seed_demo_workspace();