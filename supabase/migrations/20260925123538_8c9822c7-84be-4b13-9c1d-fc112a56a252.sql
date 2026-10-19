DROP POLICY IF EXISTS "dashboard roles read bookings" ON public.bookings;
DROP POLICY IF EXISTS "dashboard roles read customers" ON public.customers;
DROP POLICY IF EXISTS "dashboard roles read conversations" ON public.conversations;
DROP POLICY IF EXISTS "dashboard roles read conversation messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "dashboard roles read outbox" ON public.outbox_messages;
DROP POLICY IF EXISTS "dashboard roles read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "dashboard roles read blocks" ON public.availability_blocks;

DROP FUNCTION IF EXISTS public.has_any_dashboard_role(uuid);

CREATE POLICY "demo reads bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'demo'::public.app_role));
CREATE POLICY "demo reads customers" ON public.customers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'demo'::public.app_role));
CREATE POLICY "demo reads conversations" ON public.conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'demo'::public.app_role));
CREATE POLICY "demo reads conversation messages" ON public.conversation_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'demo'::public.app_role));
CREATE POLICY "demo reads outbox" ON public.outbox_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'demo'::public.app_role));
CREATE POLICY "demo reads waitlist" ON public.waitlist FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'demo'::public.app_role));