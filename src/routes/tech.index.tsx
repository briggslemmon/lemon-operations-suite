import { createFileRoute, Link } from "@tanstack/react-router";
import { useJobs, isUnassigned } from "@/lib/store";
import { useCompletedJobs, payForTech, startOfWeek } from "@/lib/completed";
import { useSession } from "@/lib/role";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { StatCard, SectionTitle, GoldButton, GhostButton, money, money2 } from "@/components/ui-bits";
import { MapPin, Clock, ArrowRight, DollarSign, TrendingUp, Bell } from "lucide-react";

export const Route = createFileRoute("/tech/")({
  component: TechHome,
});

function TechHome() {
  const { user } = useSession();
  const jobs = useJobs();
  const completed = useCompletedJobs();
  const notifiedRef = useRef(false);

  const todayJobs = jobs.filter((j) => {
    if (j.tech !== user?.name) return false;
    const d = new Date(j.scheduledAt);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });

  useEffect(() => {
    if (notifiedRef.current || !user) return;
    if (todayJobs.length > 0) {
      notifiedRef.current = true;
      const next = todayJobs[0];
      toast(`${todayJobs.length} job${todayJobs.length > 1 ? "s" : ""} today`, {
        description: `Next: ${next.customer} at ${new Date(next.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
        icon: <Bell className="size-4" />,
      });
    }
  }, [todayJobs, user]);

  const week0 = startOfWeek();
  const weekEnd = new Date(week0); weekEnd.setDate(week0.getDate() + 7); weekEnd.setMilliseconds(-1);
  const pay = payForTech(completed, user?.name ?? "", week0, weekEnd);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Hey, <span className="gold-gradient-text">{user?.name.split(" ")[0]}</span>
          </h1>
        </div>
      </div>


      <div className="grid grid-cols-2 gap-3 mt-4">
        <StatCard
          label="This week"
          value={money(pay.total)}
          hint="Earnings"
          icon={<DollarSign className="size-4" />}
          accent
        />
        <StatCard
          label="Hourly avg"
          value={money2(pay.hourly)}
          hint={pay.hourly >= 15 ? "Above $15 min" : "Below guarantee"}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard label="Jobs this week" value={pay.jobs} hint="Completed" />
        <StatCard label="Hours worked" value={`${pay.hours.toFixed(1)}h`} hint="This week" icon={<Clock className="size-4" />} />
      </div>

      {(() => {
        const upcoming = jobs
          .filter((j) => j.tech === user?.name)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        return (
          <>
            <SectionTitle title="Upcoming jobs" />
            <div className="grid gap-2.5">
              {upcoming.length === 0 && (
                <div className="surface-card p-5 text-sm text-muted-foreground text-center">
                  No upcoming jobs. Check{" "}
                  <Link to="/tech/available" className="text-gold font-medium">available jobs</Link>{" "}
                  to claim one.
                </div>
              )}
              {upcoming.map((j) => (
                <Link
                  key={j.id}
                  to="/tech/jobs/$jobId"
                  params={{ jobId: j.id }}
                  className="surface-card p-4 flex items-center gap-4 hover:border-[color:var(--gold)]/40 transition"
                >
                  <div className="text-center w-14 shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(j.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div className="text-base font-semibold leading-tight mt-0.5">
                      {new Date(j.scheduledAt).getDate()}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(j.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{j.customer}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="size-3" /> {j.address}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{money(j.baseQuote)}</div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </>
        );
      })()}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link to="/tech/available"><GhostButton full>Browse available</GhostButton></Link>
        <Link to="/tech/calculator"><GoldButton full>Quote a job</GoldButton></Link>
      </div>
    </div>
  );
}
