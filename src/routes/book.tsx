import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Snowflake,
  Check,
  Minus,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";

import heroImage from "@/assets/lp-hero.jpg";
import splitImage from "@/assets/jun-service-split.jpg";
import windowImage from "@/assets/jun-service-window.jpg";
import checkupImage from "@/assets/jun-service-checkup.jpg";
import freonImage from "@/assets/jun-service-freon.jpg";
import carePlanImage from "@/assets/lp-care-plan.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getBookingOptions, getAvailability, createBooking, openLead, joinWaitlist } from "@/lib/booking.functions";
import { peso, minutesLabel, timeLabel, dateLabel, isValidPhMobile } from "@/lib/format";
import { fill, LangSwitch, useT } from "@/lib/i18n";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Bugnaw Aircon Care — Book an aircon cleaning in Cebu" },
      {
        name: "description",
        content:
          "Book Jun Villanueva for split-type and window-type aircon cleaning, check-ups and freon recharge in Mandaue, Cebu City, Lapu-Lapu and Consolacion. Pick a slot in under a minute.",
      },
      { property: "og:title", content: "Bugnaw Aircon Care — Book an aircon cleaning in Cebu" },
      {
        property: "og:description",
        content: "Cool again, fast. Real-time slots, ₱200 GCash deposit, honest pricing across Metro Cebu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: z.object({
    lead: z.string().optional(),
    service: z.string().optional(),
    units: z.coerce.number().int().min(1).max(10).optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    plan: z.string().optional(),
  }),
  loader: () => getBookingOptions(),
  component: BookingPage,
});

type Cart = Record<string, number>;

const SERVICE_IMAGES: Record<string, string> = {
  "split-clean": splitImage,
  "window-clean": windowImage,
  checkup: checkupImage,
  freon: freonImage,
  "care-plan": carePlanImage,
};

function BookingPage() {
  const t = useT();
  const b = t.booking;
  const loaderData = Route.useLoaderData();
  const { services = [], zones = [], depositPhp = 200, peakMode = false } = loaderData ?? {};
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<Cart>({});
  const [zoneId, setZoneId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    address: "",
    landmark: "",
    accessNotes: "",
    adultPresent: false,
  });
  const [mobileTouched, setMobileTouched] = useState(false);
  const [error, setError] = useState("");
  const { lead, service, units, date: prefillDate, time: prefillTime, plan } = Route.useSearch();
  useEffect(() => {
    if (lead || !service) return;
    const match = services.find((s) => s.slug === service);
    if (match) setCart({ [match.id]: units ?? 1 });
  }, [lead, service, units, services]);
  const [leadWelcome, setLeadWelcome] = useState(false);

  useEffect(() => {
    if (!lead) return;
    let alive = true;
    openLead({ data: { token: lead } }).then((p) => {
      if (!alive || !p) return;
      if (p.serviceId) setCart({ [p.serviceId]: p.units });
      if (p.zoneId) setZoneId(p.zoneId);
      if (p.customerName && p.customerName !== "Website visitor")
        setForm((f) => ({ ...f, fullName: f.fullName || p.customerName }));
      if (p.barangay) setForm((f) => ({ ...f, address: f.address || `${p.barangay}, ` }));
      if (p.serviceId && p.zoneId) setStep(2);
      if (prefillDate) setDate(prefillDate);
      if (prefillTime) setStartTime(prefillTime.length === 5 ? `${prefillTime}:00` : prefillTime);
      setLeadWelcome(true);
    });
    return () => {
      alive = false;
    };
  }, [lead, prefillDate, prefillTime]);

  const totals = useMemo(() => {
    let price = 0;
    let minutes = 0;
    const lines: Array<{ name: string; qty: number; price: number }> = [];
    for (const s of services) {
      const qty = cart[s.id] ?? 0;
      if (!qty) continue;
      price += s.price_php * qty;
      minutes += s.duration_minutes * qty;
      lines.push({ name: s.name, qty, price: s.price_php * qty });
    }
    return { price, minutes, lines };
  }, [cart, services]);

  const zone = zones.find((z) => z.id === zoneId);

  const availability = useQuery({
    queryKey: ["availability", zoneId, totals.minutes],
    enabled: step === 2 && !!zoneId && totals.minutes > 0,
    queryFn: () => getAvailability({ data: { zoneId, durationMinutes: totals.minutes } }),
  });

  const submit = useMutation({
    mutationFn: (depositReference: string) =>
      createBooking({
        data: {
          items: Object.entries(cart)
            .filter(([, q]) => q > 0)
            .map(([service_id, quantity]) => ({ service_id, quantity })),
          zoneId,
          date,
          startTime,
          ...form,
          depositReference,
          ...(lead ? { leadToken: lead } : {}),
        },
      }),
    onSuccess: (res) => {
      if (res.ok) navigate({ to: "/booking/$reference", params: { reference: res.reference } });
      else setError(res.error);
    },
    onError: () => setError(b.error),
  });

  const setQty = (id: string, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, Math.min(10, (c[id] ?? 0) + delta));
      return { ...c, [id]: next };
    });

  const detailsValid =
    form.fullName.trim().length > 1 &&
    isValidPhMobile(form.mobile) &&
    form.address.trim().length > 4 &&
    form.adultPresent;

  return (
    <main className={`app-shell ${step === 1 ? "pb-48 sm:pb-24" : "pb-24"}`}>
      <Hero />

      <section
        id="book"
        className={`relative z-10 mx-auto -mt-10 px-4 transition-[max-width] ${step === 1 ? "max-w-7xl" : "max-w-3xl"}`}
      >
        <div data-tour="booking" className="rounded-2xl bg-card p-5 shadow-xl sm:p-8">
          {leadWelcome && <p className="mb-4 rounded-2xl bg-accent/20 px-4 py-3 text-sm">{b.leadWelcome}</p>}
          {plan === "care" && (
            <p className="mb-4 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">{b.carePlan}</p>
          )}
          <Stepper step={step} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduced ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
              transition={{ duration: 0.24 }}
            >
              {step === 1 && (
                <div className="mt-6">
                  <h2 className="font-display text-xl font-semibold">{b.needTitle}</h2>
                  <p className="text-sm text-muted-foreground">{b.needSub}</p>
                  <div className="mt-5 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((s) => {
                      const qty = cart[s.id] ?? 0;
                      return (
                        <article
                          key={s.id}
                          className={`flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border transition-all ${qty ? "border-primary bg-primary/5 shadow-md" : "border-lp-ink/8 bg-card"}`}
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden">
                            <img
                              src={SERVICE_IMAGES[s.slug] ?? carePlanImage}
                              alt={`${s.name} by Jun Villanueva`}
                              width={1200}
                              height={896}
                              loading="lazy"
                              className="h-full w-full object-cover object-center"
                            />
                            {qty > 0 && (
                              <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-md">
                                <Check className="mr-1 h-3.5 w-3.5" /> {qty} {qty === 1 ? b.unit : b.units}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-4">
                            <h3 className="font-display text-lg font-semibold leading-tight">{s.name}</h3>
                            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">{s.description}</p>
                            <p className="mt-3 text-sm font-semibold text-primary">
                              {peso(s.price_php)} · {minutesLabel(s.duration_minutes)}
                            </p>
                            <div className="mt-auto flex w-full items-center justify-between border-t border-border/70 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label={`Remove one ${s.name}`}
                                onClick={() => setQty(s.id, -1)}
                                disabled={!qty}
                                className="h-11 w-11 shrink-0 rounded-full bg-background"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="min-w-12 text-center text-lg font-semibold tabular-nums">{qty}</span>
                              <Button
                                type="button"
                                size="icon"
                                aria-label={`Add one ${s.name}`}
                                onClick={() => setQty(s.id, 1)}
                                className="h-11 w-11 shrink-0 rounded-full"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-6 space-y-4">
                  <h2 className="font-display text-xl font-semibold">{b.whereWhen}</h2>
                  <div className="space-y-2">
                    <Label>{b.yourArea}</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {zones.map((z) => (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => {
                            setZoneId(z.id);
                            setDate("");
                            setStartTime("");
                          }}
                          className={`tap rounded-2xl border p-3 text-left transition-colors ${
                            zoneId === z.id ? "border-primary bg-frost" : "border-border"
                          }`}
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                            {z.name}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {z.barangays.slice(0, 4).join(", ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {zoneId && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>{fill(b.slots, { duration: minutesLabel(totals.minutes) })}</Label>
                        {availability.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                      {availability.data?.length === 0 && (
                        <p className="text-sm text-muted-foreground">{b.fullyBooked}</p>
                      )}
                      {peakMode && <p className="rounded-xl bg-warm/15 px-3 py-2 text-sm">{b.peak}</p>}
                      <div className="space-y-3">
                        {(availability.data ?? [])
                          .slice(0, 10)
                          .sort((a, b) => Number(b.best) - Number(a.best))
                          .map((day) => (
                            <div
                              key={day.date}
                              className={`rounded-2xl border p-3 ${day.best ? "border-warm bg-warm/10" : "border-border"}`}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">
                                  {dateLabel(day.date, {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                                {day.best && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-warm px-2.5 py-1 text-xs font-semibold text-warm-foreground">
                                    <Sparkles className="h-3 w-3" /> {b.inArea}
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {[...day.clustered, ...day.slots.filter((x) => !day.clustered.includes(x))].map(
                                  (slot) => {
                                    const active = date === day.date && startTime === slot;
                                    const hot = day.clustered.includes(slot);
                                    return (
                                      <button
                                        key={slot}
                                        data-tour={active ? "selected-slot" : undefined}
                                        type="button"
                                        onClick={() => {
                                          setDate(day.date);
                                          setStartTime(slot);
                                        }}
                                        className={`tap rounded-xl border px-4 text-sm font-medium transition-colors ${
                                          active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : hot
                                              ? "border-warm bg-warm/20"
                                              : "border-border bg-background"
                                        }`}
                                        title={hot ? b.bestSlot : undefined}
                                      >
                                        {hot && "★ "}
                                        {timeLabel(slot)}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                      {(peakMode || availability.data?.length === 0) && (
                        <WaitlistForm
                          zoneId={zoneId}
                          serviceSlug={
                            totals.lines.length
                              ? services.find((x) => x.name === totals.lines[0]!.name)?.slug
                              : undefined
                          }
                          units={totals.lines[0]?.qty ?? 1}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="mt-6 space-y-4">
                  <h2 className="font-display text-xl font-semibold">{b.whereGo}</h2>
                  <Field label={b.fullName}>
                    <Input
                      className="tap"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    />
                  </Field>
                  <Field
                    label={b.mobile}
                    hint={b.mobileHint}
                    error={
                      mobileTouched && form.mobile.trim() && !isValidPhMobile(form.mobile) ? b.mobileError : undefined
                    }
                  >
                    <Input
                      className="tap"
                      inputMode="numeric"
                      placeholder="09171234567"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      onBlur={() => setMobileTouched(true)}
                    />
                  </Field>
                  <Field label={b.address}>
                    <textarea
                      rows={2}
                      className="w-full rounded-xl border border-input bg-background p-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </Field>
                  <Field label={b.landmark} hint={b.landmarkHint}>
                    <Input
                      className="tap"
                      placeholder={b.landmarkPh}
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                    />
                  </Field>
                  <Field label={b.gate} hint={b.optional}>
                    <Input
                      className="tap"
                      placeholder={b.gatePh}
                      value={form.accessNotes}
                      onChange={(e) => setForm({ ...form, accessNotes: e.target.value })}
                    />
                  </Field>

                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-frost p-4">
                    <Checkbox
                      checked={form.adultPresent}
                      onCheckedChange={(v) => setForm({ ...form, adultPresent: v === true })}
                      className="mt-0.5 h-6 w-6"
                    />
                    <span className="text-sm">
                      <span className="font-medium">{b.adult}</span>
                      <span className="block text-muted-foreground">{b.adultNote}</span>
                    </span>
                  </label>
                </div>
              )}

              {step === 4 && (
                <GCashStep
                  amount={depositPhp}
                  total={totals.price}
                  busy={submit.isPending}
                  allowSkip={!peakMode}
                  onPaid={(ref) => submit.mutate(ref)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className={step === 1 ? "hidden sm:block" : undefined}>
            <Summary
              lines={totals.lines}
              price={totals.price}
              minutes={totals.minutes}
              zone={zone?.name}
              date={date}
              startTime={startTime}
              deposit={depositPhp}
            />
          </div>

          {step < 4 && (
            <div className={`mt-5 gap-3 ${step === 1 ? "hidden sm:flex" : "flex"}`}>
              {step > 1 && (
                <Button variant="outline" className="tap flex-1" onClick={() => setStep(step - 1)}>
                  {b.back}
                </Button>
              )}
              <Button
                className="tap flex-1 text-base"
                disabled={
                  (step === 1 && totals.minutes === 0) || (step === 2 && !startTime) || (step === 3 && !detailsValid)
                }
                onClick={() => {
                  setError("");
                  setStep(step + 1);
                }}
              >
                {step === 3 ? b.payDeposit : b.next} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
          {step === 1 && (
            <div className="fixed bottom-16 left-3 right-3 z-40 flex items-center gap-3 rounded-2xl border border-lp-ink/10 bg-card/95 p-3 shadow-xl backdrop-blur sm:hidden">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                {totals.lines.reduce((sum, line) => sum + line.qty, 0)}{" "}
                {totals.lines.reduce((sum, line) => sum + line.qty, 0) === 1 ? b.service : b.services} ·{" "}
                {peso(totals.price)}
              </p>
              <Button
                className="h-12 shrink-0 rounded-full px-5 text-base"
                disabled={totals.minutes === 0}
                onClick={() => setStep(2)}
              >
                {b.next} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
          {step === 4 && !submit.isPending && (
            <Button variant="ghost" className="tap mt-3 w-full" onClick={() => setStep(3)}>
              {b.backToDetails}
            </Button>
          )}
        </div>

        <TrustRow />
      </section>

      <footer className="mx-auto mt-14 max-w-2xl px-4 text-center text-sm text-muted-foreground">
        <p className="font-display text-base text-foreground">Bugnaw Aircon Care</p>
        <p className="mt-1">{b.hours}</p>
        <p className="mt-3">
          <Link to="/owner" className="inline-flex min-h-11 items-center underline underline-offset-4">
            {t.footer.ownerLogin}
          </Link>
        </p>
        <p className="mt-4">{b.signoff}</p>
      </footer>
    </main>
  );
}

function Hero() {
  const b = useT().booking;
  return (
    <header className="relative overflow-hidden bg-lp-ink pb-24 pt-10">
      <img
        src={heroImage}
        width={1920}
        height={1088}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-lp-ink/45" />
      <div className="relative mx-auto max-w-3xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex min-h-11 items-center gap-2 text-frostwhite">
            <Snowflake className="h-5 w-5" />
            <span className="font-oswald text-2xl font-bold">Bugnaw</span>
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center text-sm font-medium text-frostwhite/80 underline-offset-4 hover:text-frostwhite hover:underline"
          >
            {b.backHome}
          </Link>
          <LangSwitch />
        </div>
        <p className="mt-12 inline-flex items-center gap-2 rounded-full border border-lp-blue/60 px-4 py-1.5 text-sm text-lp-blue">
          <span className="h-2 w-2 rounded-full bg-lp-blue" />
          {b.badge}
        </p>
        <h1 className="mt-5 font-oswald text-5xl font-bold uppercase leading-none text-frostwhite sm:text-6xl">
          {b.h1a}
          <span className="text-lp-blue">{b.h1b}</span>
        </h1>
        <p className="mt-4 max-w-lg text-frostwhite/75">{b.sub}</p>
      </div>
    </header>
  );
}

function Stepper({ step }: { step: number }) {
  const STEPS = useT().booking.steps;
  return (
    <ol className="flex items-start gap-1 sm:gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="relative h-1.5 overflow-hidden rounded-full bg-lp-bg">
              <motion.span
                className="absolute inset-y-0 left-0 bg-primary"
                animate={{ width: done || active ? "100%" : "0%" }}
              />
            </span>
            <span className={`truncate text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {done ? <Check className="inline h-3 w-3" /> : null} {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  const id = React.useId();
  const errorId = `${id}-error`;
  const control = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{
          id?: string;
          "aria-invalid"?: boolean;
          "aria-describedby"?: string;
        }>,
        {
          id,
          ...(error ? { "aria-invalid": true, "aria-describedby": errorId } : {}),
        },
      )
    : children;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {hint && <span className="ml-2 font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {control}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Summary({
  lines,
  price,
  minutes,
  zone,
  date,
  startTime,
  deposit,
}: {
  lines: Array<{ name: string; qty: number; price: number }>;
  price: number;
  minutes: number;
  zone?: string | undefined;
  date: string;
  startTime: string;
  deposit: number;
}) {
  const b = useT().booking;
  if (!lines.length) return null;
  return (
    <div
      data-tour="booking-summary"
      className="sticky bottom-20 z-10 mt-6 rounded-2xl border border-lp-ink/8 bg-card/95 p-4 shadow-xl backdrop-blur sm:static sm:shadow-lift"
    >
      {lines.map((l) => (
        <div key={l.name} className="flex justify-between text-sm">
          <span>
            {l.name} × {l.qty}
          </span>
          <span className="tabular-nums">{peso(l.price)}</span>
        </div>
      ))}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {minutesLabel(minutes)}
          </p>
          {zone && (
            <p className="mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {zone}
            </p>
          )}
          {date && startTime && (
            <p className="mt-1">
              {dateLabel(date)} · {timeLabel(startTime)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold">{peso(price)}</p>
          <p className="text-xs text-muted-foreground">
            {peso(deposit)} {b.depositToday}
          </p>
        </div>
      </div>
    </div>
  );
}

function GCashStep({
  amount,
  total,
  busy,
  onPaid,
  allowSkip,
}: {
  amount: number;
  total: number;
  busy: boolean;
  allowSkip: boolean;
  onPaid: (reference: string) => void;
}) {
  const [phase, setPhase] = useState<"review" | "paying">("review");
  const b = useT().booking;

  function pay() {
    setPhase("paying");
    const ref = "GC" + Math.floor(100000000 + Math.random() * 899999999);
    setTimeout(() => onPaid(ref), 1400);
  }

  return (
    <div className="mt-6">
      <h2 className="font-display text-xl font-semibold">{fill(b.gcashTitle, { amount: peso(amount) })}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {fill(b.gcashSub, { total: peso(total), balance: peso(total - amount) })}
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-lp-blue/20 shadow-lift">
        <div className="flex items-center justify-between bg-lp-blue px-5 py-4 text-frostwhite">
          <span className="font-display text-lg font-semibold tracking-tight">GCash</span>
          <span className="text-xs opacity-80">{b.simulated}</span>
        </div>
        <div className="space-y-3 bg-card p-5">
          <Row label={b.payTo} value="Bugnaw Aircon Care" />
          <Row label={b.account} value="0917 •••• 4482" />
          <Row label={b.purpose} value={b.purposeValue} />
          <div className="flex items-end justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">{b.amountDue}</span>
            <span className="font-display text-3xl font-semibold">{peso(amount)}</span>
          </div>
          <Button className="tap w-full text-base" disabled={busy || phase === "paying"} onClick={pay}>
            {busy || phase === "paying" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {b.confirming}
              </>
            ) : (
              fill(b.payNow, { amount: peso(amount) })
            )}
          </Button>
          {allowSkip && (
            <Button
              variant="ghost"
              className="tap w-full"
              disabled={busy || phase === "paying"}
              onClick={() => onPaid("")}
            >
              {fill(b.skip, { total: peso(total) })}
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">{b.demoNote}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TrustRow() {
  const trust = useT().booking.trust;
  const items = [ShieldCheck, Clock, Phone].map((icon, i) => ({
    icon,
    title: trust[i]?.title ?? "",
    text: trust[i]?.text ?? "",
  }));
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {items.map((i, n) => (
        <div key={n} className="rounded-2xl border border-border bg-card p-4">
          <i.icon className="h-5 w-5 text-primary" />
          <p className="mt-2 font-medium">{i.title}</p>
          <p className="text-sm text-muted-foreground">{i.text}</p>
        </div>
      ))}
    </div>
  );
}

function WaitlistForm({
  zoneId,
  serviceSlug,
  units,
}: {
  zoneId: string;
  serviceSlug: string | undefined;
  units: number;
}) {
  const b = useT().booking;
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const join = useMutation({
    mutationFn: () =>
      joinWaitlist({
        data: { fullName: name, mobile, zoneId, units, ...(serviceSlug ? { serviceSlug } : {}) },
      }),
  });
  if (join.data?.ok) return <p className="rounded-2xl bg-primary/10 p-4 text-sm">{b.waitlistDone}</p>;
  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <p className="font-medium">{b.waitlistTitle}</p>
      <p className="text-sm text-muted-foreground">{b.waitlistSub}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          aria-label="Waitlist name"
          placeholder={b.yourName}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          aria-label="Waitlist mobile"
          placeholder="09XX XXX XXXX"
          inputMode="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>
      <Button variant="outline" className="tap mt-2 w-full" disabled={join.isPending} onClick={() => join.mutate()}>
        {b.joinWaitlist}
      </Button>
      {join.data && !join.data.ok && <p className="mt-2 text-sm text-destructive">{join.data.error}</p>}
    </div>
  );
}
