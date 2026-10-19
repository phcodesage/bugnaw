import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Lang = "bisaya" | "taglish" | "english";
export type Extracted = {
  customer_name: string | null;
  service_slug: string | null;
  units: number | null;
  zone_slug: string | null;
  barangay: string | null;
  preferred_date: string | null;
  preferred_day: string | null;
  preferred_time: "morning" | "afternoon" | null;
  language: Lang;
  confidence: { service: number; units: number; zone: number; when: number };
  missing: string[];
};
export type SuggestedSlot = { date: string; time: string; best: boolean };
export type ConversationStatus = "new" | "replied" | "link_opened" | "booked";

export type InboxItem = {
  id: string;
  customer_name: string;
  status: ConversationStatus;
  language: string | null;
  last_message_at: string;
  preview: string;
  extracted: Partial<Extracted>;
  channel: string;
};

export type Thread = {
  id: string;
  customer_name: string;
  status: ConversationStatus;
  language: string | null;
  extracted: Partial<Extracted>;
  suggested_slots: SuggestedSlot[];
  draft_reply: string | null;
  booking_reference: string | null;
  lead_token: string;
  messages: Array<{ id: string; direction: "in" | "out"; sent_by: string; body: string; created_at: string }>;
};

/* ---------------- helpers (server-only at runtime; called inside handlers) ---------------- */

function addDaysIso(iso: string, days: number) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

function dayWords(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    label: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }),
  };
}

function manilaToday() {
  const now = new Date(Date.now() + 8 * 3600_000);
  const iso = now.toISOString().slice(0, 10);
  const tomorrow = addDaysIso(iso, 1);
  return {
    iso,
    weekday: dayWords(iso).weekday,
    label: dayWords(iso).label,
    tomorrow,
    tomorrowLabel: dayWords(tomorrow).label,
  };
}

/** "ugma"/"bukas"/"tomorrow" and "karon"/"today" resolved in code — the model miscounts weekdays. */
function relativeDate(lower: string, todayIso: string): string | null {
  if (/\b(ugma|bukas|tomorrow|tmrw|tom)\b/.test(lower)) return addDaysIso(todayIso, 1);
  if (/\b(karon|karong adlawa|today|ngayon)\b/.test(lower)) return todayIso;
  return null;
}

/** Common Cebu places Jun does not cover; used to say so instead of asking for a barangay again. */
const OUTSIDE_AREA = [
  "talisay",
  "minglanilla",
  "naga",
  "carcar",
  "liloan",
  "compostela",
  "danao",
  "cordova",
  "toledo",
  "balamban",
  "bogo",
  "moalboal",
  "bohol",
];

/** Deterministic Bisaya vs Taglish vs English check on the customer's own words. */
export function detectLanguage(text: string): Lang {
  const words = text
    .toLowerCase()
    .replace(/[^a-zñ\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const joined = ` ${words.join(" ")} `;
  const count = (list: string[]) => words.filter((w) => list.includes(w)).length;
  const bisaya = count([
    "unsa",
    "pila",
    "ugma",
    "asa",
    "kaayo",
    "karon",
    "buntag",
    "nako",
    "namo",
    "ninyo",
    "diri",
    "didto",
    "dili",
    "wala",
    "naa",
    "og",
    "ug",
    "taga",
    "tga",
    "isa",
    "duha",
    "tulo",
    "ra",
    "lagi",
    "unta",
    "mi",
    "ko",
    "ka",
    "sab",
    "pud",
    "bugnaw",
    "limpyo",
    "baho",
    "ani",
    "kini",
    "mao",
  ]);
  const tagalog =
    count([
      "po",
      "ho",
      "opo",
      "ba",
      "kayo",
      "magkano",
      "bukas",
      "ng",
      "namin",
      "niyo",
      "yung",
      "hindi",
      "ano",
      "sana",
      "eto",
      "dito",
      "ngayon",
      "mamaya",
      "umaga",
      "gabi",
      "lumalamig",
      "malamig",
      "natin",
      "kami",
      "sila",
      "naman",
    ]) +
    (joined.includes(" po ") ? 1 : 0) +
    (joined.includes(" pwede ba ") ? 1 : 0);
  if (!bisaya && !tagalog) return "english";
  return bisaya > tagalog ? "bisaya" : "taglish";
}

const PICK_LINE: Record<Lang, string> = {
  bisaya: "Pili lang og oras sa ubos 👇",
  taglish: "Pili lang ng oras sa baba 👇",
  english: "Pick a time below 👇",
};

/** Public web chat: slots are buttons, so drop lead-ins/slot lines/links and place the pick line after the price. */
function formatWebReply(text: string, lang: Lang, hasSlots: boolean) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/https?:\/\/\S+/g, "").trim())
    .filter(
      (l) =>
        l &&
        !/:\s*$/.test(l) &&
        !/^\s*(?:\d+[.)]|[-•*])/.test(l) &&
        !/\d{1,2}:\d{2}\s?(?:AM|PM)/i.test(l) &&
        !/👇/.test(l) &&
        !/\bbuttons?\b/i.test(l),
    );
  if (!hasSlots) return lines.join("\n");
  const priceIdx = lines.findIndex((l) => /₱\s?[\d,]+/.test(l) && !/₱\s?200\b/.test(l));
  const depositIdx = lines.findIndex((l) => /₱\s?200\b|deposit/i.test(l));
  const at = priceIdx >= 0 ? priceIdx + 1 : depositIdx >= 0 ? depositIdx : lines.length;
  lines.splice(at, 0, PICK_LINE[lang]);
  return lines.join("\n");
}

function clamp01(n: unknown, d = 0.5) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : d;
}

function normalize(
  raw: Partial<Extracted> | null,
  services: Array<{ slug: string }>,
  zones: Array<{ slug: string }>,
): Extracted {
  const r = raw ?? {};
  const service = services.some((s) => s.slug === r.service_slug) ? (r.service_slug as string) : null;
  const zone = zones.some((z) => z.slug === r.zone_slug) ? (r.zone_slug as string) : null;
  const unitsNum = Math.round(Number(r.units));
  const units = Number.isFinite(unitsNum) && unitsNum > 0 ? Math.min(10, unitsNum) : null;
  const lang: Lang = r.language === "bisaya" || r.language === "taglish" ? r.language : "english";
  const date =
    typeof r.preferred_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.preferred_date) ? r.preferred_date : null;
  const time = r.preferred_time === "morning" || r.preferred_time === "afternoon" ? r.preferred_time : null;
  const c = (r.confidence ?? {}) as Partial<Extracted["confidence"]>;
  const missing: string[] = [];
  if (!zone) missing.push("location");
  if (!service) missing.push("service");
  return {
    customer_name:
      typeof r.customer_name === "string" && r.customer_name.trim() ? r.customer_name.trim().slice(0, 80) : null,
    service_slug: service,
    units,
    zone_slug: zone,
    barangay: typeof r.barangay === "string" && r.barangay.trim() ? r.barangay.trim().slice(0, 60) : null,
    preferred_date: date,
    preferred_day: typeof r.preferred_day === "string" ? r.preferred_day.slice(0, 40) : null,
    preferred_time: time,
    language: lang,
    confidence: {
      service: service ? clamp01(c.service) : 0,
      units: units ? clamp01(c.units) : 0,
      zone: zone ? clamp01(c.zone) : 0,
      when: date || time ? clamp01(c.when) : 0,
    },
    missing,
  };
}

function pickSlots(
  days: Array<{ date: string; best: boolean; slots: string[]; clustered?: string[] }>,
  pref: { date: string | null; time: "morning" | "afternoon" | null },
): SuggestedSlot[] {
  const fitsTime = (t: string) => {
    const h = Number(t.slice(0, 2));
    return pref.time === "morning" ? h < 12 : pref.time === "afternoon" ? h >= 13 : true;
  };
  const scored = days
    .map((d, i) => {
      const matching = d.slots.filter(fitsTime);
      let score = 0;
      if (pref.date && d.date === pref.date) score += 10;
      if (d.best) score += 4;
      if (matching.length) score += 2;
      score -= i * 0.3; // sooner is better
      const hot = (d.clustered ?? []).filter(fitsTime);
      if (hot.length) score += 3;
      return { d, score, slot: (hot[0] ?? matching[0] ?? d.slots[0])! };
    })
    .sort((a, b) => b.score - a.score);
  const out: SuggestedSlot[] = scored.slice(0, 3).map((s) => ({ date: s.d.date, time: s.slot, best: s.d.best }));
  // If the preferred day has room, offer a second time that same day.
  const top = scored[0];
  if (top && pref.date === top.d.date && out.length === 3) {
    const second = top.d.slots.filter(fitsTime).find((t) => Number(t.slice(0, 2)) - Number(top.slot.slice(0, 2)) >= 2);
    if (second) (out.splice(1, 0, { date: top.d.date, time: second, best: top.d.best }), out.pop());
  }
  return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function slotLabel(s: SuggestedSlot) {
  const d = new Date(`${s.date}T00:00:00Z`);
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const [h, m] = s.time.split(":").map(Number);
  const hr = ((h! + 11) % 12) + 1;
  return `${day}, ${hr}:${String(m).padStart(2, "0")} ${h! < 12 ? "AM" : "PM"}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function analyze(
  db: any,
  opts: {
    inbound: string[];
    override?: Partial<Extracted>;
    link: string;
    knownName: string | null;
    workspaceId?: string;
    web?: boolean;
  },
) {
  const { askAi, parseJson } = await import("./ai.server");
  const { computeAvailability } = await import("./availability.server");
  const [{ data: services }, { data: zones }] = await Promise.all([
    db.from("services").select("id,slug,name,duration_minutes,price_php").eq("active", true).order("sort_order"),
    db.from("zones").select("id,slug,name,barangays").order("sort_order"),
  ]);
  const svcList = (services ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    duration_minutes: number;
    price_php: number;
  }>;
  const zoneList = (zones ?? []) as Array<{ id: string; slug: string; name: string; barangays: string[] }>;
  const today = manilaToday();
  const convo = opts.inbound.map((m, i) => `Message ${i + 1}: ${m}`).join("\n");

  let extracted: Extracted;
  if (opts.override) {
    extracted = normalize(opts.override, svcList, zoneList);
  } else {
    const system = `You read Facebook Messenger messages sent to Bugnaw Aircon Care, a one-man aircon cleaning service in Metro Cebu, Philippines. Customers write in Cebuano/Bisaya, Taglish, or English, with slang ("ugma"=tomorrow, "karon"=today, "hapon"=afternoon, "buntag"=morning, "sat"=Saturday, "tga"=from, "lapu2"=Lapu-Lapu, "ka"/"units"/"isa"=1, "duha"=2, "tulo"=3).
Services (slug: meaning): ${svcList.map((s) => `${s.slug}: ${s.name}`).join("; ")}. Generic "cleaning"/"linis"/"limpyo" of a split unit or unspecified type → split-clean with confidence ≤0.6. Smell, "baho", dirty → cleaning. "Dili bugnaw"/"not cold"/"hindi malamig" → checkup (or freon if they mention freon).
Zones (slug: barangays/areas): ${zoneList.map((z) => `${z.slug}: ${z.name} — ${z.barangays.join(", ")}`).join("; ")}.
Today in Cebu is ${today.weekday}, ${today.iso}; tomorrow ("ugma"/"bukas") is ${today.tomorrowLabel}, ${today.tomorrow}.
Return ONLY a json object with keys: customer_name (string|null, only if they sign or say their name), service_slug (one slug or null), units (integer|null), zone_slug (slug or null), barangay (string|null), preferred_date (YYYY-MM-DD resolved from words like tomorrow/ugma/sat, or null), preferred_day (short human words as written, e.g. "ugma hapon", or null), preferred_time ("morning"|"afternoon"|null), language ("bisaya" if mostly Cebuano, "taglish" if Tagalog/English mix, "english" otherwise), confidence (object with service, units, zone, when — each 0 to 1).`;
    const { text } = await askAi(system, convo, { json: true });
    extracted = normalize(parseJson<Partial<Extracted>>(text), svcList, zoneList);
    extracted = { ...extracted, language: detectLanguage(opts.inbound.join(" ")) };
    // Keep obvious local phrasing reliable even when a model answer is conservative.
    const lower = convo.toLowerCase();
    if (!extracted.service_slug) {
      const hinted = /window[ -]?type/.test(lower)
        ? "window-clean"
        : /split[ -]?type|split type|aircon.*clean|cleaning|limpyo|baho/.test(lower)
          ? "split-clean"
          : /freon|recharge|top[ -]?up/.test(lower)
            ? "freon"
            : /check[ -]?up|diagnos|dili bugnaw|not cold|hindi malamig/.test(lower)
              ? "checkup"
              : null;
      if (hinted && svcList.some((s) => s.slug === hinted))
        extracted = {
          ...extracted,
          service_slug: hinted,
          confidence: { ...extracted.confidence, service: 0.82 },
          missing: extracted.missing.filter((m) => m !== "service"),
        };
    }
    if (!extracted.zone_slug) {
      // A barangay name shared by two zones (e.g. "Basak") is ambiguous, so it can't decide the zone on its own.
      const sharedBarangay = (b: string) =>
        zoneList.filter((z) => z.barangays.some((x) => x.toLowerCase() === b.toLowerCase())).length > 1;
      const matched = zoneList.find(
        (z) =>
          lower.includes(z.slug.replaceAll("-", " ")) ||
          lower.includes(z.name.toLowerCase()) ||
          z.barangays.some((b) => !sharedBarangay(b) && lower.includes(b.toLowerCase())) ||
          (z.slug === "lapu-lapu" && /lapu\s*-?\s*lapu|lapu2/.test(lower)) ||
          (z.slug === "cebu-south" && /\bpardo\b/.test(lower)),
      );
      if (matched)
        extracted = {
          ...extracted,
          zone_slug: matched.slug,
          confidence: { ...extracted.confidence, zone: 0.9 },
          missing: extracted.missing.filter((m) => m !== "location"),
        };
    }
    const relative = relativeDate(lower, today.iso);
    if (relative)
      extracted = {
        ...extracted,
        preferred_date: relative,
        confidence: { ...extracted.confidence, when: Math.max(extracted.confidence.when, 0.9) },
      };
  }
  const lowerAll = convo.toLowerCase();
  const outsidePlace = extracted.zone_slug
    ? null
    : (OUTSIDE_AREA.find((p) => new RegExp(`\\b${p}\\b`).test(lowerAll)) ?? null);
  if (outsidePlace && !extracted.barangay)
    extracted = { ...extracted, barangay: outsidePlace.replace(/^\w/, (c) => c.toUpperCase()) };

  const svc = svcList.find((s) => s.slug === extracted.service_slug);
  const zone = zoneList.find((z) => z.slug === extracted.zone_slug);
  const units = extracted.units ?? 1;
  let slots: SuggestedSlot[] = [];
  if (svc && zone) {
    const days = await computeAvailability(
      db,
      zone.id,
      svc.duration_minutes * units,
      opts.workspaceId ? { workspaceId: opts.workspaceId } : {},
    );
    slots = pickSlots(days, { date: extracted.preferred_date, time: extracted.preferred_time });
  }
  const price = svc ? svc.price_php * units : null;
  const minutes = svc ? svc.duration_minutes * units : null;
  const name = extracted.customer_name ?? opts.knownName;

  const wantedDate = extracted.preferred_date;
  const wantedFull = !!(
    svc &&
    zone &&
    wantedDate &&
    wantedDate >= today.iso &&
    !slots.some((s) => s.date === wantedDate)
  );
  const wantedDow = wantedDate ? new Date(`${wantedDate}T00:00:00Z`).getUTCDay() : -1;
  const wantedLabel = wantedDate ? dayWords(wantedDate).label : null;
  const zoneNames = zoneList.map((z) => z.name).join(", ");
  const facts = [
    `Today is ${today.label}; tomorrow is ${today.tomorrowLabel}. Jun works Monday to Saturday, 8 AM–5 PM; Sunday is his day off. Only mention weekdays exactly as written in these facts.`,
    `Customer language/tone: ${extracted.language}`,
    name ? `Customer name: ${name}` : "Customer name unknown (greet without a name).",
    svc
      ? `Service: ${svc.name} × ${units} unit(s). Price: ₱${price!.toLocaleString("en-PH")} total (₱${svc.price_php.toLocaleString("en-PH")} each), about ${Math.round((minutes! / 60) * 10) / 10} hour(s).`
      : null,
    !svc ? `Price list for reference: ${svcList.map((s) => `${s.name} ₱${s.price_php}/unit`).join(", ")}.` : null,
    zone ? `Area: ${extracted.barangay ? extracted.barangay + ", " : ""}${zone.name}` : null,
    slots.length
      ? `Open slots to offer (numbered list): ${slots.map((s, i) => `${i + 1}) ${slotLabel(s)}${s.best ? " — Jun is already in the area" : ""}`).join("; ")}`
      : null,
    wantedFull
      ? `The customer asked for "${extracted.preferred_day ?? wantedDate}", which is ${wantedLabel}, but Jun has NO openings that day${wantedDow === 0 ? " — Sunday is his day off" : " — it is fully booked"}. START the reply by briefly saying so in their language, then offer the next open slots.`
      : null,
    svc && zone && !slots.length
      ? "No open slots in the next 3 weeks — apologise and say Jun will message when a slot opens."
      : null,
    svc && zone && !opts.web ? `Personal booking link (include exactly, on its own line): ${opts.link}` : null,
    "A ₱200 GCash deposit secures the booking and is deducted from the final bill.",
  ]
    .filter(Boolean)
    .join("\n");

  const missingAsk = outsidePlace
    ? `The customer is in ${extracted.barangay}, which is OUTSIDE Jun's service area (he only covers ${zoneNames}). Do NOT offer slots or a link. Politely say sorry, Jun doesn't serve ${extracted.barangay} yet, name the areas he covers, and say he'd be happy to help if they have a unit in one of those areas. Keep it to 2–4 short lines.`
    : extracted.missing[0] === "location"
      ? "Location is missing. Do NOT offer slots or a link. Ask ONLY which barangay/city they are in (one short question). You may mention the price if the service is known."
      : extracted.missing[0] === "service"
        ? "The service is unclear. Do NOT offer slots or a link. Ask ONLY what the aircon needs (cleaning of split or window type, check-up, or freon) and how many units — as one short question."
        : opts.web
          ? "This is a website chat: the open slots are shown as buttons under your text, so do NOT list slots, times or links and do NOT write a lead-in like 'Available slots:', and do NOT mention buttons or tell them to pick a time (that line is added for you). Put each part on its own line. Structure: greeting (plus the no-openings note if given), one line with price and what it covers, then the deposit sentence, then a short sign-off."
          : "Offer the slots and the link. Ask them to tap the link to confirm and pay the deposit.";

  const draftSystem = `You are Jun Villanueva, a friendly aircon technician in Cebu, replying on Facebook Messenger. Write the reply in the SAME language and tone as the customer: "bisaya" → natural Cebuano (e.g. "Maayong adlaw!", "Salamat kaayo!", "pwede ra", "Kita-kits!"); "taglish" → casual Taglish with "po" (e.g. "Hello po!", "Salamat po!"); "english" → warm, simple English. Match their formality (if they said "boss", you can be casual). Keep it short like a real Messenger reply: 3–7 short lines, no markdown, no asterisks, max 1 emoji. Never invent prices, times or links — use only the facts given. Plain text only.`;
  const { text: draft } = await askAi(
    draftSystem,
    `Customer messages:\n${convo}\n\nFacts:\n${facts}\n\nInstruction: ${missingAsk}`,
  );

  const clean = draft.trim().slice(0, 1500);
  return {
    extracted,
    slots,
    draft: opts.web ? formatWebReply(clean, extracted.language as Lang, slots.length > 0) : clean,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireOperator(context: { supabase: any; userId: string }) {
  const [{ data: owner }, { data: demo }, { data: workspaceId }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "demo" }),
    context.supabase.rpc("current_workspace_id", { _user_id: context.userId }),
  ]);
  if (!owner && !demo) throw new Error("Owner access required.");
  if (!workspaceId) throw new Error("Workspace unavailable.");
  return String(workspaceId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendOut(db: any, id: string, body: string, by: "owner" | "auto", workspaceId?: string) {
  const { error } = await db
    .from("conversation_messages")
    .insert({
      ...(workspaceId ? { workspace_id: workspaceId } : {}),
      conversation_id: id,
      direction: "out",
      sent_by: by,
      body,
    });
  if (error) throw new Error(error.message);
  const { data: c } = await db.from("conversations").select("status").eq("id", id).single();
  const patch: Record<string, unknown> = { last_message_at: new Date().toISOString(), draft_reply: null };
  if (c?.status === "new") patch["status"] = "replied";
  const { error: e2 } = await db.from("conversations").update(patch).eq("id", id);
  if (e2) throw new Error(e2.message);
}

/* ---------------- server functions ---------------- */

export const listInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const workspaceId = await requireOperator(context);
    const db = context.supabase;
    const [{ data: convs, error }, { data: settings }] = await Promise.all([
      db
        .from("conversations")
        .select("id,customer_name,status,language,last_message_at,extracted,channel")
        .order("last_message_at", { ascending: false })
        .limit(100),
      db.from("shop_settings").select("auto_reply").eq("workspace_id", workspaceId).single(),
    ]);
    if (error) throw new Error(error.message);
    const ids = (convs ?? []).map((c) => c.id);
    const { data: msgs } = ids.length
      ? await db
          .from("conversation_messages")
          .select("conversation_id,body,created_at,direction")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false })
      : { data: [] as Array<{ conversation_id: string; body: string }> };
    const preview = new Map<string, string>();
    // Prefer the customer's latest message, falling back to the latest reply.
    for (const m of (msgs ?? []) as Array<{ conversation_id: string; body: string; direction?: string }>)
      if (m.direction === "in" && !preview.has(m.conversation_id)) preview.set(m.conversation_id, m.body);
    for (const m of msgs ?? []) if (!preview.has(m.conversation_id)) preview.set(m.conversation_id, m.body);
    const items: InboxItem[] = (convs ?? []).map((c) => ({
      id: c.id,
      customer_name: c.customer_name,
      status: c.status as ConversationStatus,
      language: c.language,
      last_message_at: c.last_message_at,
      preview: preview.get(c.id) ?? "",
      extracted: (c.extracted ?? {}) as Partial<Extracted>,
      channel: c.channel,
    }));
    return { items, autoReply: !!settings?.auto_reply };
  });

export const getThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<Thread | null> => {
    const db = context.supabase;
    const { data: c } = await db.from("conversations").select("*").eq("id", data.id).maybeSingle();
    if (!c) return null;
    const { data: msgs } = await db
      .from("conversation_messages")
      .select("id,direction,sent_by,body,created_at")
      .eq("conversation_id", data.id)
      .order("created_at");
    return {
      id: c.id,
      customer_name: c.customer_name,
      status: c.status as ConversationStatus,
      language: c.language,
      extracted: (c.extracted ?? {}) as Partial<Extracted>,
      suggested_slots: (c.suggested_slots ?? []) as unknown as SuggestedSlot[],
      draft_reply: c.draft_reply,
      booking_reference: c.booking_reference,
      lead_token: c.lead_token,
      messages: (msgs ?? []) as Thread["messages"],
    };
  });

/** Log an inbound message (new or follow-up), analyse it with AI, and auto-send if enabled. */
export const ingestMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string; customerName?: string; conversationId?: string; origin: string }) => ({
    text: String(d.text ?? "")
      .trim()
      .slice(0, 1500),
    customerName: String(d.customerName ?? "")
      .trim()
      .slice(0, 80),
    conversationId: d.conversationId ? String(d.conversationId) : undefined,
    origin: /^https?:\/\/[^\s/]+$/.test(d.origin) ? d.origin : "",
  }))
  .handler(async ({ data, context }) => {
    const workspaceId = await requireOperator(context);
    if (!data.text) return { ok: false as const, error: "Message is empty." };
    const db = context.supabase;

    let id = data.conversationId;
    if (!id) {
      const { data: c, error } = await db
        .from("conversations")
        .insert({ workspace_id: workspaceId, customer_name: data.customerName || "Messenger customer" })
        .select("id")
        .single();
      if (error || !c) return { ok: false as const, error: error?.message ?? "Could not save message." };
      id = c.id;
    }
    const { error: mErr } = await db
      .from("conversation_messages")
      .insert({
        workspace_id: workspaceId,
        conversation_id: id,
        direction: "in",
        sent_by: "customer",
        body: data.text,
      });
    if (mErr) return { ok: false as const, error: mErr.message, id };
    await db.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);

    return runAnalysis(db, id!, data.origin, workspaceId, undefined);
  });

/** Re-run slots + draft after the owner edits the chips (or retry AI extraction). */
export const reanalyze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; origin: string; extracted?: Partial<Extracted> }) => d)
  .handler(async ({ data, context }) => {
    const workspaceId = await requireOperator(context);
    return runAnalysis(context.supabase, data.id, data.origin, workspaceId, data.extracted, true);
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAnalysis(
  db: any,
  id: string,
  origin: string,
  workspaceId: string,
  override?: Partial<Extracted>,
  manual = false,
) {
  const { data: conv } = await db.from("conversations").select("customer_name,lead_token").eq("id", id).single();
  const { data: inbound } = await db
    .from("conversation_messages")
    .select("body")
    .eq("conversation_id", id)
    .eq("direction", "in")
    .order("created_at");
  const knownName = conv?.customer_name && conv.customer_name !== "Messenger customer" ? conv.customer_name : null;
  try {
    const { adminDb } = await import("./db.server");
    // Availability reads all bookings; the admin client is used only after the owner check.
    const result = await analyze(adminDb(), {
      inbound: (inbound ?? []).map((m: { body: string }) => m.body),
      ...(override ? { override } : {}),
      link: `${origin}/book?lead=${conv?.lead_token}`,
      knownName,
      workspaceId,
    });
    const patch: Record<string, unknown> = {
      extracted: result.extracted,
      suggested_slots: result.slots,
      draft_reply: result.draft,
      language: result.extracted.language,
    };
    if (!knownName && result.extracted.customer_name) patch["customer_name"] = result.extracted.customer_name;
    const { error } = await db.from("conversations").update(patch).eq("id", id);
    if (error) return { ok: false as const, error: error.message, id };

    let autoSent = false;
    if (!manual) {
      const { data: s } = await db.from("shop_settings").select("auto_reply").eq("workspace_id", workspaceId).single();
      if (s?.auto_reply) {
        await sendOut(db, id, result.draft, "auto", workspaceId);
        autoSent = true;
      }
    }
    return { ok: true as const, id, autoSent };
  } catch (e) {
    return { ok: false as const, id, error: e instanceof Error ? e.message : "AI couldn't read this message." };
  }
}

export const sendReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; body: string }) => ({
    id: d.id,
    body: String(d.body ?? "")
      .trim()
      .slice(0, 2000),
  }))
  .handler(async ({ data, context }) => {
    const workspaceId = await requireOperator(context);
    if (!data.body) throw new Error("Reply is empty.");
    await sendOut(context.supabase, data.id, data.body, "owner", workspaceId);
    return { ok: true };
  });

export const setAutoReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { on: boolean }) => ({ on: !!d.on }))
  .handler(async ({ data, context }) => {
    const workspaceId = await requireOperator(context);
    const { error } = await context.supabase
      .from("shop_settings")
      .update({ auto_reply: data.on })
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type PublicChatReply = {
  conversationId: string;
  reply: string;
  language: Lang;
  serviceSlug: string | null;
  zoneSlug: string | null;
  units: number;
  leadToken: string;
  slots: SuggestedSlot[];
};

/** Public landing chat: one inquiry, one AI answer, persisted into Jun's live Inbox. */
export const publicChat = createServerFn({ method: "POST" })
  .inputValidator((d: { text: string; origin: string; tourGenerated?: boolean }) => ({
    text: String(d.text ?? "")
      .trim()
      .slice(0, 800),
    origin: /^https?:\/\/[^\s/]+$/.test(d.origin) ? d.origin : "",
    tourGenerated: d.tourGenerated === true,
  }))
  .handler(async ({ data }): Promise<{ ok: true; data: PublicChatReply } | { ok: false; error: string }> => {
    if (data.text.length < 3) return { ok: false, error: "Please type a little more about your aircon." };
    const { adminDb } = await import("./db.server");
    const db = adminDb();
    const workspaceId = "00000000-0000-0000-0000-000000000001";
    const { data: conv, error } = await db
      .from("conversations")
      .insert({ workspace_id: workspaceId, customer_name: "Website visitor" })
      .select("id,lead_token")
      .single();
    if (error || !conv) return { ok: false, error: "We couldn't start the chat. Please try again." };
    await db
      .from("conversation_messages")
      .insert({
        workspace_id: workspaceId,
        conversation_id: conv.id,
        direction: "in",
        sent_by: "customer",
        body: data.text,
      });
    try {
      const result = await analyze(db, {
        inbound: [data.text],
        link: `${data.origin}/book?lead=${conv.lead_token}`,
        knownName: null,
        workspaceId,
        web: true,
      });
      await db
        .from("conversations")
        .update({
          extracted: result.extracted,
          suggested_slots: result.slots,
          language: result.extracted.language,
          status: "replied",
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conv.id);
      await sendOut(db, conv.id, result.draft, "auto", workspaceId);
      // Mirror into the demo sandbox so visitors see their own inquiry in the demo Inbox.
      try {
        const demoWs = "00000000-0000-0000-0000-000000000002";
        const now = Date.now();
        const { data: dc } = await db
          .from("conversations")
          .insert({
            workspace_id: demoWs,
            customer_name: "Website visitor",
            channel: data.tourGenerated ? "website-tour" : "website",
            status: "new",
            extracted: result.extracted,
            suggested_slots: result.slots,
            language: result.extracted.language,
            last_message_at: new Date(now + 1000).toISOString(),
          })
          .select("id")
          .single();
        if (dc) {
          await db.from("conversation_messages").insert([
            {
              workspace_id: demoWs,
              conversation_id: dc.id,
              direction: "in",
              sent_by: "customer",
              body: data.text,
              created_at: new Date(now).toISOString(),
            },
            {
              workspace_id: demoWs,
              conversation_id: dc.id,
              direction: "out",
              sent_by: "auto",
              body: result.draft,
              created_at: new Date(now + 1000).toISOString(),
            },
          ]);
          const { data: websiteRows } = await db
            .from("conversations")
            .select("id,channel,last_message_at")
            .eq("workspace_id", demoWs)
            .like("channel", "website%")
            .order("last_message_at", { ascending: false });
          const rows = websiteRows ?? [];
          const tourIds = rows
            .filter((item) => item.channel === "website-tour")
            .slice(3)
            .map((item) => item.id);
          const afterTourCap = rows.filter((item) => !tourIds.includes(item.id));
          const totalIds = afterTourCap.slice(10).map((item) => item.id);
          const oldIds = [...new Set([...tourIds, ...totalIds])];
          if (oldIds.length) {
            await db.from("conversation_messages").delete().in("conversation_id", oldIds);
            await db.from("conversations").delete().in("id", oldIds);
          }
        }
      } catch (mirrorError) {
        console.warn(
          "[publicChat] demo mirror failed",
          mirrorError instanceof Error ? mirrorError.message : mirrorError,
        );
      }
      return {
        ok: true,
        data: {
          conversationId: conv.id,
          reply: result.draft,
          language: result.extracted.language,
          serviceSlug: result.extracted.service_slug,
          zoneSlug: result.extracted.zone_slug,
          units: result.extracted.units ?? 1,
          leadToken: conv.lead_token,
          slots: result.slots,
        },
      };
    } catch (e) {
      // Never show AI errors to the customer; the message stays in Jun's Inbox as a New lead.
      console.error("[publicChat] AI reply failed", e);
      await db
        .from("conversations")
        .update({ status: "new", last_message_at: new Date().toISOString() })
        .eq("id", conv.id);
      return {
        ok: true,
        data: {
          conversationId: conv.id,
          reply: "Salamat! Jun will reply shortly.",
          language: "english",
          serviceSlug: null,
          zoneSlug: null,
          units: 1,
          leadToken: conv.lead_token,
          slots: [],
        },
      };
    }
  });
