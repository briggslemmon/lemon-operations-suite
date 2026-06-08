import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/role";
import { useCompletedJobs, payForTech, startOfWeek } from "@/lib/completed";
import { StatCard, SectionTitle, money, money2 } from "@/components/ui-bits";

export const Route = createFileRoute("/tech/payroll")({
  component: TechPayroll,
});

function startOfWeekOffset(weeksAgo: number) {
  const d = startOfWeek();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d;
}
function endOfWeek(weekStart: Date) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7);
  d.setMilliseconds(-1);
  return d;
}

function TechPayroll() {
  const { user } = useSession();
  const jobs = useCompletedJobs();
  const name = user?.name ?? "";

  const week0 = startOfWeekOffset(0);
  const current = payForTech(jobs, name, week0, endOfWeek(week0));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My pay</h1>
      <p className="text-sm text-muted-foreground mt-1">Your hours, commissions, bonuses & tips.</p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <StatCard label="This week" value={money(current.total)} hint={`${current.hours.toFixed(1)} hrs · ${current.jobs} jobs`} accent />
        <StatCard label="Hourly avg" value={money2(current.hourly)} hint={current.hourly < 15 ? "Below guarantee" : "On track"} />
        <StatCard label="Total tips" value={money(current.tips)} hint="This week" />
        <StatCard label="Upsell bonus" value={money(current.upsellBonus)} hint="20% of upsells" />
      </div>

      <SectionTitle title="Breakdown — this week" />
      <div className="surface-card p-4 grid gap-2.5 text-sm">
        <Row k="Base revenue (your share)" v={money2(current.base)} />
        <Row k="Upsell revenue (your share)" v={money2(current.upsell)} />
        <Row k="Commission" v={money2(current.commission)} />
        <Row k="Upsell bonus (20%)" v={money2(current.upsellBonus)} />
        <Row k="Tips" v={money2(current.tips)} />
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-medium">Total</span>
          <span className="font-semibold gold-gradient-text text-lg">{money2(current.total)}</span>
        </div>
      </div>

      <SectionTitle title="History" />
      <div className="grid gap-2.5">
        {[0, 1, 2].map((wAgo) => {
          const ws = startOfWeekOffset(wAgo);
          const p = payForTech(jobs, name, ws, endOfWeek(ws));
          const label = wAgo === 0 ? "This week" : wAgo === 1 ? "Last week" : `${wAgo} weeks ago`;
          return (
            <div key={wAgo} className="surface-card p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{p.hours.toFixed(1)} hrs · {p.jobs} jobs · {money2(p.hourly)}/hr</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{money(p.total)}</div>
                <div className="text-[11px] text-muted-foreground">+{money(p.upsellBonus)} bonus</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={muted ? "text-muted-foreground" : "font-medium"}>{v}</span>
    </div>
  );
}
