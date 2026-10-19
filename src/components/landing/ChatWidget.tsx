import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "framer-motion";
import { Info, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { reportChatReply } from "@/components/GuidedTour";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { publicChat, type PublicChatReply } from "@/lib/inbox.functions";
import { dateLabel, timeLabel } from "@/lib/format";
import messagePhoto from "@/assets/lp-message.jpg";
import junPortrait from "@/assets/portraits/jun.jpg";
import { LANGS, useLanguage } from "@/lib/i18n";

/** Strip the raw slot list and booking URL from the AI draft — the web chat shows slots as buttons instead. */
function cleanReplyText(text: string, hasSlots: boolean): string {
  let out = text
    .replace(/https?:\/\/\S*\/book\?lead=\S+/g, "")
    .replace(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+\w{3,9}\s+\d{1,2},?\s+\d{1,2}:\d{2}\s?(?:AM|PM)/gi, "")
    .replace(/^\s*(?:\d+[.)]|[-•*])\s*$/gm, "")
    .replace(/(?:available|open)\s+(?:slots|times|schedules?)\s*(?:are|ni Jun|po)?\s*:\s*(?=\n|$)/gi, "")
    .replace(/^[^\n.!?]{0,60}:\s*$/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out;
}

const TOUR_EXAMPLES = [
  "Boss, pila cleaning sa usa ka split type? Mandaue ko, pwede Sabado buntag?",
  "Hi po, available ba kayo bukas for 2 split type sa Banilad?",
  "Can I book one window-type cleaning in Lapu-Lapu this Friday afternoon?",
  "Maayong adlaw, pa-check unta ko aircon sa Talamban kay dili na bugnaw.",
  "Magkano po freon recharge for one unit in Cebu City South?",
];
const TOUR_EXAMPLE_KEY = "bugnaw-tour-example-index";

export function ChatWidget() {
  const chat = useServerFn(publicChat);
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [userMessage, setUserMessage] = useState("");
  const [reply, setReply] = useState<PublicChatReply | null>(null);
  const [status, setStatus] = useState<"ready" | "submitted" | "error">("ready");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const { lang, setLang, t } = useLanguage();
  const c = t.chat;

  async function send(text: string, tourGenerated = false) {
    const clean = text.trim();
    if (!clean || status === "submitted") return;
    setUserMessage(clean);
    setReply(null);
    setError("");
    setStatus("submitted");
    const result = await chat({
      data: { text: clean, origin: window.location.origin, tourGenerated },
    });
    if (result.ok) {
      setReply(result.data);
      setStatus("ready");
      const first = result.data.slots[0];
      if (first) reportChatReply({ leadToken: result.data.leadToken, date: first.date, time: first.time });
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    const onExample = () => {
      let index = 0;
      try {
        index = Number(sessionStorage.getItem(TOUR_EXAMPLE_KEY) ?? "0") % TOUR_EXAMPLES.length;
      } catch {
        /* ignore */
      }
      const example = TOUR_EXAMPLES[index] ?? TOUR_EXAMPLES[0];
      try {
        sessionStorage.setItem(TOUR_EXAMPLE_KEY, String((index + 1) % TOUR_EXAMPLES.length));
      } catch {
        /* ignore */
      }
      if (example) void sendRef.current(example, true);
    };
    window.addEventListener("bugnaw:send-example", onExample);
    return () => window.removeEventListener("bugnaw:send-example", onExample);
  }, []);

  return (
    <section id="chat" className="scroll-mt-20 bg-frostwhite px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="flex items-center gap-3 text-xs font-semibold uppercase text-lp-ink">
            <span className="h-0.5 w-6 bg-lp-blue" /> {c.eyebrow}
          </p>
          <h2 className="mt-4 font-oswald text-4xl font-bold leading-tight text-lp-ink sm:text-5xl">{c.h2}</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-lp-muted">{c.sub}</p>
          <img
            src={messagePhoto}
            alt="Aircon technician responding between service calls"
            loading="lazy"
            className="mt-8 aspect-[4/3] w-full rounded-2xl object-cover"
          />
        </motion.div>

        <motion.div
          initial={false}
          data-tour="chat"
          className="overflow-hidden rounded-2xl border border-lp-ink/10 bg-card shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-lp-ink/8 px-4 py-3 sm:px-5">
            <span className="relative shrink-0">
              <img
                src={junPortrait}
                alt="Jun Villanueva"
                width={48}
                height={48}
                loading="lazy"
                className="h-12 w-12 rounded-full object-cover"
              />
              <span
                aria-label="Online"
                className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-success"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-lp-ink">Bugnaw Aircon Care</p>
              <p className="text-xs leading-tight text-lp-muted">Jun Villanueva · {c.replies}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="About Bugnaw replies"
                    className="shrink-0 text-lp-muted"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-64">
                  <p>{c.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center justify-center gap-3 border-b border-lp-ink/8 px-4 py-2 sm:justify-between sm:px-5">
            <p className="hidden text-[11px] text-lp-muted sm:block">{c.langNote}</p>
            <div role="group" aria-label={t.nav.language} className="flex shrink-0 rounded-full bg-lp-bg p-0.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  aria-pressed={lang === l.code}
                  onClick={() => setLang(l.code)}
                  className={`min-h-9 rounded-full px-3 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-lp-blue ${lang === l.code ? "bg-lp-blue text-frostwhite" : "text-lp-muted hover:text-lp-ink"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[560px] min-h-[240px] space-y-1 overflow-y-auto bg-card p-4 sm:p-5" aria-live="polite">
            {!userMessage && (
              <div className="space-y-1">
                <Message from="assistant" className="max-w-[88%]">
                  <MessageContent className="rounded-[18px] rounded-bl-md bg-lp-bg px-3.5 py-2.5 text-lp-ink">
                    <MessageResponse>{c.greeting}</MessageResponse>
                  </MessageContent>
                </Message>
                <div className="flex items-end gap-2">
                  <img
                    src={junPortrait}
                    alt=""
                    aria-hidden
                    width={28}
                    height={28}
                    loading="lazy"
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                  <Message from="assistant" className="max-w-[82%]">
                    <MessageContent className="rounded-[18px] rounded-bl-md bg-lp-bg px-3.5 py-2.5 text-lp-ink">
                      <MessageResponse>{c.tryOne}</MessageResponse>
                    </MessageContent>
                  </Message>
                </div>
                <p className="pl-9 pt-1 text-[11px] text-lp-muted">{c.justNow}</p>
              </div>
            )}
            {userMessage && (
              <div className="pb-2">
                <Message from="user" className="max-w-[82%]">
                  <MessageContent className="messenger-user-bubble rounded-[18px] rounded-br-md px-3.5 py-2.5">
                    {userMessage}
                  </MessageContent>
                </Message>
                <p className="mt-1 text-right text-[11px] text-lp-muted">{c.seen}</p>
              </div>
            )}
            {status === "submitted" && (
              <div className="flex items-end gap-2 pt-1">
                <img
                  src={junPortrait}
                  alt=""
                  aria-hidden
                  width={28}
                  height={28}
                  loading="lazy"
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
                <div>
                  <div
                    className="inline-flex items-center gap-1 rounded-[18px] rounded-bl-md bg-lp-bg px-4 py-3"
                    aria-label="Jun is typing"
                  >
                    <span className="h-2 w-2 animate-bounce rounded-full bg-lp-muted [animation-delay:-0.24s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-lp-muted [animation-delay:-0.12s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-lp-muted" />
                  </div>
                  <p className="mt-1 text-[11px] text-lp-muted">{c.typing}</p>
                </div>
              </div>
            )}
            {reply && (
              <div className="flex items-end gap-2 pt-1">
                <img
                  src={junPortrait}
                  alt=""
                  aria-hidden
                  width={28}
                  height={28}
                  loading="lazy"
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 max-w-[calc(100%-2.25rem)] flex-1 sm:max-w-[88%]">
                  <Message from="assistant" className="max-w-full">
                    <MessageContent className="rounded-[18px] rounded-bl-md bg-lp-bg px-3.5 py-2.5 text-lp-ink">
                      <MessageResponse>{cleanReplyText(reply.reply, reply.slots.length > 0)}</MessageResponse>
                    </MessageContent>
                  </Message>
                  {reply.slots.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {reply.slots.map((slot) => (
                        <Button
                          key={`${slot.date}-${slot.time}`}
                          variant="outline"
                          className="h-12 w-full justify-between rounded-xl px-3.5"
                          onClick={() =>
                            navigate({
                              to: "/book",
                              search: { lead: reply.leadToken, date: slot.date, time: slot.time },
                            })
                          }
                        >
                          <span className="truncate font-semibold">
                            {dateLabel(slot.date, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            · {timeLabel(slot.time)}
                          </span>
                          <span className="rounded-full bg-lp-blue px-3 py-1 text-xs text-frostwhite">{c.book}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-lp-muted">{c.justNow}</p>
                </div>
              </div>
            )}
            {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </div>
          <div className="border-t border-lp-ink/8 p-3 sm:p-4">
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              {c.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={status === "submitted"}
                  onClick={() => send(example)}
                  className="flex min-h-12 items-center rounded-2xl border border-lp-blue/20 bg-card px-3 py-2 text-left text-xs font-medium leading-snug text-lp-ink transition-colors hover:bg-lp-bg disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
            <PromptInput
              onSubmit={async ({ text }) => {
                await send(text);
                setDraft("");
              }}
              className="relative rounded-3xl border-lp-ink/15 bg-card shadow-none"
            >
              <PromptInputTextarea
                aria-label="Message Bugnaw"
                placeholder={c.placeholder}
                disabled={status === "submitted"}
                onChange={(event) => setDraft(event.currentTarget.value)}
                className="max-h-24 min-h-12 py-3 pl-4 pr-14 text-base"
              />
              <PromptInputFooter className="absolute bottom-1.5 right-1.5 w-auto p-0">
                <PromptInputSubmit
                  aria-label="Send message"
                  status={status === "submitted" ? "submitted" : status === "error" ? "error" : "ready"}
                  disabled={status === "submitted" || !draft.trim()}
                  className="h-9 min-h-9 w-9 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </PromptInputSubmit>
              </PromptInputFooter>
            </PromptInput>
            {reply && (
              <p className="mx-auto mt-3 max-w-sm text-center text-[11px] text-lp-muted">
                {c.inboxNote} ·{" "}
                <Link
                  to="/owner"
                  search={{ demo: true }}
                  className="inline-flex min-h-11 items-center font-semibold text-lp-blue underline-offset-4 hover:underline"
                >
                  {c.seeInbox}
                </Link>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
