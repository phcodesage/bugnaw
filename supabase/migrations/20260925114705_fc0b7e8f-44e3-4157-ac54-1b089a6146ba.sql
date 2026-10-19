ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS auto_reply boolean NOT NULL DEFAULT false;

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL DEFAULT 'Messenger customer',
  channel text NOT NULL DEFAULT 'messenger',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','replied','link_opened','booked')),
  lead_token text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,12),
  language text,
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggested_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  draft_reply text,
  booking_reference text,
  link_opened_at timestamptz,
  booked_at timestamptz,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages conversations" ON public.conversations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  sent_by text NOT NULL DEFAULT 'customer' CHECK (sent_by IN ('customer','owner','auto','system')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.conversation_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_messages TO authenticated;
GRANT ALL ON public.conversation_messages TO service_role;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages conversation messages" ON public.conversation_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER conversations_touch BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DO $$
DECLARE c uuid;
BEGIN
  INSERT INTO public.conversations (customer_name,status,language,extracted,booking_reference,link_opened_at,booked_at,last_message_at,created_at)
  VALUES ('Marites Cabahug','booked','bisaya',
    '{"service_slug":"split-clean","units":2,"zone_slug":"cebu-north","barangay":"Talamban","preferred_day":"Monday","preferred_time":"morning","language":"bisaya","confidence":{"service":0.95,"units":0.95,"zone":0.9,"when":0.8},"missing":[]}',
    'BGN-2419', now()-interval '2 days 3 hours', now()-interval '2 days 2 hours', now()-interval '2 days 2 hours', now()-interval '2 days 4 hours')
  RETURNING id INTO c;
  INSERT INTO public.conversation_messages (conversation_id,direction,sent_by,body,created_at) VALUES
   (c,'in','customer','Maayong buntag! Pa limpyo unta mi 2 ka split type sa Talamban, Monday buntag pwede?', now()-interval '2 days 4 hours'),
   (c,'out','auto','Maayong buntag, Marites! Salamat sa message. 2 ka split-type cleaning = ₱1,600 (mga 2 oras). Libre si Jun ani: Mon 8:00 AM, Mon 9:30 AM, Tue 8:00 AM. I-book lang diri: /?lead=demo', now()-interval '2 days 4 hours'+interval '1 minute');

  INSERT INTO public.conversations (customer_name,status,language,extracted,link_opened_at,last_message_at,created_at)
  VALUES ('Rodel Tampus','link_opened','taglish',
    '{"service_slug":"window-clean","units":1,"zone_slug":"mandaue","barangay":"Subangdaku","preferred_day":"Saturday","preferred_time":null,"language":"taglish","confidence":{"service":0.95,"units":0.9,"zone":0.95,"when":0.7},"missing":[]}',
    now()-interval '5 hours', now()-interval '6 hours', now()-interval '6 hours')
  RETURNING id INTO c;
  INSERT INTO public.conversation_messages (conversation_id,direction,sent_by,body,created_at) VALUES
   (c,'in','customer','Boss available ka sat? window type lang isa, Mandaue ko', now()-interval '6 hours'),
   (c,'out','owner','Hello boss! Yes po, window-type cleaning ₱600 (45 mins). Available si Jun sa Sat 8:00 AM, 10:00 AM o 2:00 PM. Book na dito para sure: /?lead=demo', now()-interval '5 hours 50 minutes');

  INSERT INTO public.conversations (customer_name,status,language,extracted,last_message_at,created_at)
  VALUES ('Jessa Ybañez','replied','english',
    '{"service_slug":"freon","units":1,"zone_slug":"lapu-lapu","barangay":"Pusok","preferred_day":null,"preferred_time":"afternoon","language":"english","confidence":{"service":0.8,"units":0.9,"zone":0.95,"when":0.5},"missing":[]}',
    now()-interval '1 hour', now()-interval '1 hour')
  RETURNING id INTO c;
  INSERT INTO public.conversation_messages (conversation_id,direction,sent_by,body,created_at) VALUES
   (c,'in','customer','Hi! Our aircon is not cold anymore, maybe needs freon? We are in Pusok, Lapu-Lapu. Afternoons are best.', now()-interval '1 hour'),
   (c,'out','owner','Hi Jessa! A freon recharge is ₱1,800 (about 1.5 hrs). Jun can do afternoons. Pick a slot here: /?lead=demo', now()-interval '55 minutes');
END $$;