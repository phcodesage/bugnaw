ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS manage_token text NOT NULL DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,16),
  ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS at_risk boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_forfeited boolean NOT NULL DEFAULT false;

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS sim_offset_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS automations jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.outbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  channel text NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms','messenger','email')),
  recipient text NOT NULL,
  recipient_name text NOT NULL DEFAULT '',
  body text NOT NULL,
  status text NOT NULL DEFAULT 'simulated' CHECK (status IN ('sent','simulated','failed','skipped')),
  action_url text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  waitlist_id uuid,
  dedupe_key text UNIQUE,
  sim_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.outbox_messages(sim_time DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbox_messages TO authenticated;
GRANT ALL ON public.outbox_messages TO service_role;
ALTER TABLE public.outbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages outbox" ON public.outbox_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  mobile text NOT NULL,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  service_slug text,
  units integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','offered','booked','removed')),
  token text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,12),
  offered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages waitlist" ON public.waitlist FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

INSERT INTO public.waitlist (full_name, mobile, zone_id, service_slug, units, created_at)
SELECT v.n, v.m, z.id, v.s, v.u, now() - (v.h || ' hours')::interval
FROM (VALUES
  ('Cherry Mae Lim','09171234501','mandaue','split-clean',2,30),
  ('Dennis Abellana','09281234502','cebu-north','split-clean',1,20),
  ('Rhea Mendoza','09391234503','lapu-lapu','window-clean',1,12),
  ('Vince Go','09171234504','cebu-south','checkup',1,6)
) AS v(n,m,zs,s,u,h)
JOIN public.zones z ON z.slug = v.zs;