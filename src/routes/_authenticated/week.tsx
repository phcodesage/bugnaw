import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { OwnerShell } from "@/components/OwnerShell";
import { Button } from "@/components/ui/button";
import { getJobsInRange } from "@/lib/owner.functions";
import { peso, timeLabel, dateLabel, minutesLabel } from "@/lib/format";
import { weekSaved } from "@/lib/route";
import { LoadingState } from "@/components/BugnawUI";

export const Route = createFileRoute("/_authenticated/week")({
  head: () => ({
    meta: [
      { title: "Week schedule — Bugnaw Aircon Care" },
      { name: "description", content: "Jun's week at a glance, colour-coded by service zone." },
      { property: "og:title", content: "Week schedule — Bugnaw Aircon Care" },
      { property: "og:description", content: "Jun's week at a glance, colour-coded by service zone." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WeekView,
});

/** Manila "today" as YYYY-MM-DD. */
function manilaToday() {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
}

function WeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const todayIso = manilaToday();
  const base = new Date(`${todayIso}T00:00:00Z`);
  const mondayShift = (base.getUTCDay() + 6) % 7;
  base.setUTCDate(base.getUTCDate() - mondayShift + weekOffset * 7);
  const days: string[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const jobs = useQuery({
    queryKey: ["jobs", "week", days[0]!],
    queryFn: () => getJobsInRange({ data: { from: days[0]!, to: days[days.length - 1]! } }),
  });

  return (
    <OwnerShell
      title="This week"
      subtitle={`${dateLabel(days[0]!, { month: "short", day: "numeric" })} – ${dateLabel(days[5]!, { month: "short", day: "numeric" })}`}
    >
      <div className="mb-4 grid w-full min-w-0 grid-cols-3 gap-1.5 sm:gap-2">
        <Button variant="outline" className="tap min-w-0 px-2 sm:px-4" onClick={() => setWeekOffset(weekOffset - 1)}>
          Last week
        </Button>
        <Button variant="outline" className="tap min-w-0 px-2 sm:px-4" onClick={() => setWeekOffset(0)}>
          This week
        </Button>
        <Button variant="outline" className="tap min-w-0 px-2 sm:px-4" onClick={() => setWeekOffset(weekOffset + 1)}>
          Next week
        </Button>
      </div>

      {jobs.data && (() => {
        const w = weekSaved(jobs.data);
        return (
          <div className="mb-4 rounded-3xl bg-warm/15 p-4">
            <p className="text-sm text-muted-foreground">Travel time saved this week by zone clustering</p>
            <p className="font-display text-3xl font-semibold">{minutesLabel(w.saved)}</p>
            <p className="text-xs text-muted-foreground">Driving planned: {minutesLabel(w.drive)} · vs. {minutesLabel(w.drive + w.saved)} if every job were a cross-zone trip</p>
          </div>
        );
      })()}

      {jobs.isLoading && <LoadingState label="Loading this week…" rows={4} />}

      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {days.map((iso) => {
          const dayJobs = (jobs.data ?? []).filter((j) => j.service_date === iso && j.status !== "cancelled");
          const minutes = dayJobs.reduce((s, j) => s + j.duration_minutes, 0);
          return (
            <div key={iso} className={`min-h-52 min-w-0 overflow-hidden rounded-2xl border border-lp-ink/5 bg-card p-4 shadow-lift ${iso === todayIso ? "ring-2 ring-primary" : ""}`}>
              <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-display text-lg font-semibold">{dateLabel(iso, { weekday: "long", day: "numeric", month: "short" })}</p>
                <p className="text-sm text-muted-foreground">
                  {dayJobs.length ? `${dayJobs.length} ${dayJobs.length === 1 ? "job" : "jobs"} · ${minutesLabel(minutes)}` : "Free"}
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {dayJobs.map((j) => (
                  <div
                    key={j.id}
                    className="flex min-w-0 items-center gap-2 rounded-xl border-l-4 bg-frost p-3 sm:gap-3"
                    style={{ borderLeftColor: j.zone.color }}
                  >
                    <span className="w-[4.5rem] shrink-0 text-sm font-medium tabular-nums sm:w-20">{timeLabel(j.start_time)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {j.customer.full_name} · <span className="text-muted-foreground">{j.zone.name}</span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums">{peso(j.total_php)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </OwnerShell>
  );
}
