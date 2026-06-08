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

function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function Available() {
  const jobs = useJobs();
  const { user } = useSession();
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(today));
  const [selected, setSelected] = useState<Date>(today);

  const open = jobs.filter(isUnassigned);

  const jobsByDay = useMemo(() => {
    const m = new Map<string, typeof open>();
    open.forEach((j) => {
      const key = new Date(j.scheduledAt).toDateString();
      const arr = m.get(key) || [];
      arr.push(j);
      m.set(key, arr);
    });
    return m;
  }, [open]);

  const claim = (id: string, customer: string) => {
    if (!user) return;
    claimJob(id, user.name);
    // Fake SMS confirmation to the technician.
    import("@/lib/notifications").then(({ sendSMS }) => {
      sendSMS({ to: user.phone, toName: user.name.split(" ")[0], body: `Lemmon: You signed up for the ${customer} job. Details in the app.` });
    });
  };

  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const selectedJobs = (jobsByDay.get(selected.toDateString()) || []).sort(
    (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt),
  );

  const shiftWeek = (dir: number) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + dir * 7);
    setWeekStart(d);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Available jobs</h1>
      <p className="text-sm text-muted-foreground mt-1">Tap a day to see open jobs.</p>

      <div className="surface-card p-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-1.5 rounded-md hover:bg-accent"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-semibold">{weekLabel}</div>
          <button
            onClick={() => shiftWeek(1)}
            className="p-1.5 rounded-md hover:bg-accent"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d) => {
            const isToday = sameDay(d, today);
            const isSel = sameDay(d, selected);
            const dayJobs = jobsByDay.get(d.toDateString()) || [];
            const count = dayJobs.length;
            const total = dayJobs.reduce((s, j) => s + j.baseQuote, 0);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={[
                  "rounded-lg flex flex-col items-center justify-start py-2 px-1 gap-1 transition-colors min-h-[78px]",
                  isSel
                    ? "bg-gold text-background"
                    : isToday
                      ? "bg-accent"
                      : "bg-secondary/40 hover:bg-accent/60",
                ].join(" ")}
              >
                <span className={`text-[10px] uppercase tracking-wider ${isSel ? "text-background/80" : "text-muted-foreground"}`}>
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-lg font-semibold leading-none">{d.getDate()}</span>
                {count > 0 ? (
                  <>
                    <span
                      className={`mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSel ? "bg-background text-gold" : "bg-gold text-background"
                      }`}
                    >
                      {count} job{count > 1 ? "s" : ""}
                    </span>
                    <span className={`text-[10px] font-medium ${isSel ? "text-background/90" : "text-gold"}`}>
                      {money(total)}
                    </span>
                  </>
                ) : (
                  <span className={`text-[10px] mt-1 ${isSel ? "text-background/60" : "text-muted-foreground/60"}`}>—</span>
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
          <div className="grid gap-3">
            {selectedJobs.map((j) => (
              <div key={j.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold truncate">{j.customer}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                      <MapPin className="size-3" /> {j.address}
                    </div>
                  </div>
                  <Pill tone="gold">Open</Pill>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {new Date(j.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                  <span className="text-2xl font-bold text-gold">{money(j.baseQuote)}</span>
                </div>

                <div className="mt-4">
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
