import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Banknote, Clock3, MapPinned, MessageCircle, ShieldCheck, TrendingUp } from "lucide-react";
import { OwnerShell } from "@/components/OwnerShell";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getImpact } from "@/lib/impact.functions";
import { minutesLabel, peso } from "@/lib/format";
import { CountUp } from "@/components/landing/top";
import { LoadingState } from "@/components/BugnawUI";

export const Route = createFileRoute("/_authenticated/impact")({
  head: () => ({ meta: [
    { title: "Business impact — Bugnaw Aircon Care" },
    { name: "description", content: "Jun’s weekly and monthly booking conversion, saved time, protected deposits and smarter travel." },
    { property: "og:title", content: "Business impact — Bugnaw Aircon Care" },
    { property: "og:description", content: "A private view of booking conversion, automation and operational impact." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ImpactPage,
});

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function ranges() {
  const now = new Date(Date.now() + 8 * 3600_000);
  const today = iso(now);
  const weekday = now.getUTCDay() || 7;
  const monday = new Date(now); monday.setUTCDate(now.getUTCDate() - weekday + 1);
  // Rolling 30 days so "This month" never looks empty right after the 1st.
  const month = new Date(now); month.setUTCDate(now.getUTCDate() - 29);
  return { week: { from: iso(monday), to: today }, month: { from: iso(month), to: today } };
}

const config = { inquiries: { label: "Inquiries", color: "var(--color-chart-1)" }, bookings: { label: "Bookings", color: "var(--color-chart-5)" } } satisfies ChartConfig;

function ImpactPage() {
  const [period, setPeriod] = useState<"week" | "month">("month");
  const query = useQuery({ queryKey: ["impact"], queryFn: () => getImpact({ data: ranges() }) });
  const m = query.data?.[period];
  return <OwnerShell title="Impact" subtitle="What Bugnaw quietly handled for the business">
    <div className="mb-5 flex rounded-xl bg-muted p-1"><Button variant={period === "week" ? "default" : "ghost"} className="tap flex-1" onClick={() => setPeriod("week")}>This week</Button><Button variant={period === "month" ? "default" : "ghost"} className="tap flex-1" onClick={() => setPeriod("month")}>This month</Button></div>
    {!m ? <LoadingState label="Calculating impact…" rows={2} /> : <>
      <section data-tour="impact-stats" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric icon={TrendingUp} value={`${m.conversion}%`} label={`${m.converted} of ${m.inquiries} inquiries booked`} featured />
        <Metric icon={MessageCircle} value={String(m.automatedMessages)} label="messages Jun did not type" />
        <Metric icon={Clock3} value={`${m.hoursSaved}h`} label="estimated admin time saved" />
        <Metric icon={ShieldCheck} value={String(m.noShowsPrevented)} label="no-shows prevented" />
        <Metric icon={Banknote} value={peso(m.deposits)} label="deposit revenue protected" />
        <Metric icon={MapPinned} value={minutesLabel(m.travelMinutes)} label="travel time saved" />
      </section>

      <section className="mt-5 rounded-2xl bg-card p-5 shadow-lift">
        <div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Inquiry to booking</h2><p className="mt-1 text-sm text-muted-foreground">New conversations versus scheduled work</p></div><p className="text-sm font-medium text-primary">{m.conversion}% converted</p></div>
        <ChartContainer config={config} className="mt-6 h-64 w-full aspect-auto"><BarChart accessibilityLayer data={m.chart}><CartesianGrid vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(v: string) => new Date(`${v}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} minTickGap={24} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="inquiries" fill="var(--color-inquiries)" radius={[4,4,0,0]} /><Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4,4,0,0]} /></BarChart></ChartContainer>
      </section>

      <section className="mt-5 rounded-2xl bg-card p-5 shadow-lift"><h2 className="font-display text-xl font-semibold">Time returned to Jun</h2><p className="mt-1 text-sm text-muted-foreground">3 minutes per automated message, plus 10 minutes per self-service reschedule.</p><ChartContainer config={{ saved: { label: "Hours saved", color: "var(--color-chart-4)" } }} className="mt-5 h-36 w-full aspect-auto"><AreaChart data={[{ label: "Messages", saved: Math.round(m.automatedMessages * 3 / 6) / 10 }, { label: "Total", saved: m.hoursSaved }]}><defs><linearGradient id="impactFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-saved)" stopOpacity={0.5}/><stop offset="95%" stopColor="var(--color-saved)" stopOpacity={0.05}/></linearGradient></defs><CartesianGrid vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis hide/><ChartTooltip content={<ChartTooltipContent/>}/><Area type="monotone" dataKey="saved" stroke="var(--color-saved)" fill="url(#impactFill)" /></AreaChart></ChartContainer></section>
      <p className="my-6 text-center text-xs text-muted-foreground">Figures use recorded bookings and messages for the selected period. Travel compares clustered routes with separate cross-zone trips.</p>
    </>}
  </OwnerShell>;
}

function Metric({ icon: Icon, value, label, featured = false }: { icon: typeof TrendingUp; value: string; label: string; featured?: boolean }) {
  const match = value.match(/^([^0-9]*)([0-9,.]+)(.*)$/);
  const numeric = match ? Number(match[2]?.replace(/,/g, "")) : Number.NaN;
  return <article className={`min-h-40 rounded-2xl border border-lp-ink/5 p-5 shadow-lift ${featured ? "bg-primary text-primary-foreground" : "bg-card"}`}><span className={`grid h-10 w-10 place-items-center rounded-full ${featured ? "bg-primary-foreground/15" : "bg-primary/10"}`}><Icon className={`h-5 w-5 ${featured ? "text-primary-foreground" : "text-primary"}`} /></span><p className="mt-5 break-words font-oswald text-4xl font-bold tabular-nums">{Number.isFinite(numeric) && match ? <CountUp to={numeric} prefix={match[1] ?? ""} suffix={match[3] ?? ""} decimals={match[2]?.includes(".") ? 1 : 0} /> : value}</p><p className={`mt-1 text-sm leading-snug ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p></article>;
}