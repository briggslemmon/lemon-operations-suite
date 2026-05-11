import { createFileRoute } from "@tanstack/react-router";
import { JOBS, TECHS } from "@/lib/mock-data";
import { Pill, money } from "@/components/ui-bits";
import { Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/admin/schedule")({
  component: Schedule,
});

function Schedule() {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
      <p className="text-sm text-muted-foreground mt-1">Drag-and-drop board · technician routes.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
        {days.map((d, i) => {
          const dayJobs = JOBS.filter((j) => new Date(j.scheduledAt).toDateString() === d.toDateString());
          return (
            <div key={i} className="snap-start shrink-0 w-72 surface-card p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-lg font-semibold">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <Pill tone="gold">{dayJobs.length} jobs</Pill>
              </div>

              <div className="grid gap-2">
                {dayJobs.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                    Drop jobs here
                  </div>
                )}
                {dayJobs.map((j) => (
                  <div key={j.id} className="rounded-lg border border-border p-3 bg-background/40 hover:border-[color:var(--gold)]/40 transition cursor-grab">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium">{new Date(j.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                      <div className="text-xs text-gold font-semibold">{money(j.baseQuote)}</div>
                    </div>
                    <div className="text-sm font-medium mt-1 truncate">{j.customer}</div>
                    <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3" /> {j.address}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="size-3" /> {j.estMinutes}m · {j.tech.split(" ")[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 surface-card p-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">Technicians</div>
        <div className="flex flex-wrap gap-2">
          {TECHS.map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-full bg-secondary text-sm">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
