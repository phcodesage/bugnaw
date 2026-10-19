import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { weekSaved } from "./route";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Range = { from: string; to: string };

function day(iso: string) {
  return iso.slice(0, 10);
}

export const getImpact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { week: Range; month: Range }) => data)
  .handler(async ({ data, context }) => {
    const build = (range: Range) => buildImpact(context.supabase, range);
    return { week: await build(data.week), month: await build(data.month) };
  });

async function buildImpact(client: SupabaseClient<Database>, range: Range, workspaceId?: string) {
  const context = { supabase: client };
  const scope = <T extends { eq: (column: string, value: string) => T }>(query: T) => workspaceId ? query.eq("workspace_id", workspaceId) : query;
  {
    {
      const [conversations, autoReplies, outbox, bookings, waitlist] = await Promise.all([
        scope(context.supabase.from("conversations").select("id,status,created_at,booked_at")).not("channel", "like", "website%").gte("created_at", `${range.from}T00:00:00+08:00`).lte("created_at", `${range.to}T23:59:59+08:00`),
        scope(context.supabase.from("conversation_messages").select("id,created_at")).eq("direction", "out").eq("sent_by", "auto").gte("created_at", `${range.from}T00:00:00`).lte("created_at", `${range.to}T23:59:59`),
        scope(context.supabase.from("outbox_messages").select("id,kind,booking_id,sim_time")).gte("sim_time", `${range.from}T00:00:00`).lte("sim_time", `${range.to}T23:59:59`),
        scope(context.supabase.from("bookings").select("id,service_date,start_time,status,deposit_php,deposit_reference,deposit_forfeited,customer_confirmed_at,at_risk,zones(name,slug,color)")).gte("service_date", range.from).lte("service_date", range.to),
        scope(context.supabase.from("waitlist").select("id,status,offered_at")).eq("status", "booked").gte("offered_at", `${range.from}T00:00:00`).lte("offered_at", `${range.to}T23:59:59`),
      ]);
      for (const result of [conversations, autoReplies, outbox, bookings, waitlist]) {
        if (result.error) throw new Error(result.error.message);
      }

      const conv = conversations.data ?? [];
      const sent = outbox.data ?? [];
      const jobs = (bookings.data ?? []).map((b) => ({
        ...b,
        zone: (b.zones as unknown as { name: string; slug: string; color: string } | null) ?? { name: "", slug: "", color: "" },
      }));
      const inquiries = conv.length;
      const converted = conv.filter((c) => c.status === "booked" || c.booked_at).length;
      const automatedMessages = (autoReplies.data?.length ?? 0) + sent.length;
      const reschedules = sent.filter((m) => m.kind === "reschedule").length;
      const nudgedIds = new Set(sent.filter((m) => m.kind === "nudge" && m.booking_id).map((m) => m.booking_id));
      const recovered = jobs.filter((b) => nudgedIds.has(b.id) && !!b.customer_confirmed_at).length;
      const noShowsPrevented = recovered + (waitlist.data?.length ?? 0);
      const deposits = jobs
        .filter((b) => !!b.deposit_reference && b.status !== "cancelled")
        .reduce((sum, b) => sum + b.deposit_php, 0);
      const travelMinutes = weekSaved(jobs).saved;

      const chart = new Map<string, { date: string; inquiries: number; bookings: number }>();
      for (let cursor = new Date(`${range.from}T00:00:00Z`); cursor <= new Date(`${range.to}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
        const key = cursor.toISOString().slice(0, 10);
        chart.set(key, { date: key, inquiries: 0, bookings: 0 });
      }
      for (const c of conv) {
        const row = chart.get(day(c.created_at));
        if (row) row.inquiries++;
      }
      for (const b of jobs) {
        const row = chart.get(b.service_date);
        if (row && b.status !== "cancelled") row.bookings++;
      }
      return {
        inquiries,
        converted,
        conversion: inquiries ? Math.round((converted / inquiries) * 100) : 0,
        automatedMessages,
        hoursSaved: Math.round(((automatedMessages * 3 + reschedules * 10) / 60) * 10) / 10,
        noShowsPrevented,
        deposits,
        travelMinutes,
        chart: [...chart.values()],
      };
    }
  }
}

/** Public, aggregate-only numbers for the landing page (no customer details). */
export const getPublicImpact = createServerFn({ method: "GET" }).handler(async () => {
  // Marketing analytics must never make the public homepage unavailable. A
  // deployment clock can briefly lag behind Supabase's service-key `iat`, so
  // degrade to neutral aggregates until the clocks converge instead of
  // throwing from the route loader and blanking the whole page.
  const fallback = {
    unitsCleaned: 3200,
    recentJobs: [] as Array<{ year: string; title: string; place: string }>,
    hoursMonth: 0,
    hoursPerWeek: 0,
    unanswered: 0,
    inquiries: 0,
    noShowsPrevented: 0,
    travelPerWeek: 0,
    deposits: 0,
    conversion: 0,
  };

  try {
    const { adminDb } = await import("./db.server");
    const now = new Date(Date.now() + 8 * 3600_000);
    const to = now.toISOString().slice(0, 10);
    const start = new Date(now); start.setUTCDate(now.getUTCDate() - 29);
    const from = start.toISOString().slice(0, 10);
    const db = adminDb();
    const liveWorkspace = "00000000-0000-0000-0000-000000000001";
    const demoWorkspace = "00000000-0000-0000-0000-000000000002";
    const [live, demo] = await Promise.all([
      buildImpact(db, { from, to }, liveWorkspace),
      buildImpact(db, { from, to }, demoWorkspace),
    ]);
    // Use the demo sandbox totals when the live workspace has less data.
    const r = demo.automatedMessages > live.automatedMessages ? demo : live;
    const [{ count, error: countError }, { data: done, error: jobsError }] = await Promise.all([
      db.from("conversations").select("id", { count: "exact", head: true }).eq("workspace_id", liveWorkspace).eq("status", "new"),
      db.from("bookings").select("service_date,items,status,zones(name)").eq("workspace_id", liveWorkspace).in("status", ["done", "confirmed", "arrived", "on_the_way"]).order("service_date", { ascending: false }).limit(1000),
    ]);
    if (countError) throw new Error(countError.message);
    if (jobsError) throw new Error(jobsError.message);
    const weeks = 4.3;
    const rows = (done ?? []).map((b) => {
      const items = (b.items as unknown as Array<{ name: string; quantity: number }>) ?? [];
      return { serviceDate: b.service_date, items, zone: (b.zones as unknown as { name: string } | null)?.name ?? "Cebu", done: b.status === "done" };
    });
    const HISTORICAL_UNITS = 3200;
    const unitsCleaned = HISTORICAL_UNITS + rows.filter((row) => row.done).reduce((n, row) => n + row.items.reduce((a, item) => a + (item.quantity || 0), 0), 0);
    const recentJobs = rows.slice(0, 10).map((row) => {
      const first = row.items[0];
      const units = row.items.reduce((a, item) => a + (item.quantity || 0), 0);
      const daysAgo = Math.max(0, Math.round((Date.parse(to) - Date.parse(row.serviceDate)) / 86_400_000));
      const when = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : daysAgo < 7 ? `${daysAgo} days ago` : daysAgo < 14 ? "1 week ago" : `${Math.floor(daysAgo / 7)} weeks ago`;
      const service = first?.name.toLowerCase() ?? "aircon service";
      const title = first
        ? units > 1 ? `${units} ${service.replace(/ cleaning$/i, "")} units, cool again` : `${service}, fresh and ready`
        : "Home cooling restored";
      return { year: when, title, place: `${row.zone}, Cebu` };
    });
    return { unitsCleaned, recentJobs, hoursMonth: r.hoursSaved, hoursPerWeek: Math.round((r.hoursSaved / weeks) * 10) / 10, unanswered: count ?? 0, inquiries: r.inquiries, noShowsPrevented: r.noShowsPrevented, travelPerWeek: Math.round(r.travelMinutes / weeks), deposits: r.deposits, conversion: r.conversion };
  } catch (error) {
    console.warn("[Impact] Public aggregates unavailable; using safe fallback.", error instanceof Error ? error.message : error);
    return fallback;
  }
});