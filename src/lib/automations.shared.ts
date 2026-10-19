export type AutomationKey =
  | "confirmation"
  | "reminder"
  | "nudge"
  | "at_risk"
  | "on_the_way"
  | "reschedule"
  | "no_show"
  | "lead_followup"
  | "waitlist"
  | "recleaning"
  | "weather";

export type AutomationConfig = Record<AutomationKey, { enabled: boolean; template: string }>;

export const AUTOMATIONS: Array<{ key: AutomationKey; title: string; when: string; template: string }> = [
  {
    key: "confirmation",
    title: "Instant confirmation",
    when: "Right after the GCash deposit",
    template:
      "Salamat, {name}! ✅ You're booked with Bugnaw Aircon Care — {ref}, {date} at {time} ({service}). ₱{deposit} deposit received, deducted from your final bill. Manage your booking: {link}",
  },
  {
    key: "reminder",
    title: "Day-before reminder",
    when: "6:00 PM the day before",
    template:
      "Hi {name}! Reminder: Jun comes tomorrow, {date} at {time} for {service}. Will someone 18+ be home? Tap “Yes, someone will be home” or reschedule here: {link}",
  },
  {
    key: "nudge",
    title: "Morning nudge",
    when: "8:00 AM on job day if not yet confirmed",
    template: "Maayong buntag, {name}! Jun is scheduled at {time} today. Please tap to confirm someone will be home: {link}",
  },
  {
    key: "at_risk",
    title: "At-risk alert + waitlist offer",
    when: "2 hours before the slot if still unconfirmed",
    template: "⚠️ {ref} ({name}, {time}) is still unconfirmed. Marked at risk — slot offered to the waitlist.",
  },
  {
    key: "on_the_way",
    title: "Jun is on the way",
    when: "When Jun taps “On the way”",
    template: "Jun is on the way! 🚐 Estimated arrival around {eta}. See you soon, {name} — Kita-kits!",
  },
  {
    key: "reschedule",
    title: "Reschedule confirmation",
    when: "When a customer moves their booking",
    template: "Done, {name}! {ref} is now {date} at {time}. {fee_note} Manage your booking: {link}",
  },
  {
    key: "no_show",
    title: "Customer not home",
    when: "When Jun taps “Wala tao”",
    template:
      "Hi {name}, Jun came by today but no one was home. As per our policy the ₱{deposit} deposit is kept. We'd still love to help — rebook anytime: {link}",
  },
  {
    key: "lead_followup",
    title: "Lead follow-up",
    when: "Once, 24h after a reply with no booking",
    template: "Hi {name}! Just checking if you still need your aircon cleaned 🙂 Your booking link is still here: {link} Salamat!",
  },
  {
    key: "waitlist",
    title: "Waitlist slot offer",
    when: "When a slot frees up in the customer's zone",
    template: "Good news, {name}! A slot just opened in {zone}: {date} at {time}. First to book gets it: {link}",
  },
  {
    key: "recleaning",
    title: "6-month recleaning reminder",
    when: "6 months after a completed job",
    template: "Hi {name}! It's been 6 months since Jun cleaned your aircon. Time for your next cleaning — book with 1 tap: {link}",
  },
  {
    key: "weather",
    title: "Bad-weather apology",
    when: "When Jun taps “Bad weather — cancel afternoon”",
    template:
      "Hi {name}, pasensya kaayo! 🌧️ Heavy rain today means Jun can't safely do your {time} job ({service}). Your deposit stays with your booking — pick a new time for free in one tap: {link}",
  },
];

export function withDefaults(raw: unknown): AutomationConfig {
  const r = (raw ?? {}) as Partial<Record<AutomationKey, { enabled?: boolean; template?: string }>>;
  const out = {} as AutomationConfig;
  for (const a of AUTOMATIONS) {
    const v = r[a.key] ?? {};
    out[a.key] = {
      enabled: v.enabled ?? true,
      template: typeof v.template === "string" && v.template.trim() ? v.template : a.template,
    };
  }
  return out;
}

export const PLACEHOLDERS = "{name} {ref} {date} {time} {service} {zone} {deposit} {eta} {fee_note} {link}";
