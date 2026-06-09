import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  useCompletedJobs,
  revenueInRange,
  topPerformers,
  startOfWeek,
  startOfMonth,
  startOfYear,
  payForTech,
  payForSalesman,
  ownerCut,
  revenueByDay,
  revenueByMonth,
} from "@/lib/completed";
import { useSession } from "@/lib/role";
import { SectionTitle, money, GoldButton } from "@/components/ui-bits";
import { BarChart, Sparkline, Donut, Leaderboard } from "@/components/Charts";
import { ClipboardPlus, MessageSquare, TrendingUp, Briefcase, DollarSign } from "lucide-react";
import { recentSMS } from "@/lib/notifications";

export const Route = createFileRoute("/owner/")({
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { user, listAccounts } = useSession();
  const jobs = useCompletedJobs();
  const techs = listAccounts().filter((a) => a.role === "tech");
  const now = new Date();

  const week = useMemo(() => revenueInRange(jobs, startOfWeek(now)), [jobs]);
  const month = useMemo(() => revenueInRange(jobs, startOfMonth(now)), [jobs]);
  const year = useMemo(() => revenueInRange(jobs, startOfYear(now)), [jobs]);
  const performers = useMemo(() => topPerformers(jobs, startOfMonth(now)), [jobs]);
  const dailyRev = useMemo(() => revenueByDay(jobs, 14), [jobs]);
  const monthlyRev = useMemo(() => revenueByMonth(jobs, 6), [jobs]);

  const { totalOwedTech, totalPaidTech, totalOwedSales, totalPaidSales, ownerEarnings } = useMemo(() => {
    let totalOwedTech = 0,
      totalPaidTech = 0,
      totalOwedSales = 0,
      totalPaidSales = 0,
      ownerEarnings = 0;
    for (const a of techs) {
      const p = payForTech(jobs, `${a.firstName} ${a.lastName}`.trim());
      totalOwedTech += p.owed;
      totalPaidTech += p.paid;
    }
    const salesmenSet = new Set<string>();
    jobs.forEach((j) => (j.salesmen ?? []).forEach((n) => salesmenSet.add(n)));
    salesmenSet.forEach((n) => {
      const p = payForSalesman(jobs, n);
      totalOwedSales += p.owed;
      totalPaidSales += p.paid;
    });
    for (const j of jobs) ownerEarnings += ownerCut(j);
    return { totalOwedTech, totalPaidTech, totalOwedSales, totalPaidSales, ownerEarnings };
  }, [jobs, techs]);

  const totalOwed = totalOwedTech + totalOwedSales;
  const totalPaid = totalPaidTech + totalPaidSales;

  const sms = recentSMS(5);

  const leaderRows = performers.slice(0, 5).map((p) => {
    const acct = techs.find((t) => `${t.firstName} ${t.lastName}`.trim() === p.tech);
    return {
      label: p.tech,
      value: p.revenue,
      sub: `${p.jobs} jobs · ${p.hours.toFixed(1)} hr`,
      avatar: (
        <div className="size-8 rounded-full bg-secondary border border-border grid place-items-center overflow-hidden shrink-0">
          {acct?.avatar?.startsWith("data:") ? (
            <img src={acct.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{acct?.avatar ?? "🙂"}</span>
          )}
        </div>
      ),
    };
  });

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Welcome back, <span className="gold-gradient-text">{user?.name.split(" ")[0]}</span>
          </h1>
        </div>
        <Link to="/owner/intake">
          <GoldButton>
            <ClipboardPlus className="size-4" /> Log job
          </GoldButton>
        </Link>
      </div>

      {/* Hero: revenue trend */}
      <div className="surface-card p-5 mt-5 overflow-hidden">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Revenue · this month</div>
            <div className="mt-1 text-3xl font-semibold gold-gradient-text">{money(month.revenue)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {month.count} jobs · {money(week.revenue)} this week
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Year to date</div>
            <div className="text-lg font-semibold mt-1">{money(year.revenue)}</div>
            <div className="text-[11px] text-muted-foreground">{year.count} jobs</div>
          </div>
        </div>
        <div className="mt-4 -mx-1">
          <Sparkline data={dailyRev.map((d) => d.revenue)} height={70} />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 text-center">
          Last 14 days
        </div>
      </div>

      {/* Monthly bars + Owner cut donut */}
      <div className="grid md:grid-cols-2 gap-3 mt-3">
        <div className="surface-card p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="size-3.5" /> Last 6 months
          </div>
          <div className="mt-3">
            <BarChart
              data={monthlyRev.map((m) => ({ label: m.label, value: m.revenue }))}
              format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`)}
              accent
            />
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col items-center justify-center">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground self-start flex items-center gap-1.5">
            <DollarSign className="size-3.5" /> Where the money goes
          </div>
          <div className="mt-2">
            <Donut
              segments={[
                { value: Math.max(0, ownerEarnings), color: "oklch(0.82 0.16 90)", label: "Owner" },
                { value: totalPaidTech + totalOwedTech, color: "oklch(0.6 0.14 230)", label: "Techs" },
                { value: totalPaidSales + totalOwedSales, color: "oklch(0.65 0.18 25)", label: "Sales" },
              ]}
              label={money(year.revenue + year.tips)}
              sublabel="YTD payout"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 w-full text-center text-[10px]">
            <LegendDot color="oklch(0.82 0.16 90)" label="Owner" value={money(ownerEarnings)} />
            <LegendDot color="oklch(0.6 0.14 230)" label="Techs" value={money(totalPaidTech + totalOwedTech)} />
            <LegendDot color="oklch(0.65 0.18 25)" label="Sales" value={money(totalPaidSales + totalOwedSales)} />
          </div>
        </div>
      </div>

      {/* Owed vs paid */}
      <div className="surface-card p-5 mt-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
          <Briefcase className="size-3.5" /> Payroll status
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Owed</span>
              <span className="font-semibold">{money(totalOwed)}</span>
            </div>
            <Bar value={totalOwed} max={Math.max(1, totalOwed + totalPaid)} tone="danger" />
            <div className="text-[10px] text-muted-foreground mt-1">
              Techs {money(totalOwedTech)} · Sales {money(totalOwedSales)}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-semibold">{money(totalPaid)}</span>
            </div>
            <Bar value={totalPaid} max={Math.max(1, totalOwed + totalPaid)} tone="success" />
            <div className="text-[10px] text-muted-foreground mt-1">
              Techs {money(totalPaidTech)} · Sales {money(totalPaidSales)}
            </div>
          </div>
        </div>
      </div>

      {/* Daily jobs chart */}
      <SectionTitle title="Jobs · last 14 days" />
      <div className="surface-card p-4">
        <BarChart
          data={dailyRev.map((d) => ({ label: d.label[0], value: d.count }))}
          format={(v) => String(v)}
          height={120}
        />
      </div>

      <SectionTitle
        title="Top performers · this month"
        action={
          <Link to="/owner/team" className="text-xs text-gold font-medium">
            View team →
          </Link>
        }
      />
      <div className="surface-card p-4">
        {leaderRows.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            No completed jobs yet this month.{" "}
            <Link to="/owner/intake" className="text-gold font-medium">Log one</Link>.
          </div>
        ) : (
          <Leaderboard rows={leaderRows} format={(v) => money(v)} />
        )}
      </div>

      <SectionTitle title="Recent notifications" />
      <div className="surface-card p-4 grid gap-2 text-sm">
        {sms.length === 0 && <div className="text-muted-foreground text-center py-2">No SMS sent yet.</div>}
        {sms.map((s) => (
          <div key={s.id} className="flex gap-3 items-start">
            <MessageSquare className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">
                To {s.toName || s.to} ·{" "}
                {new Date(s.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="text-sm">{s.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <span className="size-2 rounded-full" style={{ background: color }} />
        <span className="uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

function Bar({ value, max, tone }: { value: number; max: number; tone: "success" | "danger" }) {
  const pct = (value / max) * 100;
  const cls =
    tone === "success"
      ? "bg-gradient-to-r from-emerald-500/70 to-emerald-400"
      : "bg-gradient-to-r from-rose-500/70 to-rose-400";
  return (
    <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
      <div className={`h-full ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
