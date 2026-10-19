import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarPlus, CheckCircle2, Snowflake, MapPin, Clock } from "lucide-react";
import junPortrait from "@/assets/portraits/jun.jpg";
import { Portrait } from "@/components/BugnawUI";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBookingByReference, cancelBooking, getManageState, confirmPresence, getRescheduleSlots, rescheduleBooking } from "@/lib/booking.functions";
import { peso, minutesLabel, timeLabel, dateLabel } from "@/lib/format";

export const Route = createFileRoute("/booking/$reference")({
  validateSearch: z.object({ t: z.string().optional() }),
  loader: async ({ params }) => {
    const booking = await getBookingByReference({ data: { reference: params.reference } });
    if (!booking) throw notFound();
    return booking;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Booking ${loaderData.reference} — Bugnaw Aircon Care` : "Booking — Bugnaw Aircon Care" },
      { name: "description", content: "Your Bugnaw Aircon Care booking details, add-to-calendar and cancellation." },
      { property: "og:title", content: "Your Bugnaw Aircon Care booking" },
      { property: "og:description", content: "Booking summary, add to calendar, reschedule or cancel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <Shell>
      <h1 className="font-display text-2xl font-semibold">Booking not found</h1>
      <p className="mt-2 text-muted-foreground">Please double-check the reference code (it looks like BGN-2417).</p>
      <Button asChild className="tap mt-6 w-full">
        <Link to="/find-booking">Find my booking</Link>
      </Button>
      <Button asChild variant="outline" className="tap mt-3 w-full">
        <Link to="/" className="inline-flex min-h-11 items-center">Back to home</Link>
      </Button>
    </Shell>
  ),
  errorComponent: () => (
    <Shell>
      <h1 className="font-display text-2xl font-semibold">We couldn't load this booking</h1>
      <Button asChild className="tap mt-6 w-full">
        <Link to="/book">Back to booking</Link>
      </Button>
    </Shell>
  ),
  component: BookingDetail,
});

function Shell({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <main className="app-shell">
      <div className="bg-lp-ink px-4 pb-20 pt-8">
        <div className="mx-auto flex max-w-xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/book" className="flex min-h-11 items-center gap-2 text-frostwhite">
            <Snowflake className="h-5 w-5" />
            <span className="font-oswald text-2xl font-bold">Bugnaw</span>
          </Link>
          <Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium text-frostwhite/80 underline-offset-4 hover:text-frostwhite hover:underline">← Back to home</Link>
        </div>
      </div>
      <div className="mx-auto -mt-10 max-w-xl px-4 pb-16">
        <motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card p-6 shadow-xl sm:p-8">{children}</motion.div>
      </div>
    </main>
  );
}

function BookingDetail() {
  const b = Route.useLoaderData();
  const { t } = Route.useSearch();
  const [last4, setLast4] = useState("");
  const [msg, setMsg] = useState("");
  const [cancelled, setCancelled] = useState(b.status === "cancelled");
  const [showCancel, setShowCancel] = useState(false);

  function calendarLink() {
    const start = `${b.service_date.replace(/-/g, "")}T${b.start_time.slice(0, 5).replace(":", "")}00`;
    const end = `${b.service_date.replace(/-/g, "")}T${b.end_time.slice(0, 5).replace(":", "")}00`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "Bugnaw Aircon Care service",
      dates: `${start}/${end}`,
      details: `Booking ${b.reference}. Someone 18+ must be home.`,
      location: b.address,
      ctz: "Asia/Manila",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  async function doCancel() {
    const res = await cancelBooking({ data: { reference: b.reference, last4 } });
    if (res.ok) {
      setCancelled(true);
      setMsg("");
    } else setMsg(res.error);
  }

  return (
    <Shell>
      {cancelled ? (
        <>
          <h1 className="font-display text-2xl font-semibold">Booking cancelled</h1>
          <p className="mt-2 text-muted-foreground">
            {b.reference} is cancelled.
          </p>
          {t && <ManagePanel reference={b.reference} token={t} />}
          <Button asChild className="tap mt-6 w-full">
            <Link to="/book">Book a new schedule</Link>
          </Button>
        </>
      ) : (
        <>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180 }} className="grid h-16 w-16 place-items-center rounded-full bg-success/15"><CheckCircle2 className="h-9 w-9 text-success" /></motion.div>
          <h1 className="mt-4 font-oswald text-4xl font-bold uppercase">You're booked, {b.customer_name.split(" ")[0]}!</h1>
          <p className="mt-1 text-muted-foreground">Jun has your slot locked in. Kita-kits!</p>

          <p className="mt-5 inline-block rounded-full bg-primary px-4 py-2 font-display text-lg font-semibold tracking-wider text-primary-foreground">
            {b.reference}
          </p>

          <div className="ice-panel mt-5 rounded-2xl p-4">
            <p className="font-medium">{dateLabel(b.service_date, { weekday: "long", month: "long", day: "numeric" })}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {timeLabel(b.start_time)} – {timeLabel(b.end_time)} ({minutesLabel(b.duration_minutes)})
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {b.address} · {b.zone_name}
            </p>
            <div className="mt-3 border-t border-border pt-3">
              {b.items.map((i) => (
                <div key={i.name} className="flex justify-between text-sm">
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <span className="tabular-nums">{peso(i.unit_price * i.quantity)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between font-medium">
                <span>Total</span>
                <span>{peso(b.total_php)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Deposit paid</span>
                <span>−{peso(b.deposit_php)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm font-medium">
                <span>Balance after service</span>
                <span>{peso(b.total_php - b.deposit_php)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-2xl bg-lp-bg p-4"><Portrait src={junPortrait} name="Jun Villanueva" className="h-16 w-16 ring-lp-bg" /><div><p className="font-semibold text-lp-ink">Jun will see you on {dateLabel(b.service_date, { month: "short", day: "numeric" })}.</p><p className="mt-1 text-sm text-lp-muted">He’ll message when he’s on the way. Kita-kits!</p></div></div>

          {t && <ManagePanel reference={b.reference} token={t} />}

          <Button asChild className="tap mt-5 w-full text-base">
            <a href={calendarLink()} target="_blank" rel="noreferrer">
              <CalendarPlus className="mr-2 h-4 w-4" /> Add to calendar
            </a>
          </Button>

          {!showCancel ? (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="mt-4 w-full text-sm text-muted-foreground underline underline-offset-4"
            >
              Reschedule or cancel
            </button>
          ) : (
            <div className="mt-5 rounded-2xl border border-border p-4">
              <p className="text-sm">
                To reschedule, cancel this booking then pick a new slot. Confirm with the last 4 digits of your mobile
                number.
              </p>
              <div className="mt-3 space-y-2">
                <Label htmlFor="last4">Last 4 digits</Label>
                <Input id="last4" className="tap" inputMode="numeric" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value)} />
              </div>
              {msg && <p className="mt-2 text-sm text-destructive">{msg}</p>}
              <Button variant="destructive" className="tap mt-3 w-full" disabled={last4.length !== 4} onClick={doCancel}>
                Cancel booking
              </Button>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

function ManagePanel({ reference, token }: { reference: string; token: string }) {
  const state = useQuery({ queryKey: ["manage", reference, token], queryFn: () => getManageState({ data: { reference, token } }) });
  const [mode, setMode] = useState<"idle" | "resched">("idle");
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const slots = useQuery({
    queryKey: ["resched-slots", reference, token],
    enabled: mode === "resched",
    queryFn: () => getRescheduleSlots({ data: { reference, token } }),
  });
  const s = state.data;
  if (!s || s.status !== "confirmed") return null;

  async function confirm() {
    setBusy(true);
    const r = await confirmPresence({ data: { reference, token } });
    setBusy(false);
    if (r.ok) {
      setDone("Salamat! Jun knows someone will be home. Kita-kits!");
      state.refetch();
    } else setErr(r.error);
  }
  async function move(date: string, startTime: string) {
    setBusy(true);
    setErr("");
    const r = await rescheduleBooking({ data: { reference, token, date, startTime } });
    setBusy(false);
    if (r.ok) window.location.reload();
    else setErr(r.error);
  }

  return (
    <div className="mt-5 rounded-2xl border-2 border-primary/30 p-4">
      {s.weather ? (
        <p className="rounded-xl bg-warm/15 p-3 text-sm">🌧️ Pasensya — this job was rained out. Your deposit is safe. Pick a new time below, free of charge.</p>
      ) : s.confirmed || done ? (
        <p className="flex items-center gap-2 font-medium text-primary">
          <CheckCircle2 className="h-5 w-5" /> {done || "You confirmed someone 18+ will be home."}
        </p>
      ) : (
        <Button className="tap w-full text-base" disabled={busy} onClick={confirm}>
          Yes, someone will be home
        </Button>
      )}
      <Button variant="outline" className="tap mt-2 w-full" onClick={() => setMode(mode === "resched" ? "idle" : "resched")}>
        Reschedule
      </Button>
      {mode === "resched" && (
        <div className="mt-3">
          <p className={`rounded-xl px-3 py-2 text-sm ${s.freeReschedule ? "bg-primary/10" : "bg-destructive/10 text-destructive"}`}>
            {s.freeReschedule
              ? "Free to move — more than 24 hours before your slot."
              : "Less than 24 hours before your slot: you can still move it, but the deposit will be forfeited."}
          </p>
          {slots.isLoading && <p className="mt-2 text-sm text-muted-foreground">Finding open times…</p>}
          <div className="mt-2 max-h-80 space-y-3 overflow-y-auto">
            {(slots.data ?? []).slice(0, 7).map((d) => (
              <div key={d.date}>
                <p className="text-sm font-medium">
                  {dateLabel(d.date, { weekday: "short", month: "short", day: "numeric" })}
                  {d.best && <span className="ml-2 text-xs text-primary">Jun is in your area</span>}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {d.slots.map((t) => (
                    <button key={t} type="button" disabled={busy} onClick={() => move(d.date, t)} className="tap rounded-xl border border-border px-3 text-sm hover:border-primary">
                      {timeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
    </div>
  );
}
