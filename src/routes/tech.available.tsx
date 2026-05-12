import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useJobs, claimJob, isUnassigned } from "@/lib/store";
import { useSession } from "@/lib/role";
import { Pill, money, GoldButton } from "@/components/ui-bits";
import { MapPin, Clock, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tech/available")({
  component: Available,
});

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function Available() {
  const jobs = useJobs();
  const { user } = useSession();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState<Date>(startOfMonth(today));
  const [selected, setSelected] = useState<Date>(today);

  const open = jobs.filter(isUnassigned);

  const jobsByDay = useMemo(() => {
    const m = new Map<string, typeof open>();
    open.forEach((j) => {
      const d = new Date(j.scheduledAt);
      const key = d.toDateString();
      const arr = m.get(key) || [];
      arr.push(j);
      m.set(key, arr);
    });
    return m;
  }, [open]);

  const claim = (id: string, customer: string) => {
    if (!user) return;
    claimJob(id, user.name);
    toast.success(`Claimed ${customer}`, { description: "Owner has been notified." });
  };

  // Build calendar grid (6 weeks)
  const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const gridStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - firstWeekday);
  const days: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedJobs = (jobsByDay.get(selected.toDateString()) || []).sort(
    (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Available jobs</h1>
      <p className="text-sm text-muted-foreground mt-1">Tap a day to see open jobs.</p>

      <div className="surface-card p-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-1.5 rounded-md hover:bg-accent"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-semibold">{monthLabel}</div>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-1.5 rounded-md hover:bg-accent"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-muted-foreground text-center mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = sameDay(d, today);
            const isSel = sameDay(d, selected);
            const count = (jobsByDay.get(d.toDateString()) || []).length;
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={[
                  "aspect-square rounded-md flex flex-col items-center justify-center text-sm relative transition-colors",
                  inMonth ? "text-foreground" : "text-muted-foreground/40",
                  isSel
                    ? "bg-gold text-background font-semibold"
                    : isToday
                      ? "bg-accent"
                      : "hover:bg-accent/60",
                ].join(" ")}
              >
                <span>{d.getDate()}</span>
                {count > 0 && (
                  <span
                    className={[
                      "mt-0.5 h-1 w-1 rounded-full",
                      isSel ? "bg-background" : "bg-gold",
                    ].join(" ")}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2 font-medium">
          {selected.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </div>

        {selectedJobs.length === 0 ? (
          <div className="surface-card p-6 text-center text-sm text-muted-foreground">
            No open jobs on this day.
          </div>
        ) : (
          <div className="grid gap-2.5">
            {selectedJobs.map((j) => (
              <div key={j.id} className="surface-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{j.customer}</div>
                  <Pill tone="gold">Open</Pill>
                </div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                  <MapPin className="size-3" /> {j.address}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(j.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                  <span className="text-gold font-semibold">{money(j.baseQuote)}</span>
                </div>
                <div className="mt-3">
                  <GoldButton full onClick={() => claim(j.id, j.customer)}>
                    <Check className="size-4" /> Claim job
                  </GoldButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
