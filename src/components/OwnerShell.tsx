import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, ListChecks, Settings, LogOut, MessageCircle, Send, FlaskConical, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { getSimClock } from "@/lib/automation.functions";
import { getMyRole, resetDemo } from "@/lib/owner.functions";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark, PageHeader } from "@/components/BugnawUI";
import { Button } from "@/components/ui/button";
import { Portrait } from "@/components/BugnawUI";
import junPortrait from "@/assets/portraits/jun.jpg";
import { useState } from "react";

const NAV = [
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/today", label: "Today", icon: ListChecks },
  { to: "/week", label: "Calendar", icon: CalendarDays },
  { to: "/outbox", label: "Messages", icon: Send },
  { to: "/impact", label: "Impact", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function OwnerShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const clock = useQuery({ queryKey: ["sim-clock"], queryFn: () => getSimClock() });
  const role = useQuery({ queryKey: ["my-role"], queryFn: () => getMyRole() });
  const [resetting, setResetting] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/owner" });
  }

  return (
    <div className="app-shell pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-lp-ink px-5 py-6 lg:flex">
        <Link to="/today"><BrandMark light /></Link>
        <div className="mt-9 flex items-center gap-3 rounded-2xl border border-frostwhite/10 bg-frostwhite/5 p-3">
          <Portrait src={junPortrait} name="Jun Villanueva" className="h-12 w-12 ring-lp-ink" />
          <div><p className="font-semibold text-frostwhite">Jun Villanueva</p><p className="text-xs text-frostwhite/55">Owner · Technician</p></div>
        </div>
        <nav className="mt-8 space-y-1" aria-label="Owner dashboard">
          {NAV.map((n) => <Link key={n.to} to={n.to} className="flex min-h-12 items-center gap-3 rounded-full px-4 text-sm font-medium text-frostwhite/60 transition hover:bg-frostwhite/8 hover:text-frostwhite" activeProps={{ className: "flex min-h-12 items-center gap-3 rounded-full bg-lp-blue px-4 text-sm font-semibold text-frostwhite" }}><n.icon className="h-5 w-5" />{n.label}</Link>)}
        </nav>
        <Link to="/" className="mt-auto flex min-h-11 items-center gap-2 px-4 text-sm font-medium text-frostwhite/60 transition hover:text-frostwhite"><ArrowLeft className="h-4 w-4" /> View public site</Link>
        <Button variant="ghost" onClick={signOut} className="justify-start text-frostwhite/60 hover:bg-frostwhite/10 hover:text-frostwhite"><LogOut /> Sign out</Button>
      </aside>

      <header className="border-b border-lp-ink/5 bg-card px-5 py-5 lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between"><Link to="/today" className="inline-flex min-h-11 items-center"><BrandMark /></Link><div className="flex flex-col items-end gap-1"><Link to="/" className="flex min-h-11 items-center gap-1 text-xs font-medium text-lp-muted"><ArrowLeft className="h-3.5 w-3.5" /> View public site</Link><Button variant="ghost" size="sm" onClick={signOut}><LogOut /> Sign out</Button></div></div>
      </header>

      {clock.data && clock.data.offsetMinutes !== 0 && (
        <Link to="/outbox" className="mx-auto flex max-w-5xl items-center justify-center gap-2 bg-lp-blue/10 px-4 py-2 text-sm font-medium text-lp-blue lg:mt-0">
          <FlaskConical className="h-4 w-4" /> Demo time:{" "}
          {new Date(clock.data.now).toLocaleString("en-PH", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </Link>
      )}

      {role.data?.role === "demo" && (
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 bg-warm/20 px-4 py-2 text-center text-sm font-medium text-warm-foreground">
          <span>Demo mode — try anything, then reset.</span>
          <Button size="sm" variant="outline" disabled={resetting} onClick={async () => { setResetting(true); await resetDemo(); window.location.reload(); }}>
            {resetting ? "Resetting…" : "Reset demo"}
          </Button>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
        <PageHeader eyebrow="Owner workspace" title={title} {...(subtitle ? { subtitle } : {})} />
        <motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-8">{children}</motion.div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-lp-ink/8 bg-card/95 pb-[calc(1.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_color-mix(in_oklab,var(--lp-ink)_8%,transparent)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-6 px-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex min-w-0 flex-col items-center gap-1 py-3 text-xs text-muted-foreground"
              activeProps={{ className: "flex min-w-0 flex-col items-center gap-1 py-3 text-xs text-primary font-semibold" }}
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
