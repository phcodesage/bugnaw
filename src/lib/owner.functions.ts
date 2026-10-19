import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireOperator(context: { supabase: any; userId: string }) {
  const [{ data: owner }, { data: demo }, { data: workspaceId }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "demo" }),
    context.supabase.rpc("current_workspace_id", { _user_id: context.userId }),
  ]);
  if (!owner && !demo) throw new Error("Owner access required.");
  if (!workspaceId) throw new Error("Workspace unavailable.");
  return { workspaceId: String(workspaceId), demo: !!demo };
}

export type OwnerJob = {
  id: string;
  reference: string;
  service_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  at_risk: boolean;
  customer_confirmed: boolean;
  deposit_forfeited: boolean;
  total_php: number;
  items: Array<{ name: string; quantity: number }>;
  zone: { name: string; color: string; slug: string };
  customer: { full_name: string; mobile: string; address: string; landmark: string; access_notes: string };
};

const SELECT =
  "id,reference,service_date,start_time,end_time,duration_minutes,status,at_risk,customer_confirmed_at,deposit_forfeited,total_php,items,zones(name,color,slug),customers(full_name,mobile,address,landmark,access_notes)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shape(rows: any[]): OwnerJob[] {
  return (rows ?? []).map((r) => ({
    id: r.id,
    reference: r.reference,
    service_date: r.service_date,
    start_time: r.start_time,
    end_time: r.end_time,
    duration_minutes: r.duration_minutes,
    status: r.status,
    at_risk: !!r.at_risk,
    customer_confirmed: !!r.customer_confirmed_at,
    deposit_forfeited: !!r.deposit_forfeited,
    total_php: r.total_php,
    items: r.items ?? [],
    zone: r.zones ?? { name: "", color: "#0ea5e9", slug: "" },
    customer: r.customers ?? { full_name: "", mobile: "", address: "", landmark: "", access_notes: "" },
  }));
}

export const getJobsInRange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("bookings")
      .select(SELECT)
      .gte("service_date", data.from)
      .lte("service_date", data.to)
      .order("service_date")
      .order("start_time");
    if (error) throw new Error(error.message);
    return shape(rows ?? []);
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data, context }) => {
    const { workspaceId } = await requireOperator(context);
    const allowed = ["confirmed", "on_the_way", "arrived", "done", "not_home", "cancelled"];
    if (!allowed.includes(data.status)) throw new Error("Unknown status");
    const patch: { status: string; deposit_forfeited?: boolean; at_risk?: boolean } = { status: data.status };
    if (data.status === "not_home") patch["deposit_forfeited"] = true;
    if (data.status !== "confirmed") patch["at_risk"] = false;
    const { error } = await context.supabase.from("bookings").update(patch).eq("id", data.id).eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);

    if (data.status === "on_the_way" || data.status === "not_home") {
      const { Automator, autoTimeLabel } = await import("./automations.server");
      const auto = await Automator.create(context.supabase, workspaceId);
      const b = await auto.loadBooking(data.id);
      if (b) {
        const c = b.customers as unknown as { full_name: string; mobile: string };
        const vars = auto.bookingVars(b);
        if (data.status === "on_the_way") {
          const eta = auto.clock.nowMin + 25;
          await auto.send("on_the_way", { recipient: c.mobile, name: c.full_name, vars: { ...vars, eta: `${autoTimeLabel(eta - 5)}–${autoTimeLabel(eta + 10)}` }, booking_id: b.id, dedupe: `otw:${b.id}:${b.service_date}` });
        } else {
          await auto.send("no_show", { recipient: c.mobile, name: c.full_name, vars: { ...vars, link: `${auto.origin}/book` }, action_url: `${auto.origin}/book`, booking_id: b.id, dedupe: `noshow:${b.id}` });
        }
      }
    }
    return { ok: true };
  });

export const getShopConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { workspaceId } = await requireOperator(context);
    const [settings, services, blocks] = await Promise.all([
      context.supabase.from("shop_settings").select("*").eq("workspace_id", workspaceId).single(),
      context.supabase.from("services").select("*").order("sort_order"),
      context.supabase.from("availability_blocks").select("*").gte("block_date", new Date().toISOString().slice(0, 10)).order("block_date"),
    ]);
    return { settings: settings.data, services: services.data ?? [], blocks: blocks.data ?? [] };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { work_start: string; work_end: string; lunch_start: string; lunch_end: string; max_minutes_per_day: number; work_days: number[]; peak_mode?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { workspaceId } = await requireOperator(context);
    const { error } = await context.supabase.from("shop_settings").update(data).eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; price_php: number; duration_minutes: number; active: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: owner } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
    if (!owner) throw new Error("Service catalog changes are disabled in the demo.");
    const { error } = await context.supabase
      .from("services")
      .update({ price_php: data.price_php, duration_minutes: data.duration_minutes, active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { block_date: string; reason: string }) => d)
  .handler(async ({ data, context }) => {
    const { workspaceId } = await requireOperator(context);
    const { error } = await context.supabase.from("availability_blocks").insert({ workspace_id: workspaceId, block_date: data.block_date, reason: data.reason });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireOperator(context);
    const { error } = await context.supabase.from("availability_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Marks the signed-in account as the shop owner if no owner exists yet. */
export const claimOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { adminDb } = await import("./db.server");
    const db = adminDb();
    const { count } = await db.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "owner");
    if ((count ?? 0) > 0) return { ok: false as const, error: "An owner account already exists." };
    const { error } = await db.from("user_roles").insert({ user_id: context.userId, role: "owner" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).maybeSingle();
    const { adminDb } = await import("./db.server");
    const { count } = await adminDb().from("user_roles").select("id", { count: "exact", head: true }).eq("role", "owner");
    return { role: data?.role ?? null, ownerExists: (count ?? 0) > 0 };
  });

/** Peak season toggle (March–May): tighter slot windows, deposit required, waitlist forced on. */
export const setPeakMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { on: boolean }) => ({ on: !!d.on }))
  .handler(async ({ data, context }) => {
    const { workspaceId } = await requireOperator(context);
    const { error } = await context.supabase.from("shop_settings").update({ peak_mode: data.on }).eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Rain: cancel every afternoon job on `date`, block the afternoon, and send apology + free reschedule links. */
export const cancelAfternoonForWeather = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { date: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) throw new Error("Bad date");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { workspaceId } = await requireOperator(context);
    const { data: s } = await context.supabase.from("shop_settings").select("lunch_start,work_end").eq("workspace_id", workspaceId).single();
    const from = s?.lunch_start ?? "12:00:00";
    const { data: jobs, error } = await context.supabase
      .from("bookings")
      .select("id,notes")
      .eq("workspace_id", workspaceId)
      .eq("service_date", data.date)
      .gte("start_time", from)
      .in("status", ["confirmed", "on_the_way"]);
    if (error) throw new Error(error.message);
    const { Automator } = await import("./automations.server");
    const auto = await Automator.create(context.supabase, workspaceId);
    for (const j of jobs ?? []) {
      await context.supabase
        .from("bookings")
        .update({ status: "cancelled", notes: `[weather] ${j.notes}`.trim(), at_risk: false, deposit_forfeited: false })
        .eq("id", j.id);
      const b = await auto.loadBooking(j.id);
      if (!b) continue;
      const c = b.customers as unknown as { full_name: string; mobile: string };
      const vars = auto.bookingVars(b);
      await auto.send("weather", { recipient: c.mobile, name: c.full_name, vars, action_url: vars.link, booking_id: j.id, dedupe: `weather:${j.id}:${data.date}` });
    }
    await context.supabase.from("availability_blocks").insert({ workspace_id: workspaceId, block_date: data.date, start_time: from, end_time: s?.work_end ?? "17:00:00", reason: "Bad weather" });
    return { ok: true, cancelled: (jobs ?? []).length };
  });

export const resetDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { demo } = await requireOperator(context);
    if (!demo) throw new Error("Reset is only available in demo mode.");
    const { data, error } = await context.supabase.rpc("reset_my_demo_workspace");
    if (error || !data) throw new Error(error?.message ?? "Could not reset the demo.");
    return { ok: true as const };
  });
