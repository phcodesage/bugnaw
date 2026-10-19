import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";
import { withDefaults, type AutomationConfig, type AutomationKey } from "./automations.shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type Clock = { now: Date; offsetMinutes: number; today: string; tomorrow: string; nowMin: number };

export function requestOrigin() {
  try {
    const o = getRequestHeader("origin");
    if (o && /^https?:\/\//.test(o)) return o;
    const r = getRequestHeader("referer");
    if (r) return new URL(r).origin;
    return new URL(getRequestUrl()).origin;
  } catch {
    return "";
  }
}

function localParts(d: Date) {
  const l = new Date(d.getTime() + 8 * 3600_000);
  return { iso: l.toISOString().slice(0, 10), min: l.getUTCHours() * 60 + l.getUTCMinutes() };
}
export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Manila local date + minutes → real Date. */
export function manilaToDate(iso: string, min: number) {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + (min - 8 * 60) * 60_000);
}

export async function getClock(db: Db, workspaceId = "00000000-0000-0000-0000-000000000001"): Promise<Clock> {
  const { data } = await db.from("shop_settings").select("sim_offset_minutes").eq("workspace_id", workspaceId).single();
  const offsetMinutes = data?.sim_offset_minutes ?? 0;
  const now = new Date(Date.now() + offsetMinutes * 60_000);
  const p = localParts(now);
  return { now, offsetMinutes, today: p.iso, tomorrow: addDays(p.iso, 1), nowMin: p.min };
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const timeLabel = (t: string | number) => {
  const m = typeof t === "number" ? t : toMin(t);
  const h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const dateLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const first = (n: string) => (n || "there").split(" ")[0]!;

export function render(tpl: string, vars: Record<string, string | number>) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)).replace(/\s{2,}/g, " ").trim();
}

export class Automator {
  constructor(
    public db: Db,
    public clock: Clock,
    public config: AutomationConfig,
    public origin: string,
    public deposit: number,
    public peak = false,
    public workspaceId = "00000000-0000-0000-0000-000000000001",
  ) {}

  static async create(db: Db, workspaceId = "00000000-0000-0000-0000-000000000001") {
    const [clock, { data: s }] = await Promise.all([getClock(db, workspaceId), db.from("shop_settings").select("automations,deposit_php,peak_mode").eq("workspace_id", workspaceId).single()]);
    return new Automator(db, clock, withDefaults(s?.automations), requestOrigin(), s?.deposit_php ?? 200, !!s?.peak_mode, workspaceId);
  }

  enabled(k: AutomationKey) {
    if (k === "waitlist" && this.peak) return true; // peak season: waitlist always on
    return this.config[k].enabled;
  }

  async send(
    kind: AutomationKey,
    m: {
      recipient: string;
      name: string;
      vars: Record<string, string | number>;
      channel?: "sms" | "messenger";
      action_url?: string | null;
      booking_id?: string | null;
      conversation_id?: string | null;
      waitlist_id?: string | null;
      dedupe: string | null;
    },
  ) {
    if (!this.enabled(kind)) return false;
    const body = render(this.config[kind].template, { deposit: this.deposit, name: first(m.name), ...m.vars });
    const { error } = await this.db.from("outbox_messages").insert({
      kind,
      channel: m.channel ?? "sms",
      recipient: m.recipient || "—",
      recipient_name: m.name,
      body,
      status: "simulated",
      action_url: m.action_url ?? null,
      booking_id: m.booking_id ?? null,
      conversation_id: m.conversation_id ?? null,
      waitlist_id: m.waitlist_id ?? null,
      dedupe_key: m.dedupe,
      sim_time: this.clock.now.toISOString(),
      workspace_id: this.workspaceId,
    });
    if (error) {
      if (error.code !== "23505") console.error("outbox insert failed", error.message);
      return false;
    }
    return true;
  }

  manageLink(ref: string, token: string) {
    return `${this.origin}/booking/${ref}?t=${token}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookingVars(b: any) {
    const items = (b.items ?? []) as Array<{ name: string; quantity: number }>;
    return {
      ref: b.reference,
      date: dateLabel(b.service_date),
      time: timeLabel(b.start_time),
      service: items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", "),
      zone: b.zones?.name ?? "",
      link: this.manageLink(b.reference, b.manage_token),
    };
  }

  async loadBooking(id: string) {
    const { data } = await this.db
      .from("bookings")
      .select("id,reference,manage_token,service_date,start_time,end_time,items,zone_id,status,customer_confirmed_at,at_risk,zones(name),customers(full_name,mobile)")
      .eq("workspace_id", this.workspaceId)
      .eq("id", id)
      .single();
    return data;
  }

  /** Offer a freed slot to the first waitlisted customer in that zone. */
  async offerSlot(zoneId: string, date: string, startTime: string, dedupeSuffix: string) {
    if (!this.enabled("waitlist")) return false;
    const { data: w } = await this.db
      .from("waitlist")
      .select("id,full_name,mobile,token,zones(name)")
      .eq("workspace_id", this.workspaceId)
      .eq("zone_id", zoneId)
      .eq("status", "waiting")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (!w) return false;
    const ok = await this.send("waitlist", {
      recipient: w.mobile,
      name: w.full_name,
      vars: { zone: (w.zones as unknown as { name: string } | null)?.name ?? "", date: dateLabel(date), time: timeLabel(startTime), link: `${this.origin}/book?lead=${w.token}` },
      action_url: `${this.origin}/book?lead=${w.token}`,
      waitlist_id: w.id,
      dedupe: `waitlist:${dedupeSuffix}`,
    });
    if (ok) await this.db.from("waitlist").update({ status: "offered", offered_at: this.clock.now.toISOString() }).eq("id", w.id);
    return ok;
  }

  /** Time-based automations. Idempotent — safe to run as often as you like. */
  async runScheduled() {
    const { today, tomorrow, nowMin, now } = this.clock;
    let sent = 0;

    const { data: upcoming } = await this.db
      .from("bookings")
      .select("id,reference,manage_token,service_date,start_time,end_time,items,zone_id,status,customer_confirmed_at,at_risk,zones(name),customers(full_name,mobile)")
      .eq("workspace_id", this.workspaceId)
      .in("service_date", [today, tomorrow])
      .eq("status", "confirmed");

    for (const b of upcoming ?? []) {
      const c = b.customers as unknown as { full_name: string; mobile: string };
      const vars = this.bookingVars(b);
      const start = toMin(b.start_time);
      if (b.service_date === tomorrow && nowMin >= 18 * 60 && !b.customer_confirmed_at) {
        if (await this.send("reminder", { recipient: c.mobile, name: c.full_name, vars, action_url: vars.link, booking_id: b.id, dedupe: `reminder:${b.id}:${b.service_date}` })) sent++;
      }
      if (b.service_date === today && !b.customer_confirmed_at) {
        if (nowMin >= 8 * 60 && nowMin < start) {
          if (await this.send("nudge", { recipient: c.mobile, name: c.full_name, vars, action_url: vars.link, booking_id: b.id, dedupe: `nudge:${b.id}:${b.service_date}` })) sent++;
        }
        if (nowMin >= start - 120 && nowMin < start && !b.at_risk && this.enabled("at_risk")) {
          await this.db.from("bookings").update({ at_risk: true }).eq("id", b.id);
          await this.send("at_risk", { recipient: "Jun (dashboard)", name: c.full_name, vars: { ...vars, name: c.full_name }, booking_id: b.id, dedupe: `atrisk:${b.id}:${b.service_date}` });
          await this.offerSlot(b.zone_id, b.service_date, b.start_time, `atrisk:${b.id}:${b.service_date}`);
          sent++;
        }
      }
    }

    // Lead follow-up: replied / link opened, not booked, last reply ≥24h ago → one gentle nudge.
    if (this.enabled("lead_followup")) {
      const { data: convs } = await this.db.from("conversations").select("id,customer_name,lead_token,status").eq("workspace_id", this.workspaceId).in("status", ["replied", "link_opened"]);
      for (const cv of convs ?? []) {
        const { data: lastOut } = await this.db
          .from("conversation_messages")
          .select("created_at")
          .eq("conversation_id", cv.id)
          .eq("direction", "out")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!lastOut || now.getTime() - new Date(lastOut.created_at).getTime() < 24 * 3600_000) continue;
        const link = `${this.origin}/book?lead=${cv.lead_token}`;
        const ok = await this.send("lead_followup", {
          recipient: `Messenger · ${cv.customer_name}`,
          name: cv.customer_name === "Messenger customer" ? "" : cv.customer_name,
          channel: "messenger",
          vars: { link },
          action_url: link,
          conversation_id: cv.id,
          dedupe: `lead:${cv.id}`,
        });
        if (ok) {
          const { data: msg } = await this.db.from("outbox_messages").select("body").eq("dedupe_key", `lead:${cv.id}`).single();
          await this.db.from("conversation_messages").insert({ workspace_id: this.workspaceId, conversation_id: cv.id, direction: "out", sent_by: "auto", body: msg?.body ?? "", created_at: now.toISOString() });
          sent++;
        }
      }
    }

    // 6-month recleaning reminders.
    if (this.enabled("recleaning")) {
      const { data: done } = await this.db
        .from("bookings")
        .select("id,reference,manage_token,service_date,start_time,items,customers(full_name,mobile)")
        .eq("workspace_id", this.workspaceId)
        .eq("status", "done")
        .lte("service_date", addDays(today, -182))
        .limit(100);
      for (const b of done ?? []) {
        const c = b.customers as unknown as { full_name: string; mobile: string };
        if (await this.send("recleaning", { recipient: c.mobile, name: c.full_name, vars: { link: `${this.origin}/book` }, action_url: `${this.origin}/book`, booking_id: b.id, dedupe: `reclean:${b.id}` })) sent++;
      }
    }
    return sent;
  }
}

export { timeLabel as autoTimeLabel, dateLabel as autoDateLabel, toMin as autoToMin };
