import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AutomationConfig } from "./automations.shared";

export type OutboxRow = {
  id: string;
  kind: string;
  channel: string;
  recipient: string;
  recipient_name: string;
  body: string;
  status: string;
  action_url: string | null;
  sim_time: string;
};

export type ClockPreset = "reset" | "plus1h" | "tomorrow_18" | "tomorrow_08" | "next_job_minus2h" | "plus1d" | "plus6m";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function operatorDb(context: { supabase: any; userId: string }) {
  const [{ data: owner }, { data: demo }, { data: workspaceId }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "demo" }),
    context.supabase.rpc("current_workspace_id", { _user_id: context.userId }),
  ]);
  if (!owner && !demo) throw new Error("Owner access required.");
  if (!workspaceId) throw new Error("Workspace unavailable.");
  return { db: context.supabase, workspaceId: String(workspaceId) };
}

export const getSimClock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { workspaceId } = await operatorDb(context);
    const { getClock } = await import("./automations.server");
    const c = await getClock(context.supabase, workspaceId);
    return { now: c.now.toISOString(), offsetMinutes: c.offsetMinutes, today: c.today, nowMin: c.nowMin };
  });

/** Moves the demo clock, then runs every time-based automation. */
export const setSimClock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { preset: ClockPreset }) => d)
  .handler(async ({ data, context }) => {
    const { db, workspaceId } = await operatorDb(context);
    const { getClock, manilaToDate, addDays, Automator } = await import("./automations.server");
    const c = await getClock(db, workspaceId);
    let target: Date;
    switch (data.preset) {
      case "reset":
        target = new Date();
        break;
      case "plus1h":
        target = new Date(c.now.getTime() + 3600_000);
        break;
      case "plus1d":
        target = new Date(c.now.getTime() + 24 * 3600_000);
        break;
      case "plus6m":
        target = new Date(c.now.getTime() + 183 * 24 * 3600_000);
        break;
      case "tomorrow_18":
        target = manilaToDate(c.today, 18 * 60);
        if (target <= c.now) target = manilaToDate(addDays(c.today, 1), 18 * 60);
        break;
      case "tomorrow_08":
        target = manilaToDate(addDays(c.today, 1), 8 * 60);
        break;
      case "next_job_minus2h": {
        const { data: jobs } = await db
          .from("bookings")
          .select("service_date,start_time")
          .eq("status", "confirmed")
          .is("customer_confirmed_at", null)
          .gte("service_date", c.today)
          .order("service_date")
          .order("start_time")
          .limit(20);
        const next = (jobs ?? [])
          .map((j: { service_date: string; start_time: string }) => manilaToDate(j.service_date, Number(j.start_time.slice(0, 2)) * 60 + Number(j.start_time.slice(3, 5)) - 120))
          .find((t: Date) => t.getTime() > c.now.getTime());
        if (!next) return { ok: false as const, error: "No upcoming unconfirmed job to jump to." };
        target = next;
        break;
      }
    }
    const offset = Math.round((target.getTime() - Date.now()) / 60_000);
    await db.from("shop_settings").update({ sim_offset_minutes: data.preset === "reset" ? 0 : offset }).eq("workspace_id", workspaceId);
    const auto = await Automator.create(db, workspaceId);
    const sent = await auto.runScheduled();
    return { ok: true as const, sent, now: auto.clock.now.toISOString() };
  });

export const runAutomationsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, workspaceId } = await operatorDb(context);
    const { Automator } = await import("./automations.server");
    const auto = await Automator.create(db, workspaceId);
    return { sent: await auto.runScheduled() };
  });

export const listOutbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { workspaceId } = await operatorDb(context);
    const [{ data, error }, { data: wl }] = await Promise.all([
      context.supabase
        .from("outbox_messages")
        .select("id,kind,channel,recipient,recipient_name,body,status,action_url,sim_time")
        .order("sim_time", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase.from("waitlist").select("id,full_name,status,units,service_slug,zones(name)").order("created_at"),
    ]);
    if (error) throw new Error(error.message);
    return {
      messages: (data ?? []) as OutboxRow[],
      waitlist: (wl ?? []).map((w) => ({ ...w, zone: (w.zones as unknown as { name: string } | null)?.name ?? "" })),
    };
  });

export const getAutomationConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { withDefaults } = await import("./automations.shared");
    const { workspaceId } = await operatorDb(context);
    const { data } = await context.supabase.from("shop_settings").select("automations").eq("workspace_id", workspaceId).single();
    return withDefaults(data?.automations);
  });

export const saveAutomationConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: AutomationConfig) => d)
  .handler(async ({ data, context }) => {
    const { workspaceId } = await operatorDb(context);
    const { withDefaults } = await import("./automations.shared");
    const clean = withDefaults(data);
    for (const k of Object.keys(clean) as Array<keyof AutomationConfig>) clean[k].template = clean[k].template.slice(0, 600);
    const { error } = await context.supabase.from("shop_settings").update({ automations: clean }).eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
