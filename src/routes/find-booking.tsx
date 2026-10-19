import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findBooking } from "@/lib/booking.functions";

export const Route = createFileRoute("/find-booking")({
  head: () => ({ meta: [
    { title: "Find my booking — Bugnaw Aircon Care" },
    { name: "description", content: "Find a Bugnaw booking securely to reschedule or cancel." },
    { property: "og:title", content: "Find my booking — Bugnaw Aircon Care" },
    { property: "og:description", content: "Use your booking reference and mobile number to manage your appointment." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: FindBookingPage,
});

function FindBookingPage() {
  const navigate = useNavigate();
  const [reference, setReference] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const found = await findBooking({ data: { reference, mobile } });
    setBusy(false);
    if (!found) return setError("We couldn't match that reference and mobile number.");
    navigate({ to: "/booking/$reference", params: { reference: found.reference }, search: { t: found.token } });
  }
  return <main className="app-shell min-h-screen px-5 py-10"><div className="mx-auto max-w-xl"><div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><Link to="/" className="flex min-h-11 items-center gap-2 font-oswald text-2xl font-bold text-lp-ink"><Snowflake className="text-lp-blue" /> Bugnaw</Link><Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium text-lp-muted underline-offset-4 hover:text-lp-ink hover:underline">← Back to home</Link></div><div className="mt-12"><p className="inline-flex rounded-full border border-lp-blue/30 px-4 py-1.5 text-sm text-lp-blue">Manage a visit</p><h1 className="mt-5 font-oswald text-5xl font-bold text-lp-ink">Find my booking</h1><p className="mt-3 text-lp-muted">Enter the details used when you booked. We’ll open your reschedule and cancellation options.</p></div><form onSubmit={submit} className="mt-8 rounded-2xl bg-card p-6 shadow-lift"><div className="space-y-2"><Label htmlFor="ref">Booking reference</Label><Input id="ref" placeholder="BGN-2417" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} /></div><div className="mt-5 space-y-2"><Label htmlFor="mobile">Mobile number</Label><Input id="mobile" inputMode="tel" placeholder="0917 123 4567" value={mobile} onChange={(e) => setMobile(e.target.value)} /></div>{error && <p className="mt-4 text-sm text-destructive">{error}</p>}<Button type="submit" className="mt-6 w-full" disabled={busy}><Search /> {busy ? "Finding…" : "Find booking"}</Button></form></div></main>;
}