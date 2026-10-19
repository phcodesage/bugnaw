import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircle,
  Play,
  ShieldCheck,
  Snowflake,
  Star,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getPublicImpact } from "@/lib/impact.functions";
import { startTour } from "@/components/GuidedTour";
import heroImg from "@/assets/lp-hero.jpg";
import whyHomeImg from "@/assets/lp-why-home.jpg";
import careImg from "@/assets/lp-care-plan.jpg";
import rainyImg from "@/assets/lp-rainy.jpg";
import junHeroImg from "@/assets/jun-hero-booking.jpg";
import junSplitImg from "@/assets/jun-service-split.jpg";
import junWindowImg from "@/assets/jun-service-window.jpg";
import junCheckupImg from "@/assets/jun-service-checkup.jpg";
import junFreonImg from "@/assets/jun-service-freon.jpg";
import theresaPortrait from "@/assets/portraits/theresa.jpg";
import carloPortrait from "@/assets/portraits/carlo.jpg";
import annaPortrait from "@/assets/portraits/anna.jpg";
import jessaPortrait from "@/assets/portraits/jessa.jpg";
import { Portrait } from "@/components/BugnawUI";
import junPortrait from "@/assets/portraits/jun.jpg";
import { LangSwitch, useT } from "@/lib/i18n";

export const spring = { type: "spring" as const, stiffness: 110, damping: 20 };
export const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
export const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: spring },
};

export function usePublicImpact() {
  return useQuery({
    queryKey: ["public-impact"],
    queryFn: () => getPublicImpact(),
    staleTime: 60_000,
  });
}

export function Reveal({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const C = as === "section" ? motion.section : motion.div;
  return (
    <C
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </C>
  );
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <motion.p
      variants={rise}
      className={`flex items-center gap-3 text-xs font-semibold uppercase ${light ? "text-frostwhite/70" : "text-lp-ink"}`}
    >
      <span className="h-0.5 w-6 bg-lp-blue" /> {children}
    </motion.p>
  );
}

export function H2({
  children,
  light = false,
  className = "",
}: {
  children: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <motion.h2
      variants={rise}
      className={`font-oswald text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl ${light ? "text-frostwhite" : "text-lp-ink"} ${className}`}
      style={{ textTransform: "capitalize" }}
    >
      {children}
    </motion.h2>
  );
}

type BookSearch = { service?: string; units?: number; plan?: string };

export function PillCta({
  children,
  search,
  dark = false,
  size = "md",
}: {
  children: ReactNode;
  search?: BookSearch;
  dark?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex">
      <Link
        to="/book"
        search={search ?? {}}
        className={`group inline-flex items-center gap-3 rounded-full py-1.5 pl-6 pr-1.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-lp-blue focus-visible:ring-offset-2 ${
          dark ? "bg-lp-ink text-frostwhite" : "bg-lp-blue text-frostwhite"
        } ${size === "lg" ? "text-lg" : "text-base"}`}
      >
        {children}
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${dark ? "bg-frostwhite text-lp-ink" : "bg-frostwhite text-lp-blue"} transition-transform group-hover:translate-x-0.5`}
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </motion.div>
  );
}

export function JunLink({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex">
      <Link
        to="/owner"
        search={{ demo: true }}
        className={`inline-flex min-h-[52px] items-center rounded-full border px-6 font-medium outline-none focus-visible:ring-2 focus-visible:ring-lp-blue ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function ChatLink() {
  const t = useT();
  return (
    <motion.a
      href="#chat"
      whileTap={{ scale: 0.97 }}
      className="inline-flex min-h-[52px] items-center rounded-full border border-frostwhite/40 px-6 font-medium text-frostwhite outline-none focus-visible:ring-2 focus-visible:ring-lp-blue sm:hidden"
    >
      {t.hero.tryChat}
    </motion.a>
  );
}

/* ---------------- Navbar ---------------- */
const NAV = [
  { href: "#services", key: "services" },
  { href: "#about", key: "about" },
  { href: "#why", key: "why" },
  { href: "#process", key: "process" },
  { href: "#pricing", key: "pricing" },
] as const;

export function Navbar() {
  const t = useT();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setSolid(v > 40));
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-lp-ink/80 shadow-lg backdrop-blur-xl"
        animate={{ opacity: solid || open ? 1 : 0 }}
      />
      <nav className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Main">
        <a href="#top" className="flex items-center gap-2 font-oswald text-3xl font-bold text-frostwhite">
          <Snowflake className="h-6 w-6 text-lp-blue" /> Bugnaw
        </a>
        <ul className="hidden items-center gap-6 text-[17px] text-frostwhite lg:flex">
          {NAV.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-lp-blue"
              >
                {t.nav[l.key]}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 lg:gap-4">
          <LangSwitch />
          <div className="hidden lg:block">
            <PillCta>{t.nav.book}</PillCta>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 text-frostwhite lg:hidden"
          >
            <motion.span className="h-0.5 w-6 bg-current" animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} />
            <motion.span className="h-0.5 w-6 bg-current" animate={{ opacity: open ? 0 : 1 }} />
            <motion.span
              className="h-0.5 w-6 bg-current"
              animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            />
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative border-t border-frostwhite/10 bg-lp-ink/95 px-6 pb-8 lg:hidden"
          >
            <motion.ul variants={stagger} initial="hidden" animate="show" className="flex flex-col">
              {NAV.map((l) => (
                <motion.li key={l.href} variants={rise}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-oswald text-3xl text-frostwhite"
                  >
                    {t.nav[l.key]}
                  </a>
                </motion.li>
              ))}
              <motion.li variants={rise} className="mt-4 flex flex-wrap gap-3">
                <PillCta>{t.nav.book}</PillCta>
                <JunLink className="border-frostwhite/30 text-frostwhite">{t.nav.junSide}</JunLink>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------------- Hero ---------------- */
export function Hero() {
  const t = useT();
  return (
    <section id="top" className="relative overflow-hidden bg-lp-ink">
      <img
        src={heroImg}
        alt=""
        width={1920}
        height={1088}
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--lp-ink)_85%,transparent)_0%,color-mix(in_oklab,var(--lp-ink)_45%,transparent)_60%,transparent_100%)]" />
      <div className="relative mx-auto grid max-w-7xl items-end lg:min-h-[min(100svh,900px)] gap-10 px-5 pb-10 pt-32 sm:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:pb-24">
        <motion.div className="self-center" variants={stagger} initial="hidden" animate="show">
          <p className="inline-flex items-center gap-3 text-xs font-semibold uppercase text-frostwhite/70">
            <span className="h-0.5 w-6 bg-lp-blue" /> {t.hero.eyebrow}
          </p>
          <p className="mt-4 flex w-fit items-center gap-2 rounded-full border border-frostwhite/20 bg-frostwhite/10 px-3 py-1.5 text-xs font-medium text-frostwhite backdrop-blur-md">
            <MessageCircle className="h-3.5 w-3.5 text-lp-blue" /> {t.hero.badge}
          </p>
          <h1 className="mt-6 font-oswald text-5xl font-bold leading-[1.08] tracking-tight text-frostwhite sm:text-6xl lg:text-7xl">
            {t.hero.h1a}
            <span className="text-lp-blue">{t.hero.h1b}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-frostwhite/80">{t.hero.sub}</p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
            <PillCta size="lg">{t.nav.book}</PillCta>
            <ChatLink />
            <span className="hidden sm:inline-flex">
              <JunLink className="border-frostwhite/40 text-frostwhite hover:bg-frostwhite/10">{t.nav.junSide}</JunLink>
            </span>
            <button
              type="button"
              onClick={startTour}
              className="inline-flex min-h-[52px] items-center gap-2 px-2 font-medium text-frostwhite underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-lp-blue"
            >
              <Play className="h-4 w-4 fill-current" /> {t.hero.tour}
            </button>
          </motion.div>
          <motion.ul
            variants={rise}
            className="mt-12 grid max-w-2xl gap-4 rounded-2xl border border-frostwhite/15 bg-frostwhite/5 p-4 backdrop-blur-md sm:grid-cols-3 sm:divide-x sm:divide-frostwhite/20"
          >
            {[
              { icon: MessageCircle, t: t.hero.b1 },
              { icon: MapPin, t: t.hero.b2 },
              { icon: Wallet, t: t.hero.b3 },
            ].map((b, i) => (
              <li key={i} className="flex items-center gap-3 sm:px-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-lp-blue/60 text-lp-blue">
                  <b.icon className="h-5 w-5" />
                </span>
                <span className="text-[15px] leading-snug text-frostwhite">{b.t}</span>
              </li>
            ))}
          </motion.ul>
        </motion.div>
        <TrustCard />
      </div>
    </section>
  );
}

const STORY = [2800, 2400, 2800];

function TrustCard() {
  const tr = useT();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setStep((s) => (s + 1) % 3), STORY[step]);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.5 }}
      className="w-full max-w-sm justify-self-end rounded-2xl border border-frostwhite/15 bg-lp-ink/60 p-3 backdrop-blur-xl"
    >
      <div className="flex gap-3">
        <img
          src={junHeroImg}
          alt="Jun confirming an aircon booking"
          width={1200}
          height={896}
          className="h-36 w-28 rounded-xl object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <ShieldCheck className="h-6 w-6 text-lp-blue" />
          <div className="relative mt-2 min-h-[92px]" aria-live="polite">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.p
                  key="a"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl rounded-bl-sm bg-frostwhite/10 px-3 py-2 text-sm text-frostwhite"
                >
                  Hi po, pwede ba ugma hapon? 2 ka aircon sa Banilad
                </motion.p>
              )}
              {step === 1 && (
                <motion.div
                  key="b"
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  variants={stagger}
                  className="flex flex-wrap gap-1.5"
                >
                  {["2× Split-type", "Banilad", tr.hero.chipTomorrow].map((c) => (
                    <motion.span
                      key={c}
                      variants={{
                        hidden: { opacity: 0, scale: 0.6 },
                        show: { opacity: 1, scale: 1 },
                      }}
                      className="rounded-full bg-lp-blue/20 px-2.5 py-1 text-xs font-medium text-frostwhite"
                    >
                      {c}
                    </motion.span>
                  ))}
                </motion.div>
              )}
              {step === 2 && (
                <motion.div
                  key="c"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl bg-success px-3 py-2 text-success-foreground"
                >
                  <p className="font-oswald text-lg font-semibold">{tr.hero.booked}</p>
                  <p className="text-xs">BGN-2417 · {tr.hero.depositPaid}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-auto">
            <div className="flex gap-0.5 text-lp-star">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-2">
                {(
                  [
                    [theresaPortrait, "Ma. Theresa"],
                    [carloPortrait, "Carlo"],
                    [annaPortrait, "Anna Marie"],
                  ] as const
                ).map(([src, name]) => (
                  <Portrait key={name} src={src} name={name} className="h-7 w-7 ring-lp-ink" />
                ))}
              </div>
              <p className="text-xs leading-tight text-frostwhite/80">
                {tr.hero.trusted} <span className="text-lp-blue">1,200+</span> {tr.hero.trustedTail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Area marquee ---------------- */
const AREAS = [
  "Banilad",
  "Talamban",
  "Lahug",
  "IT Park",
  "Mandaue",
  "Subangdaku",
  "Lapu-Lapu",
  "Mactan Newtown",
  "Consolacion",
  "Pacific Grand Villas",
  "Cebu Business Park",
  "Tipolo",
];

export function AreaMarquee() {
  return (
    <section aria-label="Areas we serve" className="overflow-hidden border-y border-lp-ink/10 bg-frostwhite py-8">
      <div className="marquee flex w-max items-center gap-14">
        {[...AREAS, ...AREAS].map((a, i) => (
          <span
            key={i}
            aria-hidden={i >= AREAS.length}
            className="flex items-center gap-3 font-oswald text-3xl font-semibold uppercase tracking-wide text-lp-muted"
          >
            <Snowflake className="h-5 w-5 text-lp-blue/60" /> {a}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- About ---------------- */
export function CountUp({
  to,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) return setV(to);
    const c = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: setV });
    return () => c.stop();
  }, [inView, to, reduce]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toLocaleString("en-PH", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function About() {
  const t = useT();
  const { data } = usePublicImpact();
  const years = new Date().getFullYear() - 2019;
  const stats = [
    { v: 4.9, d: 1, label: t.about.rating, stars: true },
    { v: years, suffix: "+", label: t.about.years },
    { v: data?.unitsCleaned ?? 0, suffix: "+", label: t.about.units },
    { v: data?.hoursMonth ?? 0, d: 1, suffix: " h", label: t.about.hours },
  ];
  return (
    <Reveal as="section" className="scroll-mt-20 bg-lp-bg px-5 py-24 sm:px-8">
      <div id="about" className="mx-auto max-w-7xl">
        <Eyebrow>{t.about.eyebrow}</Eyebrow>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <motion.img
            variants={rise}
            src={junPortrait}
            alt="Jun Villanueva, owner and aircon technician"
            width={816}
            height={816}
            loading="lazy"
            className="h-full max-h-[460px] w-full rounded-2xl object-cover"
          />
          <div className="flex flex-col">
            <motion.p variants={rise} className="border-l-2 border-lp-blue pl-4 text-lg leading-relaxed text-lp-muted">
              {t.about.story}
            </motion.p>
            <motion.div variants={rise} className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 rounded-2xl bg-card p-7">
              {stats.map((s, i) => (
                <div key={i}>
                  <p className="flex items-center gap-2 font-oswald text-5xl font-bold text-lp-ink">
                    <CountUp to={s.v} decimals={s.d ?? 0} suffix={s.suffix ?? ""} />
                    {s.stars && (
                      <span className="flex text-lp-star">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-lp-muted">{s.label}</p>
                </div>
              ))}
            </motion.div>
            <motion.div variants={rise} className="mt-6 flex flex-wrap items-center gap-4">
              <PillCta>{t.nav.book}</PillCta>
              <div className="flex -space-x-3">
                {(
                  [
                    [theresaPortrait, "Ma. Theresa"],
                    [carloPortrait, "Carlo"],
                    [annaPortrait, "Anna Marie"],
                    [jessaPortrait, "Jessa"],
                  ] as const
                ).map(([src, name]) => (
                  <Portrait key={name} src={src} name={name} className="h-12 w-12 ring-lp-bg" />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- Services carousel ---------------- */
const SERVICES: Array<{
  title: string;
  body: string;
  img: string;
  search?: BookSearch;
  process?: boolean;
}> = [
  {
    title: "Split-type Cleaning",
    body: "₱800 per unit · 60 min. Coil, blower and drain, fully washed.",
    img: junSplitImg,
    search: { service: "split-clean" },
  },
  {
    title: "Window-type Cleaning",
    body: "₱600 per unit · 45 min. Pulled out, washed and sanitized.",
    img: junWindowImg,
    search: { service: "window-clean" },
  },
  {
    title: "Check-up & Diagnosis",
    body: "₱500 flat. Jun tests everything and tells you exactly what it needs.",
    img: junCheckupImg,
    search: { service: "checkup" },
  },
  {
    title: "Freon Recharge",
    body: "₱1,800 per unit · 90 min. Leak check plus full top-up.",
    img: junFreonImg,
    search: { service: "freon" },
  },
  {
    title: "6-Month Care Reminder",
    body: "We message you when it’s time again. Rebook with one tap.",
    img: careImg,
    process: true,
  },
  {
    title: "Rainy-day Rescheduling",
    body: "Bad weather? You get a free one-tap reschedule link.",
    img: rainyImg,
    process: true,
  },
];

export function Services() {
  const t = useT();
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <Reveal as="section" className="scroll-mt-20 bg-lp-bg px-5 pb-24 sm:px-8">
      <div id="services" className="mx-auto max-w-7xl">
        <Eyebrow>{t.services.eyebrow}</Eyebrow>
        <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <H2 className="max-w-2xl">{t.services.h2}</H2>
          <motion.p variants={rise} className="max-w-md border-l-2 border-lp-blue pl-4 text-lp-muted">
            {t.services.sub}
          </motion.p>
        </div>
        <div
          ref={track}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SERVICES.map((s, i) => (
            <motion.article
              key={s.title}
              variants={rise}
              className="flex w-[85%] shrink-0 snap-start flex-col rounded-2xl bg-card p-2 sm:w-[46%] lg:w-[31.5%]"
            >
              <div className="px-3 pt-3">
                <h3 className="font-oswald text-2xl font-semibold text-lp-ink">
                  {t.services.items[i]?.title ?? s.title}
                </h3>
                <p className="mt-2 min-h-12 text-[15px] text-lp-muted">{t.services.items[i]?.body ?? s.body}</p>
                {s.process ? (
                  <a
                    href="#process"
                    className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-lp-blue hover:underline"
                  >
                    {t.services.howItWorks} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link
                    to="/book"
                    search={s.search ?? {}}
                    className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-lp-blue hover:underline"
                  >
                    {t.services.bookThis} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <img
                src={s.img}
                alt=""
                width={928}
                height={720}
                loading="lazy"
                className="mt-4 aspect-[4/3] w-full rounded-xl object-cover"
              />
            </motion.article>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            aria-label={t.services.prev}
            onClick={() => scroll(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-lp-blue shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-lp-blue"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={t.services.next}
            onClick={() => scroll(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-lp-blue shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-lp-blue"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- Why Us ---------------- */
export function WhyUs() {
  const t = useT();
  const { data } = usePublicImpact();
  const drivingHrs = data ? Math.round((data.travelPerWeek / 60) * 10) / 10 : 3.2;
  const unanswered = 0;
  return (
    <Reveal as="section" className="scroll-mt-20 bg-frostwhite px-5 py-24 sm:px-8">
      <div id="why" className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>{t.why.eyebrow}</Eyebrow>
          <H2 className="mt-4">{t.why.h2}</H2>
          <motion.p variants={rise} className="mt-5 max-w-md text-lp-muted">
            {t.why.sub}
          </motion.p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { v: unanswered, label: t.why.unanswered, icon: MessageCircle },
              { v: drivingHrs, d: 1, suffix: t.why.hrs, label: t.why.driving, icon: MapPin },
              { v: 78, suffix: "%", label: t.why.noShows, icon: CalendarCheck2 },
            ].map((s, i) => (
              <motion.div key={i} variants={rise} className="rounded-2xl bg-lp-bg p-6">
                <s.icon className="h-5 w-5 text-lp-blue" />
                <p className="mt-4 font-oswald text-4xl font-bold text-lp-ink">
                  <CountUp to={s.v} decimals={s.d ?? 0} suffix={s.suffix ?? ""} />
                </p>
                <p className="mt-1 text-sm text-lp-muted">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="grid min-h-[500px] grid-cols-2 grid-rows-[1.15fr_0.85fr] gap-4">
          <motion.img
            variants={rise}
            src={whyHomeImg}
            alt="Bright tropical living room kept cool by a split-type aircon"
            loading="lazy"
            width={1200}
            height={900}
            className="col-span-2 h-full min-h-64 w-full rounded-2xl object-cover"
          />
          <motion.img
            variants={rise}
            src={rainyImg}
            alt="A bright Cebu home during gentle rain"
            loading="lazy"
            width={1200}
            height={900}
            className="h-full min-h-48 w-full rounded-2xl object-cover"
          />
          <motion.div
            variants={rise}
            className="flex h-full min-h-48 flex-col justify-end rounded-2xl bg-lp-blue p-6 text-frostwhite"
          >
            <Snowflake className="h-6 w-6" />
            <p className="mt-auto font-oswald text-2xl font-semibold leading-tight">{t.why.callout}</p>
          </motion.div>
        </div>
      </div>
    </Reveal>
  );
}
