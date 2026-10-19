import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

import { OwnerShell } from "@/components/OwnerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getShopConfig, saveSettings, saveService, addBlock, removeBlock, setPeakMode } from "@/lib/owner.functions";
import { dateLabel, peso } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getAutomationConfig, saveAutomationConfig } from "@/lib/automation.functions";
import { AUTOMATIONS, PLACEHOLDERS, type AutomationConfig } from "@/lib/automations.shared";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Bugnaw Aircon Care" },
      { name: "description", content: "Working hours, blocked days and service prices for Bugnaw Aircon Care." },
      { property: "og:title", content: "Settings — Bugnaw Aircon Care" },
      { property: "og:description", content: "Working hours, blocked days and service prices." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsView,
});

const DAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
  { n: 0, label: "Sun" },
];

function SettingsView() {
  const qc = useQueryClient();
  const config = useQuery({ queryKey: ["shop-config"], queryFn: () => getShopConfig() });

  const [hours, setHours] = useState({
    work_start: "08:00",
    work_end: "17:00",
    lunch_start: "12:00",
    lunch_end: "13:00",
    max_minutes_per_day: 300,
    work_days: [1, 2, 3, 4, 5, 6] as number[],
  });
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const s = config.data?.settings;
    if (!s) return;
    setHours({
      work_start: s.work_start.slice(0, 5),
      work_end: s.work_end.slice(0, 5),
      lunch_start: s.lunch_start.slice(0, 5),
      lunch_end: s.lunch_end.slice(0, 5),
      max_minutes_per_day: s.max_minutes_per_day,
      work_days: s.work_days,
    });
  }, [config.data?.settings]);

  const saveHours = useMutation({
    mutationFn: () => saveSettings({ data: hours }),
    onSuccess: () => {
      setSaved("Working hours saved.");
      qc.invalidateQueries({ queryKey: ["shop-config"] });
    },
  });

  const peak = useMutation({
    mutationFn: (on: boolean) => setPeakMode({ data: { on } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-config"] }),
  });
  const peakOn = peak.isPending ? !!peak.variables : !!config.data?.settings?.peak_mode;

  const updateService = useMutation({
    mutationFn: (v: { id: string; price_php: number; duration_minutes: number; active: boolean }) => saveService({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-config"] }),
  });

  const block = useMutation({
    mutationFn: () => addBlock({ data: { block_date: blockDate, reason: blockReason } }),
    onSuccess: () => {
      setBlockDate("");
      setBlockReason("");
      qc.invalidateQueries({ queryKey: ["shop-config"] });
    },
  });

  const unblock = useMutation({
    mutationFn: (id: string) => removeBlock({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-config"] }),
  });

  if (config.isLoading) {
    return (
      <OwnerShell title="Settings">
        <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />
      </OwnerShell>
    );
  }

  return (
    <OwnerShell title="Settings" subtitle="Your hours, days off and prices">
      <section className={`mb-4 rounded-2xl border border-lp-ink/5 p-5 shadow-lift ${peakOn ? "bg-warm/20" : "bg-card"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Peak season mode</h2>
            <p className="mt-1 text-sm text-muted-foreground">For the March–May rush. Turn it on when bookings pile up.</p>
          </div>
          <Switch checked={peakOn} onCheckedChange={(v) => peak.mutate(v)} aria-label="Peak season mode" />
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• Tighter time slots: customers pick from every 15 minutes instead of every 30</li>
          <li>• ₱{(config.data?.settings as { deposit_php?: number } | undefined)?.deposit_php ?? 200} deposit required for every booking (off-season, customers may pay on the day)</li>
          <li>• Waitlist on: customers can join it, and freed slots are offered automatically</li>
        </ul>
      </section>
      <section className="app-card">
        <h2 className="font-display text-lg font-semibold">Working hours</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <TimeField label="Start" value={hours.work_start} onChange={(v) => setHours({ ...hours, work_start: v })} />
          <TimeField label="End" value={hours.work_end} onChange={(v) => setHours({ ...hours, work_end: v })} />
          <TimeField label="Lunch from" value={hours.lunch_start} onChange={(v) => setHours({ ...hours, lunch_start: v })} />
          <TimeField label="Lunch to" value={hours.lunch_end} onChange={(v) => setHours({ ...hours, lunch_end: v })} />
        </div>

        <div className="mt-4 space-y-2">
          <Label>Working days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = hours.work_days.includes(d.n);
              return (
                <button
                  key={d.n}
                  type="button"
                  onClick={() =>
                    setHours({
                      ...hours,
                      work_days: on ? hours.work_days.filter((x) => x !== d.n) : [...hours.work_days, d.n],
                    })
                  }
                  className={`tap w-14 rounded-xl border text-sm font-medium ${
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="max">Max job hours per day</Label>
          <Input
            id="max"
            className="tap"
            type="number"
            min={1}
            max={12}
            value={hours.max_minutes_per_day / 60}
            onChange={(e) => setHours({ ...hours, max_minutes_per_day: Math.round(Number(e.target.value) * 60) })}
          />
        </div>

        <Button className="tap mt-4 w-full" disabled={saveHours.isPending} onClick={() => saveHours.mutate()}>
          Save working hours
        </Button>
        {saved && <p className="mt-2 text-sm text-success">{saved}</p>}
      </section>

      <section className="app-card mt-4">
        <h2 className="font-display text-lg font-semibold">Services</h2>
        <div className="mt-3 space-y-4">
          {(config.data?.services ?? []).map((s) => (
            <ServiceRow key={s.id} service={s} onSave={(v) => updateService.mutate(v)} />
          ))}
        </div>
      </section>

      <section className="app-card mt-4">
        <h2 className="font-display text-lg font-semibold">Blocked days</h2>
        <p className="mt-1 text-sm text-muted-foreground">Days customers can't book — fiesta, family, maintenance.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input className="tap" type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
          <Input className="tap" placeholder="Reason" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
          <Button className="tap" disabled={!blockDate || block.isPending} onClick={() => block.mutate()}>
            Block
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {(config.data?.blocks ?? []).map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl bg-frost p-3">
              <span className="text-sm">
                {dateLabel(b.block_date, { weekday: "short", month: "short", day: "numeric" })}
                {b.reason && <span className="text-muted-foreground"> · {b.reason}</span>}
              </span>
              <button type="button" aria-label="Remove block" onClick={() => unblock.mutate(b.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <AutomationSettings />
    </OwnerShell>
  );
}

function AutomationSettings() {
  const cfg = useQuery({ queryKey: ["automation-config"], queryFn: () => getAutomationConfig() });
  const [draft, setDraft] = useState<AutomationConfig | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (cfg.data) setDraft(cfg.data);
  }, [cfg.data]);
  const save = useMutation({
    mutationFn: (c: AutomationConfig) => saveAutomationConfig({ data: c }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      cfg.refetch();
    },
  });
  if (!draft) return null;

  return (
    <section className="app-card mt-6">
      <h2 className="font-display text-lg font-semibold">Automations</h2>
      <p className="mt-1 text-sm text-muted-foreground">Placeholders: {PLACEHOLDERS}</p>
      <div className="mt-4 space-y-3">
        {AUTOMATIONS.map((a) => (
          <div key={a.key} className="rounded-2xl border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.when}</p>
              </div>
              <Switch
                aria-label={a.title}
                checked={draft[a.key].enabled}
                onCheckedChange={(v) => setDraft({ ...draft, [a.key]: { ...draft[a.key], enabled: v } })}
              />
            </div>
            <Textarea
              className="mt-2 text-sm"
              rows={3}
              value={draft[a.key].template}
              onChange={(e) => setDraft({ ...draft, [a.key]: { ...draft[a.key], template: e.target.value } })}
            />
          </div>
        ))}
      </div>
      <Button className="tap mt-4 w-full" disabled={save.isPending} onClick={() => save.mutate(draft)}>
        {saved ? "Saved — salamat!" : "Save automations"}
      </Button>
    </section>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input className="tap" type="time" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

type ServiceLike = { id: string; name: string; price_php: number; duration_minutes: number; active: boolean };

function ServiceRow({ service, onSave }: { service: ServiceLike; onSave: (v: { id: string; price_php: number; duration_minutes: number; active: boolean }) => void }) {
  const [price, setPrice] = useState(service.price_php);
  const [duration, setDuration] = useState(service.duration_minutes);
  const dirty = price !== service.price_php || duration !== service.duration_minutes;

  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">{service.name}</p>
        <button
          type="button"
          onClick={() => onSave({ id: service.id, price_php: price, duration_minutes: duration, active: !service.active })}
          className={`rounded-full px-3 py-1 text-xs font-medium ${service.active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {service.active ? "Offered" : "Paused"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Price ({peso(price)})</Label>
          <Input className="tap" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Minutes per unit</Label>
          <Input className="tap" type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
      </div>
      {dirty && (
        <Button
          className="tap mt-3 w-full"
          onClick={() => onSave({ id: service.id, price_php: price, duration_minutes: duration, active: service.active })}
        >
          Save changes
        </Button>
      )}
    </div>
  );
}
