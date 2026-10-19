import { createServerFn } from "@tanstack/react-start";

export type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_php: number;
};

export type ZoneRow = {
  id: string;
  slug: string;
  name: string;
  barangays: string[];
  color: string;
};

export type CartItem = { service_id: string; quantity: number };

export type DayAvailability = {
  date: string;
  best: boolean;
  slots: string[];
  clustered: string[];
};

const LIVE_WORKSPACE = "00000000-0000-0000-0000-000000000001";

function toMin(t: string) {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}
function toTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
}

/** Services, zones and the shop's working rules — public. */
export const getBookingOptions = createServerFn({ method: "GET" }).handler(async () => {
  const { adminDb } = await import("./db.server");
  const db = adminDb();
  const [services, zones, settings] = await Promise.all([
    db.from("services").select("id,slug,name,description,duration_minutes,price_php").eq("active", true).order("sort_order"),
    db.from("zones").select("id,slug,name,barangays,color").order("sort_order"),
    db.from("shop_settings").select("*").eq("workspace_id", LIVE_WORKSPACE).single(),
  ]);
  return {
    services: (services.data ?? []) as ServiceRow[],
    zones: (zones.data ?? []) as ZoneRow[],
    depositPhp: settings.data?.deposit_php ?? 200,
    peakMode: !!settings.data?.peak_mode,
  };
});

/** Open slots for the next two weeks that fit the requested job length. */
export const getAvailability = createServerFn({ method: "POST" })
  .inputValidator((d: { zoneId: string; durationMinutes: number }) => d)
  .handler(async ({ data }): Promise<DayAvailability[]> => {
    const { adminDb } = await import("./db.server");
    const { computeAvailability } = await import("./availability.server");
    return computeAvailability(adminDb(), data.zoneId, data.durationMinutes, { workspaceId: LIVE_WORKSPACE });
  });

/** Personal booking link from a Messenger reply: marks it opened and returns the prefill. */
export const openLead = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: String(d.token).slice(0, 40) }))
  .handler(async ({ data }) => {
    const { adminDb } = await import("./db.server");
    const db = adminDb();
    const { data: c } = await db
      .from("conversations")
      .select("id,status,customer_name,extracted,link_opened_at")
      .eq("workspace_id", LIVE_WORKSPACE)
      .eq("lead_token", data.token)
      .maybeSingle();
    if (!c) {
      const { data: w } = await db.from("waitlist").select("full_name,zone_id,service_slug,units").eq("workspace_id", LIVE_WORKSPACE).eq("token", data.token).maybeSingle();
      if (!w) return null;
      const { data: svc } = w.service_slug ? await db.from("services").select("id").eq("slug", w.service_slug).maybeSingle() : { data: null };
      return { customerName: w.full_name, serviceId: (svc as { id: string } | null)?.id ?? null, units: w.units, zoneId: w.zone_id, barangay: "" };
    }
    if (c.status === "new" || c.status === "replied") {
      await db.from("conversations").update({ status: "link_opened", link_opened_at: new Date().toISOString() }).eq("id", c.id);
    }
    const ex = (c.extracted ?? {}) as { service_slug?: string | null; units?: number | null; zone_slug?: string | null; barangay?: string | null };
    const [{ data: svc }, { data: zone }] = await Promise.all([
      ex.service_slug ? db.from("services").select("id").eq("slug", ex.service_slug).maybeSingle() : Promise.resolve({ data: null }),
      ex.zone_slug ? db.from("zones").select("id").eq("slug", ex.zone_slug).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const name = c.customer_name === "Messenger customer" ? "" : c.customer_name;
    return {
      customerName: name,
      serviceId: (svc as { id: string } | null)?.id ?? null,
      units: Math.max(1, Math.min(10, Number(ex.units) || 1)),
      zoneId: (zone as { id: string } | null)?.id ?? null,
      barangay: ex.barangay ?? "",
    };
  });

export type BookingSummary = {
  reference: string;
  service_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_php: number;
  deposit_php: number;
  status: string;
  items: Array<{ name: string; quantity: number; unit_price: number }>;
  zone_name: string;
  customer_name: string;
  address: string;
  mobile_last4: string;
};

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      items: CartItem[];
      zoneId: string;
      date: string;
      startTime: string;
      fullName: string;
      mobile: string;
      address: string;
      landmark: string;
      accessNotes: string;
      adultPresent: boolean;
      depositReference: string;
      leadToken?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { adminDb } = await import("./db.server");
    const db = adminDb();

    const mobile = data.mobile.replace(/[\s-]/g, "");
    if (!/^09\d{9}$/.test(mobile)) return { ok: false as const, error: "Please enter a valid mobile number (09XXXXXXXXX)." };
    if (!data.adultPresent) return { ok: false as const, error: "Someone 18+ must be home during the service." };
    if (!data.fullName.trim() || !data.address.trim()) return { ok: false as const, error: "Name and address are required." };
    if (!Array.isArray(data.items) || data.items.length === 0) return { ok: false as const, error: "Choose at least one service." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !/^\d{2}:\d{2}/.test(data.startTime))
      return { ok: false as const, error: "Choose a schedule." };

    const { data: services } = await db.from("services").select("id,name,price_php,duration_minutes,slug").eq("active", true);
    const { data: zone } = await db.from("zones").select("id,name").eq("id", data.zoneId).single();
    const { data: settings } = await db.from("shop_settings").select("deposit_php,peak_mode").eq("workspace_id", LIVE_WORKSPACE).single();
    const payLater = !data.depositReference;
    if (payLater && settings?.peak_mode) return { ok: false as const, error: "Peak season: a deposit is required to hold your slot." };
    if (!services || !zone) return { ok: false as const, error: "Something went wrong. Please try again." };

    let total = 0;
    let duration = 0;
    const items = [];
    for (const item of data.items) {
      const s = services.find((x) => x.id === item.service_id);
      const qty = Math.max(1, Math.min(10, Math.round(item.quantity)));
      if (!s) continue;
      total += s.price_php * qty;
      duration += s.duration_minutes * qty;
      items.push({ service_id: s.id, slug: s.slug, name: s.name, quantity: qty, unit_price: s.price_php, unit_minutes: s.duration_minutes });
    }
    if (!items.length) return { ok: false as const, error: "Choose at least one service." };

    const start = toMin(data.startTime);
    const end = toTime(start + duration);

    // Enforce travel buffers (15 min same zone / 40 min cross-zone) and working rules.
    const { computeAvailability } = await import("./availability.server");
    const avail = await computeAvailability(db, zone.id, duration, { workspaceId: LIVE_WORKSPACE });
    if (!avail.some((d) => d.date === data.date && d.slots.includes(toTime(start))))
      return { ok: false as const, error: "Pasensya! That slot was just taken. Please pick another time." };

    const { data: customer, error: custErr } = await db
      .from("customers")
      .insert({
        workspace_id: LIVE_WORKSPACE,
        full_name: data.fullName.trim().slice(0, 120),
        mobile,
        address: data.address.trim().slice(0, 300),
        landmark: data.landmark.trim().slice(0, 200),
        access_notes: data.accessNotes.trim().slice(0, 400),
        zone_id: zone.id,
      })
      .select("id")
      .single();
    if (custErr || !customer) return { ok: false as const, error: "Could not save your details. Please try again." };

    const { data: booking, error } = await db
      .from("bookings")
      .insert({
        workspace_id: LIVE_WORKSPACE,
        customer_id: customer.id,
        zone_id: zone.id,
        service_date: data.date,
        start_time: toTime(start),
        end_time: end,
        duration_minutes: duration,
        items,
        total_php: total,
        deposit_php: payLater ? 0 : (settings?.deposit_php ?? 200),
        deposit_reference: payLater ? null : data.depositReference.slice(0, 40),
        adult_present: true,
        status: "confirmed",
      })
      .select("id,reference")
      .single();

    if (error || !booking) {
      await db.from("customers").delete().eq("id", customer.id);
      const taken = (error?.message ?? "").includes("bookings_no_overlap");
      return {
        ok: false as const,
        error: taken ? "Pasensya! That slot was just taken. Please pick another time." : "Booking failed. Please try again.",
      };
    }

    if (data.leadToken) {
      const tok = String(data.leadToken).slice(0, 40);
      await db
        .from("conversations")
        .update({ status: "booked", booking_reference: booking.reference, booked_at: new Date().toISOString() })
        .eq("lead_token", tok);
      await db.from("waitlist").update({ status: "booked" }).eq("token", tok);
    }

    try {
      const { Automator } = await import("./automations.server");
      const auto = await Automator.create(db, LIVE_WORKSPACE);
      const b = await auto.loadBooking(booking.id);
      if (b) {
        const vars = auto.bookingVars(b);
        await auto.send("confirmation", { recipient: mobile, name: data.fullName, vars, action_url: vars.link, booking_id: b.id, dedupe: `confirm:${b.id}` });
      }
    } catch (e) {
      console.error("confirmation message failed", e);
    }

    return { ok: true as const, reference: booking.reference };
  });

export const getBookingByReference = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string }) => d)
  .handler(async ({ data }): Promise<BookingSummary | null> => {
    const { adminDb } = await import("./db.server");
    const db = adminDb();
    const { data: b } = await db
      .from("bookings")
      .select(
        "reference,service_date,start_time,end_time,duration_minutes,total_php,deposit_php,status,items,zones(name),customers(full_name,address,mobile)",
      )
      .eq("workspace_id", LIVE_WORKSPACE)
      .eq("reference", data.reference.toUpperCase().trim())
      .maybeSingle();
    if (!b) return null;
    const customer = b.customers as unknown as { full_name: string; address: string; mobile: string } | null;
    return {
      reference: b.reference,
      service_date: b.service_date,
      start_time: b.start_time,
      end_time: b.end_time,
      duration_minutes: b.duration_minutes,
      total_php: b.total_php,
      deposit_php: b.deposit_php,
      status: b.status,
      items: (b.items as unknown as BookingSummary["items"]) ?? [],
      zone_name: (b.zones as unknown as { name: string } | null)?.name ?? "",
      customer_name: customer?.full_name ?? "",
      address: customer?.address ?? "",
      mobile_last4: (customer?.mobile ?? "").slice(-4),
    };
  });

/** Cancelling requires the reference plus the last 4 digits of the mobile used. */
export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string; last4: string }) => d)
  .handler(async ({ data }) => {
    const { adminDb } = await import("./db.server");
    const db = adminDb();
    const { data: b } = await db
      .from("bookings")
      .select("id,status,zone_id,service_date,start_time,customers(mobile)")
      .eq("workspace_id", LIVE_WORKSPACE)
      .eq("reference", data.reference.toUpperCase().trim())
      .maybeSingle();
    if (!b) return { ok: false as const, error: "Booking not found." };
    const mobile = (b.customers as unknown as { mobile: string } | null)?.mobile ?? "";
    if (mobile.slice(-4) !== data.last4.trim()) return { ok: false as const, error: "That doesn't match the mobile number on the booking." };
    const { error } = await db.from("bookings").update({ status: "cancelled" }).eq("id", b.id);
    if (error) return { ok: false as const, error: "Could not cancel. Please call Jun." };
    const { Automator } = await import("./automations.server");
    const auto = await Automator.create(db, LIVE_WORKSPACE);
    await auto.offerSlot(b.zone_id, b.service_date, b.start_time, `cancel:${b.id}`);
    return { ok: true as const };
  });

/** Private customer link (?t=token): state for confirm + reschedule. */
export const getManageState = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string; token: string }) => ({ reference: String(d.reference).toUpperCase().slice(0, 20), token: String(d.token ?? "").slice(0, 40) }))
  .handler(async ({ data }) => {
    if (!data.token) return null;
    const { adminDb } = await import("./db.server");
    const { getClock, manilaToDate } = await import("./automations.server");
    const db = adminDb();
    const { data: b } = await db
      .from("bookings")
      .select("id,zone_id,duration_minutes,service_date,start_time,customer_confirmed_at,deposit_forfeited,status,notes")
      .eq("workspace_id", LIVE_WORKSPACE)
      .eq("reference", data.reference)
      .eq("manage_token", data.token)
      .maybeSingle();
    if (!b) return null;
    const weather = b.status === "cancelled" && b.notes.startsWith("[weather]");
    const clock = await getClock(db, LIVE_WORKSPACE);
    const start = manilaToDate(b.service_date, toMin(b.start_time));
    return {
      zoneId: b.zone_id,
      durationMinutes: b.duration_minutes,
      confirmed: !!b.customer_confirmed_at,
      freeReschedule: weather || start.getTime() - clock.now.getTime() >= 24 * 3600_000,
      depositForfeited: b.deposit_forfeited,
      status: weather ? "confirmed" : b.status,
      weather,
    };
  });

export const confirmPresence = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string; token: string }) => ({ reference: String(d.reference).toUpperCase().slice(0, 20), token: String(d.token ?? "").slice(0, 40) }))
  .handler(async ({ data }) => {
    const { adminDb } = await import("./db.server");
    const { getClock } = await import("./automations.server");
    const db = adminDb();
    const clock = await getClock(db, LIVE_WORKSPACE);
    const { data: rows, error } = await db
      .from("bookings")
      .update({ customer_confirmed_at: clock.now.toISOString(), at_risk: false })
      .eq("workspace_id", LIVE_WORKSPACE)
      .eq("reference", data.reference)
      .eq("manage_token", data.token)
      .select("id");
    if (error || !rows?.length) return { ok: false as const, error: "Link not valid." };
    return { ok: true as const };
  });

export const getRescheduleSlots = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string; token: string }) => ({ reference: String(d.reference).toUpperCase().slice(0, 20), token: String(d.token ?? "").slice(0, 40) }))
  .handler(async ({ data }): Promise<DayAvailability[]> => {
    const { adminDb } = await import("./db.server");
    const { computeAvailability } = await import("./availability.server");
    const db = adminDb();
    const { data: b } = await db.from("bookings").select("id,zone_id,duration_minutes").eq("workspace_id", LIVE_WORKSPACE).eq("reference", data.reference).eq("manage_token", data.token).maybeSingle();
    if (!b) return [];
    return computeAvailability(db, b.zone_id, b.duration_minutes, { excludeBookingId: b.id, workspaceId: LIVE_WORKSPACE });
  });

export const rescheduleBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string; token: string; date: string; startTime: string }) => ({
    reference: String(d.reference).toUpperCase().slice(0, 20),
    token: String(d.token ?? "").slice(0, 40),
    date: String(d.date),
    startTime: String(d.startTime),
  }))
  .handler(async ({ data }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !/^\d{2}:\d{2}/.test(data.startTime)) return { ok: false as const, error: "Pick a new time." };
    const { adminDb } = await import("./db.server");
    const { computeAvailability } = await import("./availability.server");
    const { Automator, manilaToDate } = await import("./automations.server");
    const db = adminDb();
    const { data: b } = await db
      .from("bookings")
      .select("id,zone_id,duration_minutes,service_date,start_time,status,deposit_forfeited,notes")
      .eq("workspace_id", LIVE_WORKSPACE)
      .eq("reference", data.reference)
      .eq("manage_token", data.token)
      .maybeSingle();
    const weather = !!b && b.status === "cancelled" && b.notes.startsWith("[weather]");
    if (!b || (b.status !== "confirmed" && !weather)) return { ok: false as const, error: "This booking can't be moved online. Please message Jun." };

    const avail = await computeAvailability(db, b.zone_id, b.duration_minutes, { excludeBookingId: b.id, workspaceId: LIVE_WORKSPACE });
    const slot = data.startTime.slice(0, 5) + ":00";
    if (!avail.some((d) => d.date === data.date && d.slots.includes(slot))) return { ok: false as const, error: "Pasensya! That slot is no longer available." };

    const auto = await Automator.create(db, LIVE_WORKSPACE);
    const free = weather || manilaToDate(b.service_date, toMin(b.start_time)).getTime() - auto.clock.now.getTime() >= 24 * 3600_000;
    const start = toMin(slot);
    const { error } = await db
      .from("bookings")
      .update({
        service_date: data.date,
        start_time: toTime(start),
        end_time: toTime(start + b.duration_minutes),
        customer_confirmed_at: null,
        at_risk: false,
        deposit_forfeited: b.deposit_forfeited || !free,
        ...(weather ? { status: "confirmed", notes: b.notes.replace("[weather]", "[weather-rebooked]") } : {}),
      })
      .eq("id", b.id);
    if (error) {
      const taken = error.message.includes("bookings_no_overlap");
      return { ok: false as const, error: taken ? "Pasensya! That slot was just taken." : "Could not move the booking." };
    }
    const nb = await auto.loadBooking(b.id);
    if (nb) {
      const c = nb.customers as unknown as { full_name: string; mobile: string };
      const vars = auto.bookingVars(nb);
      await auto.send("reschedule", {
        recipient: c.mobile,
        name: c.full_name,
        vars: { ...vars, fee_note: free ? "No fee — salamat for the heads-up!" : "Since this was within 24 hours, the deposit is forfeited." },
        action_url: vars.link,
        booking_id: b.id,
        dedupe: `resched:${b.id}:${data.date}:${slot}`,
      });
    }
    if (!weather) await auto.offerSlot(b.zone_id, b.service_date, b.start_time, `resched:${b.id}:${b.service_date}:${b.start_time}`);
    return { ok: true as const, depositForfeited: !free };
  });

/** Public: join the waitlist for a zone (used when slots are tight, e.g. peak season). */
export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((d: { fullName: string; mobile: string; zoneId: string; serviceSlug?: string; units?: number }) => ({
    fullName: String(d.fullName ?? "").trim().slice(0, 120),
    mobile: String(d.mobile ?? "").replace(/[\s-]/g, ""),
    zoneId: String(d.zoneId ?? ""),
    serviceSlug: d.serviceSlug ? String(d.serviceSlug).slice(0, 40) : null,
    units: Math.max(1, Math.min(10, Math.round(Number(d.units) || 1))),
  }))
  .handler(async ({ data }) => {
    if (!data.fullName) return { ok: false as const, error: "Please enter your name." };
    if (!/^09\d{9}$/.test(data.mobile)) return { ok: false as const, error: "Please enter a valid mobile number (09XXXXXXXXX)." };
    const { adminDb } = await import("./db.server");
    const db = adminDb();
    const { error } = await db.from("waitlist").insert({
      workspace_id: LIVE_WORKSPACE,
      full_name: data.fullName,
      mobile: data.mobile,
      zone_id: data.zoneId,
      service_slug: data.serviceSlug,
      units: data.units,
    });
    if (error) return { ok: false as const, error: "Could not join the waitlist. Please try again." };
    return { ok: true as const };
  });

/** Secure booking lookup requiring both the reference and full mobile number. */
export const findBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string; mobile: string }) => ({
    reference: String(d.reference ?? "").toUpperCase().trim().slice(0, 20),
    mobile: String(d.mobile ?? "").replace(/[\s-]/g, "").slice(0, 11),
  }))
  .handler(async ({ data }) => {
    if (!/^BGN-\d+$/i.test(data.reference) || !/^09\d{9}$/.test(data.mobile)) return null;
    const { adminDb } = await import("./db.server");
    const { data: booking } = await adminDb()
      .from("bookings")
      .select("reference,manage_token,customers!inner(mobile)")
      .eq("workspace_id", LIVE_WORKSPACE)
      .eq("reference", data.reference)
      .eq("customers.mobile", data.mobile)
      .maybeSingle();
    return booking ? { reference: booking.reference, token: booking.manage_token } : null;
  });
