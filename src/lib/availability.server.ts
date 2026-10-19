import type { SupabaseClient } from "@supabase/supabase-js";

/** clustered = slots right next to a job Jun already has in this zone that day (least driving). */
export type DayAvailability = { date: string; best: boolean; slots: string[]; clustered: string[] };

export const CLUSTER_GAP = 60;

const TRAVEL_SAME_ZONE = 15;
const TRAVEL_CROSS_ZONE = 40;

export function toMin(t: string) {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}
export function toTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Open slots for the next 21 days that fit a job of `duration` minutes in `zoneId`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function computeAvailability(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  zoneId: string,
  durationMinutes: number,
  opts: { excludeBookingId?: string; workspaceId?: string } = {},
): Promise<DayAvailability[]> {
  const duration = Math.max(15, Math.min(600, Math.round(durationMinutes)));
  const workspaceId = opts.workspaceId ?? "00000000-0000-0000-0000-000000000001";
  const { data: settings } = await db.from("shop_settings").select("*").eq("workspace_id", workspaceId).single();
  if (!settings) return [];

  const { data: clk } = await db.from("shop_settings").select("sim_offset_minutes").eq("workspace_id", workspaceId).single();
  const today = new Date(Date.now() + (clk?.sim_offset_minutes ?? 0) * 60_000 + 8 * 3600_000);
  const from = new Date(today);
  from.setDate(from.getDate() + 1);
  const to = new Date(today);
  to.setDate(to.getDate() + 21);

  const [{ data: bookings }, { data: blocks }] = await Promise.all([
    db
      .from("bookings")
      .select("id,service_date,start_time,end_time,duration_minutes,zone_id,status")
      .eq("workspace_id", workspaceId)
      .gte("service_date", isoDate(from))
      .lte("service_date", isoDate(to))
      .neq("status", "cancelled"),
    db.from("availability_blocks").select("block_date,start_time,end_time").eq("workspace_id", workspaceId).gte("block_date", isoDate(from)).lte("block_date", isoDate(to)),
  ]);

  const workStart = toMin(settings.work_start);
  const workEnd = toMin(settings.work_end);
  const lunchStart = toMin(settings.lunch_start);
  const lunchEnd = toMin(settings.lunch_end);
  const out: DayAvailability[] = [];

  for (let i = 0; i < 21; i++) {
    const day = new Date(from);
    day.setDate(from.getDate() + i);
    const iso = isoDate(day);
    const dow = day.getDay();
    if (!settings.work_days.includes(dow === 0 ? 7 : dow) && !settings.work_days.includes(dow)) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dayBlocks = (blocks ?? []).filter((b: any) => b.block_date === iso);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (dayBlocks.some((b: any) => !b.start_time || !b.end_time)) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dayJobs = (bookings ?? []).filter((b: any) => b.service_date === iso && b.id !== opts.excludeBookingId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booked = dayJobs.reduce((s: number, b: any) => s + b.duration_minutes, 0);
    if (booked + duration > settings.max_minutes_per_day) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sameZoneToday = dayJobs.some((b: any) => b.zone_id === zoneId);

    const busy: Array<{ start: number; end: number }> = [
      { start: lunchStart, end: lunchEnd },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...dayJobs.map((b: any) => {
        const buffer = b.zone_id === zoneId ? TRAVEL_SAME_ZONE : TRAVEL_CROSS_ZONE;
        return { start: toMin(b.start_time) - buffer, end: toMin(b.end_time) + buffer };
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...dayBlocks.map((b: any) => ({ start: toMin(b.start_time), end: toMin(b.end_time) })),
    ];

    const step = settings.peak_mode ? 15 : 30;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zoneJobs = dayJobs.filter((b: any) => b.zone_id === zoneId).map((b: any) => ({ s: toMin(b.start_time), e: toMin(b.end_time) }));
    const slots: string[] = [];
    const clustered: string[] = [];
    for (let t = workStart; t + duration <= workEnd; t += step) {
      if (busy.some((b) => t < b.end && t + duration > b.start)) continue;
      slots.push(toTime(t));
      if (zoneJobs.some((j) => (t >= j.e && t - j.e <= CLUSTER_GAP) || (j.s >= t + duration && j.s - (t + duration) <= CLUSTER_GAP))) clustered.push(toTime(t));
    }
    if (slots.length) out.push({ date: iso, best: sameZoneToday, slots, clustered });
  }
  return out;
}
