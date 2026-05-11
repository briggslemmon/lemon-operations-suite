import { createFileRoute } from "@tanstack/react-router";
import { calcWeeklyPay } from "@/lib/mock-data";
import { StatCard, SectionTitle, money, money2 } from "@/components/ui-bits";

export const Route = createFileRoute("/tech/payroll")({
  component: TechPayroll,
});

const WEEKS = [
  { label: "This week", hours: 31, jobs: 11, baseRevenue: 4820, upsellRevenue: 940, tips: 145 },
  { label: "Last week", hours: 36, jobs: 13, baseRevenue: 5410, upsellRevenue: 1180, tips: 210 },
  { label: "2 weeks ago", hours: 28, jobs: 10, baseRevenue: 3980, upsellRevenue: 620, tips: 95 },
];

function TechPayroll() {
  const current = calcWeeklyPay(WEEKS[0]);
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My pay</h1>
      <p className="text-sm text-muted-foreground mt-1">Your hours, commissions, bonuses & tips.</p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <StatCard label="This week" value={money(current.total)} hint={`${current.hours} hrs · ${current.jobs} jobs`} accent />
        <StatCard label="Hourly avg" value={money2(current.hourly)} hint={current.guaranteeAdjustment > 0 ? "Guarantee applied" : "Above $15 min"} />
        <StatCard label="Commission" value={money(current.commission)} hint="35% solo rate" />
        <StatCard label="Upsell bonus" value={money(current.upsellBonus)} hint="20% of upsells" />
      </div>

      <SectionTitle title="Breakdown — this week" />
      <div className="surface-card p-4 grid gap-2.5 text-sm">
        <Row k="Base revenue (collected)" v={money2(current.baseRevenue)} />
        <Row k="Upsell revenue" v={money2(current.upsellRevenue)} />
        <Row k="Commission (35%)" v={money2(current.commission)} />
        <Row k="Upsell bonus (20%)" v={money2(current.upsellBonus)} />
        <Row k="Guarantee adjustment" v={money2(current.guaranteeAdjustment)} muted={current.guaranteeAdjustment === 0} />
        <Row k="Tips" v={money2(current.tips)} />
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-medium">Total</span>
          <span className="font-semibold gold-gradient-text text-lg">{money2(current.total)}</span>
        </div>
      </div>

      <SectionTitle title="History" />
      <div className="grid gap-2.5">
        {WEEKS.map((w) => {
          const p = calcWeeklyPay(w);
          return (
            <div key={w.label} className="surface-card p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{w.label}</div>
                <div className="text-xs text-muted-foreground">{w.hours} hrs · {w.jobs} jobs · {money2(p.hourly)}/hr</div>
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
