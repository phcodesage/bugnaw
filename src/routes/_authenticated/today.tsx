import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Navigation, KeyRound, Clock, CloudRain, Route as RouteIcon } from "lucide-react";

import { OwnerShell } from "@/components/OwnerShell";
import { Button } from "@/components/ui/button";
import { getSimClock } from "@/lib/automation.functions";
import { getJobsInRange, updateJobStatus, getMyRole, claimOwner, cancelAfternoonForWeather, type OwnerJob } from "@/lib/owner.functions";
import { routeSummary, weekSaved, CROSS_ZONE_MIN, SAME_ZONE_MIN } from "@/lib/route";
import { peso, timeLabel, minutesLabel, dateLabel } from "@/lib/format";
import { EmptyState, LoadingState, StatusBadge } from "@/components/BugnawUI";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({
    meta: [
      { title: "Today's jobs — Bugnaw Aircon Care" },
      { name: "description", content: "Jun's route for today: jobs in driving order with call, map and status buttons." },
      { property: "og:title", content: "Today's jobs — Bugnaw Aircon Care" },
      { property: "og:description", content: "Jobs in driving order with call, map and status buttons." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TodayView,
});

const STATUSES: Array<{ key: string; label: string }> = [
  { key: "on_the_way", label: "On the way" },
  { key: "arrived", label: "Arrived" },
  { key: "done", label: "Done" },
  { key: "not_home", label: "Wala tao" },
];

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  on_the_way: "On the way",
  arrived: "Arrived",
  done: "Done",
  not_home: "Customer not home",
  cancelled: "Cancelled",
};

function addDaysIso(iso: string, offset: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function TodayView() {
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const clock = useQuery({ queryKey: ["sim-clock"], queryFn: () => getSimClock() });
  const base = clock.data?.today ?? new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
  const date = addDaysIso(base, offset);

  const role = useQuery({
    queryKey: ["my-role"],
    queryFn: () => getMyRole(),
    // Right after sign-in (especially the demo, which may be refreshing its sandbox) the role can lag briefly.
    refetchInterval: (q) => (q.state.data && !q.state.data.role && q.state.dataUpdateCount < 6 ? 1500 : false),
  });
  const roleTries = qc.getQueryState(["my-role"])?.dataUpdateCount ?? 0;
  const roleSettling = role.isLoading || (!!role.data && !role.data.role && roleTries < 6);
  const jobs = useQuery({
    queryKey: ["jobs", date],
    queryFn: () => getJobsInRange({ data: { from: date, to: date } }),
  });

  const monday = (() => {
    const d = new Date(`${date}T00:00:00Z`);
    return addDaysIso(date, -((d.getUTCDay() + 6) % 7));
  })();
  const week = useQuery({
    queryKey: ["jobs", "week", monday],
    queryFn: () => getJobsInRange({ data: { from: monday, to: addDaysIso(monday, 5) } }),
  });
  const saved = week.data ? weekSaved(week.data).saved : null;
  const route = useMemo(() => routeSummary(jobs.data ?? []), [jobs.data]);
  const afternoonCount = (jobs.data ?? []).filter((j) => ["confirmed", "on_the_way"].includes(j.status) && j.start_time >= "12:00").length;

  const weather = useMutation({
    mutationFn: () => cancelAfternoonForWeather({ data: { date } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["outbox"] });
    },
  });

  const claim = useMutation({
    mutationFn: () => claimOwner(),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateJobStatus({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["outbox"] });
    },
  });

  const grouped = useMemo(() => {
    const list = (jobs.data ?? []).filter((j) => j.status !== "cancelled");
    const out: Array<{ zone: OwnerJob["zone"]; jobs: OwnerJob[] }> = [];
    for (const job of list) {
      const last = out[out.length - 1];
      if (last && last.zone.slug === job.zone.slug) last.jobs.push(job);
      else out.push({ zone: job.zone, jobs: [job] });
    }
    return out;
  }, [jobs.data]);

  const totalMinutes = (jobs.data ?? []).filter((j) => j.status !== "cancelled").reduce((s, j) => s + j.duration_minutes, 0);
  const totalPesos = (jobs.data ?? []).filter((j) => j.status !== "cancelled").reduce((s, j) => s + j.total_php, 0);

  if (roleSettling) {
    return (
      <OwnerShell title="Getting your dashboard ready">
        <LoadingState label="Preparing today's jobs…" rows={3} />
      </OwnerShell>
    );
  }

  if (role.data && !role.data.role) {
    return (
      <OwnerShell title="Almost there">
        <div className="app-card">
          {role.data.ownerExists ? (
            <p>This account isn't the owner account. Sign in with Jun's account to see the jobs.</p>
          ) : (
            <>
              <p>No owner has been set yet. Claim this account as Jun's owner account to unlock the dashboard.</p>
              <Button className="tap mt-4 w-full" disabled={claim.isPending} onClick={() => claim.mutate()}>
                Make this the owner account
              </Button>
              {claim.data && !claim.data.ok && <p className="mt-2 text-sm text-destructive">{claim.data.error}</p>}
            </>
          )}
        </div>
      </OwnerShell>
    );
  }

  return (
    <OwnerShell
      title={offset === 0 ? `Today — ${dateLabel(date, { weekday: "long", month: "short", day: "numeric" })}` : dateLabel(date, { weekday: "long", month: "long", day: "numeric" })}
      subtitle={(() => { const n = grouped.reduce((s, g) => s + g.jobs.length, 0); return `${n} ${n === 1 ? "job" : "jobs"} · ${minutesLabel(totalMinutes)} · ${peso(totalPesos)}`; })()}
    >
      <div className="mb-4 flex gap-2">
        <Button variant="outline" className="tap flex-1" onClick={() => setOffset(offset - 1)}>
          Previous day
        </Button>
        <Button variant="outline" className="tap flex-1" onClick={() => setOffset(offset + 1)}>
          Next day
        </Button>
      </div>

      {route.legs.length > 0 && (
        <div className="app-card mb-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <RouteIcon className="h-4 w-4 text-primary" /> Route
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
            {route.legs.map((l, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground">→</span>}
                 <span className="app-badge app-badge-muted">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.zone.color }} />
                  {l.zone.name} ×{l.count}
                </span>
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {route.hops} zone {route.hops === 1 ? "hop" : "hops"} · ~{minutesLabel(route.driveMin)} driving · {minutesLabel(route.savedMin)} saved today
          </p>
          {route.revisits.length > 0 && (
            <p className="mt-2 rounded-xl bg-warm/15 p-2 text-xs">
              Tip: you go back to {route.revisits.join(", ")} later. Moving those jobs next to each other would save up to {CROSS_ZONE_MIN * 2 - SAME_ZONE_MIN} min.
            </p>
          )}
          {saved !== null && (
            <p className="mt-3 border-t border-border pt-3 text-sm">
              Travel time saved this week: <span className="font-display text-lg font-semibold">{minutesLabel(saved)}</span>
            </p>
          )}
        </div>
      )}

      {afternoonCount > 0 && (
        <Button
          variant="outline"
          className="tap mb-4 w-full border-destructive/40 text-destructive"
          disabled={weather.isPending}
          onClick={() => {
            if (confirm(`Cancel ${afternoonCount} afternoon job(s) for bad weather? Each customer gets an apology and a free reschedule link.`)) weather.mutate();
          }}
        >
          <CloudRain className="mr-2 h-4 w-4" /> Bad weather — cancel afternoon ({afternoonCount})
        </Button>
      )}
      {weather.data && <p className="mb-4 rounded-xl bg-primary/10 p-3 text-sm">Cancelled {weather.data.cancelled} job(s). Apologies and reschedule links sent — check the Outbox.</p>}

      {jobs.isLoading && <LoadingState label="Loading today’s route…" rows={3} />}

      {jobs.data && grouped.length === 0 && (
        <EmptyState title="No jobs today" text="Pahuway sa — rest up, Jun." />
      )}

      <div className="space-y-6">
        {grouped.map((group, gi) => (
          <section key={group.zone.slug + gi}>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.zone.color }} />
              <h2 className="font-display text-lg font-semibold">{group.zone.name}</h2>
              <span className="text-sm text-muted-foreground">
                stop {gi + 1} of {grouped.length}
              </span>
            </div>
            <div className="space-y-3">
              {group.jobs.map((job) => (
                <motion.article initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} key={job.id} className={`rounded-2xl border border-lp-ink/5 bg-card p-5 shadow-lift ${job.at_risk ? "ring-2 ring-destructive" : ""}`}>
                  {(job.at_risk || job.customer_confirmed || job.deposit_forfeited) && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {job.at_risk && (
                        <StatusBadge tone="danger">
                          At risk — not confirmed · slot offered to waitlist
                        </StatusBadge>
                      )}
                       {job.customer_confirmed && <StatusBadge tone="success">Customer confirmed home</StatusBadge>}
                       {job.deposit_forfeited && <StatusBadge tone="muted">Deposit kept</StatusBadge>}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {timeLabel(job.start_time)} <span className="text-muted-foreground">– {timeLabel(job.end_time)}</span>
                      </p>
                      <p className="mt-1 font-medium">{job.customer.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{peso(job.total_php)}</p>
                      <p className="text-xs text-muted-foreground">{job.reference}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm">{job.customer.address}</p>
                  {job.customer.landmark && <p className="text-sm text-muted-foreground">{job.customer.landmark}</p>}
                  {job.customer.access_notes && (
                    <p className="mt-2 flex items-start gap-2 rounded-xl bg-warm/15 p-3 text-sm">
                      <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-warm-foreground" />
                      {job.customer.access_notes}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="tap">
                      <a href={`tel:${job.customer.mobile}`}>
                        <Phone className="mr-2 h-4 w-4" /> Call
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="tap">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${job.customer.address}, ${job.zone.name}, Cebu`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Navigation className="mr-2 h-4 w-4" /> Maps
                      </a>
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setStatus.mutate({ id: job.id, status: s.key })}
                        className={`tap rounded-xl border px-3 text-sm font-medium ${
                          job.status === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {STATUS_LABEL[job.status]} · {minutesLabel(job.duration_minutes)}
                  </p>
                </motion.article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </OwnerShell>
  );
}
