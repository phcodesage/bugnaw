import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Bot, Loader2, MessageCircle, Send, Pencil, Shuffle, AlertTriangle, CalendarCheck, RefreshCw, Link2, CheckCircle2 } from "lucide-react";

import { OwnerShell } from "@/components/OwnerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getBookingOptions } from "@/lib/booking.functions";
import {
  listInbox,
  getThread,
  ingestMessage,
  reanalyze,
  sendReply,
  setAutoReply,
  type ConversationStatus,
  type Extracted,
  type InboxItem,
} from "@/lib/inbox.functions";
import { dateLabel, timeLabel } from "@/lib/format";
import { EmptyState, LoadingState, StatusBadge } from "@/components/BugnawUI";

export const Route = createFileRoute("/_authenticated/inbox")({
  validateSearch: z.object({ c: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Messenger Inbox — Bugnaw Aircon Care" },
      { name: "description", content: "AI reads customer messages, finds open slots and drafts replies in Bisaya, Taglish or English." },
      { property: "og:title", content: "Messenger Inbox — Bugnaw Aircon Care" },
      { property: "og:description", content: "Turn 'pwede ba ugma?' into a confirmed booking in one tap." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InboxPage,
});

const SAMPLES: Array<{ name: string; text: string }> = [
  { name: "Grace Alcoseba", text: "Hi po, pwede ba ugma hapon? 2 ka aircon split type sa Banilad, lami na kaayo ug baho" },
  { name: "Ramil Ouano", text: "Boss available ka sat? window type lang isa, Mandaue ko" },
  { name: "Liza Pepito", text: "how much po cleaning 3 units? tga lapu2 mi" },
  { name: "Noel Cabatingan", text: "Maayong buntag! Dili na bugnaw among aircon, basin kulang na og freon. Taga Liloan mi, pwede Lunes?" },
  { name: "Kristine Dy", text: "Hello! Can I book a check-up for our split-type unit? We're in Lahug near JY Square, any weekday morning works." },
  { name: "Arnel Suico", text: "Sir pa linis unta ko 1 split ug 1 window, asa man mo dapit?" },
  { name: "Mae Lumapas", text: "Hi, magkano po linis ng split type? Sa Talisay po kami, pero pwede ba sa Basak Pardo?" },
  { name: "Joel Tan", text: "yo boss pwede karong friday buntag? 4 units split sa Pusok" },
];

const STATUS: Record<ConversationStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-accent text-accent-foreground" },
  replied: { label: "Replied", cls: "bg-secondary text-secondary-foreground" },
  link_opened: { label: "Link opened", cls: "bg-primary/15 text-primary" },
  booked: { label: "Booked", cls: "bg-primary text-primary-foreground" },
};
const FLOW: ConversationStatus[] = ["new", "replied", "link_opened", "booked"];
const LANG: Record<string, string> = { bisaya: "Bisaya", taglish: "Taglish", english: "English" };

function origin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function InboxPage() {
  const { c } = Route.useSearch();
  return c ? <ThreadView id={c} /> : <InboxList />;
}

/* ---------------------------- list ---------------------------- */

function InboxList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const inbox = useQuery({ queryKey: ["inbox"], queryFn: () => listInbox(), refetchInterval: 15000 });
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const ingest = useMutation({
    mutationFn: (m: { text: string; customerName: string }) => ingestMessage({ data: { ...m, origin: origin() } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      if (!r.ok) setErr(r.error);
      if ("id" in r && r.id) navigate({ to: "/inbox", search: { c: r.id } });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Something went wrong."),
  });

  const auto = useMutation({
    mutationFn: (on: boolean) => setAutoReply({ data: { on } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });

  const items = inbox.data?.items ?? [];
  const counts = useMemo(() => {
    const n = { total: items.length, replied: 0, opened: 0, booked: 0 };
    for (const i of items) {
      if (i.status !== "new") n.replied++;
      if (i.status === "link_opened" || i.status === "booked") n.opened++;
      if (i.status === "booked") n.booked++;
    }
    return n;
  }, [items]);

  function simulate() {
    const s = SAMPLES[Math.floor(Math.random() * SAMPLES.length)]!;
    setErr("");
    ingest.mutate({ text: s.text, customerName: s.name });
  }

  return (
    <OwnerShell title="Messenger Inbox" subtitle="Messages in, bookings out — Jun just taps Send.">
      <div className="space-y-4">
        <div className="app-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-semibold">Auto-reply</p>
                <p className="text-xs text-muted-foreground">
                  {inbox.data?.autoReply ? "On — replies go out instantly, even while you're on a job." : "Off — you review each draft first."}
                </p>
              </div>
            </div>
            <Switch
              aria-label="Auto-reply"
              checked={!!inbox.data?.autoReply}
              disabled={auto.isPending || !inbox.data}
              onCheckedChange={(v) => auto.mutate(v)}
            />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              ["Leads", counts.total],
              ["Replied", counts.replied],
              ["Opened", counts.opened],
              ["Booked", counts.booked],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-2xl bg-muted/60 py-2">
                <p className="font-display text-xl font-semibold">{v}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card">
          <Button className="tap w-full text-base" onClick={simulate} disabled={ingest.isPending}>
            {ingest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
            {ingest.isPending ? "Reading message…" : "Simulate new message"}
          </Button>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Or paste a message</p>
            <Input placeholder="Customer name (optional)" value={name} onChange={(e) => setName(e.target.value)} className="tap" />
            <Textarea
              placeholder="e.g. Boss pwede ugma buntag? 1 split sa Mandaue"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
            <Button
              variant="secondary"
              className="tap w-full"
              disabled={!text.trim() || ingest.isPending}
              onClick={() => {
                setErr("");
                ingest.mutate({ text, customerName: name });
                setText("");
                setName("");
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Add to inbox
            </Button>
          </div>
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        </div>

        <div className="space-y-2">
          {inbox.isLoading && <LoadingState label="Loading conversations…" rows={4} />}
          {!inbox.isLoading && !items.length && <EmptyState title="No messages yet" text="New customer inquiries will appear here." />}
          {items.map((i) => (
            <ConversationRow key={i.id} item={i} />
          ))}
        </div>
      </div>
    </OwnerShell>
  );
}

function ConversationRow({ item }: { item: InboxItem }) {
  const s = STATUS[item.status];
  return (
    <Link
      to="/inbox"
      data-tour={item.channel.startsWith("website") && item.status === "new" ? "website-chat" : undefined}
      search={{ c: item.id }}
      className="block rounded-2xl border border-lp-ink/8 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-semibold">{item.customer_name}</p>
        <StatusBadge className={s.cls}>{item.channel.startsWith("website") && item.status === "new" ? "New · from website chat" : s.label}</StatusBadge>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.preview}</p>
      <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
        {item.language && <span>{LANG[item.language] ?? item.language}</span>}
        <span>·</span>
        <span>{new Date(item.last_message_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
      </div>
    </Link>
  );
}

/* ---------------------------- thread ---------------------------- */

function ThreadView({ id }: { id: string }) {
  const qc = useQueryClient();
  const thread = useQuery({ queryKey: ["thread", id], queryFn: () => getThread({ data: { id } }), refetchInterval: 15000 });
  const options = useQuery({ queryKey: ["booking-options"], queryFn: () => getBookingOptions() });
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [err, setErr] = useState("");

  const t = thread.data;
  useEffect(() => {
    setDraft(t?.draft_reply ?? "");
    setEditing(false);
  }, [t?.draft_reply]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["thread", id] });
    qc.invalidateQueries({ queryKey: ["inbox"] });
  };

  const send = useMutation({
    mutationFn: (body: string) => sendReply({ data: { id, body } }),
    onSuccess: refresh,
    onError: (e) => setErr(e instanceof Error ? e.message : "Could not send."),
  });
  const redo = useMutation({
    mutationFn: (extracted?: Partial<Extracted>) => reanalyze({ data: { id, origin: origin(), ...(extracted ? { extracted } : {}) } }),
    onSuccess: (r) => {
      if (!r.ok) setErr(r.error);
      refresh();
    },
  });
  const follow = useMutation({
    mutationFn: (text: string) => ingestMessage({ data: { text, conversationId: id, origin: origin() } }),
    onSuccess: (r) => {
      if (!r.ok) setErr(r.error);
      setFollowUp("");
      refresh();
    },
  });

  if (thread.isLoading) {
    return (
      <OwnerShell title="Conversation">
        <LoadingState label="Loading conversation…" rows={3} />
      </OwnerShell>
    );
  }
  if (!t) {
    return (
      <OwnerShell title="Conversation">
        <EmptyState title="Conversation not found" text="It may have been removed or is no longer available." />
      </OwnerShell>
    );
  }

  const ex = t.extracted;
  const analysed = !!ex.language;
  const busy = redo.isPending || follow.isPending;

  return (
    <OwnerShell title={t.customer_name} subtitle={t.language ? `Writes in ${LANG[t.language] ?? t.language}` : "Messenger"}>
      <div className="space-y-4">
        <Link to="/inbox" search={{}} className="tap inline-flex items-center gap-1 rounded-full bg-card px-4 text-sm font-medium shadow-frost">
          <ArrowLeft className="h-4 w-4" /> Inbox
        </Link>

        <StatusTrack status={t.status} reference={t.booking_reference} />

        {/* conversation log */}
         <div className="space-y-2 rounded-2xl bg-card p-4 shadow-lift sm:p-5">
          {t.messages.map((m) => (
            <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.direction === "out" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
                }`}
              >
                {m.body}
                <p className={`mt-1 text-[10px] ${m.direction === "out" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {m.sent_by === "auto" ? "Auto-reply · " : m.sent_by === "owner" ? "Jun · " : ""}
                  {new Date(m.created_at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* extraction */}
        <div className="app-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">What the customer wants</h2>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => redo.mutate(undefined)}>
              <RefreshCw className={`mr-1 h-4 w-4 ${redo.isPending ? "animate-spin" : ""}`} /> Re-read
            </Button>
          </div>
          {!analysed ? (
            <p className="mt-2 text-sm text-muted-foreground">Not analysed yet. Tap Re-read.</p>
          ) : (
            <ChipEditor
              ex={ex}
              services={options.data?.services ?? []}
              zones={options.data?.zones ?? []}
              disabled={busy}
              onApply={(next) => redo.mutate(next)}
            />
          )}
        </div>

        {/* slots */}
        {t.suggested_slots.length > 0 && (
          <div className="app-card">
            <h2 className="font-display text-lg font-semibold">3 best slots</h2>
            <div className="mt-3 grid gap-2">
              {t.suggested_slots.map((s) => (
                <div key={s.date + s.time} className="flex items-center justify-between rounded-2xl border border-border px-3 py-2.5">
                  <span className="font-medium">
                    {dateLabel(s.date)} · {timeLabel(s.time)}
                  </span>
                  {s.best && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">Already in area</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* draft */}
        {t.draft_reply !== null && (
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 shadow-lift">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Draft reply</h2>
              {ex.language && <span className="text-xs text-muted-foreground">in {LANG[ex.language]}</span>}
            </div>
            {editing ? (
              <Textarea className="mt-3 text-sm" rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} />
            ) : (
              <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-muted/60 p-3 text-sm">{draft}</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" className="tap" onClick={() => setEditing((v) => !v)}>
                <Pencil className="mr-2 h-4 w-4" /> {editing ? "Done" : "Edit"}
              </Button>
              <Button className="tap" disabled={!draft.trim() || send.isPending} onClick={() => send.mutate(draft)}>
                {send.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send
              </Button>
            </div>
          </div>
        )}

        {/* follow-up */}
        <div className="app-card">
          <p className="text-sm font-medium">Customer replied? Paste it here</p>
          <div className="mt-2 flex gap-2">
            <Input className="tap" value={followUp} placeholder="e.g. Sa Talamban mi" onChange={(e) => setFollowUp(e.target.value)} />
            <Button className="tap" disabled={!followUp.trim() || busy} onClick={() => follow.mutate(followUp)}>
              {follow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </div>

        {busy && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading and drafting…
          </p>
        )}
        {err && <p className="text-sm text-destructive">{err}</p>}
      </div>
    </OwnerShell>
  );
}

function StatusTrack({ status, reference }: { status: ConversationStatus; reference: string | null }) {
  const idx = FLOW.indexOf(status);
  const icons = [MessageCircle, Send, Link2, CalendarCheck];
  return (
    <div className="app-card">
      <div className="flex items-center">
        {FLOW.map((s, i) => {
          const Icon = icons[i]!;
          const done = i <= idx;
          return (
            <div key={s} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`text-[11px] ${done ? "font-semibold" : "text-muted-foreground"}`}>{STATUS[s].label}</span>
              </div>
              {i < FLOW.length - 1 && <div className={`mx-1 mb-5 h-0.5 flex-1 ${i < idx ? "bg-primary" : "bg-muted"}`} />}
            </div>
          );
        })}
      </div>
      {reference && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" /> Booked as {reference}
        </p>
      )}
    </div>
  );
}

function Confidence({ v }: { v: number }) {
  const level = v >= 0.8 ? "high" : v >= 0.5 ? "mid" : "low";
  const cls = level === "high" ? "bg-primary" : level === "mid" ? "bg-accent" : "bg-destructive";
  return (
    <span className="flex items-center gap-0.5" title={`${Math.round(v * 100)}% sure`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < (level === "high" ? 3 : level === "mid" ? 2 : 1) ? cls : "bg-muted-foreground/25"}`} />
      ))}
    </span>
  );
}

function ChipEditor({
  ex,
  services,
  zones,
  disabled,
  onApply,
}: {
  ex: Partial<Extracted>;
  services: Array<{ slug: string; name: string }>;
  zones: Array<{ slug: string; name: string }>;
  disabled: boolean;
  onApply: (e: Partial<Extracted>) => void;
}) {
  const [v, setV] = useState<Partial<Extracted>>(ex);
  useEffect(() => setV(ex), [ex]);
  const conf = ex.confidence ?? { service: 0, units: 0, zone: 0, when: 0 };
  const dirty = JSON.stringify(v) !== JSON.stringify(ex);
  const missing = ex.missing ?? [];

  const chip = "flex flex-col gap-1 rounded-2xl border px-3 py-2";
  const warn = (bad: boolean) => (bad ? "border-destructive/60 bg-destructive/5" : "border-border");
  const sel = "w-full bg-transparent text-sm font-medium outline-none";

  return (
    <div className="mt-3 space-y-3">
      {missing.length > 0 && (
        <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> Missing: {missing.join(", ")} — the draft asks only for this.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className={`${chip} ${warn(!v.service_slug)}`}>
          <span className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
            Service <Confidence v={conf.service} />
          </span>
          <select className={sel} value={v.service_slug ?? ""} disabled={disabled} onChange={(e) => setV({ ...v, service_slug: e.target.value || null })}>
            <option value="">— missing —</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className={`${chip} ${warn(false)}`}>
          <span className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
            Units <Confidence v={conf.units} />
          </span>
          <input
            type="number"
            min={1}
            max={10}
            className={sel}
            value={v.units ?? ""}
            placeholder="1"
            disabled={disabled}
            onChange={(e) => setV({ ...v, units: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
        <label className={`${chip} ${warn(!v.zone_slug)}`}>
          <span className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
            Zone <Confidence v={conf.zone} />
          </span>
          <select className={sel} value={v.zone_slug ?? ""} disabled={disabled} onChange={(e) => setV({ ...v, zone_slug: e.target.value || null })}>
            <option value="">— missing —</option>
            {zones.map((z) => (
              <option key={z.slug} value={z.slug}>
                {z.name}
              </option>
            ))}
          </select>
          {v.barangay && <span className="text-xs text-muted-foreground">{v.barangay}</span>}
        </label>
        <label className={`${chip} ${warn(false)}`}>
          <span className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
            When <Confidence v={conf.when} />
          </span>
          <input
            type="date"
            className={sel}
            value={v.preferred_date ?? ""}
            disabled={disabled}
            onChange={(e) => setV({ ...v, preferred_date: e.target.value || null })}
          />
          <select
            className="bg-transparent text-xs text-muted-foreground outline-none"
            value={v.preferred_time ?? ""}
            disabled={disabled}
            onChange={(e) => setV({ ...v, preferred_time: (e.target.value || null) as Extracted["preferred_time"] })}
          >
            <option value="">Any time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Language</span>
          <select
            className="rounded-full border border-border bg-transparent px-3 py-1 text-sm font-medium"
            value={v.language ?? "english"}
            disabled={disabled}
            onChange={(e) => setV({ ...v, language: e.target.value as Extracted["language"] })}
          >
            <option value="bisaya">Bisaya</option>
            <option value="taglish">Taglish</option>
            <option value="english">English</option>
          </select>
        </label>
        {dirty && (
          <Button size="sm" disabled={disabled} onClick={() => onApply(v)}>
            Update draft
          </Button>
        )}
      </div>
    </div>
  );
}
