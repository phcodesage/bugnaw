ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS demo_seeded_on date;

CREATE OR REPLACE FUNCTION public.seed_demo_workspace()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' SET timezone TO 'Asia/Manila'
AS $fn$
DECLARE
  ws constant uuid := public.demo_workspace_id();
  today constant date := (now() AT TIME ZONE 'Asia/Manila')::date;
  names text[] := ARRAY['Grace Alcoseba','Ramil Ouano','Liza Pepito','Noel Cabatingan','Kristine Dy','Arnel Suico','Mae Lumapas','Joel Tan','Cherry Lim','Dennis Abellana','Rhea Gonzaga','Paolo Sy','Jenny Rosales','Mark Villamor','Ivy Cañete','Ronald Uy','Aileen Bacus','Jerome Lao','Marites Go','Kevin Ybañez'];
  zslugs text[] := ARRAY['mandaue','cebu-north','cebu-south','lapu-lapu','consolacion'];
  sslugs text[] := ARRAY['split-clean','window-clean','split-clean','checkup','split-clean','freon'];
  msgs text[] := ARRAY[
    'Boss pwede ugma buntag? 2 ka split type, Mandaue ko',
    'Hi po, available ba kayo this Saturday? 1 window type sa Banilad',
    'Hello, how much for cleaning 3 split units? We are in Lapu-Lapu.',
    'Sir pa linis unta ko og aircon, baho na kaayo. Taga Consolacion mi',
    'Pwede po ba check-up? Hindi na lumalamig yung aircon namin sa Talamban',
    'Good day! Need freon recharge for our split type, Cebu City South area.'];
  langs text[] := ARRAY['bisaya','taglish','english','bisaya','taglish','english'];
  replies text[] := ARRAY[
    'Hello boss! Pwede ra. Split-type cleaning ₱800/unit. Pili lang sa open slots sa imong booking link.',
    'Hi po! Available po si Jun. Window-type ₱600. Pili lang po kayo ng slot sa link.',
    'Hi! Cleaning is ₱800 per split unit. Here are Jun''s open slots — tap your link to book.',
    'Salamat sa message! Split-type cleaning ₱800/unit. Ania ang mga bakante nga oras.',
    'Hi po! Check-up ₱500 flat. Eto po ang open slots ni Jun sa area niyo.',
    'Hello! Freon recharge is ₱1,800 per unit. Here are the available slots near you.'];
  streets text[] := ARRAY['12 A. Soriano Ave, Centro','45 M.C. Briones St, Tipolo','8 Gov. M. Cuenco Ave, Banilad','21 Salinas Dr, Lahug','17 N. Bacalso Ave, Mambaling','6 Tres de Abril St, Labangon','90 M.L. Quezon Hwy, Pusok','14 Basak-Marigondon Rd, Basak','27 Pitogo Rd, Poblacion Oriental','5 Casili Rd, Lugo'];
  z record; s record; c uuid; b uuid; cv uuid; d date; i int; k int; n int; qty int; t time; zi int; st text;
  bcount int := 0;
BEGIN
  UPDATE public.shop_settings SET demo_seeded_on=today, work_start='08:00', work_end='17:00', lunch_start='12:00', lunch_end='13:00', work_days='{1,2,3,4,5,6}', max_minutes_per_day=300, deposit_php=200, auto_reply=true, sim_offset_minutes=0, automations='{}', peak_mode=false WHERE workspace_id=ws;
  DELETE FROM public.outbox_messages WHERE workspace_id=ws;
  DELETE FROM public.conversation_messages WHERE workspace_id=ws;
  DELETE FROM public.conversations WHERE workspace_id=ws;
  DELETE FROM public.waitlist WHERE workspace_id=ws;
  DELETE FROM public.bookings WHERE workspace_id=ws;
  DELETE FROM public.customers WHERE workspace_id=ws;
  DELETE FROM public.availability_blocks WHERE workspace_id=ws;

  FOR i IN -27..7 LOOP
    d := today + i;
    CONTINUE WHEN i <> 0 AND extract(dow FROM d) = 0;
    IF i = 0 THEN n := 4; ELSIF i > 0 THEN n := 1; ELSIF abs(i) % 3 = 0 THEN n := 2; ELSE n := 1; END IF;
    t := '08:00';
    FOR k IN 1..n LOOP
      zi := CASE WHEN i = 0 THEN (CASE WHEN k <= 3 THEN 1 ELSE 2 END) ELSE 1 + (abs(i) % 5) END;
      SELECT * INTO z FROM public.zones WHERE slug = zslugs[zi];
      SELECT * INTO s FROM public.services WHERE slug = CASE WHEN i = 0 AND k = 3 THEN 'window-clean' ELSE sslugs[1 + ((abs(i) + k) % 6)] END;
      qty := CASE WHEN s.slug IN ('checkup') THEN 1 WHEN s.per_unit THEN 1 + ((abs(i) + k) % 2) ELSE 1 END;
      IF i = 0 THEN qty := 1; END IF;
      IF i = 0 AND k = 4 THEN t := '13:00'; END IF;
      bcount := bcount + 1;
      INSERT INTO public.customers(workspace_id,full_name,mobile,address,landmark,access_notes,zone_id)
      VALUES (ws, names[1 + (bcount % 20)], '0917' || lpad((2345000 + bcount)::text, 7, '0'), streets[(zi - 1) * 2 + 1 + (bcount % 2)] || ', ' || z.name, 'Near the barangay hall', 'Call at the gate', z.id) RETURNING id INTO c;
      st := CASE WHEN i < 0 THEN 'done' ELSE 'confirmed' END;
      INSERT INTO public.bookings(workspace_id,customer_id,zone_id,service_date,start_time,end_time,duration_minutes,items,total_php,deposit_php,adult_present,status,deposit_reference,customer_confirmed_at,notes,created_at)
      VALUES (ws, c, z.id, d, t, t + ((s.duration_minutes * qty) || ' minutes')::interval, s.duration_minutes * qty,
        jsonb_build_array(jsonb_build_object('service_id',s.id,'slug',s.slug,'name',s.name,'quantity',qty,'unit_price',s.price_php,'unit_minutes',s.duration_minutes)),
        s.price_php * qty, 200, true, st, 'GC' || lpad(bcount::text, 6, '0'),
        CASE WHEN i <= 0 THEN (d - 1) + time '18:20' ELSE NULL END,
        CASE WHEN bcount = 5 THEN 'Rescheduled by customer via link' WHEN bcount = 9 THEN 'Moved after rainy-day cancellation' ELSE '' END,
        (d - 3) + time '10:00')
      RETURNING id INTO b;
      IF i <= 0 THEN
        INSERT INTO public.outbox_messages(workspace_id,kind,channel,recipient,recipient_name,body,status,booking_id,sim_time,created_at) VALUES
          (ws,'confirmation','sms','0917'||lpad((2345000+bcount)::text,7,'0'),names[1+(bcount%20)],'Salamat! Booked na ka. ₱200 deposit received — deducted from your final bill. Kita-kits!','simulated',b,(d-3)+time '10:01',(d-3)+time '10:01'),
          (ws,'reminder','sms','0917'||lpad((2345000+bcount)::text,7,'0'),names[1+(bcount%20)],'Reminder: Jun arrives tomorrow at '||to_char(t,'FMHH12:MI AM')||'. Tap Yes if someone 18+ will be home.','simulated',b,(d-1)+time '18:00',(d-1)+time '18:00');
      END IF;
      IF i < 0 AND bcount IN (3, 11, 19) THEN
        INSERT INTO public.outbox_messages(workspace_id,kind,channel,recipient,recipient_name,body,status,booking_id,sim_time,created_at)
        VALUES (ws,'nudge','sms','0917'||lpad((2345000+bcount)::text,7,'0'),names[1+(bcount%20)],'Good morning! You mentioned you might be away — is someone home for Jun today? Tap to confirm or reschedule.','simulated',b,d+time '08:00',d+time '08:00');
        UPDATE public.bookings SET customer_confirmed_at = d + time '08:25' WHERE id = b;
      END IF;
      IF bcount IN (5, 9) THEN
        INSERT INTO public.outbox_messages(workspace_id,kind,channel,recipient,recipient_name,body,status,booking_id,sim_time,created_at)
        VALUES (ws,'reschedule','sms','0917'||lpad((2345000+bcount)::text,7,'0'),names[1+(bcount%20)],'Your booking has been moved to '||to_char(d,'Dy Mon FMDD')||' at '||to_char(t,'FMHH12:MI AM')||'. Salamat!','simulated',b,(d-2)+time '15:00',(d-2)+time '15:00');
      END IF;
      IF bcount = 9 THEN
        INSERT INTO public.outbox_messages(workspace_id,kind,channel,recipient,recipient_name,body,status,booking_id,sim_time,created_at)
        VALUES (ws,'weather','sms','0917'||lpad((2345000+bcount)::text,7,'0'),names[1+(bcount%20)],'Pasensya! Heavy rain this afternoon, so Jun has to move your visit. Tap to pick a new slot.','simulated',b,(d-2)+time '12:30',(d-2)+time '12:30');
      END IF;
      t := t + ((s.duration_minutes * qty + 30) || ' minutes')::interval;
    END LOOP;
  END LOOP;

  FOR i IN 1..45 LOOP
    k := 1 + (i % 6);
    st := CASE WHEN i <= 2 OR i = 45 THEN 'new' WHEN i % 8 = 0 THEN 'replied' WHEN i % 4 = 0 THEN 'link_opened' ELSE 'booked' END;
    INSERT INTO public.conversations(workspace_id,customer_name,status,language,extracted,last_message_at,created_at,link_opened_at,booked_at)
    VALUES (ws, names[1 + ((i * 7) % 20)], st, langs[k],
      jsonb_build_object('service_slug', CASE k WHEN 2 THEN 'window-clean' WHEN 5 THEN 'checkup' WHEN 6 THEN 'freon' ELSE 'split-clean' END,
        'units', 1 + (i % 3), 'zone_slug', zslugs[1 + (i % 5)], 'language', langs[k],
        'confidence', jsonb_build_object('service',0.95,'units',0.9,'zone',0.9,'when',0.7), 'missing', '[]'::jsonb),
      now() - ((i * 14) || ' hours')::interval, now() - ((i * 14) || ' hours')::interval,
      CASE WHEN st IN ('link_opened','booked') THEN now() - ((i * 14 - 1) || ' hours')::interval END,
      CASE WHEN st = 'booked' THEN now() - ((i * 14 - 2) || ' hours')::interval END)
    RETURNING id INTO cv;
    INSERT INTO public.conversation_messages(workspace_id,conversation_id,direction,sent_by,body,created_at)
    VALUES (ws, cv, 'in', 'customer', msgs[k], now() - ((i * 14) || ' hours')::interval);
    IF st <> 'new' THEN
      INSERT INTO public.conversation_messages(workspace_id,conversation_id,direction,sent_by,body,created_at)
      VALUES (ws, cv, 'out', 'auto', replies[k], now() - ((i * 14) || ' hours')::interval + interval '40 seconds');
    END IF;
    IF st IN ('replied','link_opened') AND i > 6 THEN
      INSERT INTO public.outbox_messages(workspace_id,kind,channel,recipient,recipient_name,body,status,conversation_id,sim_time,created_at)
      VALUES (ws,'lead_followup','messenger',names[1+((i*7)%20)],names[1+((i*7)%20)],'Hi! Just checking if you still want Jun to clean your aircon — your slots are still open. Salamat!','simulated',cv,now() - ((i*14 - 24) || ' hours')::interval,now() - ((i*14 - 24) || ' hours')::interval);
    END IF;
  END LOOP;

  INSERT INTO public.waitlist(workspace_id,full_name,mobile,zone_id,service_slug,units,created_at)
  SELECT ws,'Cherry Mae Lim','09171234501',id,'split-clean',2,now()-interval '20 hours' FROM public.zones WHERE slug='mandaue';
  INSERT INTO public.waitlist(workspace_id,full_name,mobile,zone_id,service_slug,units,created_at)
  SELECT ws,'Dennis Abellana','09281234502',id,'split-clean',1,now()-interval '12 hours' FROM public.zones WHERE slug='cebu-north';
END $fn$;

REVOKE EXECUTE ON FUNCTION public.seed_demo_workspace() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_demo_fresh()
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE seeded date;
BEGIN
  IF NOT public.has_role(auth.uid(),'demo'::public.app_role) THEN RETURN false; END IF;
  SELECT demo_seeded_on INTO seeded FROM public.shop_settings WHERE workspace_id = public.demo_workspace_id() FOR UPDATE;
  IF seeded IS DISTINCT FROM (now() AT TIME ZONE 'Asia/Manila')::date THEN
    PERFORM public.seed_demo_workspace();
  END IF;
  RETURN true;
END $fn$;
REVOKE EXECUTE ON FUNCTION public.ensure_demo_fresh() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_demo_fresh() TO authenticated;

SELECT public.seed_demo_workspace();