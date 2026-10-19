CREATE OR REPLACE FUNCTION public.has_any_dashboard_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner'::public.app_role, 'demo'::public.app_role)
  )
$$;

REVOKE ALL ON FUNCTION public.has_any_dashboard_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_dashboard_role(uuid) TO authenticated, service_role;

CREATE POLICY "dashboard roles read bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_any_dashboard_role(auth.uid()));
CREATE POLICY "dashboard roles read customers" ON public.customers FOR SELECT TO authenticated USING (public.has_any_dashboard_role(auth.uid()));
CREATE POLICY "dashboard roles read conversations" ON public.conversations FOR SELECT TO authenticated USING (public.has_any_dashboard_role(auth.uid()));
CREATE POLICY "dashboard roles read conversation messages" ON public.conversation_messages FOR SELECT TO authenticated USING (public.has_any_dashboard_role(auth.uid()));
CREATE POLICY "dashboard roles read outbox" ON public.outbox_messages FOR SELECT TO authenticated USING (public.has_any_dashboard_role(auth.uid()));
CREATE POLICY "dashboard roles read waitlist" ON public.waitlist FOR SELECT TO authenticated USING (public.has_any_dashboard_role(auth.uid()));
CREATE POLICY "dashboard roles read blocks" ON public.availability_blocks FOR SELECT TO authenticated USING (public.has_any_dashboard_role(auth.uid()));