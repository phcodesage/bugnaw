CREATE OR REPLACE FUNCTION public.live_workspace_id() RETURNS uuid
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT '00000000-0000-0000-0000-000000000001'::uuid $$;
CREATE OR REPLACE FUNCTION public.demo_workspace_id() RETURNS uuid
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT '00000000-0000-0000-0000-000000000002'::uuid $$;

ALTER TABLE public.user_roles ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();
UPDATE public.user_roles SET workspace_id = public.demo_workspace_id() WHERE role = 'demo'::public.app_role;

CREATE OR REPLACE FUNCTION public.current_workspace_id(_user_id uuid DEFAULT auth.uid()) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT workspace_id FROM public.user_roles WHERE user_id = _user_id ORDER BY created_at LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.current_workspace_id(uuid) TO authenticated, service_role;

ALTER TABLE public.customers ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();
ALTER TABLE public.bookings ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();
ALTER TABLE public.availability_blocks ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();
ALTER TABLE public.conversations ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();
ALTER TABLE public.conversation_messages ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();
ALTER TABLE public.outbox_messages ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();
ALTER TABLE public.waitlist ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();
ALTER TABLE public.shop_settings ADD COLUMN workspace_id uuid NOT NULL DEFAULT public.live_workspace_id();

ALTER TABLE public.bookings DROP CONSTRAINT bookings_no_overlap;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap EXCLUDE USING gist (workspace_id WITH =, slot WITH &&) WHERE (status <> 'cancelled');
ALTER TABLE public.shop_settings DROP CONSTRAINT shop_settings_single;
INSERT INTO public.shop_settings (id, workspace_id) VALUES (2, public.demo_workspace_id()) ON CONFLICT (id) DO UPDATE SET workspace_id = EXCLUDED.workspace_id;
CREATE UNIQUE INDEX shop_settings_workspace_unique ON public.shop_settings(workspace_id);
CREATE INDEX customers_workspace_idx ON public.customers(workspace_id);
CREATE INDEX bookings_workspace_date_idx ON public.bookings(workspace_id, service_date);
CREATE INDEX conversations_workspace_idx ON public.conversations(workspace_id, last_message_at DESC);
CREATE INDEX conversation_messages_workspace_idx ON public.conversation_messages(workspace_id, conversation_id, created_at);
CREATE INDEX outbox_workspace_idx ON public.outbox_messages(workspace_id, sim_time DESC);
CREATE INDEX waitlist_workspace_idx ON public.waitlist(workspace_id, created_at);
CREATE INDEX blocks_workspace_idx ON public.availability_blocks(workspace_id, block_date);

DROP POLICY IF EXISTS "owner reads customers" ON public.customers;
DROP POLICY IF EXISTS "demo reads customers" ON public.customers;
CREATE POLICY "workspace members manage customers" ON public.customers FOR ALL TO authenticated
USING (workspace_id = public.current_workspace_id()) WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "owner manages bookings" ON public.bookings;
DROP POLICY IF EXISTS "demo reads bookings" ON public.bookings;
CREATE POLICY "workspace members manage bookings" ON public.bookings FOR ALL TO authenticated
USING (workspace_id = public.current_workspace_id()) WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "owner manages blocks" ON public.availability_blocks;
CREATE POLICY "workspace members manage blocks" ON public.availability_blocks FOR ALL TO authenticated
USING (workspace_id = public.current_workspace_id()) WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "owner manages settings" ON public.shop_settings;
CREATE POLICY "workspace members manage settings" ON public.shop_settings FOR ALL TO authenticated
USING (workspace_id = public.current_workspace_id()) WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "Owner manages conversations" ON public.conversations;
DROP POLICY IF EXISTS "demo reads conversations" ON public.conversations;
CREATE POLICY "workspace members manage conversations" ON public.conversations FOR ALL TO authenticated
USING (workspace_id = public.current_workspace_id()) WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "Owner manages conversation messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "demo reads conversation messages" ON public.conversation_messages;
CREATE POLICY "workspace members manage conversation messages" ON public.conversation_messages FOR ALL TO authenticated
USING (workspace_id = public.current_workspace_id()) WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "Owner manages outbox" ON public.outbox_messages;
DROP POLICY IF EXISTS "demo reads outbox" ON public.outbox_messages;
CREATE POLICY "workspace members manage outbox" ON public.outbox_messages FOR ALL TO authenticated
USING (workspace_id = public.current_workspace_id()) WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "Owner manages waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "demo reads waitlist" ON public.waitlist;
CREATE POLICY "workspace members manage waitlist" ON public.waitlist FOR ALL TO authenticated
USING (workspace_id = public.current_workspace_id()) WITH CHECK (workspace_id = public.current_workspace_id());

CREATE OR REPLACE FUNCTION public.seed_demo_workspace() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ws constant uuid := public.demo_workspace_id();
  z record; s record; c uuid; b uuid; cv uuid; d date; i int; start_at time;
BEGIN
  UPDATE public.shop_settings SET work_start='08:00', work_end='17:00', lunch_start='12:00', lunch_end='13:00', work_days='{1,2,3,4,5,6}', max_minutes_per_day=300, deposit_php=200, auto_reply=false, sim_offset_minutes=0, automations='{}', peak_mode=false WHERE workspace_id=ws;
  DELETE FROM public.outbox_messages WHERE workspace_id=ws;
  DELETE FROM public.conversation_messages WHERE workspace_id=ws;
  DELETE FROM public.conversations WHERE workspace_id=ws;
  DELETE FROM public.waitlist WHERE workspace_id=ws;
  DELETE FROM public.bookings WHERE workspace_id=ws;
  DELETE FROM public.customers WHERE workspace_id=ws;
  DELETE FROM public.availability_blocks WHERE workspace_id=ws;

  FOR i IN -4..8 LOOP
    CONTINUE WHEN extract(dow from current_date + i) = 0;
    d := current_date + i;
    SELECT * INTO z FROM public.zones ORDER BY sort_order OFFSET (abs(i) % 5) LIMIT 1;
    SELECT * INTO s FROM public.services WHERE active ORDER BY sort_order OFFSET (abs(i + 1) % 4) LIMIT 1;
    start_at := CASE WHEN i % 2 = 0 THEN '08:00'::time ELSE '13:00'::time END;
    INSERT INTO public.customers(workspace_id,full_name,mobile,address,landmark,access_notes,zone_id)
    VALUES(ws, (ARRAY['Grace Alcoseba','Ramil Ouano','Liza Pepito','Noel Cabatingan','Kristine Dy'])[1+(abs(i)%5)], '09171234'||lpad((50+i+4)::text,3,'0'), 'Demo home, '||z.name, 'Near the barangay hall', 'Call at the gate', z.id) RETURNING id INTO c;
    INSERT INTO public.bookings(workspace_id,customer_id,zone_id,service_date,start_time,end_time,duration_minutes,items,total_php,adult_present,status,deposit_reference)
    VALUES(ws,c,z.id,d,start_at,start_at+(s.duration_minutes||' minutes')::interval,s.duration_minutes,jsonb_build_array(jsonb_build_object('service_id',s.id,'slug',s.slug,'name',s.name,'quantity',1,'unit_price',s.price_php,'unit_minutes',s.duration_minutes)),s.price_php,true,CASE WHEN i<0 THEN 'done' ELSE 'confirmed' END,'DEMO'||i) RETURNING id INTO b;
  END LOOP;

  INSERT INTO public.conversations(workspace_id,customer_name,status,language,extracted,last_message_at,created_at)
  VALUES(ws,'Mae Lumapas','new','taglish','{"service_slug":"split-clean","units":2,"zone_slug":"cebu-north","barangay":"Talamban","language":"taglish","confidence":{"service":0.95,"units":0.95,"zone":0.9,"when":0.6},"missing":[]}',now()-interval '18 minutes',now()-interval '18 minutes') RETURNING id INTO cv;
  INSERT INTO public.conversation_messages(workspace_id,conversation_id,direction,sent_by,body,created_at)
  VALUES(ws,cv,'in','customer','Hi po, pwede ba ugma hapon? 2 ka aircon split type sa Talamban.',now()-interval '18 minutes');

  INSERT INTO public.conversations(workspace_id,customer_name,status,language,extracted,last_message_at,created_at)
  VALUES(ws,'Carlo Tan','replied','bisaya','{"service_slug":"window-clean","units":1,"zone_slug":"mandaue","barangay":"Tipolo","language":"bisaya","confidence":{"service":0.95,"units":0.9,"zone":0.95,"when":0.7},"missing":[]}',now()-interval '3 hours',now()-interval '3 hours') RETURNING id INTO cv;
  INSERT INTO public.conversation_messages(workspace_id,conversation_id,direction,sent_by,body,created_at) VALUES
  (ws,cv,'in','customer','Boss available ka sat? window type lang isa, Mandaue ko',now()-interval '3 hours'),
  (ws,cv,'out','auto','Hello boss! Pwede ra. Window-type cleaning is ₱600. Pili lang sa open slots sa personal booking link.',now()-interval '2 hours 59 minutes');

  INSERT INTO public.waitlist(workspace_id,full_name,mobile,zone_id,service_slug,units,created_at)
  SELECT ws,'Cherry Mae Lim','09171234501',id,'split-clean',2,now()-interval '20 hours' FROM public.zones WHERE slug='mandaue';
  INSERT INTO public.waitlist(workspace_id,full_name,mobile,zone_id,service_slug,units,created_at)
  SELECT ws,'Dennis Abellana','09281234502',id,'split-clean',1,now()-interval '12 hours' FROM public.zones WHERE slug='cebu-north';
END $$;

CREATE OR REPLACE FUNCTION public.reset_my_demo_workspace() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'demo'::public.app_role) THEN RAISE EXCEPTION 'Demo account required'; END IF;
  PERFORM public.seed_demo_workspace();
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.seed_demo_workspace() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_workspace() TO service_role;
REVOKE ALL ON FUNCTION public.reset_my_demo_workspace() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_my_demo_workspace() TO authenticated, service_role;
SELECT public.seed_demo_workspace();