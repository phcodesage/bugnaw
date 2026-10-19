import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "ceb" | "tag";

export const LANGS: Array<{ code: Lang; short: string; label: string }> = [
  { code: "en", short: "EN", label: "English" },
  { code: "ceb", short: "CEB", label: "Bisaya" },
  { code: "tag", short: "TAG", label: "Taglish" },
];

const STORAGE_KEY = "bugnaw-lang";

const en = {
  nav: {
    services: "Services",
    about: "About",
    why: "Why Us",
    process: "Process",
    pricing: "Pricing",
    book: "Book a Cleaning",
    junSide: "See Jun’s side",
    language: "Language",
  },
  hero: {
    eyebrow: "Aircon cleaning · Mandaue & Metro Cebu",
    badge: "Replies in Bisaya · Taglish · English",
    h1a: "From ‘Pwede ba ugma?’ to ",
    h1b: "You’re Booked.",
    sub: "Message us in Bisaya, Taglish, or English. Bugnaw replies instantly with real open slots in your area, confirms your booking, and reminds you the day before, so Jun can keep working.",
    tryChat: "Try the chat",
    tour: "Take the tour",
    b1: "Replies in under 1 minute",
    b2: "Same-zone scheduling",
    b3: "₱200 deposit, deducted from bill",
    trusted: "Trusted by",
    trustedTail: "Cebu homes",
    booked: "Booked ✓",
    depositPaid: "Deposit paid",
    chipTomorrow: "Tomorrow PM",
  },
  chat: {
    eyebrow: "Try it now",
    h2: "Message Bugnaw like you normally would.",
    sub: "No forms or perfect wording. Ask in Bisaya, Taglish, or English and get real available times.",
    replies: "Typically replies instantly",
    tooltip: "Replies are drafted by Bugnaw for Jun and use his real calendar.",
    greeting: "Hi! What does your aircon need, how many units, and which area are you in?",
    placeholder: "Type your message…",
    langNote: "Jun replies in the language you write in",
    examples: [
      "Hi! Are you free Saturday for 1 window unit in Mandaue?",
      "How much is a freon recharge? I'm in Cebu City South",
      "Can I book 2 split-type cleanings in Talamban next week?",
    ],
    tryOne: "Try one of these, or type your own 👇",
    justNow: "Just now",
    seen: "Just now · Seen",
    typing: "Checking Jun’s real open slots…",
    book: "Book",
    inboxNote: "This inquiry is now in Jun’s Inbox",
    seeInbox: "See it in Jun’s Inbox →",
  },
  about: {
    eyebrow: "About Us",
    story:
      "Jun Villanueva has cleaned aircons across Metro Cebu since 2019 — just him and one helper. He built Bugnaw because every missed Messenger reply was a lost customer, and every “wala tao” was a wasted drive. Now the bookings take care of themselves.",
    rating: "Customer Rating",
    years: "Years in Service",
    units: "Units Cleaned",
    hours: "Hours Saved This Month",
  },
  services: {
    eyebrow: "Services",
    h2: "Complete care for every aircon at home",
    sub: "Honest prices, one trusted technician, and booking that takes under a minute.",
    howItWorks: "How it works",
    bookThis: "Book this",
    prev: "Previous services",
    next: "Next services",
    items: [
      {
        title: "Split-type Cleaning",
        body: "₱800 per unit · 60 min. Coil, blower and drain, fully washed.",
      },
      {
        title: "Window-type Cleaning",
        body: "₱600 per unit · 45 min. Pulled out, washed and sanitized.",
      },
      {
        title: "Check-up & Diagnosis",
        body: "₱500 flat. Jun tests everything and tells you exactly what it needs.",
      },
      { title: "Freon Recharge", body: "₱1,800 per unit · 90 min. Leak check plus full top-up." },
      {
        title: "6-Month Care Reminder",
        body: "We message you when it’s time again. Rebook with one tap.",
      },
      {
        title: "Rainy-day Rescheduling",
        body: "Bad weather? You get a free one-tap reschedule link.",
      },
    ],
  },
  why: {
    eyebrow: "Why Us",
    h2: "Built for how Cebu actually books.",
    sub: "Nobody fills out forms. People send “pwede ugma?” on Messenger. Bugnaw answers that — instantly, in their language, with a real slot.",
    unanswered: "unanswered messages",
    driving: "less driving / week",
    hrs: " hrs",
    noShows: "fewer no-shows",
    callout: "Jun already in your area? You get the earlier slot.",
  },
  recent: {
    eyebrow: "Recent Jobs",
    h2: "Fresh air, all over Metro Cebu",
    jobs: [
      { year: "Today", title: "3 split-types for a family in Banilad" },
      { year: "Yesterday", title: "Condo split-type clean near IT Park" },
      { year: "3 days ago", title: "Office freon top-up in Mandaue" },
      { year: "Last week", title: "2 window units before the rains" },
      { year: "Last week", title: "Outdoor unit check-up in Lapu-Lapu" },
    ],
  },
  process: {
    eyebrow: "Process",
    h2: "Three steps. Under a minute.",
    steps: [
      { t: "Message us any way", b: "Messenger, any language. “Pwede ugma?” is enough." },
      {
        t: "Get real slots instantly",
        b: "An AI reply with open times in your area — Jun’s same-zone days first.",
      },
      {
        t: "Tap, pay ₱200, done",
        b: "GCash deposit locks it in. Reminders are handled automatically.",
      },
    ],
  },
  junLife: {
    eyebrow: "A day in Jun’s life, before Bugnaw",
    h2: "Great technician. Impossible inbox.",
    tooLate: "Too late",
    items: [
      {
        title: "On a roof, phone buzzing",
        text: "Jun can’t stop mid-cleaning to answer Messenger.",
      },
      {
        title: "14 unread messages",
        text: "Every unanswered inquiry is already checking another technician.",
      },
      {
        title: "40-minute drive",
        text: "He reaches Lapu-Lapu. The gate is locked. Nobody is home.",
      },
      { title: "Replying instead of eating", text: "The day’s work ends, but the inbox starts." },
      { title: "3 customers gone", text: "They already booked someone else." },
    ],
  },
  beforeAfter: {
    eyebrow: "Before / After",
    h2: "See the difference.",
    aircon: "Your aircon",
    inbox: "Jun’s inbox",
    before: "Before",
    after: "After",
    unread: "14 unread",
    pileUp: "Messages pile up while Jun is on the job.",
    zoneGrouped: "0 unread · zone-grouped",
  },
  testimonials: { eyebrow: "Testimonials", h2: "Salamat from our customers" },
  pricing: {
    eyebrow: "Pricing",
    h2: "Simple, honest prices",
    choose: "Choose",
    plans: [
      {
        name: "Single Cleaning",
        per: "/unit",
        items: ["Full inspection", "Filter + coil cleaning", "30-day warranty"],
        cta: "Choose Single",
      },
      {
        name: "Whole-Home Clean",
        per: "up to 3 units",
        items: ["Everything in Single", "Freon pressure check", "Priority slots", "60-day warranty"],
        cta: "Choose Whole-Home",
      },
      {
        name: "Bugnaw Care Plan",
        per: "/year",
        items: ["2 cleanings per unit yearly", "Automatic 6-month reminders", "Rainy-season priority rescheduling"],
        cta: "Choose Care Plan",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    h2: "Questions? We’ve got answers.",
    items: [
      {
        q: "How long does a cleaning take?",
        a: "About 60 minutes per split-type unit and 45 minutes per window-type. Freon recharge takes around 90 minutes.",
      },
      {
        q: "What if I’m not home?",
        a: "The day before, you get a one-tap “Yes, someone will be home” message. Someone 18+ must be there during the service; if nobody is home, the deposit is kept and we send you a rebooking link.",
      },
      {
        q: "How does the ₱200 deposit work?",
        a: "Pay ₱200 by GCash to lock your slot. It’s deducted from your final bill — you only pay the balance after the job.",
      },
      {
        q: "Can I reschedule?",
        a: "Yes. Your booking link shows only real open times. It’s free up to 24 hours before your slot.",
      },
      {
        q: "Which areas do you cover?",
        a: "Mandaue, Cebu City North (Banilad, Talamban, Lahug), Cebu City South, Lapu-Lapu and Consolacion. Monday to Saturday, 8 AM–5 PM.",
      },
      {
        q: "Do you reply in Bisaya?",
        a: "Oo! Message us in Bisaya, Tagalog, Taglish or English — the reply comes back in the same language.",
      },
    ],
  },
  finalCta: {
    h2a: "Mainit sa gawas? ",
    h2b: "Bugnaw sa balay.",
    sub: "Book in under a minute. We’ll handle the rest.",
  },
  footer: {
    blurb: "Aircon cleaning, check-ups and freon recharge across Mandaue and Metro Cebu, booked in under a minute.",
    quickLinks: "Quick Links",
    home: "Home",
    services: "Services",
    pricing: "Pricing",
    book: "Book",
    reschedule: "Reschedule",
    ownerLogin: "Owner login",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    top: "Top",
  },
  tour: {
    launch: "Take the 60-second tour",
    prompt: "New here? See how Bugnaw turns a message into a booking.",
  },
  booking: {
    backHome: "← Back to home",
    steps: ["Service", "Schedule", "Details", "Deposit"],
    badge: "Book your cleaning",
    h1a: "Cool again, ",
    h1b: "without the wait.",
    sub: "Jun Villanueva cleans and repairs aircons across Metro Cebu. Pick your service, see his real open slots, and you're booked — no waiting for a reply.",
    leadWelcome:
      "Hi from Jun! 👋 Your service and area are already filled in — just pick a time, add your details and pay the deposit.",
    carePlan: "Bugnaw Care Plan · ₱3,500/year · first visit scheduling",
    needTitle: "What does your unit need?",
    needSub: "Add how many units for each service.",
    unit: "unit",
    units: "units",
    whereWhen: "Where and when?",
    yourArea: "Your area",
    slots: "Available slots ({duration} job)",
    fullyBooked: "Fully booked for now — try fewer units or join the waitlist below.",
    peak: "🔥 Peak season — slots go fast. Deposit required to hold your time.",
    inArea: "Jun is already in your area — faster service",
    bestSlot: "Best slot — Jun is right next door",
    whereGo: "Where should Jun go?",
    fullName: "Full name",
    mobile: "Mobile number",
    mobileHint: "Format: 09XXXXXXXXX",
    mobileError: "Enter an 11-digit number starting with 09.",
    address: "Exact address",
    landmark: "Landmark",
    landmarkHint: "Optional but it saves Jun time",
    landmarkPh: "Beside the sari-sari store",
    gate: "Gate / access notes",
    optional: "Optional",
    gatePh: "Gate code, guard, parking, dogs…",
    adult: "Someone 18+ will be home during the service.",
    adultNote: "Required — no one home means the deposit is forfeited.",
    back: "Back",
    next: "Continue",
    payDeposit: "Pay ₱200 deposit",
    service: "service",
    services: "services",
    backToDetails: "Back to my details",
    depositToday: "deposit today",
    error: "Something went wrong. Please try again.",
    gcashTitle: "Secure your slot with a {amount} deposit",
    gcashSub: "Deducted from your final bill of {total}. Balance {balance} is paid after the job.",
    simulated: "Simulated payment",
    payTo: "Pay to",
    account: "Account",
    purpose: "Purpose",
    purposeValue: "Booking deposit",
    amountDue: "Amount due",
    payNow: "Pay {amount} now",
    confirming: "Confirming with GCash…",
    skip: "Skip — pay the full {total} after the job",
    demoNote: "Demo only — no real money moves. A real GCash checkout would open here.",
    trust: [
      { title: "Fixed, honest pricing", text: "The price you see is the price you pay." },
      { title: "On-time or he calls", text: "Jun updates you when he's on the way." },
      { title: "Real person, local", text: "Based in Mandaue, serving all of Metro Cebu." },
    ],
    waitlistTitle: "Can't find a good time? Join the waitlist",
    waitlistSub: "When a slot frees up in your area, you get a text first.",
    waitlistDone: "You're on the waitlist! Jun will text you the moment a slot opens in your area. Salamat!",
    yourName: "Your name",
    joinWaitlist: "Join waitlist",
    hours: "Mandaue City, Cebu · Mon–Sat, 8:00 AM–5:00 PM",
    signoff: "Salamat, kita-kits! 🧊",
  },
};

export type Dict = typeof en;

const ceb: Dict = {
  nav: {
    services: "Mga Serbisyo",
    about: "Bahin Kanamo",
    why: "Nganong Kami",
    process: "Proseso",
    pricing: "Presyo",
    book: "Pa-limpyo Karon",
    junSide: "Tan-awa ang bahin ni Jun",
    language: "Pinulongan",
  },
  hero: {
    eyebrow: "Paglimpyo og aircon · Mandaue & Metro Cebu",
    badge: "Motubag sa Bisaya · Taglish · English",
    h1a: "Gikan sa ‘Pwede ba ugma?’ ngadto sa ",
    h1b: "Naka-book Ka Na.",
    sub: "Mag-message lang sa Bisaya, Taglish, o English. Motubag dayon ang Bugnaw nga naay tinuod nga bakanteng oras sa inyong dapit, mokumpirma sa imong booking, ug mopahinumdom nimo usa ka adlaw una — aron makapadayon si Jun sa iyang trabaho.",
    tryChat: "Sulayi ang chat",
    tour: "Sulayi ang tour",
    b1: "Motubag sulod sa usa ka minuto",
    b2: "Iskedyul sa parehas nga zone",
    b3: "₱200 deposit, ibawas sa bayronon",
    trusted: "Gisaligan sa",
    trustedTail: "ka balay sa Cebu",
    booked: "Naka-book ✓",
    depositPaid: "Bayad na ang deposit",
    chipTomorrow: "Ugma hapon",
  },
  chat: {
    eyebrow: "Sulayi karon",
    h2: "Pagmensahe sa Bugnaw sama sa naandan nimo.",
    sub: "Walay porma o hapsay nga pinulongan nga gikinahanglan. Pangutana sa Bisaya, Taglish, o English ug makakuha og tinuod nga bakanteng oras.",
    replies: "Kasagaran motubag dayon",
    tooltip: "Ang mga tubag gidrapt sa Bugnaw para kang Jun gamit ang iyang tinuod nga kalendaryo.",
    greeting: "Hi! Unsa imong aircon need, pila ka units, ug asa inyong area?",
    placeholder: "I-type imong mensahe…",
    langNote: "Motubag si Jun sa pinulongan nga imong gigamit",
    examples: [
      "Boss, pwede ugma? 2 split sa Banilad",
      "Pila ang limpyo sa window type? Taga Mandaue mi",
      "Dili na bugnaw akong aircon, pa-check unta sa Talamban",
    ],
    tryOne: "Sulayi ang usa niini, o pagsulat sa imong kaugalingon 👇",
    justNow: "Karon lang",
    seen: "Karon lang · Nakita",
    typing: "Gisusi ang tinuod nga bakanteng oras ni Jun…",
    book: "Book",
    inboxNote: "Ang imong pangutana naa na sa Inbox ni Jun",
    seeInbox: "Tan-awa sa Inbox ni Jun →",
  },
  about: {
    eyebrow: "Bahin Kanamo",
    story:
      "Si Jun Villanueva naglimpyo og aircon sa tibuok Metro Cebu sukad 2019 — siya ug usa ka katabang lang. Gihimo niya ang Bugnaw kay matag wala matubag nga mensahe sa Messenger usa ka nawala nga kustomer, ug matag “wala tao” usa ka usik nga biyahe. Karon, ang mga booking mismo na ang nag-atiman sa ilang kaugalingon.",
    rating: "Rating sa Kustomer",
    years: "Ka Tuig nga Nagserbisyo",
    units: "Ka Yunit nga Nalimpyohan",
    hours: "Ka Oras nga Natipigan Karong Bulana",
  },
  services: {
    eyebrow: "Mga Serbisyo",
    h2: "Kompletong pag-atiman sa matag aircon sa balay",
    sub: "Tarong nga presyo, usa ka kasaligan nga technician, ug booking nga mahuman sulod sa usa ka minuto.",
    howItWorks: "Unsaon ni molihok",
    bookThis: "I-book ni",
    prev: "Miaging mga serbisyo",
    next: "Sunod nga mga serbisyo",
    items: [
      {
        title: "Paglimpyo og Split-type",
        body: "₱800 kada yunit · 60 min. Coil, blower ug drain, hugasan tanan.",
      },
      {
        title: "Paglimpyo og Window-type",
        body: "₱600 kada yunit · 45 min. Kuhaon, hugasan ug sanitize.",
      },
      {
        title: "Check-up & Diagnosis",
        body: "₱500 flat. Susihon ni Jun ang tanan ug sultihan ka unsay kinahanglan.",
      },
      {
        title: "Freon Recharge",
        body: "₱1,800 kada yunit · 90 min. Leak check ug kompletong top-up.",
      },
      {
        title: "6-Bulan nga Pahinumdom",
        body: "Mensahan ka namo kung panahon na pod. Usa ka tap lang para mag-book.",
      },
      {
        title: "Reschedule kung Ulan",
        body: "Dautan ang panahon? Makadawat ka og libreng one-tap reschedule link.",
      },
    ],
  },
  why: {
    eyebrow: "Nganong Kami",
    h2: "Gihimo para sa tinuod nga paagi sa pag-book sa Cebu.",
    sub: "Walay mopuno og porma. Ang tawo mo-send og “pwede ugma?” sa Messenger. Kana ang gitubag sa Bugnaw — dihadiha, sa ilang pinulongan, uban sa tinuod nga oras.",
    unanswered: "wala matubag nga mensahe",
    driving: "kunhod nga biyahe / semana",
    hrs: " ka oras",
    noShows: "mas gamay nga no-show",
    callout: "Naa na si Jun sa inyong dapit? Imo ang mas sayo nga oras.",
  },
  recent: {
    eyebrow: "Bag-ong Trabaho",
    h2: "Bugnaw nga hangin, tibuok Metro Cebu",
    jobs: [
      { year: "Karon", title: "3 ka split-type para sa pamilya sa Banilad" },
      { year: "Gahapon", title: "Limpyo sa split-type sa condo duol sa IT Park" },
      { year: "3 ka adlaw na", title: "Freon top-up sa opisina sa Mandaue" },
      { year: "Miaging semana", title: "2 ka window unit sa wala pa ang ulan" },
      { year: "Miaging semana", title: "Check-up sa outdoor unit sa Lapu-Lapu" },
    ],
  },
  process: {
    eyebrow: "Proseso",
    h2: "Tulo ka lakang. Sulod sa usa ka minuto.",
    steps: [
      {
        t: "Pagmensahe bisan unsaon",
        b: "Messenger, bisan unsang pinulongan. Igo na ang “Pwede ugma?”.",
      },
      {
        t: "Kuhaa dayon ang tinuod nga oras",
        b: "Tubag nga naay bakanteng oras sa inyong dapit — una ang sama nga zone ni Jun.",
      },
      {
        t: "I-tap, bayad ₱200, human",
        b: "Ang GCash deposit maoy mo-lock niini. Awtomatiko na ang mga pahinumdom.",
      },
    ],
  },
  junLife: {
    eyebrow: "Usa ka adlaw ni Jun, sa wala pa ang Bugnaw",
    h2: "Maayong technician. Imposible nga inbox.",
    tooLate: "Ulahi na",
    items: [
      {
        title: "Naa sa atop, nag-vibrate ang telepono",
        text: "Dili makaundang si Jun sa tunga sa paglimpyo aron motubag.",
      },
      {
        title: "14 ka wala mabasa nga mensahe",
        text: "Ang matag wala matubag nangita na og laing technician.",
      },
      {
        title: "40-minutos nga biyahe",
        text: "Nakaabot siya sa Lapu-Lapu. Sirado ang gate. Walay tawo.",
      },
      { title: "Nagtubag imbes mokaon", text: "Human na ang trabaho, pero nagsugod ang inbox." },
      { title: "3 ka kustomer nawala", text: "Nag-book na sila og lain." },
    ],
  },
  beforeAfter: {
    eyebrow: "Kaniadto / Karon",
    h2: "Tan-awa ang kalainan.",
    aircon: "Imong aircon",
    inbox: "Inbox ni Jun",
    before: "Kaniadto",
    after: "Karon",
    unread: "14 wala mabasa",
    pileUp: "Nagtapok ang mensahe samtang naa si Jun sa trabaho.",
    zoneGrouped: "0 wala mabasa · grupo sa zone",
  },
  testimonials: { eyebrow: "Mga Testimonya", h2: "Salamat gikan sa among mga kustomer" },
  pricing: {
    eyebrow: "Presyo",
    h2: "Simple, tarong nga presyo",
    choose: "Pilia ang",
    plans: [
      {
        name: "Usa ka Paglimpyo",
        per: "/yunit",
        items: ["Kompletong inspeksyon", "Filter + coil nga paglimpyo", "30-adlaw nga warranty"],
        cta: "Pilia ni",
      },
      {
        name: "Tibuok Balay",
        per: "hangtod 3 ka yunit",
        items: ["Tanan sa Usa ka Paglimpyo", "Freon pressure check", "Prayoridad nga oras", "60-adlaw nga warranty"],
        cta: "Pilia ang Tibuok Balay",
      },
      {
        name: "Bugnaw Care Plan",
        per: "/tuig",
        items: [
          "2 ka paglimpyo kada yunit kada tuig",
          "Awtomatikong pahinumdom kada 6 ka bulan",
          "Prayoridad nga reschedule panahon sa ting-ulan",
        ],
        cta: "Pilia ang Care Plan",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    h2: "Naay pangutana? Naa mi tubag.",
    items: [
      {
        q: "Pila ka dugay ang paglimpyo?",
        a: "Mga 60 minutos kada split-type nga yunit ug 45 minutos kada window-type. Ang freon recharge mga 90 minutos.",
      },
      {
        q: "Unsa man kung wala ko sa balay?",
        a: "Usa ka adlaw sa wala pa, makadawat ka og one-tap nga “Oo, naay tawo sa balay” nga mensahe. Kinahanglan naay 18-anyos pataas sa panahon sa serbisyo; kung walay tawo, mapugngan ang deposit ug padad-an ka og rebooking link.",
      },
      {
        q: "Unsaon paglihok sa ₱200 nga deposit?",
        a: "Bayad og ₱200 pinaagi sa GCash aron ma-lock ang imong oras. Ibawas ni sa imong kataposang bayronon — ang balanse na lang imong bayran human sa trabaho.",
      },
      {
        q: "Pwede ko mag-reschedule?",
        a: "Oo. Ang imong booking link nagpakita lang og tinuod nga bakanteng oras. Libre ni hangtod 24 ka oras sa wala pa ang imong iskedyul.",
      },
      {
        q: "Unsa nga mga lugar ang inyong giserbisyohan?",
        a: "Mandaue, Cebu City North (Banilad, Talamban, Lahug), Cebu City South, Lapu-Lapu ug Consolacion. Lunes hangtod Sabado, 8 AM–5 PM.",
      },
      {
        q: "Motubag ba mo sa Bisaya?",
        a: "Oo! Pagmensahe sa Bisaya, Tagalog, Taglish o English — parehas ra nga pinulongan ang tubag.",
      },
    ],
  },
  finalCta: {
    h2a: "Mainit sa gawas? ",
    h2b: "Bugnaw sa balay.",
    sub: "Mag-book sulod sa usa ka minuto. Kami nay bahala sa uban.",
  },
  footer: {
    blurb: "Paglimpyo og aircon, check-up ug freon recharge sa Mandaue ug Metro Cebu, ma-book sulod sa usa ka minuto.",
    quickLinks: "Dali nga Link",
    home: "Home",
    services: "Mga Serbisyo",
    pricing: "Presyo",
    book: "Mag-book",
    reschedule: "Reschedule",
    ownerLogin: "Owner login",
    terms: "Mga Termino ug Kondisyon",
    privacy: "Patakaran sa Pribasiya",
    top: "Taas",
  },
  tour: {
    launch: "Sulayi ang 60-segundo nga tour",
    prompt: "Bag-o ka diri? Tan-awa unsaon paghimo sa Bugnaw og booking gikan sa usa ka mensahe.",
  },
  booking: {
    backHome: "← Balik sa home",
    steps: ["Serbisyo", "Iskedyul", "Detalye", "Deposit"],
    badge: "I-book ang imong paglimpyo",
    h1a: "Bugnaw na usab, ",
    h1b: "walay paghulat.",
    sub: "Si Jun Villanueva naglimpyo ug nag-ayo og aircon sa tibuok Metro Cebu. Pilia ang serbisyo, tan-awa ang iyang tinuod nga bakanteng oras, ug naka-book ka na — dili na kinahanglan maghulat og tubag.",
    leadWelcome:
      "Hi gikan kang Jun! 👋 Napuno na ang imong serbisyo ug lugar — pili na lang og oras, ibutang imong detalye ug bayri ang deposit.",
    carePlan: "Bugnaw Care Plan · ₱3,500/tuig · iskedyul sa unang bisita",
    needTitle: "Unsay kinahanglan sa imong aircon?",
    needSub: "Idugang pila ka yunit sa matag serbisyo.",
    unit: "yunit",
    units: "ka yunit",
    whereWhen: "Asa ug kanus-a?",
    yourArea: "Imong lugar",
    slots: "Bakanteng oras ({duration} nga trabaho)",
    fullyBooked: "Puno pa karon — sulayi og mas gamay nga yunit o apil sa waitlist sa ubos.",
    peak: "🔥 Peak season — dali ra mahurot ang oras. Kinahanglan ang deposit aron ma-reserve.",
    inArea: "Naa na si Jun sa inyong dapit — mas paspas nga serbisyo",
    bestSlot: "Labing maayo nga oras — duol ra si Jun",
    whereGo: "Asa man moadto si Jun?",
    fullName: "Tibuok nga ngalan",
    mobile: "Numero sa mobile",
    mobileHint: "Pormat: 09XXXXXXXXX",
    mobileError: "Ibutang ang 11 ka numero nga nagsugod sa 09.",
    address: "Eksaktong address",
    landmark: "Timaan (landmark)",
    landmarkHint: "Opsyonal pero makatipig og oras ni Jun",
    landmarkPh: "Tupad sa sari-sari store",
    gate: "Gate / pahibalo sa pagsulod",
    optional: "Opsyonal",
    gatePh: "Gate code, guard, parking, iro…",
    adult: "Naay 18-anyos pataas sa balay samtang ang serbisyo.",
    adultNote: "Kinahanglan — kung walay tawo, dili na mabalik ang deposit.",
    back: "Balik",
    next: "Padayon",
    payDeposit: "Bayri ang ₱200 deposit",
    service: "serbisyo",
    services: "ka serbisyo",
    backToDetails: "Balik sa akong detalye",
    depositToday: "deposit karon",
    error: "Naay sayop. Palihug sulayi pag-usab.",
    gcashTitle: "I-secure ang imong oras gamit ang {amount} nga deposit",
    gcashSub: "Ibawas ni sa imong kataposang bayronon nga {total}. Ang balanse nga {balance} bayran human sa trabaho.",
    simulated: "Simulated nga bayad",
    payTo: "Bayran si",
    account: "Account",
    purpose: "Katuyoan",
    purposeValue: "Deposit sa booking",
    amountDue: "Kantidad nga bayran",
    payNow: "Bayri karon ang {amount}",
    confirming: "Gikumpirma sa GCash…",
    skip: "Laktawi — bayri ang tibuok {total} human sa trabaho",
    demoNote: "Demo ra — walay tinuod nga kwarta nga mabalhin. Diri moabli ang tinuod nga GCash checkout.",
    trust: [
      {
        title: "Tarong ug pirmi nga presyo",
        text: "Ang presyo nga imong makita, mao ra ang imong bayran.",
      },
      { title: "Sa oras o motawag siya", text: "Pahibaw-on ka ni Jun kung padulong na siya." },
      { title: "Tinuod nga tawo, lokal", text: "Taga Mandaue, nagserbisyo sa tibuok Metro Cebu." },
    ],
    waitlistTitle: "Walay haom nga oras? Apil sa waitlist",
    waitlistSub: "Kung naay mabakante sa inyong dapit, ikaw ang unang ma-text.",
    waitlistDone: "Naa ka na sa waitlist! I-text ka ni Jun dayon kung naay mabakante sa inyong dapit. Salamat!",
    yourName: "Imong ngalan",
    joinWaitlist: "Apil sa waitlist",
    hours: "Mandaue City, Cebu · Lunes–Sabado, 8:00 AM–5:00 PM",
    signoff: "Salamat, kita-kits! 🧊",
  },
};

const tag: Dict = {
  nav: {
    services: "Services",
    about: "Tungkol",
    why: "Bakit Kami",
    process: "Proseso",
    pricing: "Presyo",
    book: "Mag-book ng Cleaning",
    junSide: "Tingnan ang side ni Jun",
    language: "Wika",
  },
  hero: {
    eyebrow: "Aircon cleaning · Mandaue & Metro Cebu",
    badge: "Sumasagot sa Bisaya · Taglish · English",
    h1a: "Mula sa ‘Pwede ba bukas?’ hanggang ",
    h1b: "Booked Ka Na.",
    sub: "Mag-message lang po sa Bisaya, Taglish, o English. Agad sumasagot ang Bugnaw with real open slots sa inyong area, kino-confirm ang booking, at nagpapaalala isang araw bago — para makapag-trabaho lang si Jun.",
    tryChat: "Subukan ang chat",
    tour: "Subukan ang tour",
    b1: "Sumasagot sa loob ng 1 minuto",
    b2: "Same-zone na scheduling",
    b3: "₱200 deposit, babawasin sa bill",
    trusted: "Pinagkakatiwalaan ng",
    trustedTail: "na bahay sa Cebu",
    booked: "Booked ✓",
    depositPaid: "Bayad na ang deposit",
    chipTomorrow: "Bukas hapon",
  },
  chat: {
    eyebrow: "Subukan mo na",
    h2: "Mag-message sa Bugnaw gaya ng nakasanayan mo.",
    sub: "Walang forms o perfect na grammar. Magtanong po sa Bisaya, Taglish, o English at makakuha ng totoong available na oras.",
    replies: "Karaniwang sumasagot agad",
    tooltip: "Ang mga sagot ay dinra-draft ng Bugnaw para kay Jun gamit ang totoo niyang calendar.",
    greeting: "Hi po! Ano pong kailangan ng aircon niyo, ilang units, at saan po kayo?",
    placeholder: "I-type ang message niyo…",
    langNote: "Sumasagot si Jun sa wikang ginamit mo",
    examples: [
      "Magkano po cleaning ng 3 units? Lapu-Lapu kami",
      "Available po ba kayo bukas ng hapon? 1 split sa Mabolo",
      "Hindi na po lumalamig yung aircon namin sa Consolacion",
    ],
    tryOne: "Subukan ang isa dito, o mag-type ng sarili mo 👇",
    justNow: "Ngayon lang",
    seen: "Ngayon lang · Seen",
    typing: "Chine-check ang totoong open slots ni Jun…",
    book: "Book",
    inboxNote: "Nasa Inbox na ni Jun ang inquiry na ito",
    seeInbox: "Tingnan sa Inbox ni Jun →",
  },
  about: {
    eyebrow: "Tungkol Sa Amin",
    story:
      "Si Jun Villanueva ay naglilinis ng aircon sa buong Metro Cebu mula 2019 — siya lang at isang katulong. Ginawa niya ang Bugnaw kasi bawat hindi nasagot na Messenger ay nawawalang customer, at bawat “wala tao” ay sayang na biyahe. Ngayon, kusa nang nag-aayos ang mga booking.",
    rating: "Customer Rating",
    years: "Taon sa Serbisyo",
    units: "Units na Nalinis",
    hours: "Oras na Na-save Ngayong Buwan",
  },
  services: {
    eyebrow: "Services",
    h2: "Kumpletong alaga para sa bawat aircon sa bahay",
    sub: "Tapat na presyo, isang mapagkakatiwalaang technician, at booking na kulang sa isang minuto.",
    howItWorks: "Paano ito gumagana",
    bookThis: "I-book ito",
    prev: "Nakaraang services",
    next: "Susunod na services",
    items: [
      {
        title: "Split-type Cleaning",
        body: "₱800 kada unit · 60 min. Coil, blower at drain, hugasan lahat.",
      },
      {
        title: "Window-type Cleaning",
        body: "₱600 kada unit · 45 min. Tatanggalin, huhugasan at sasanitize.",
      },
      {
        title: "Check-up & Diagnosis",
        body: "₱500 flat. Chine-check ni Jun lahat at sasabihin kung ano ang kailangan.",
      },
      { title: "Freon Recharge", body: "₱1,800 kada unit · 90 min. Leak check plus buong top-up." },
      {
        title: "6-Month Care Reminder",
        body: "Mine-message ka namin kapag panahon na ulit. One tap lang mag-rebook.",
      },
      {
        title: "Rainy-day Rescheduling",
        body: "Masamang panahon? Libre ang one-tap reschedule link.",
      },
    ],
  },
  why: {
    eyebrow: "Bakit Kami",
    h2: "Gawa para sa totoong paraan ng pag-book sa Cebu.",
    sub: "Walang pumupuno ng forms. Nagse-send lang ang tao ng “pwede bukas?” sa Messenger. Yun ang sinasagot ng Bugnaw — agad, sa wika nila, may totoong slot.",
    unanswered: "hindi nasagot na mensahe",
    driving: "mas kaunting biyahe / linggo",
    hrs: " oras",
    noShows: "mas kaunting no-show",
    callout: "Nasa area niyo na si Jun? Sa iyo ang mas maagang slot.",
  },
  recent: {
    eyebrow: "Recent Jobs",
    h2: "Sariwang hangin, sa buong Metro Cebu",
    jobs: [
      { year: "Ngayon", title: "3 split-type para sa isang pamilya sa Banilad" },
      { year: "Kahapon", title: "Condo split-type cleaning malapit sa IT Park" },
      { year: "3 araw na", title: "Freon top-up sa office sa Mandaue" },
      { year: "Last week", title: "2 window units bago ang tag-ulan" },
      { year: "Last week", title: "Check-up ng outdoor unit sa Lapu-Lapu" },
    ],
  },
  process: {
    eyebrow: "Proseso",
    h2: "Tatlong hakbang. Wala pang isang minuto.",
    steps: [
      {
        t: "Mag-message kahit paano",
        b: "Messenger, kahit anong wika. Sapat na ang “Pwede bukas?”.",
      },
      {
        t: "Kunin agad ang totoong slots",
        b: "Sagot na may bukas na oras sa area niyo — una ang same-zone days ni Jun.",
      },
      {
        t: "I-tap, bayad ₱200, tapos",
        b: "Ang GCash deposit ang magla-lock nito. Automatic na ang mga reminder.",
      },
    ],
  },
  junLife: {
    eyebrow: "Isang araw kay Jun, bago ang Bugnaw",
    h2: "Magaling na technician. Imposibleng inbox.",
    tooLate: "Huli na",
    items: [
      {
        title: "Nasa bubong, tumutunog ang phone",
        text: "Hindi pwedeng huminto si Jun sa gitna ng paglilinis.",
      },
      {
        title: "14 na unread na mensahe",
        text: "Bawat hindi nasagot ay naghahanap na ng ibang technician.",
      },
      {
        title: "40 minutong biyahe",
        text: "Nakarating siya sa Lapu-Lapu. Nakakandado ang gate. Walang tao.",
      },
      {
        title: "Nagre-reply imbes kumain",
        text: "Tapos na ang trabaho, pero nagsisimula ang inbox.",
      },
      { title: "3 customers nawala", text: "Nag-book na sila sa iba." },
    ],
  },
  beforeAfter: {
    eyebrow: "Before / After",
    h2: "Tingnan ang pagkakaiba.",
    aircon: "Ang aircon mo",
    inbox: "Inbox ni Jun",
    before: "Before",
    after: "After",
    unread: "14 unread",
    pileUp: "Nag-iipon ang mensahe habang nasa trabaho si Jun.",
    zoneGrouped: "0 unread · naka-grupo sa zone",
  },
  testimonials: { eyebrow: "Testimonials", h2: "Salamat mula sa aming mga customer" },
  pricing: {
    eyebrow: "Presyo",
    h2: "Simple at tapat na presyo",
    choose: "Piliin ang",
    plans: [
      {
        name: "Single Cleaning",
        per: "/unit",
        items: ["Buong inspeksyon", "Filter + coil cleaning", "30-araw na warranty"],
        cta: "Piliin ang Single",
      },
      {
        name: "Whole-Home Clean",
        per: "hanggang 3 units",
        items: ["Lahat ng nasa Single", "Freon pressure check", "Priority slots", "60-araw na warranty"],
        cta: "Piliin ang Whole-Home",
      },
      {
        name: "Bugnaw Care Plan",
        per: "/taon",
        items: [
          "2 cleanings kada unit kada taon",
          "Automatic na 6-month reminders",
          "Priority rescheduling tuwing tag-ulan",
        ],
        cta: "Piliin ang Care Plan",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    h2: "May tanong? May sagot kami.",
    items: [
      {
        q: "Gaano katagal ang cleaning?",
        a: "Mga 60 minuto kada split-type unit at 45 minuto kada window-type. Ang freon recharge ay mga 90 minuto.",
      },
      {
        q: "Paano kung wala ako sa bahay?",
        a: "Isang araw bago, makakatanggap ka ng one-tap na “Oo, may tao sa bahay” na mensahe. Kailangan may 18+ pataas habang ginagawa ang serbisyo; kung walang tao, mananatili sa amin ang deposit at papadalhan ka ng rebooking link.",
      },
      {
        q: "Paano gumagana ang ₱200 deposit?",
        a: "Magbayad ng ₱200 via GCash para ma-lock ang slot mo. Babawasin ito sa final bill — ang balance na lang ang bayaran mo pagkatapos.",
      },
      {
        q: "Pwede ba akong mag-reschedule?",
        a: "Opo. Ang booking link mo ay nagpapakita lang ng totoong bukas na oras. Libre ito hanggang 24 oras bago ang slot mo.",
      },
      {
        q: "Anong mga lugar ang saklaw niyo?",
        a: "Mandaue, Cebu City North (Banilad, Talamban, Lahug), Cebu City South, Lapu-Lapu at Consolacion. Lunes hanggang Sabado, 8 AM–5 PM.",
      },
      {
        q: "Sumasagot ba kayo sa Bisaya?",
        a: "Oo! Mag-message sa Bisaya, Tagalog, Taglish o English — pareho ring wika ang sagot.",
      },
    ],
  },
  finalCta: {
    h2a: "Mainit sa labas? ",
    h2b: "Bugnaw sa bahay.",
    sub: "Mag-book sa wala pang isang minuto. Kami na ang bahala sa iba.",
  },
  footer: {
    blurb: "Aircon cleaning, check-up at freon recharge sa Mandaue at Metro Cebu, na-book sa wala pang isang minuto.",
    quickLinks: "Quick Links",
    home: "Home",
    services: "Services",
    pricing: "Presyo",
    book: "Mag-book",
    reschedule: "Reschedule",
    ownerLogin: "Owner login",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    top: "Taas",
  },
  tour: {
    launch: "Subukan ang 60-second tour",
    prompt: "Bago ka dito? Tingnan kung paano ginagawang booking ng Bugnaw ang isang message.",
  },
  booking: {
    backHome: "← Balik sa home",
    steps: ["Service", "Schedule", "Details", "Deposit"],
    badge: "I-book ang cleaning mo",
    h1a: "Malamig ulit, ",
    h1b: "walang hintayan.",
    sub: "Si Jun Villanueva ay naglilinis at nag-aayos ng aircon sa buong Metro Cebu. Piliin ang service, tingnan ang totoo niyang open slots, at booked ka na — hindi na kailangang maghintay ng reply.",
    leadWelcome:
      "Hi mula kay Jun! 👋 Naka-fill in na ang service at area mo — pumili na lang ng oras, ilagay ang details mo at bayaran ang deposit.",
    carePlan: "Bugnaw Care Plan · ₱3,500/taon · schedule ng unang visit",
    needTitle: "Ano ang kailangan ng aircon mo?",
    needSub: "Ilagay kung ilang units sa bawat service.",
    unit: "unit",
    units: "units",
    whereWhen: "Saan at kailan?",
    yourArea: "Area mo",
    slots: "Available slots ({duration} na trabaho)",
    fullyBooked: "Fully booked pa sa ngayon — subukan ang mas kaunting units o sumali sa waitlist sa baba.",
    peak: "🔥 Peak season — mabilis maubos ang slots. Kailangan ang deposit para ma-hold ang oras mo.",
    inArea: "Nasa area mo na si Jun — mas mabilis na service",
    bestSlot: "Best slot — malapit lang si Jun",
    whereGo: "Saan pupunta si Jun?",
    fullName: "Buong pangalan",
    mobile: "Mobile number",
    mobileHint: "Format: 09XXXXXXXXX",
    mobileError: "Maglagay ng 11-digit number na nagsisimula sa 09.",
    address: "Eksaktong address",
    landmark: "Landmark",
    landmarkHint: "Optional pero makakatipid ng oras ni Jun",
    landmarkPh: "Katabi ng sari-sari store",
    gate: "Gate / access notes",
    optional: "Optional",
    gatePh: "Gate code, guard, parking, aso…",
    adult: "May 18+ na nasa bahay habang ginagawa ang service.",
    adultNote: "Required — kapag walang tao, hindi na ibabalik ang deposit.",
    back: "Bumalik",
    next: "Tuloy",
    payDeposit: "Bayaran ang ₱200 deposit",
    service: "service",
    services: "services",
    backToDetails: "Bumalik sa details ko",
    depositToday: "deposit ngayon",
    error: "May mali. Pakisubukan ulit.",
    gcashTitle: "I-secure ang slot mo gamit ang {amount} na deposit",
    gcashSub: "Babawasin ito sa final bill mong {total}. Ang balance na {balance} ay babayaran pagkatapos ng trabaho.",
    simulated: "Simulated na bayad",
    payTo: "Bayaran si",
    account: "Account",
    purpose: "Layunin",
    purposeValue: "Booking deposit",
    amountDue: "Babayaran",
    payNow: "Bayaran ang {amount} ngayon",
    confirming: "Kino-confirm sa GCash…",
    skip: "Skip — bayaran ang buong {total} pagkatapos ng trabaho",
    demoNote: "Demo lang — walang totoong perang gagalaw. Dito magbubukas ang totoong GCash checkout.",
    trust: [
      {
        title: "Fixed at tapat na presyo",
        text: "Kung ano ang nakikita mo, yun ang babayaran mo.",
      },
      { title: "On-time o tatawag siya", text: "Mag-a-update si Jun kapag papunta na siya." },
      { title: "Totoong tao, lokal", text: "Taga-Mandaue, nagse-serve sa buong Metro Cebu." },
    ],
    waitlistTitle: "Walang swak na oras? Sumali sa waitlist",
    waitlistSub: "Kapag may nabakanteng slot sa area mo, ikaw ang unang ite-text.",
    waitlistDone: "Nasa waitlist ka na! Ite-text ka ni Jun agad kapag may bakanteng slot sa area mo. Salamat!",
    yourName: "Pangalan mo",
    joinWaitlist: "Sumali sa waitlist",
    hours: "Mandaue City, Cebu · Lunes–Sabado, 8:00 AM–5:00 PM",
    signoff: "Salamat, kita-kits! 🧊",
  },
};

const DICTS: Record<Lang, Dict> = { en, ceb, tag };

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : lang === "ceb" ? "ceb" : "tl";
  }, [lang]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && saved in DICTS) setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang: (l: Lang) => {
        setLangState(l);
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignore */
        }
      },
      t: DICTS[lang],
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Replace {name} placeholders, e.g. fill(t.booking.payNow, { amount: "₱200" }). */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function useT(): Dict {
  return useContext(LanguageContext).t;
}

/** EN | CEB | TAG switcher. The choice is saved and follows the visitor to the chat and booking pages. */
export function LangSwitch({ light = true, className = "" }: { light?: boolean; className?: string }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={`flex shrink-0 rounded-full p-0.5 ${light ? "bg-frostwhite/10" : "bg-lp-ink/5"} ${className}`}
    >
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code === "en" ? "en" : l.code === "ceb" ? "ceb" : "tl"}
          aria-pressed={lang === l.code}
          aria-label={l.label}
          title={l.label}
          onClick={() => setLang(l.code)}
          className={`min-h-11 min-w-11 rounded-full px-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-lp-blue lg:min-h-9 ${
            lang === l.code
              ? "bg-lp-blue text-frostwhite"
              : light
                ? "text-frostwhite/80 hover:text-frostwhite"
                : "text-lp-muted hover:text-lp-ink"
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
