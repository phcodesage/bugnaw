import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  Facebook,
  MapPin,
  MessageCircle,
  Quote,
  Snowflake,
  Star,
  Smartphone,
  Car,
  Utensils,
  UserX,
} from "lucide-react";
import { useRef, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Eyebrow, H2, PillCta, Reveal, rise, spring } from "./top";
import dirtyImg from "@/assets/lp-coil-dirty.jpg";
import cleanImg from "@/assets/lp-coil-clean.jpg";
import heroImg from "@/assets/lp-hero.jpg";
import aboutImg from "@/assets/lp-about.jpg";
import messageImg from "@/assets/lp-message.jpg";
import slotsImg from "@/assets/lp-process-slots.jpg";
import depositImg from "@/assets/lp-process-deposit.jpg";
import baniladJobImg from "@/assets/job-banilad-family.jpg";
import itParkJobImg from "@/assets/job-itpark-condo.jpg";
import mandaueJobImg from "@/assets/job-mandaue-office.jpg";
import consolacionJobImg from "@/assets/job-consolacion-window.jpg";
import lapuLapuJobImg from "@/assets/job-lapulapu-checkup.jpg";
import theresaPortrait from "@/assets/portraits/theresa.jpg";
import carloPortrait from "@/assets/portraits/carlo.jpg";
import rodelPortrait from "@/assets/portraits/rodel.jpg";
import annaPortrait from "@/assets/portraits/anna.jpg";
import jessaPortrait from "@/assets/portraits/jessa.jpg";
import nonoyPortrait from "@/assets/portraits/nonoy.jpg";
import kimPortrait from "@/assets/portraits/kim.jpg";
import junPortrait from "@/assets/portraits/jun.jpg";
import { Portrait } from "@/components/BugnawUI";
import { useT } from "@/lib/i18n";

/* ---------------- Recent jobs ---------------- */
const RECENT_JOBS = [
  {
    year: "Today",
    title: "3 split-types for a family in Banilad",
    place: "Banilad, Cebu City",
    image: baniladJobImg,
  },
  {
    year: "Yesterday",
    title: "Condo split-type clean near IT Park",
    place: "IT Park, Cebu City",
    image: itParkJobImg,
  },
  {
    year: "3 days ago",
    title: "Office freon top-up in Mandaue",
    place: "Mandaue City",
    image: mandaueJobImg,
  },
  {
    year: "Last week",
    title: "2 window units before the rains",
    place: "Consolacion",
    image: consolacionJobImg,
  },
  {
    year: "Last week",
    title: "Outdoor unit check-up in Lapu-Lapu",
    place: "Lapu-Lapu City",
    image: lapuLapuJobImg,
  },
];

export function RecentJobs() {
  const t = useT();
  return (
    <section className="overflow-hidden bg-lp-bg py-24">
      <Reveal className="mx-auto max-w-7xl px-5 sm:px-8">
        <Eyebrow>{t.recent.eyebrow}</Eyebrow>
        <H2 className="mt-4">{t.recent.h2}</H2>
      </Reveal>
      <div className="marquee mt-12 flex w-max gap-5">
        {[...RECENT_JOBS, ...RECENT_JOBS].map((j, i) => (
          <article key={i} aria-hidden={i >= RECENT_JOBS.length} className="w-[300px] shrink-0 rounded-2xl bg-card p-2">
            <img src={j.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
            <div className="p-3">
              <p className="text-sm text-lp-blue">{t.recent.jobs[i % RECENT_JOBS.length]?.year ?? j.year}</p>
              <h3 className="mt-1 font-oswald text-xl font-semibold text-lp-ink">
                {t.recent.jobs[i % RECENT_JOBS.length]?.title ?? j.title}
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-lp-muted">
                <MapPin className="h-4 w-4 text-lp-blue" /> {j.place}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Process ---------------- */
const STEPS = [
  {
    n: "01",
    t: "Message us any way",
    b: "Messenger, any language. “Pwede ugma?” is enough.",
    img: messageImg,
  },
  {
    n: "02",
    t: "Get real slots instantly",
    b: "An AI reply with open times in your area — Jun’s same-zone days first.",
    img: slotsImg,
  },
  {
    n: "03",
    t: "Tap, pay ₱200, done",
    b: "GCash deposit locks it in. Reminders are handled automatically.",
    img: depositImg,
  },
];

export function Process() {
  const t = useT();
  return (
    <Reveal as="section" className="scroll-mt-20 bg-frostwhite px-5 py-24 sm:px-8">
      <div id="process" className="mx-auto max-w-7xl">
        <div className="text-center">
          <div className="flex justify-center">
            <Eyebrow>{t.process.eyebrow}</Eyebrow>
          </div>
          <H2 className="mt-4">{t.process.h2}</H2>
        </div>
        <div className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-0 top-16 hidden h-24 w-full md:block"
            viewBox="0 0 1200 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <motion.path
              d="M250 50 C 350 -10, 450 110, 550 50"
              stroke="var(--lp-blue)"
              strokeWidth="2"
              strokeDasharray="6 8"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            />
            <motion.path
              d="M650 50 C 750 -10, 850 110, 950 50"
              stroke="var(--lp-blue)"
              strokeWidth="2"
              strokeDasharray="6 8"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4 }}
            />
          </svg>
          {STEPS.map((s, i) => (
            <motion.article key={s.n} variants={rise} className="relative text-center">
              <div className="relative mx-auto h-40 w-40">
                <img
                  src={s.img}
                  alt=""
                  loading="lazy"
                  className="h-40 w-40 rounded-full object-cover ring-8 ring-lp-bg"
                />
                <span className="absolute -right-2 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-lp-blue font-oswald text-lg font-bold text-frostwhite">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-6 font-oswald text-2xl font-semibold text-lp-ink">{t.process.steps[i]?.t ?? s.t}</h3>
              <p className="mx-auto mt-2 max-w-xs text-lp-muted">{t.process.steps[i]?.b ?? s.b}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

const JUN_DAY = [
  {
    time: "8:14 AM",
    icon: Smartphone,
    title: "On a roof, phone buzzing",
    text: "Jun can’t stop mid-cleaning to answer Messenger.",
  },
  {
    time: "10:30 AM",
    icon: MessageCircle,
    title: "14 unread messages",
    text: "Every unanswered inquiry is already checking another technician.",
  },
  {
    time: "1:00 PM",
    icon: Car,
    title: "40-minute drive",
    text: "He reaches Lapu-Lapu. The gate is locked. Nobody is home.",
  },
  {
    time: "6:00 PM",
    icon: Utensils,
    title: "Replying instead of eating",
    text: "The day’s work ends, but the inbox starts.",
  },
  {
    time: "Too late",
    icon: UserX,
    title: "3 customers gone",
    text: "They already booked someone else.",
  },
];

export function JunLife() {
  const t = useT();
  return (
    <Reveal as="section" className="overflow-hidden bg-lp-ink px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Eyebrow light>{t.junLife.eyebrow}</Eyebrow>
        <H2 light className="mt-4 max-w-3xl">
          {t.junLife.h2}
        </H2>
        <div className="mt-14 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:grid md:grid-cols-5 md:overflow-visible">
          {JUN_DAY.map((item, i) => (
            <motion.article
              key={item.time}
              variants={rise}
              className="relative w-[78vw] shrink-0 snap-start border-t border-frostwhite/20 pt-6 md:w-auto"
            >
              <span className="absolute -top-2 left-0 h-4 w-4 rounded-full border-4 border-lp-ink bg-lp-blue" />
              <item.icon className="h-6 w-6 text-lp-blue" />
              <p className="mt-5 text-sm font-semibold text-lp-blue">
                {item.time === "Too late" ? t.junLife.tooLate : item.time}
              </p>
              <h3 className="mt-2 font-oswald text-2xl font-semibold text-frostwhite">
                {t.junLife.items[i]?.title ?? item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-frostwhite/65">{t.junLife.items[i]?.text ?? item.text}</p>
              {i < JUN_DAY.length - 1 && (
                <span className="absolute right-[-18px] top-[-1px] hidden h-px w-5 bg-frostwhite/20 md:block" />
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- Before / After ---------------- */
export function BeforeAfter() {
  const t = useT();
  const [tab, setTab] = useState<"aircon" | "inbox">("inbox");
  const [pct, setPct] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPct(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <Reveal as="section" className="bg-lp-bg px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>{t.beforeAfter.eyebrow}</Eyebrow>
            <H2 className="mt-4">{t.beforeAfter.h2}</H2>
          </div>
          <motion.div variants={rise} role="tablist" className="inline-flex rounded-full bg-card p-1">
            {(
              [
                ["aircon", t.beforeAfter.aircon],
                ["inbox", t.beforeAfter.inbox],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                type="button"
                onClick={() => setTab(k)}
                className={`min-h-11 rounded-full px-5 text-sm font-medium transition-colors ${tab === k ? "bg-lp-blue text-frostwhite" : "text-lp-ink"}`}
              >
                {l}
              </button>
            ))}
          </motion.div>
        </div>
        <motion.div
          variants={rise}
          ref={box}
          className="relative mt-10 aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-2xl sm:aspect-[16/9]"
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && move(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
        >
          <div className="absolute inset-0">
            {tab === "aircon" ? (
              <img
                src={dirtyImg}
                alt="Dirty, dust-clogged aircon coil"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <InboxBefore />
            )}
          </div>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
            {tab === "aircon" ? (
              <img
                src={cleanImg}
                alt="Spotless aircon coil after cleaning"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <InboxAfter />
            )}
          </div>
          <span className="absolute bottom-4 left-4 rounded-full bg-lp-ink/70 px-3 py-1 text-xs font-medium text-frostwhite">
            {t.beforeAfter.before}
          </span>
          <span className="absolute bottom-4 right-4 rounded-full bg-lp-blue px-3 py-1 text-xs font-medium text-frostwhite">
            {t.beforeAfter.after}
          </span>
          <div className="absolute inset-y-0 w-0.5 bg-frostwhite" style={{ left: `${pct}%` }}>
            <button
              type="button"
              role="slider"
              aria-label="Drag to compare before and after"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setPct((p) => Math.max(0, p - 5));
                if (e.key === "ArrowRight") setPct((p) => Math.min(100, p + 5));
              }}
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-frostwhite text-lp-blue shadow-lg focus-visible:outline-2 focus-visible:outline-lp-blue"
            >
              ⟷
            </button>
          </div>
        </motion.div>
      </div>
    </Reveal>
  );
}

function InboxBefore() {
  const t = useT();
  const msgs = [
    "Boss available ka?",
    "How much po 3 units?",
    "Hello??",
    "Pwede ugma?",
    "Nag reply ka?",
    "Asa na mo?",
    "Sige, lain nalang",
    "Open ba kayo sat?",
  ];
  return (
    <div className="h-full bg-lp-ink p-5 sm:p-6">
      <div className="relative h-full w-1/2 overflow-hidden pr-3 sm:pr-6">
        <p className="text-sm font-semibold text-ember">{t.beforeAfter.unread}</p>
        {msgs.map((m, i) => (
          <span
            key={m}
            className={`absolute max-w-[90%] truncate whitespace-nowrap rounded-2xl bg-frostwhite/10 px-3 py-1.5 text-xs text-frostwhite/80 ${i > 5 ? "hidden sm:block" : ""}`}
            style={{
              top: `${12 + i * 10}%`,
              left: `${(i * 17) % 24}%`,
              transform: `rotate(${(i % 3) * 3 - 3}deg)`,
            }}
          >
            {m}
          </span>
        ))}
        <p className="absolute bottom-10 left-0 max-w-36 text-xs leading-relaxed text-frostwhite/45">
          {t.beforeAfter.pileUp}
        </p>
      </div>
    </div>
  );
}

function InboxAfter() {
  const t = useT();
  const rows = [
    { z: "Cebu North", c: "bg-lp-blue", j: ["9:00 Banilad", "10:15 Talamban", "11:30 Lahug"] },
    { z: "Mandaue", c: "bg-success", j: ["1:00 Subangdaku", "2:15 Tipolo"] },
    { z: "Consolacion", c: "bg-lp-star", j: ["3:40 Pitogo"] },
  ];
  return (
    <div className="h-full bg-frostwhite p-4 sm:p-5">
      <div className="ml-auto flex h-full w-1/2 flex-col gap-2 pl-3 sm:gap-3 sm:pl-6">
        <p className="text-xs font-semibold text-lp-blue sm:text-sm">{t.beforeAfter.zoneGrouped}</p>
        {rows.map((r) => (
          <div key={r.z} className="rounded-xl bg-card p-2 shadow-sm sm:p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-lp-ink sm:text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${r.c}`} /> {r.z}
            </p>
            <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
              {r.j.map((j) => (
                <span key={j} className="rounded-md bg-lp-bg px-2 py-1 text-xs text-lp-ink">
                  ✓ {j}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Testimonials ---------------- */
const QUOTES = [
  {
    q: "Na-book nako in 1 minute, wala na ko nag-wait sa reply!",
    n: "Ma. Theresa",
    r: "Homeowner, Talamban",
    image: theresaPortrait,
  },
  {
    q: "They told me Jun was already in Mandaue that day, so he came 2 hours earlier.",
    n: "Carlo",
    r: "Condo owner, Mandaue",
    image: carloPortrait,
  },
  {
    q: "Nag-uwan, pero one tap ra ko ni-reschedule. Salamat kaayo!",
    n: "Rodel",
    r: "Homeowner, Lapu-Lapu",
    image: rodelPortrait,
  },
  {
    q: "Taglish ako nag-message, Taglish din yung reply. Ang galing!",
    n: "Anna Marie",
    r: "Renter, Consolacion",
    image: annaPortrait,
  },
  {
    q: "The reminder came 6 months later. Booked again without thinking.",
    n: "Jessa",
    r: "Homeowner, Banilad",
    image: jessaPortrait,
  },
  {
    q: "Limpyo kaayo ang aircon, bugnaw na jud ang kwarto.",
    n: "Nonoy",
    r: "Store owner, Tipolo",
    image: nonoyPortrait,
  },
  {
    q: "Clear price upfront, ₱200 deposit, no surprises.",
    n: "Kim",
    r: "Office manager, IT Park",
    image: kimPortrait,
  },
  {
    q: "Ang Bugnaw ang nag-reply para nako. I just clean aircons now.",
    n: "Jun Villanueva",
    r: "Owner",
    image: junPortrait,
  },
];

function QuoteCard({ q, n, r, image }: (typeof QUOTES)[number]) {
  return (
    <figure className="flex w-[360px] shrink-0 flex-col rounded-2xl bg-card p-6">
      <div className="flex gap-0.5 text-lp-star">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="h-5 w-5 fill-current" />
        ))}
      </div>
      <blockquote className="mt-4 min-h-[72px] text-lg leading-snug text-lp-ink">{q}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <Portrait src={image} name={n} className="h-12 w-12 ring-card" />
        <span className="flex-1">
          <span className="block text-lp-ink">{n}</span>
          <span className="text-sm text-lp-muted">{r}</span>
        </span>
        <Quote className="h-7 w-7 fill-lp-ink text-lp-ink" />
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const t = useT();
  const a = QUOTES.slice(0, 4);
  const b = QUOTES.slice(4);
  return (
    <section aria-label="What customers say" className="overflow-hidden bg-lp-bg py-24">
      <Reveal className="mx-auto mb-12 max-w-7xl px-5 sm:px-8">
        <Eyebrow>{t.testimonials.eyebrow}</Eyebrow>
        <H2 className="mt-4">{t.testimonials.h2}</H2>
      </Reveal>
      <div className="marquee flex w-max gap-6">
        {[...a, ...a].map((quote, i) => (
          <QuoteCard key={i} {...quote} />
        ))}
      </div>
      <div className="marquee-rev mt-6 flex w-max gap-6">
        {[...b, ...b].map((quote, i) => (
          <QuoteCard key={i} {...quote} />
        ))}
      </div>
    </section>
  );
}

/* ---------------- Pricing ---------------- */
const PLANS = [
  {
    name: "Single Cleaning",
    price: "₱800",
    per: "/unit",
    items: ["Full inspection", "Filter + coil cleaning", "30-day warranty"],
    search: { service: "split-clean", units: 1 },
  },
  {
    name: "Whole-Home Clean",
    price: "₱2,000",
    per: "up to 3 units",
    items: ["Everything in Single", "Freon pressure check", "Priority slots", "60-day warranty"],
    search: { service: "split-clean", units: 3 },
    featured: true,
  },
  {
    name: "Bugnaw Care Plan",
    price: "₱3,500",
    per: "/year",
    items: ["2 cleanings per unit yearly", "Automatic 6-month reminders", "Rainy-season priority rescheduling"],
    search: { service: "care-plan", units: 1, plan: "care" },
  },
];

export function Pricing() {
  const t = useT();
  return (
    <Reveal as="section" className="scroll-mt-20 bg-frostwhite px-5 py-24 sm:px-8">
      <div id="pricing" className="mx-auto max-w-7xl">
        <div className="text-center">
          <div className="flex justify-center">
            <Eyebrow>{t.pricing.eyebrow}</Eyebrow>
          </div>
          <H2 className="mt-4">{t.pricing.h2}</H2>
        </div>
        <div className="mt-14 grid items-center gap-6 md:grid-cols-3">
          {PLANS.map((p, pi) => {
            const tp = t.pricing.plans[pi];
            return (
              <motion.article
                key={p.name}
                variants={rise}
                whileHover={{ y: -6 }}
                transition={spring}
                className={`flex flex-col rounded-2xl p-8 ${p.featured ? "bg-lp-blue text-frostwhite md:py-12 md:shadow-2xl" : "bg-lp-bg text-lp-ink"}`}
              >
                <h3 className="font-oswald text-2xl font-semibold">{tp?.name ?? p.name}</h3>
                <p className="mt-6 font-oswald text-5xl font-bold">
                  {p.price}
                  <span
                    className={`ml-2 font-inter text-base font-normal ${p.featured ? "text-frostwhite/80" : "text-lp-muted"}`}
                  >
                    {tp?.per ?? p.per}
                  </span>
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {(tp?.items ?? p.items).map((i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${p.featured ? "bg-frostwhite text-lp-blue" : "bg-lp-blue text-frostwhite"}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {i}
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <PillCta search={p.search} dark={!!p.featured}>
                    {tp?.cta ?? `Choose ${p.name.split(" ")[0]}`}
                  </PillCta>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- FAQ ---------------- */

export function Faq() {
  const t = useT();
  return (
    <Reveal as="section" className="bg-lp-bg px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>{t.faq.eyebrow}</Eyebrow>
          <H2 className="mt-4">{t.faq.h2}</H2>
          <motion.img
            variants={rise}
            src={aboutImg}
            alt=""
            loading="lazy"
            className="mt-8 hidden aspect-[4/3] w-full rounded-2xl object-cover lg:block"
          />
        </div>
        <motion.div variants={rise}>
          <Accordion type="single" collapsible defaultValue="0" className="space-y-3">
            {t.faq.items.map(({ q, a }, i) => (
              <AccordionItem key={i} value={String(i)} className="rounded-2xl border-none bg-card px-6">
                <AccordionTrigger className="py-5 text-left font-oswald text-xl font-medium text-lp-ink hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-base text-lp-muted">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </Reveal>
  );
}

/* ---------------- Final CTA ---------------- */
export function FinalCta() {
  const t = useT();
  return (
    <section className="bg-lp-bg px-5 pb-24 sm:px-8">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl">
        <img
          src={heroImg}
          alt=""
          loading="lazy"
          className="animate-kenburns absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-lp-ink/60" />
        <div className="relative px-6 py-24 text-center sm:py-32">
          <motion.h2 variants={rise} className="font-oswald text-4xl font-bold text-frostwhite sm:text-6xl">
            {t.finalCta.h2a}
            <span className="text-lp-blue">{t.finalCta.h2b}</span>
          </motion.h2>
          <motion.p variants={rise} className="mt-4 text-lg text-frostwhite/80">
            {t.finalCta.sub}
          </motion.p>
          <motion.div variants={rise} className="mt-8 flex justify-center">
            <PillCta size="lg">{t.nav.book}</PillCta>
          </motion.div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- Footer ---------------- */
export function Footer() {
  const t = useT();
  return (
    <footer data-landing-footer className="overflow-hidden bg-lp-ink px-5 pt-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="flex items-center gap-2 font-oswald text-3xl font-bold text-frostwhite">
              <Snowflake className="h-6 w-6 text-lp-blue" /> Bugnaw
            </p>
            <p className="mt-4 max-w-sm text-frostwhite/75">{t.footer.blurb}</p>
          </div>
          <div>
            <p className="text-lg text-frostwhite">{t.footer.quickLinks}</p>
            <ul className="mt-4 space-y-2.5 text-frostwhite/70">
              <li>
                <a href="#top" className="inline-flex min-h-11 items-center hover:text-frostwhite">
                  {t.footer.home}
                </a>
              </li>
              <li>
                <a href="#services" className="inline-flex min-h-11 items-center hover:text-frostwhite">
                  {t.footer.services}
                </a>
              </li>
              <li>
                <a href="#pricing" className="inline-flex min-h-11 items-center hover:text-frostwhite">
                  {t.footer.pricing}
                </a>
              </li>
              <li>
                <Link to="/book" className="inline-flex min-h-11 items-center hover:text-frostwhite">
                  {t.footer.book}
                </Link>
              </li>
              <li>
                <Link to="/find-booking" className="inline-flex min-h-11 items-center hover:text-frostwhite">
                  {t.footer.reschedule}
                </Link>
              </li>
              <li>
                <Link to="/owner" className="inline-flex min-h-11 items-center hover:text-frostwhite">
                  {t.footer.ownerLogin}
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-frostwhite/70">
            <a href="#chat" className="flex min-h-11 items-center gap-2 hover:text-frostwhite">
              <MessageCircle className="h-4 w-4" /> Messenger
            </a>
            <p className="mt-2.5">0917 123 4567</p>
            <a href="mailto:hello@bugnaw.ph" className="mt-2.5 inline-flex min-h-11 items-center hover:text-frostwhite">
              hello@bugnaw.ph
            </a>
            <div className="mt-5 flex gap-4 text-lp-blue">
              <a
                href="https://www.facebook.com/profile.php?id=100090527624920"
                aria-label="Bugnaw on Facebook"
                target="_blank"
                rel="noreferrer"
                className="grid h-11 w-11 place-items-center"
              >
                <Facebook className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        <motion.p
          aria-hidden
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 select-none bg-[linear-gradient(180deg,var(--lp-blue)_0%,transparent_95%)] bg-clip-text text-center font-inter text-[19vw] font-bold leading-[0.85] tracking-tight text-transparent lg:text-[15rem]"
        >
          BUGNAW
        </motion.p>
        <div className="flex flex-col items-start justify-between gap-4 border-t border-frostwhite/10 py-8 text-sm text-frostwhite/70 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Link to="/terms" className="inline-flex min-h-11 items-center hover:text-frostwhite">
              {t.footer.terms}
            </Link>
            <span className="h-4 w-px bg-frostwhite/40" />
            <Link to="/privacy" className="inline-flex min-h-11 items-center hover:text-frostwhite">
              {t.footer.privacy}
            </Link>
          </div>
          <p>© 2026 Bugnaw Aircon Care · Mandaue City, Cebu · Built with Lovable for #lovablechallenge</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-frostwhite/20 px-4 text-frostwhite hover:bg-frostwhite/10"
          >
            <ArrowUp className="h-4 w-4" /> {t.footer.top}
          </button>
        </div>
      </div>
    </footer>
  );
}
