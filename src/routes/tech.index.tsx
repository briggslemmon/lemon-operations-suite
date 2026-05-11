import { createFileRoute, Link } from "@tanstack/react-router";
import { JOBS, calcWeeklyPay } from "@/lib/mock-data";
import { useSession } from "@/lib/role";
import { useEffect, useState } from "react";
import { StatCard, SectionTitle, GoldButton, GhostButton, Pill, money, money2 } from "@/components/ui-bits";
import { Play, Square, MapPin, Clock, ArrowRight, DollarSign, TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/tech/")({
  component: TechHome,
});

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return "00:00:00";
  const s = Math.floor((now - startedAt) / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

function TechHome() {
  const { user } = useSession();
  const [clockedIn, setClockedIn] = useState<number | null>(null);
  const elapsed = useElapsed(clockedIn);

  const todayJobs = JOBS.filter((j) => {
    const d = new Date(j.scheduledAt);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });

  const pay = calcWeeklyPay({
    hours: 31,
    jobs: 11,
    baseRevenue: 4820,
    upsellRevenue: 940,
    tips: 145,
  });

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
        <Pill tone={clockedIn ? "gold" : "default"}>
          {clockedIn ? "On the clock" : "Off"}
        </Pill>
      </div>

      <div className="surface-card p-5 mt-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-48 rounded-full bg-[color:var(--gold)]/10 blur-3xl pointer-events-none" />
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Time clock
        </div>
        <div className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">
          {elapsed}
        </div>
        <div className="mt-4 flex gap-2">
          {!clockedIn ? (
            <GoldButton size="lg" full onClick={() => setClockedIn(Date.now())}>
              <Play className="size-4" /> Clock in
            </GoldButton>
          ) : (
            <GhostButton full onClick={() => setClockedIn(null)}>
              <Square className="size-4" /> Clock out
            </GhostButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <StatCard
          label="This week"
          value={money(pay.total)}
          hint={`${pay.hours} hrs · ${pay.jobs} jobs`}
          icon={<DollarSign className="size-4" />}
          accent
        />
        <StatCard
          label="Hourly avg"
          value={money2(pay.hourly)}
          hint={pay.guaranteeAdjustment > 0 ? `+${money(pay.guaranteeAdjustment)} guarantee` : "Above $15 min"}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Upsell bonus"
          value={money(pay.upsellBonus)}
          hint={`${money(pay.upsellRevenue)} upsold`}
          icon={<Sparkles className="size-4" />}
        />
        <StatCard
          label="Tips"
          value={money2(pay.tips)}
          hint="Paid separately"
        />
      </div>

      <SectionTitle
        title="Today's jobs"
        action={
          <Link to="/tech/jobs" className="text-xs text-gold font-medium inline-flex items-center gap-1">
            All jobs <ArrowRight className="size-3" />
          </Link>
        }
      />

      <div className="grid gap-2.5">
        {todayJobs.length === 0 && (
          <div className="surface-card p-5 text-sm text-muted-foreground text-center">
            No jobs today. Enjoy the day off.
          </div>
        )}
        {todayJobs.map((j) => (
          <Link
            key={j.id}
            to="/tech/jobs/$jobId"
            params={{ jobId: j.id }}
            className="surface-card p-4 flex items-center gap-4 hover:border-[color:var(--gold)]/40 transition"
          >
            <div className="text-center w-12 shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {new Date(j.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric" }).replace(" ", "")}
              </div>
              <div className="text-lg font-semibold leading-none mt-0.5">
                {new Date(j.scheduledAt).toLocaleTimeString("en-US", { minute: "2-digit", hour: "numeric" }).split(" ")[0].split(":")[1]}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{j.customer}</div>
              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="size-3" /> {j.address}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <Clock className="size-3" /> {j.estMinutes}m · {money(j.baseQuote)}
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
