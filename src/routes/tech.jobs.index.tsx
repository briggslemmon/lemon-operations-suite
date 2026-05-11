import { createFileRoute, Link } from "@tanstack/react-router";
import { JOBS } from "@/lib/mock-data";
import { Pill, money } from "@/components/ui-bits";
import { MapPin, Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/tech/jobs/")({
  component: JobsList,
});

function JobsList() {
  const grouped = JOBS.reduce<Record<string, typeof JOBS>>((acc, j) => {
    const k = new Date(j.scheduledAt).toDateString();
    (acc[k] ||= []).push(j);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
      <p className="text-sm text-muted-foreground mt-1">Your assigned work, in order.</p>

      <div className="mt-5 grid gap-5">
        {Object.entries(grouped).map(([day, jobs]) => (
          <div key={day}>
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2 font-medium">
              {new Date(day).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </div>
            <div className="grid gap-2.5">
              {jobs.map((j) => (
                <Link
                  key={j.id}
                  to="/tech/jobs/$jobId"
                  params={{ jobId: j.id }}
                  className="surface-card p-4 flex items-center gap-4 hover:border-[color:var(--gold)]/40 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{j.customer}</span>
                      <Pill tone={j.status === "complete" ? "success" : "default"}>{j.status.replace("_", " ")}</Pill>
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3" /> {j.address}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {new Date(j.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                      <span>{j.estMinutes}m</span>
                      <span className="text-gold font-medium">{money(j.baseQuote)}</span>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
