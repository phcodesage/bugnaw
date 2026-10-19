import { motion, useReducedMotion, type Variants } from "framer-motion";
import { AlertCircle, Inbox, LoaderCircle, Snowflake } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };
const item: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 22 } } };

export function PageMotion({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : "hidden"} animate="show" variants={list}>{children}</motion.div>;
}

export function MotionItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={item}>{children}</motion.div>;
}

export function PageHeader({ eyebrow = "Bugnaw workspace", title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return <div className="app-page-heading">
    <p className="app-eyebrow"><span className="app-eyebrow-line" />{eyebrow}</p>
    <h1>{title}</h1>
    {subtitle && <p className="app-page-subtitle">{subtitle}</p>}
  </div>;
}

export function BrandMark({ light = false }: { light?: boolean }) {
  return <span className={cn("inline-flex items-center gap-2 font-oswald text-2xl font-bold", light ? "text-frostwhite" : "text-lp-ink")}><Snowflake className="h-5 w-5 text-lp-blue" /> Bugnaw</span>;
}

export function EmptyState({ title, text, icon: Icon = Inbox }: { title: string; text: string; icon?: typeof Inbox }) {
  return <div className="app-empty"><span className="app-empty-icon"><Icon /></span><h3>{title}</h3><p>{text}</p></div>;
}

export function LoadingState({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return <div className="app-card" aria-live="polite"><p className="mb-4 flex items-center gap-2 text-sm text-lp-muted"><LoaderCircle className="h-4 w-4 animate-spin text-lp-blue" />{label}</p><div className="space-y-3">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-lp-bg" />)}</div></div>;
}

export function ErrorState({ title = "Something went wrong", text }: { title?: string; text: string }) {
  return <div className="app-empty border-destructive/20"><span className="app-empty-icon text-destructive"><AlertCircle /></span><h3>{title}</h3><p>{text}</p></div>;
}

export function StatusBadge({ children, tone = "blue", className }: { children: ReactNode; tone?: "blue" | "warm" | "dark" | "muted" | "danger" | "success"; className?: string }) {
  return <span className={cn("app-badge", `app-badge-${tone}`, className)}>{children}</span>;
}

export function Portrait({ src, name, className, eager = false }: { src: string; name: string; className?: string; eager?: boolean }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return <span className={cn("app-avatar", className)}><span aria-hidden className="app-avatar-fallback">{initials}</span><img src={src} alt={name} width={816} height={816} loading={eager ? "eager" : "lazy"} onError={(e) => { e.currentTarget.style.display = "none"; }} /></span>;
}