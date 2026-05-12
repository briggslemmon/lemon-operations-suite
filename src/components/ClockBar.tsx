import { useEffect, useState } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";

type ClockState = { startedAt: number | null; accumulated: number; running: boolean };
type Entry = { in: number; out: number };

const STORAGE_KEY = "lemmon.timeclock.v1";
const ENTRIES_KEY = "lemmon.timeclock.entries.v1";

function fmt(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

function read(): ClockState {
  if (typeof window === "undefined") return { startedAt: null, accumulated: 0, running: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startedAt: null, accumulated: 0, running: false };
}

export function ClockBar() {
  const [clock, setClock] = useState<ClockState>(read);
  const [, setTick] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clock));
  }, [clock]);

  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setClock(read());
    };
    window.addEventListener("storage", sync);
    const poll = setInterval(() => {
      const next = read();
      setClock((cur) =>
        cur.running !== next.running ||
        cur.startedAt !== next.startedAt ||
        cur.accumulated !== next.accumulated
          ? next
          : cur,
      );
    }, 1500);
    return () => {
      window.removeEventListener("storage", sync);
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!clock.running) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [clock.running]);

  const elapsed =
    clock.accumulated +
    (clock.running && clock.startedAt ? (Date.now() - clock.startedAt) / 1000 : 0);

  const start = () =>
    setClock((c) => ({ startedAt: Date.now(), accumulated: c.accumulated, running: true }));
  const pause = () =>
    setClock((c) => ({
      startedAt: null,
      accumulated: c.accumulated + (c.startedAt ? (Date.now() - c.startedAt) / 1000 : 0),
      running: false,
    }));
  const stop = () => {
    const total =
      clock.accumulated +
      (clock.running && clock.startedAt ? (Date.now() - clock.startedAt) / 1000 : 0);
    const clockIn =
      clock.startedAt ?? (clock.accumulated > 0 ? Date.now() - clock.accumulated * 1000 : null);
    if (total > 0 && clockIn) {
      try {
        const raw = localStorage.getItem(ENTRIES_KEY);
        const prev: Entry[] = raw ? JSON.parse(raw) : [];
        const next = [{ in: clockIn, out: Date.now() }, ...prev].slice(0, 25);
        localStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
      } catch {}
    }
    setClock({ startedAt: null, accumulated: 0, running: false });
  };

  const status = clock.running ? "On the clock" : clock.accumulated > 0 ? "Paused" : "Off the clock";
  const accent = clock.running
    ? "bg-gradient-to-r from-[oklch(0.92_0.12_95)] to-[oklch(0.7_0.18_88)] text-[oklch(0.16_0.01_90)]"
    : "surface-card";

  return (
    <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${accent}`}>
      <div
        className={`size-10 rounded-lg grid place-items-center shrink-0 ${
          clock.running ? "bg-black/10" : "bg-[color:var(--gold)]/10 text-gold"
        }`}
      >
        <Clock className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-[10px] uppercase tracking-[0.16em] font-semibold ${
            clock.running ? "opacity-70" : "text-muted-foreground"
          }`}
        >
          {status}
        </div>
        <div className="text-2xl font-semibold tabular-nums tracking-tight leading-tight">
          {fmt(elapsed)}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {!clock.running ? (
          <button
            onClick={start}
            className="h-10 px-4 rounded-lg inline-flex items-center gap-1.5 text-sm font-semibold bg-[color:var(--gold)] text-[oklch(0.16_0.01_90)]"
          >
            <Play className="size-4" /> {clock.accumulated > 0 ? "Resume" : "Clock in"}
          </button>
        ) : (
          <button
            onClick={pause}
            className="h-10 px-4 rounded-lg inline-flex items-center gap-1.5 text-sm font-semibold bg-black/15 text-[oklch(0.16_0.01_90)]"
          >
            <Pause className="size-4" /> Pause
          </button>
        )}
        <button
          onClick={stop}
          disabled={!clock.running && clock.accumulated === 0}
          className={`size-10 grid place-items-center rounded-lg border disabled:opacity-40 ${
            clock.running
              ? "border-black/20 text-[oklch(0.16_0.01_90)]"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Clock out"
        >
          <Square className="size-4" />
        </button>
      </div>
    </div>
  );
}
