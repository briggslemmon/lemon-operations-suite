import { useEffect, useState } from "react";

type ClockState = { startedAt: number | null; accumulated: number; running: boolean };

const STORAGE_KEY = "lemmon.timeclock.v1";

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

  const running = clock.running;
  const paused = !running && clock.accumulated > 0;
  const label = running ? "On the clock" : paused ? "Paused" : "Off the clock";

  return (
    <div
      aria-live="polite"
      className={`relative w-full flex items-center justify-between gap-2 px-4 h-7 mb-3 rounded-md text-[11px] uppercase tracking-[0.2em] transition-all ${
        running
          ? "bg-gradient-to-r from-[oklch(0.82_0.16_92)] to-[oklch(0.7_0.18_88)] text-[oklch(0.16_0.01_90)] font-semibold shadow-[var(--shadow-glow)]"
          : paused
            ? "bg-secondary/60 border border-border text-muted-foreground"
            : "bg-transparent text-muted-foreground/50 opacity-50 hover:opacity-80"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`relative inline-flex size-1.5 rounded-full ${
            running ? "bg-[oklch(0.16_0.01_90)]" : paused ? "bg-muted-foreground" : "bg-border"
          }`}
        >
          {running && (
            <span className="absolute inset-0 rounded-full bg-[oklch(0.16_0.01_90)] animate-ping opacity-60" />
          )}
        </span>
        <span>{label}</span>
      </div>
      {(running || paused) && (
        <span className="tabular-nums tracking-normal text-[12px] normal-case font-medium">
          {fmt(elapsed)}
        </span>
      )}
    </div>
  );
}
