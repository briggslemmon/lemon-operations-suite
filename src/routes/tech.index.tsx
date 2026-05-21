import { createFileRoute, Link } from "@tanstack/react-router";
import { calcWeeklyPay } from "@/lib/mock-data";
import { useJobs, isUnassigned } from "@/lib/store";
import { useSession } from "@/lib/role";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StatCard, SectionTitle, GoldButton, GhostButton, Pill, money, money2 } from "@/components/ui-bits";
import { Play, Pause, Square, MapPin, Clock, ArrowRight, DollarSign, TrendingUp, Sparkles, Bell } from "lucide-react";

export const Route = createFileRoute("/tech/")({
  component: TechHome,
});

type ClockState = { startedAt: number | null; accumulated: number; running: boolean };

function fmt(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

function TechHome() {
  const { user } = useSession();
  const jobs = useJobs();
  const [clock, setClock] = useState<ClockState>({ startedAt: null, accumulated: 0, running: false });
  const [tick, setTick] = useState(0);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!clock.running) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [clock.running]);

  const elapsed =
    clock.accumulated +
    (clock.running && clock.startedAt ? (Date.now() - clock.startedAt) / 1000 : 0);

  const todayJobs = jobs.filter((j) => {
    if (j.tech !== user?.name) return false;
    const d = new Date(j.scheduledAt);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });

  // Notify on first load if there are jobs today
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

  const myJobsCount = jobs.filter((j) => j.tech === user?.name).length;
  const openCount = jobs.filter(isUnassigned).length;

  const pay = calcWeeklyPay({
    hours: 31,
    jobs: 11,
    baseRevenue: 4820,
    upsellRevenue: 940,
    tips: 145,
  });

  const start = () => setClock({ startedAt: Date.now(), accumulated: clock.accumulated, running: true });
  const pause = () =>
    setClock((c) => ({
      startedAt: null,
      accumulated: c.accumulated + (c.startedAt ? (Date.now() - c.startedAt) / 1000 : 0),
      running: false,
    }));
  const stop = () => setClock({ startedAt: null, accumulated: 0, running: false });

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
          hint={pay.guaranteeAdjustment > 0 ? `+${money(pay.guaranteeAdjustment)} guarantee` : "Above $15 min"}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard label="Jobs this week" value={pay.jobs} hint="Completed" />
        <StatCard label="Hours worked" value={`${pay.hours}h`} hint="This week" icon={<Clock className="size-4" />} />
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
