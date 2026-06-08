import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Pause, Square, Clock, Trash2 } from "lucide-react";

export const Route = createFileRoute("/tech/time")({
  component: TimePage,
});

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

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function TimePage() {
  const [clock, setClock] = useState<ClockState>(() => {
    if (typeof window === "undefined") return { startedAt: null, accumulated: 0, running: false };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { startedAt: null, accumulated: 0, running: false };
  });
  const [entries, setEntries] = useState<Entry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(ENTRIES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clock));
  }, [clock]);
  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (!clock.running) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [clock.running]);

  const elapsed =
    clock.accumulated +
    (clock.running && clock.startedAt ? (Date.now() - clock.startedAt) / 1000 : 0);

  const clockIn = clock.startedAt ?? (clock.accumulated > 0 ? Date.now() - clock.accumulated * 1000 : null);

  const start = () =>
    setClock((c) => ({
      startedAt: Date.now(),
      accumulated: c.accumulated,
      running: true,
    }));
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
    if (total > 0 && clockIn) {
      setEntries((prev) => [{ in: clockIn, out: Date.now() }, ...prev].slice(0, 25));
    }
    setClock({ startedAt: null, accumulated: 0, running: false });
  };

  const [editing, setEditing] = useState<number | null>(null);
  const [editIn, setEditIn] = useState("");
  const [editOut, setEditOut] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toLocalInput(ts: number) {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function openEdit(e: Entry) {
    setEditing(e.in);
    setEditIn(toLocalInput(e.in));
    setEditOut(toLocalInput(e.out));
    setConfirmDelete(false);
  }
  function closeEdit() {
    setEditing(null);
    setConfirmDelete(false);
  }
  function saveEdit() {
    const inMs = new Date(editIn).getTime();
    const outMs = new Date(editOut).getTime();
    if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) return;
    setEntries((prev) =>
      prev.map((x) => (x.in === editing ? { in: inMs, out: outMs } : x)),
    );
    closeEdit();
  }
  function deleteEntry() {
    setEntries((prev) => prev.filter((x) => x.in !== editing));
    closeEdit();
  }

  return (
    <div>
      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Time clock</h1>
      </div>

      <div className="surface-card p-6 mt-4 text-center">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Clock className="size-3.5" /> Elapsed
        </div>
        <div className="text-5xl font-semibold tabular-nums tracking-tight mt-2 gold-gradient-text">
          {fmt(elapsed)}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5 text-left">
          <div className="rounded-lg border border-border p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Time in</div>
            <div className="text-base font-semibold mt-1">
              {clockIn ? fmtTime(clockIn) : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Time out</div>
            <div className="text-base font-semibold mt-1">
              {!clock.running && clock.accumulated === 0 && entries[0]
                ? fmtTime(entries[0].out)
                : "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          {!clock.running ? (
            <button
              onClick={start}
              className="h-11 px-5 rounded-lg inline-flex items-center gap-2 text-sm font-semibold bg-[color:var(--gold)] text-[oklch(0.16_0.01_90)]"
            >
              <Play className="size-4" /> {clock.accumulated > 0 ? "Resume" : "Clock in"}
            </button>
          ) : (
            <button
              onClick={pause}
              className="h-11 px-5 rounded-lg inline-flex items-center gap-2 text-sm font-semibold bg-secondary border border-border"
            >
              <Pause className="size-4" /> Pause
            </button>
          )}
          <button
            onClick={stop}
            disabled={!clock.running && clock.accumulated === 0}
            className="h-11 px-4 rounded-lg inline-flex items-center gap-2 text-sm font-semibold border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <Square className="size-4" /> Clock out
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
          Recent entries
        </div>
        <div className="grid gap-2">
          {entries.length === 0 && (
            <div className="surface-card p-4 text-sm text-muted-foreground text-center">
              No entries yet. Clock in to start tracking.
            </div>
          )}
          {entries.map((e, i) => {
            const dur = (e.out - e.in) / 1000;
            return (
              <div key={i} className="surface-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{fmtDate(e.in)}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtTime(e.in)} → {fmtTime(e.out)}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">{fmt(dur)}</div>
                <button
                  onClick={() => openEdit(e)}
                  className="h-8 px-3 rounded-md text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Edit
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {editing !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4"
          onClick={closeEdit}
        >
          <div
            className="surface-card p-5 w-full max-w-sm"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="text-sm font-semibold mb-3">Edit time entry</div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Time in
            </label>
            <input
              type="datetime-local"
              value={editIn}
              onChange={(ev) => setEditIn(ev.target.value)}
              className="w-full mt-1 h-10 px-3 rounded-md bg-secondary border border-border text-sm"
            />
            <label className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-3">
              Time out
            </label>
            <input
              type="datetime-local"
              value={editOut}
              onChange={(ev) => setEditOut(ev.target.value)}
              className="w-full mt-1 h-10 px-3 rounded-md bg-secondary border border-border text-sm"
            />

            <div className="flex items-center justify-between gap-2 mt-5">
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={deleteEntry}
                    className="h-9 px-3 rounded-md text-xs font-semibold bg-destructive text-destructive-foreground inline-flex items-center gap-1"
                  >
                    <Trash2 className="size-3.5" /> Confirm delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="h-9 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="h-9 px-3 rounded-md text-xs font-semibold border border-border text-muted-foreground hover:text-destructive hover:border-destructive inline-flex items-center gap-1"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              )}
              {!confirmDelete && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={closeEdit}
                    className="h-9 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="h-9 px-4 rounded-md text-xs font-semibold bg-[color:var(--gold)] text-[oklch(0.16_0.01_90)]"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
