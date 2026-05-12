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
      className={`flex items-center justify-between gap-2 px-2 h-6 text-[10px] uppercase tracking-[0.18em] transition-opacity ${
        running ? "opacity-100" : "opacity-40 hover:opacity-70"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`relative inline-flex size-1.5 rounded-full ${
            running ? "bg-[color:var(--gold)]" : paused ? "bg-muted-foreground" : "bg-border"
          }`}
        >
          {running && (
            <span className="absolute inset-0 rounded-full bg-[color:var(--gold)] animate-ping opacity-60" />
          )}
        </span>
        <span className={running ? "text-gold font-medium" : "text-muted-foreground"}>{label}</span>
      </div>
      {(running || paused) && (
        <span className="tabular-nums text-muted-foreground tracking-normal text-[11px] normal-case">
          {fmt(elapsed)}
        </span>
      )}
    </div>
  );
}
