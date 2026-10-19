import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Smartphone, Mail, Users, ExternalLink } from "lucide-react";

import { OwnerShell } from "@/components/OwnerShell";
import { TimeMachine } from "@/components/TimeMachine";
import { listOutbox, runAutomationsNow } from "@/lib/automation.functions";
import { AUTOMATIONS } from "@/lib/automations.shared";
import { EmptyState, LoadingState, StatusBadge } from "@/components/BugnawUI";

export const Route = createFileRoute("/_authenticated/outbox")({
  head: () => ({
    meta: [
      { title: "Message Center — Bugnaw Aircon Care" },
      { name: "description", content: "Every automated reminder, confirmation and follow-up sent to customers." },
      { property: "og:title", content: "Message Center — Bugnaw Aircon Care" },
      { property: "og:description", content: "Automated follow-through so Jun never chases customers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OutboxPage,
});

const TITLE = Object.fromEntries(AUTOMATIONS.map((a) => [a.key, a.title]));
const CHANNEL = { sms: Smartphone, messenger: MessageSquare, email: Mail } as const;

function OutboxPage() {
  // Catch up on any due reminders whenever Jun opens the Message Center.
  useQuery({ queryKey: ["auto-run"], queryFn: () => runAutomationsNow(), staleTime: 5 * 60_000 });
  const outbox = useQuery({ queryKey: ["outbox"], queryFn: () => listOutbox(), refetchInterval: 10000 });
  const msgs = outbox.data?.messages ?? [];
  const wl = outbox.data?.waitlist ?? [];

  return (
    <OwnerShell title="Message Center" subtitle="Every automatic message — Jun never has to chase anyone.">
      <div className="space-y-4">
        <TimeMachine />

        {wl.length > 0 && (
          <div className="app-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Users className="h-5 w-5 text-primary" /> Waitlist
            </h2>
            <div className="mt-2 divide-y divide-border">
              {wl.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium">{w.full_name}</span> <span className="text-muted-foreground">· {w.zone}</span>
                  </span>
                   <StatusBadge tone={w.status === "waiting" ? "muted" : w.status === "offered" ? "warm" : "blue"}>
                    {w.status}
                   </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Outbox ({msgs.length})</h2>
          {outbox.isLoading && <LoadingState label="Loading sent messages…" rows={4} />}
          {!outbox.isLoading && !msgs.length && (
            <EmptyState title="No automatic messages yet" text="Try “Tomorrow 6 PM” above to send day-before reminders." />
          )}
          {msgs.map((m) => {
            const Icon = CHANNEL[m.channel as keyof typeof CHANNEL] ?? Smartphone;
            return (
               <article key={m.id} className={`relative ml-5 rounded-2xl border bg-card p-4 shadow-sm before:absolute before:-left-5 before:top-0 before:h-[calc(100%+0.75rem)] before:w-px before:bg-lp-ink/10 after:absolute after:-left-[1.45rem] after:top-5 after:h-3 after:w-3 after:rounded-full after:bg-lp-blue ${m.kind === "at_risk" ? "border-destructive/50" : "border-lp-ink/8"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.kind === "at_risk" ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
                    {TITLE[m.kind] ?? m.kind}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.sim_time).toLocaleString("en-PH", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="h-4 w-4 text-muted-foreground" /> {m.recipient_name || "—"} <span className="font-normal text-muted-foreground">· {m.recipient}</span>
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm">{m.body}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.channel.toUpperCase()} · {m.status === "simulated" ? "Sent (simulated)" : m.status}</span>
                  {m.action_url && (
                    <a href={m.action_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary">
                      Open customer link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </OwnerShell>
  );
}
