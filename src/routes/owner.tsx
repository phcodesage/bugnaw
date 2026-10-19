import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, useReducedMotion } from "framer-motion";
import loginImage from "@/assets/jun-owner-signin.jpg";
import junPortrait from "@/assets/portraits/jun.jpg";
import { BrandMark, Portrait } from "@/components/BugnawUI";

export const Route = createFileRoute("/owner")({
  validateSearch: z.object({ demo: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Owner sign in — Bugnaw Aircon Care" },
      { name: "description", content: "Jun's private dashboard for today's aircon jobs, route order and schedule settings." },
      { property: "og:title", content: "Owner sign in — Bugnaw Aircon Care" },
      { property: "og:description", content: "Jun's private dashboard for today's aircon jobs and schedule." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerAuth,
});

function OwnerAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { demo } = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(demo ? "demo@bugnaw.app" : "");
  const [password, setPassword] = useState(demo ? "BugnawDemo2026!" : "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const reduced = useReducedMotion();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        // Demo: wait for the sandbox (and any daily refresh) to be ready before opening Today.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        try { await (supabase.rpc as any)("ensure_demo_fresh"); } catch { /* not the demo */ }
        queryClient.removeQueries();
        await navigate({ to: "/today" });
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/today` },
      });
      if (error) setError(error.message);
      else if (data.session) await navigate({ to: "/today" });
      else setNotice("Account created. Check your email to confirm, then sign in.");
    }
    setBusy(false);
  }

  return (
    <main className="app-shell grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-lp-ink lg:block">
        <img src={loginImage} alt="Jun cleaning an aircon in a Cebu home" className="absolute inset-0 h-full w-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-lp-ink/45" />
        <div className="relative flex h-full flex-col justify-between p-10"><div className="flex items-center justify-between"><Link to="/" className="inline-flex min-h-11 items-center"><BrandMark light /></Link><Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium text-frostwhite/75 underline-offset-4 hover:text-frostwhite hover:underline">← Back to home</Link></div><blockquote className="max-w-md font-oswald text-4xl font-semibold leading-tight text-frostwhite">“Every message answered. Every day planned. I just focus on the work.”<footer className="mt-5 flex items-center gap-3 font-inter text-sm font-normal"><Portrait src={junPortrait} name="Jun Villanueva" className="h-12 w-12 ring-lp-ink" /><span>Jun Villanueva<br/><span className="text-frostwhite/60">Owner & technician</span></span></footer></blockquote></div>
      </section>
      <motion.section initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md"><div className="mb-10 flex flex-col items-start gap-3 lg:hidden"><Link to="/" className="inline-flex min-h-11 items-center"><BrandMark /></Link><Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium text-lp-muted underline-offset-4 hover:text-lp-ink hover:underline">← Back to home</Link></div><p className="app-eyebrow"><span className="app-eyebrow-line" />Owner workspace</p>
      <form
        onSubmit={submit}
        className="mt-4 rounded-2xl bg-card p-6 shadow-lift sm:p-8"
      >
        <h1 className="font-oswald text-4xl font-bold uppercase">Jun's dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {demo ? "Interactive demo — try anything, then reset." : mode === "in" ? "Sign in to see today's jobs." : "Create the owner account."}
        </p>

        {demo && <p className="mt-4 rounded-xl bg-lp-blue/10 px-4 py-3 text-sm text-lp-blue">Demo email and password are ready. Just tap sign in.</p>}

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="tap" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tap"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        {notice && <p className="mt-4 text-sm text-success">{notice}</p>}

        <Button type="submit" disabled={busy} className="tap mt-6 w-full text-base">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </Button>

        {!demo && <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 w-full text-sm text-muted-foreground underline underline-offset-4"
        >
          {mode === "in" ? "First time? Create the owner account" : "Already have an account? Sign in"}
        </button>}
      </form></div></motion.section>
    </main>
  );
}
