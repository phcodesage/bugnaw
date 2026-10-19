import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, FastForward, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";

import { getSimClock, setSimClock, type ClockPreset } from "@/lib/automation.functions";

const PRESETS: Array<{ preset: ClockPreset; label: string }> = [
  { preset: "tomorrow_18", label: "Tomorrow 6 PM" },
  { preset: "tomorrow_08", label: "Next day 8 AM" },
  { preset: "next_job_minus2h", label: "2h before next job" },
  { preset: "plus1h", label: "+1 hour" },
  { preset: "plus1d", label: "+1 day" },
  { preset: "plus6m", label: "+6 months" },
];

export function simLabel(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TimeMachine() {
  const qc = useQueryClient();
  const clock = useQuery({ queryKey: ["sim-clock"], queryFn: () => getSimClock() });
  const [note, setNote] = useState("");
  const move = useMutation({
    mutationFn: (preset: ClockPreset) => setSimClock({ data: { preset } }),
    onSuccess: (r) => {
      setNote(r.ok ? `${r.sent} automatic message${r.sent === 1 ? "" : "s"} triggered.` : r.error);
      qc.invalidateQueries();
    },
  });
  const simulated = (clock.data?.offsetMinutes ?? 0) !== 0;

  return (
    <div className="app-card border-dashed border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {simulated ? "Demo time" : "Current time"}
            </p>
            <p className="font-display text-lg font-semibold">{clock.data ? simLabel(clock.data.now) : "…"}</p>
          </div>
        </div>
        {simulated && (
          <button
            type="button"
            disabled={move.isPending}
            className="tap flex items-center gap-1 rounded-full px-3 text-sm text-muted-foreground disabled:opacity-50"
            onClick={() => move.mutate("reset")}
          >
            {move.isPending && move.variables === "reset" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {move.isPending && move.variables === "reset" ? "Going back…" : "Back to now"}
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESETS.map((p) => (
          <button
            key={p.preset}
            type="button"
            disabled={move.isPending}
            onClick={() => move.mutate(p.preset)}
            className="tap flex items-center justify-center gap-1.5 rounded-full border border-lp-ink/10 bg-card px-3 text-sm font-medium hover:border-primary disabled:opacity-50"
          >
            {move.isPending && move.variables === p.preset ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FastForward className="h-4 w-4 text-primary" />
            )}
            {p.label}
          </button>
        ))}
      </div>
      {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}
