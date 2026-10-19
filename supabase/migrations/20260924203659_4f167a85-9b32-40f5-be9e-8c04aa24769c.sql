
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE public.app_role AS ENUM ('owner');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes int NOT NULL,
  price_php int NOT NULL,
  per_unit boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT USING (true);
CREATE POLICY "owner manages services" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  barangays text[] NOT NULL DEFAULT '{}',
  color text NOT NULL DEFAULT '#3b82f6',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zones TO authenticated;
GRANT ALL ON public.zones TO service_role;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zones public read" ON public.zones FOR SELECT USING (true);
CREATE POLICY "owner manages zones" ON public.zones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  mobile text NOT NULL,
  address text NOT NULL,
  landmark text NOT NULL DEFAULT '',
  access_notes text NOT NULL DEFAULT '',
  zone_id uuid REFERENCES public.zones(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads customers" ON public.customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE SEQUENCE public.booking_ref_seq START 2417;
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('BGN-' || nextval('public.booking_ref_seq')::text),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  service_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes int NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_php int NOT NULL,
  deposit_php int NOT NULL DEFAULT 200,
  deposit_reference text,
  adult_present boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'confirmed',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  slot tsrange GENERATED ALWAYS AS (tsrange(service_date + start_time, service_date + end_time)) STORED,
  CONSTRAINT bookings_status_check CHECK (status IN ('confirmed','on_the_way','arrived','done','not_home','cancelled')),
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (slot WITH &&) WHERE (status <> 'cancelled')
);
CREATE INDEX bookings_date_idx ON public.bookings(service_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages bookings" ON public.bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date date NOT NULL,
  start_time time,
  end_time time,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.availability_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_blocks TO authenticated;
GRANT ALL ON public.availability_blocks TO service_role;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks public read" ON public.availability_blocks FOR SELECT USING (true);
CREATE POLICY "owner manages blocks" ON public.availability_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.shop_settings (
  id int PRIMARY KEY DEFAULT 1,
  work_start time NOT NULL DEFAULT '08:00',
  work_end time NOT NULL DEFAULT '17:00',
  lunch_start time NOT NULL DEFAULT '12:00',
  lunch_end time NOT NULL DEFAULT '13:00',
  work_days int[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  max_minutes_per_day int NOT NULL DEFAULT 300,
  deposit_php int NOT NULL DEFAULT 200,
  CONSTRAINT shop_settings_single CHECK (id = 1)
);
GRANT SELECT ON public.shop_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.shop_settings FOR SELECT USING (true);
CREATE POLICY "owner manages settings" ON public.shop_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

INSERT INTO public.shop_settings (id) VALUES (1);

INSERT INTO public.services (slug, name, description, duration_minutes, price_php, sort_order) VALUES
 ('split-clean','Split-type cleaning','Full coil, blower and drain cleaning for wall-mounted units.',60,800,1),
 ('window-clean','Window-type cleaning','Pull-out, wash and sanitize for window units.',45,600,2),
 ('checkup','Check-up & repair diagnosis','Jun inspects, tests and tells you exactly what it needs.',60,500,3),
 ('freon','Freon recharge','Leak check plus full refrigerant top-up.',90,1800,4);

INSERT INTO public.zones (slug, name, barangays, color, sort_order) VALUES
 ('mandaue','Mandaue City', ARRAY['Basak','Banilad Mandaue','Casuntingan','Guizo','Ibabao-Estancia','Looc','Maguikay','Subangdaku','Tipolo'], '#0ea5e9', 1),
 ('cebu-north','Cebu City North', ARRAY['Banilad','Talamban','Lahug','Mabolo','Kasambagan'], '#2563eb', 2),
 ('cebu-south','Cebu City South', ARRAY['Guadalupe','Punta Princesa','Labangon','Basak San Nicolas','Mambaling'], '#7c3aed', 3),
 ('lapu-lapu','Lapu-Lapu City', ARRAY['Pusok','Basak','Marigondon','Mactan','Babag'], '#0d9488', 4),
 ('consolacion','Consolacion', ARRAY['Poblacion Oriental','Lamac','Cansaga','Tayud','Pitogo'], '#f59e0b', 5);

DO $$
DECLARE
  names text[] := ARRAY['Maricel Abellana','Joel Paredes','Dennis Cabahug','Grace Alcantara','Rommel Tabada','Jocelyn Pepito','Ernesto Ouano','Cristina Yap','Alvin Ceniza','Mylene Bacus','Ramon Seno','Lea Gonzaga','Noel Baguio','Divina Largo','Arnel Pacana','Rosalie Quinones','Bernard Sepulveda','Katrina Villamor','Fernando Lastimosa','Shiela Mae Tagalog','Paulo Enriquez','Nenita Lumapas','Jerome Baclayon','Teresita Dagohoy'];
  addrs text[] := ARRAY['Blk 4 Lot 12, St. Michael Village','2F Unit B, Highway Homes','Ph 2 Lot 7, Vista Grande','Rm 305, Sunrise Residences','Lot 19, Camella Homes','Unit 6, Lahug Townhomes'];
  marks text[] := ARRAY['Beside the sari-sari store','Green gate near the chapel','Across the barangay hall','Blue roof, corner house','Next to the basketball court','Behind Gaisano'];
  accs text[] := ARRAY['Ring the bell twice, dogs are friendly','Gate code 1121','Park along the street, tight driveway','Guard will ask for ID at entrance','Call before arriving, narrow alley'];
  zone_slugs text[] := ARRAY['mandaue','mandaue','cebu-north','cebu-north','cebu-south','lapu-lapu','consolacion'];
  svc_slugs text[] := ARRAY['split-clean','window-clean','checkup','freon'];
  d date; i int; j int; n int := 0; jobs int;
  z uuid; s record; cur time; dur int; qty int; cust uuid; zslug text;
BEGIN
  FOR i IN -7..7 LOOP
    d := current_date + i;
    CONTINUE WHEN EXTRACT(DOW FROM d) = 0;
    zslug := zone_slugs[1 + (abs(i) % array_length(zone_slugs,1))];
    SELECT id INTO z FROM public.zones WHERE slug = zslug;
    cur := '08:00'::time;
    jobs := 2 + (abs(i) % 2);
    FOR j IN 1..jobs LOOP
      n := n + 1;
      SELECT * INTO s FROM public.services WHERE slug = svc_slugs[1 + (n % 4)];
      qty := 1;
      dur := s.duration_minutes * qty;
      IF cur < '12:00'::time AND (cur + (dur || ' minutes')::interval)::time > '12:00'::time THEN
        cur := '13:00'::time;
      END IF;
      EXIT WHEN (cur + (dur || ' minutes')::interval)::time > '17:00'::time;
      INSERT INTO public.customers (full_name, mobile, address, landmark, access_notes, zone_id)
      VALUES (names[1 + (n % array_length(names,1))],
              '09' || lpad(((170000000 + n * 137171) % 1000000000)::text, 9, '0'),
              addrs[1 + (n % array_length(addrs,1))],
              marks[1 + (n % array_length(marks,1))],
              accs[1 + (n % array_length(accs,1))], z)
      RETURNING id INTO cust;
      INSERT INTO public.bookings (customer_id, zone_id, service_date, start_time, end_time, duration_minutes, items, total_php, adult_present, status, deposit_reference)
      VALUES (cust, z, d, cur, (cur + (dur || ' minutes')::interval)::time, dur,
        jsonb_build_array(jsonb_build_object('service_id', s.id, 'slug', s.slug, 'name', s.name, 'quantity', qty, 'unit_price', s.price_php, 'unit_minutes', s.duration_minutes)),
        s.price_php * qty, true,
        CASE WHEN i < 0 THEN 'done' ELSE 'confirmed' END,
        'GC' || lpad(((n * 918273) % 1000000000)::text, 9, '0'));
      cur := (cur + (dur || ' minutes')::interval + interval '20 minutes')::time;
    END LOOP;
  END LOOP;
END $$;
