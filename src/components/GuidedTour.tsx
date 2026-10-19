import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "bugnaw-tour";
const REPLY_KEY = "bugnaw-tour-reply";
const PROMPT_KEY = "bugnaw-tour-prompt-dismissed";
const TOTAL = 4;

type TourState = { step: number; link?: { lead: string; date: string; time: string } };
type ChatReply = { leadToken: string; date: string; time: string };

export function startTour() {
  window.dispatchEvent(new Event("bugnaw:tour-start"));
}

/** Called by the landing chat after an AI reply with slots arrives. */
export function reportChatReply(r: ChatReply) {
  try {
    sessionStorage.setItem(REPLY_KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("bugnaw:chat-reply"));
}

function readState(): TourState | null {
  try {
    const s = sessionStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
function readReply(): ChatReply | null {
  try {
    const s = sessionStorage.getItem(REPLY_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

const TARGETS = ["chat", "booking", "website-chat", "impact-stats"];

export function GuidedTour() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduced = useReducedMotion();
  const [state, setState] = useState<TourState | null>(null);
  const [reply, setReply] = useState<ChatReply | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [summaryRect, setSummaryRect] = useState<DOMRect | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [impactText, setImpactText] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const [mobile, setMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrolledFor = useRef<string>("");

  const save = useCallback((s: TourState | null) => {
    setState(s);
    try {
      if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Hydrate from storage
  useEffect(() => {
    setState(readState());
    setReply(readReply());
    try {
      setShowPrompt(!localStorage.getItem(PROMPT_KEY));
    } catch {
      /* ignore */
    }
    const mq = window.matchMedia("(max-width: 640px)");
    const onMq = () => setMobile(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    const onStart = () => {
      try {
        localStorage.setItem(PROMPT_KEY, "1");
        sessionStorage.removeItem(REPLY_KEY);
      } catch {
        /* ignore */
      }
      setShowPrompt(false);
      setReply(null);
      setSent(false);
      scrolledFor.current = "";
      save({ step: 0 });
      navigate({ to: "/" });
    };
    const onReply = () => setReply(readReply());
    window.addEventListener("bugnaw:tour-start", onStart);
    window.addEventListener("bugnaw:chat-reply", onReply);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("bugnaw:tour-start", onStart);
      window.removeEventListener("bugnaw:chat-reply", onReply);
    };
  }, [navigate, save]);

  const step = state?.step ?? -1;
  const active = step >= 0;
  const target = step >= 0 && step < TOTAL ? TARGETS[step] : null;

  const getTargetRect = useCallback(() => {
    if (step === 1) {
      const slot = document.querySelector<HTMLElement>('[data-tour="selected-slot"]');
      return slot?.getBoundingClientRect() ?? null;
    }
    return target
      ? (document.querySelector<HTMLElement>(`[data-tour="${target}"]`)?.getBoundingClientRect() ?? null)
      : null;
  }, [step, target]);

  // Track target position
  useEffect(() => {
    if (!active || !target) {
      setRect(null);
      setSummaryRect(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      const currentRect = getTargetRect();
      if (currentRect) {
        const key = `${target}:${pathname}`;
        if (scrolledFor.current !== key) {
          scrolledFor.current = key;
          const headerOffset = document.querySelector<HTMLElement>("header")?.getBoundingClientRect().height ?? 72;
          const desiredTop =
            step === 3
              ? headerOffset + 20
              : mobile
                ? headerOffset + 14
                : Math.max(headerOffset + 20, (window.innerHeight - currentRect.height) / 2);
          const top = window.scrollY + currentRect.top - desiredTop;
          window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
        }
        setRect(getTargetRect());
        setSummaryRect(
          step === 1
            ? (document.querySelector<HTMLElement>('[data-tour="booking-summary"]')?.getBoundingClientRect() ?? null)
            : null,
        );
      } else {
        setRect(null);
        setSummaryRect(null);
      }
      raf = window.setTimeout(tick, 120) as unknown as number;
    };
    tick();
    return () => clearTimeout(raf);
  }, [active, target, pathname, reduced, mobile, step, getTargetRect]);

  useEffect(() => {
    if (active && step === 1) document.documentElement.dataset["tourBooking"] = "true";
    else delete document.documentElement.dataset["tourBooking"];
    return () => {
      delete document.documentElement.dataset["tourBooking"];
    };
  }, [active, step]);

  // Focus card on step change
  useEffect(() => {
    if (active) setTimeout(() => cardRef.current?.focus(), 60);
  }, [active, step]);

  // Esc closes
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") save(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, save]);

  const hasRect = !!rect;
  // Read Impact numbers from the page
  useEffect(() => {
    if (step !== 3 || !hasRect) return;
    const t = setTimeout(() => {
      const cards = Array.from(document.querySelectorAll('[data-tour="impact-stats"] article')).slice(0, 5);
      const parts = cards
        .map((c) => {
          const ps = c.querySelectorAll("p");
          return ps.length >= 2 ? `${ps[0]!.textContent?.trim()} ${ps[1]!.textContent?.trim()}` : "";
        })
        .filter(Boolean);
      if (parts.length) {
        const first = parts[0] ?? "";
        const conversion = first.match(/^(\d+%)\s+(.+)$/);
        const rate = conversion?.[1];
        const count = conversion?.[2];
        setImpactText(
          rate && count
            ? `${rate} booked (${count.replace(/\s+booked$/i, "")})${parts.length > 1 ? ` · ${parts.slice(1).join(" · ")}` : ""}`
            : parts.join(" · "),
        );
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [step, hasRect, pathname]);

  async function go(next: number) {
    setErr("");
    if (next === 0) {
      save({ ...state, step: 0 });
      navigate({ to: "/" });
      return;
    }
    if (next === 1) {
      const r = reply ?? readReply();
      const link = r ? { lead: r.leadToken, date: r.date, time: r.time } : state?.link;
      if (!link) return;
      save({ step: 1, link });
      navigate({ to: "/book", search: link });
      return;
    }
    if (next === 2) {
      setBusy(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const { data } = await supabase.auth.getSession();
      if (!data.session || data.session.user.email !== "demo@bugnaw.app") {
        const { error } = await supabase.auth.signInWithPassword({
          email: "demo@bugnaw.app",
          password: "BugnawDemo2026!",
        });
        if (error) {
          setBusy(false);
          setErr("Couldn't open the demo. Please try again.");
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        try {
          await (supabase.rpc as any)("ensure_demo_fresh");
        } catch {
          /* ignore */
        }
        queryClient.removeQueries();
      }
      save({ ...state, step: 2 });
      // Full page load so the owner workspace boots cleanly with the fresh demo session.
      window.location.assign("/inbox");
      return;
    }
    if (next === 3) {
      save({ ...state, step: 3 });
      navigate({ to: "/impact" });
      return;
    }
    save({ ...state, step: next });
  }

  function sendExample() {
    setSent(true);
    window.dispatchEvent(new Event("bugnaw:send-example"));
  }

  function dismissPrompt() {
    setShowPrompt(false);
    try {
      localStorage.setItem(PROMPT_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  const onLanding = pathname === "/";

  useEffect(() => {
    if (!onLanding) {
      setPastHero(false);
      setFooterInView(false);
      return;
    }
    const hero = document.querySelector<HTMLElement>("#top");
    const footer = document.querySelector<HTMLElement>("footer[data-landing-footer]");
    const heroObserver = hero
      ? new IntersectionObserver(([entry]) => setPastHero(!entry?.isIntersecting), { threshold: 0 })
      : null;
    const footerObserver = footer
      ? new IntersectionObserver(([entry]) => setFooterInView(!!entry?.isIntersecting), { threshold: 0.05 })
      : null;
    if (hero && heroObserver) heroObserver.observe(hero);
    if (footer && footerObserver) footerObserver.observe(footer);
    return () => {
      heroObserver?.disconnect();
      footerObserver?.disconnect();
    };
  }, [onLanding]);

  useEffect(() => {
    if (!showPrompt || !pastHero || footerInView || active) return;
    const timer = window.setTimeout(dismissPrompt, 8000);
    return () => window.clearTimeout(timer);
  }, [showPrompt, pastHero, footerInView, active]);

  const steps = [
    {
      title: "A customer messages, like on Messenger",
      body: "No forms. Bugnaw replies in their language with Jun's real open slots — in seconds.",
    },
    {
      title: "One tap to book",
      body: "Service, area and time are already filled in. The ₱200 GCash deposit locks the slot and cuts no-shows.",
    },
    {
      title: "Meanwhile, on Jun's side",
      body: "The inquiry is already in Jun's Inbox, answered. He didn't type a thing.",
    },
    {
      title: "What that adds up to",
      body: impactText
        ? `This month: ${impactText}.`
        : "This month: most inquiries booked automatically, hours of admin returned, no-shows prevented, deposits protected.",
    },
  ];

  // Card placement
  let cardStyle: { left?: number | string; top?: number | string; right?: number; bottom?: number; width?: number } =
    {};
  if (!mobile) {
    const W = 360;
    if (rect && step < TOTAL) {
      const vw = window.innerWidth,
        vh = window.innerHeight;
      if (step === 3)
        cardStyle = { left: Math.max(24, Math.min(rect.left, vw - W - 24)), top: Math.min(rect.bottom + 16, vh - 250) };
      else if (vw - rect.right >= W + 32)
        cardStyle = { left: rect.right + 16, top: Math.min(Math.max(16, rect.top), vh - 320) };
      else if (rect.left >= W + 32)
        cardStyle = { left: rect.left - W - 16, top: Math.min(Math.max(16, rect.top), vh - 320) };
      else cardStyle = { right: 24, bottom: 24 };
    } else cardStyle = { left: "calc(50% - 180px)", top: "30%" };
    cardStyle.width = W;
  }

  const btn =
    "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-lp-blue disabled:opacity-40";
  const primary = `${btn} bg-lp-blue text-frostwhite`;
  const ghost = `${btn} border border-lp-ink/15 text-lp-ink`;

  return (
    <>
      {/* Hidden over the hero (which has its own "Take the tour" button) and near the footer. */}
      {onLanding && !active && (
        <motion.div
          initial={false}
          animate={{ opacity: pastHero && !footerInView ? 1 : 0, y: pastHero && !footerInView ? 0 : 10 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          aria-hidden={!pastHero || footerInView}
          className={`fixed bottom-5 left-4 z-[90] flex max-w-[calc(100vw-7rem)] flex-col items-start gap-2 sm:left-6 ${!pastHero || footerInView ? "pointer-events-none" : ""}`}
        >
          <AnimatePresence>
            {showPrompt && pastHero && !footerInView && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-14 left-0 w-[280px] max-w-[calc(100vw-2rem)] rounded-2xl bg-card p-4 pr-9 text-sm text-lp-ink shadow-xl"
                role="status"
              >
                New here? See how Bugnaw turns a message into a booking.
                <button
                  type="button"
                  onClick={dismissPrompt}
                  aria-label="Dismiss"
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-lp-muted hover:bg-lp-bg"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={startTour}
            tabIndex={pastHero && !footerInView ? 0 : -1}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-lp-ink px-5 text-sm font-semibold text-frostwhite shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-lp-blue"
          >
            <Play className="h-4 w-4 fill-current" /> Take the 60-second tour
          </button>
        </motion.div>
      )}

      {active && (
        <>
          {busy && (
            <div className="fixed inset-0 z-[10000] grid place-items-center bg-lp-bg">
              <div className="flex items-center gap-3 rounded-2xl bg-card px-6 py-5 text-sm font-semibold text-lp-ink shadow-2xl">
                <LoaderCircle className="h-5 w-5 animate-spin text-lp-blue" /> Getting your dashboard ready…
              </div>
            </div>
          )}
          {rect && step < TOTAL ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none fixed z-[9998] rounded-2xl ring-2 ring-lp-blue transition-all duration-200"
                style={{
                  top: rect.top - 8,
                  left: rect.left - 8,
                  width: rect.width + 16,
                  height: rect.height + 16,
                  boxShadow: "0 0 0 9999px color-mix(in oklab, var(--lp-ink) 55%, transparent)",
                }}
              />
              {step === 1 && summaryRect && (
                <div
                  aria-hidden
                  className="pointer-events-none fixed z-[9999] rounded-2xl ring-2 ring-lp-blue transition-all duration-200"
                  style={{
                    top: summaryRect.top - 8,
                    left: summaryRect.left - 8,
                    width: summaryRect.width + 16,
                    height: summaryRect.height + 16,
                  }}
                />
              )}
            </>
          ) : (
            <div aria-hidden className="pointer-events-none fixed inset-0 z-[9998] bg-lp-ink/55" />
          )}
          <motion.div
            key={step}
            ref={cardRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="false"
            aria-labelledby="tour-title"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={
              mobile
                ? "fixed inset-x-0 bottom-0 z-[10000] rounded-t-3xl bg-card p-5 pb-28 text-lp-ink shadow-2xl outline-none"
                : "fixed z-[9999] rounded-2xl bg-card p-6 text-lp-ink shadow-2xl outline-none"
            }
            style={cardStyle}
          >
            {step < TOTAL ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-lp-blue">
                    Step {step + 1} of {TOTAL}
                  </p>
                  <button
                    type="button"
                    onClick={() => save(null)}
                    className="text-xs font-medium text-lp-muted underline-offset-4 hover:underline"
                  >
                    Skip tour
                  </button>
                </div>
                <h2 id="tour-title" className="mt-2 font-oswald text-2xl font-bold leading-tight">
                  {steps[step]!.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-lp-muted">{steps[step]!.body}</p>
                {step === 0 && !reply && (
                  <button type="button" onClick={sendExample} disabled={sent} className={`${ghost} mt-4 w-full gap-2`}>
                    {sent ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" /> Waiting for Bugnaw's reply…
                      </>
                    ) : (
                      "Send an example"
                    )}
                  </button>
                )}
                {busy && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-lp-muted">
                    <LoaderCircle className="h-4 w-4 animate-spin text-lp-blue" /> Getting your dashboard ready…
                  </p>
                )}
                {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
                <div className="mt-5 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => go(step - 1)} disabled={step === 0 || busy} className={ghost}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => go(step + 1)}
                    disabled={busy || (step === 0 && !reply)}
                    className={primary}
                  >
                    {step === TOTAL - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => save(null)}
                    aria-label="Close tour"
                    className="grid h-8 w-8 place-items-center rounded-full text-lp-muted hover:bg-lp-bg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h2 id="tour-title" className="font-oswald text-2xl font-bold leading-tight">
                  That's Bugnaw: from ‘Pwede ba ugma?’ to ‘You're booked’ — without Jun lifting a finger.
                </h2>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => save(null)} className={primary}>
                    Explore Jun's dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      save(null);
                      navigate({ to: "/" });
                    }}
                    className={ghost}
                  >
                    Back to the site
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </>
  );
}
