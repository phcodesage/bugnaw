/** Simple zone-based routing: 15 min drive inside a zone, 40 min between zones. */
export const SAME_ZONE_MIN = 15;
export const CROSS_ZONE_MIN = 40;

type RouteJob = { id: string; start_time: string; status: string; zone: { name: string; slug: string; color: string } };

export type RouteSummary = {
  legs: Array<{ zone: RouteJob["zone"]; count: number }>;
  hops: number;
  driveMin: number;
  savedMin: number;
  revisits: string[];
};

export function routeSummary(jobs: RouteJob[]): RouteSummary {
  const list = jobs.filter((j) => j.status !== "cancelled").sort((a, b) => a.start_time.localeCompare(b.start_time));
  const legs: RouteSummary["legs"] = [];
  let drive = 0;
  for (let i = 0; i < list.length; i++) {
    const j = list[i]!;
    const last = legs[legs.length - 1];
    if (last && last.zone.slug === j.zone.slug) {
      last.count++;
      drive += SAME_ZONE_MIN;
    } else {
      if (last) drive += CROSS_ZONE_MIN;
      legs.push({ zone: j.zone, count: 1 });
    }
  }
  const transitions = Math.max(0, list.length - 1);
  const seen = new Set<string>();
  const revisits = new Set<string>();
  for (const l of legs) {
    if (seen.has(l.zone.slug)) revisits.add(l.zone.name);
    seen.add(l.zone.slug);
  }
  return {
    legs,
    hops: Math.max(0, legs.length - 1),
    driveMin: drive,
    // Without clustering every job would be its own cross-zone trip.
    savedMin: transitions * CROSS_ZONE_MIN - drive,
    revisits: [...revisits],
  };
}

/** Travel saved across many days (jobs grouped per service_date). */
export function weekSaved(jobs: Array<RouteJob & { service_date: string }>) {
  const byDay = new Map<string, Array<RouteJob & { service_date: string }>>();
  for (const j of jobs) byDay.set(j.service_date, [...(byDay.get(j.service_date) ?? []), j]);
  let saved = 0;
  let drive = 0;
  for (const d of byDay.values()) {
    const r = routeSummary(d);
    saved += r.savedMin;
    drive += r.driveMin;
  }
  return { saved, drive };
}
