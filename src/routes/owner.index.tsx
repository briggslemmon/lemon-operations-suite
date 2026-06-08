import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCompletedJobs, revenueInRange, topPerformers, startOfWeek, startOfMonth, startOfYear, payForTech } from "@/lib/completed";
import { useSession } from "@/lib/role";
import { StatCard, SectionTitle, money, money2, GoldButton } from "@/components/ui-bits";
import { DollarSign, TrendingUp, Briefcase, Users, ClipboardPlus, MessageSquare } from "lucide-react";
import { recentSMS } from "@/lib/notifications";

export const Route = createFileRoute("/owner/")({
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { user, listAccounts } = useSession();
  const jobs = useCompletedJobs();
  const accounts = listAccounts().filter((a) => a.role === "tech");

  const now = new Date();
  const week = useMemo(() => revenueInRange(jobs, startOfWeek(now)), [jobs]);
  const month = useMemo(() => revenueInRange(jobs, startOfMonth(now)), [jobs]);
  const year = useMemo(() => revenueInRange(jobs, startOfYear(now)), [jobs]);

  const performers = useMemo(() => topPerformers(jobs, startOfMonth(now)), [jobs]);

  let totalOwed = 0;
  let totalPaid = 0;
  for (const a of accounts) {
    const name = `${a.firstName} ${a.lastName}`.trim();
    const p = payForTech(jobs, name);
    totalOwed += p.owed;
    totalPaid += p.paid;
  }

  const sms = recentSMS(5);

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
          <GoldButton><ClipboardPlus className="size-4" /> Log job</GoldButton>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <StatCard label="Revenue · week" value={money(week.revenue)} hint={`${week.count} job${week.count === 1 ? "" : "s"}`} icon={<DollarSign className="size-4" />} accent />
        <StatCard label="Revenue · month" value={money(month.revenue)} hint={`${month.count} jobs`} icon={<TrendingUp className="size-4" />} />
        <StatCard label="Revenue · year" value={money(year.revenue)} hint={`${year.count} jobs`} icon={<Briefcase className="size-4" />} />
        <StatCard label="Active techs" value={accounts.length} hint="On the team" icon={<Users className="size-4" />} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <StatCard label="Owed to techs" value={money(totalOwed)} hint="Unpaid commissions + tips" />
        <StatCard label="Paid out" value={money(totalPaid)} hint="All time" />
      </div>

      <SectionTitle title="Top performers · this month" action={
        <Link to="/owner/team" className="text-xs text-gold font-medium">View team →</Link>
      } />
      <div className="grid gap-2.5">
        {performers.length === 0 && (
          <div className="surface-card p-5 text-sm text-muted-foreground text-center">
            No completed jobs yet this month.{" "}
            <Link to="/owner/intake" className="text-gold font-medium">Log one</Link>.
          </div>
        )}
        {performers.map((p, i) => (
          <div key={p.tech} className="surface-card p-4 flex items-center gap-3">
            <div className="size-8 grid place-items-center rounded-full bg-secondary text-xs font-bold">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.tech}</div>
              <div className="text-xs text-muted-foreground">{p.jobs} jobs · {p.hours.toFixed(1)} hrs</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{money(p.revenue)}</div>
              <div className="text-[11px] text-muted-foreground">revenue</div>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle title="Recent notifications" />
      <div className="surface-card p-4 grid gap-2 text-sm">
        {sms.length === 0 && <div className="text-muted-foreground text-center py-2">No SMS sent yet.</div>}
        {sms.map((s) => (
          <div key={s.id} className="flex gap-3 items-start">
            <MessageSquare className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">
                To {s.toName || s.to} · {new Date(s.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="text-sm">{s.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
