CREATE OR REPLACE FUNCTION public.live_workspace_id() RETURNS uuid
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = public AS $$ SELECT '00000000-0000-0000-0000-000000000001'::uuid $$;
CREATE OR REPLACE FUNCTION public.demo_workspace_id() RETURNS uuid
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = public AS $$ SELECT '00000000-0000-0000-0000-000000000002'::uuid $$;

CREATE OR REPLACE FUNCTION public.current_workspace_id(_user_id uuid DEFAULT auth.uid()) RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT workspace_id FROM public.user_roles WHERE user_id = _user_id ORDER BY created_at LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.current_workspace_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_workspace_id(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reset_my_demo_workspace() RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  ws constant uuid := public.demo_workspace_id();
  z record; s record; c uuid; cv uuid; d date; i int; start_at time;
BEGIN
  IF NOT public.has_role(auth.uid(),'demo'::public.app_role) OR public.current_workspace_id() <> ws THEN RAISE EXCEPTION 'Demo account required'; END IF;
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
    VALUES(ws,(ARRAY['Grace Alcoseba','Ramil Ouano','Liza Pepito','Noel Cabatingan','Kristine Dy'])[1+(abs(i)%5)],'09171234'||lpad((50+i+4)::text,3,'0'),'Demo home, '||z.name,'Near the barangay hall','Call at the gate',z.id) RETURNING id INTO c;
    INSERT INTO public.bookings(workspace_id,customer_id,zone_id,service_date,start_time,end_time,duration_minutes,items,total_php,adult_present,status,deposit_reference)
    VALUES(ws,c,z.id,d,start_at,start_at+(s.duration_minutes||' minutes')::interval,s.duration_minutes,jsonb_build_array(jsonb_build_object('service_id',s.id,'slug',s.slug,'name',s.name,'quantity',1,'unit_price',s.price_php,'unit_minutes',s.duration_minutes)),s.price_php,true,CASE WHEN i<0 THEN 'done' ELSE 'confirmed' END,'DEMO'||i);
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
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reset_my_demo_workspace() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_my_demo_workspace() TO authenticated, service_role;