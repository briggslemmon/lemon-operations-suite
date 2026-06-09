import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSession } from "@/lib/role";
import { useCompletedJobs, payForTech, startOfMonth, topPerformers } from "@/lib/completed";
import { money, money2, SectionTitle } from "@/components/ui-bits";
import { Leaderboard } from "@/components/Charts";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/owner/team")({
  component: TeamPage,
});

function TeamPage() {
  const { listAccounts } = useSession();
  const jobs = useCompletedJobs();
  const techs = listAccounts().filter((a) => a.role === "tech");
  const monthStart = startOfMonth();
  const performers = useMemo(() => topPerformers(jobs, monthStart), [jobs]);

  const leaderRows = performers.map((p) => {
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
      <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
      <p className="text-sm text-muted-foreground mt-1">Performance this month for every technician.</p>

      <SectionTitle title="Leaderboard · revenue this month" action={<Trophy className="size-4 text-gold" />} />
      <div className="surface-card p-4">
        {leaderRows.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-3">No completed jobs this month yet.</div>
        ) : (
          <Leaderboard rows={leaderRows} format={(v) => money(v)} />
        )}
      </div>

      <SectionTitle title="All technicians" />
      <div className="grid gap-3">
        {techs.length === 0 && (
          <div className="surface-card p-6 text-center text-sm text-muted-foreground">No technicians yet.</div>
        )}
        {techs.map((t) => {
          const name = `${t.firstName} ${t.lastName}`.trim();
          const m = payForTech(jobs, name, monthStart);
          const all = payForTech(jobs, name);
          return (
            <div key={t.id} className="surface-card p-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-secondary border border-border grid place-items-center overflow-hidden">
                  {t.avatar?.startsWith("data:") ? <img src={t.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">{t.avatar}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground">{t.phone} · @{t.username}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{money(m.total)}</div>
                  <div className="text-[11px] text-muted-foreground">this month</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                <Cell label="Jobs" value={String(m.jobs)} />
                <Cell label="Hours" value={`${m.hours.toFixed(1)}`} />
                <Cell label="Hourly" value={money2(m.hourly)} />
                <Cell label="Tips" value={money(m.tips)} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-center">
                <Cell label="Owed" value={money(all.owed)} accent />
                <Cell label="Paid (all-time)" value={money(all.paid)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border border-border bg-secondary/40 px-2 py-2 ${accent ? "ring-1 ring-[color:var(--gold)]/40" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
