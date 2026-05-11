import { createFileRoute } from "@tanstack/react-router";
import { TECH_PERFORMANCE, calcWeeklyPay } from "@/lib/mock-data";
import { SectionTitle, money, money2, GhostButton } from "@/components/ui-bits";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/payroll")({
  component: AdminPayroll,
});

function AdminPayroll() {
  const rows = TECH_PERFORMANCE.map((t) => {
    const hours = Math.round(t.revenue / t.hourly);
    const pay = calcWeeklyPay({
      hours,
      jobs: t.jobs,
      baseRevenue: t.revenue - t.upsells,
      upsellRevenue: t.upsells,
      tips: 0,
    });
    return { ...t, hours, pay };
  });
  const totalPayroll = rows.reduce((s, r) => s + r.pay.total, 0);
  const totalGuarantee = rows.reduce((s, r) => s + r.pay.guaranteeAdjustment, 0);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-calculated from completed jobs.</p>
        </div>
        <GhostButton><Download className="size-4" /> Export</GhostButton>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="surface-card p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Total payroll</div>
          <div className="text-2xl font-semibold gold-gradient-text mt-2">{money(totalPayroll)}</div>
        </div>
        <div className="surface-card p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Guarantee adj.</div>
          <div className="text-2xl font-semibold mt-2">{money(totalGuarantee)}</div>
        </div>
      </div>

      <SectionTitle title="By technician · this week" />
      <div className="grid gap-2.5">
        {rows.map((r) => (
          <div key={r.tech} className="surface-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.tech}</div>
                <div className="text-xs text-muted-foreground">{r.hours} hrs · {r.jobs} jobs · {money2(r.pay.hourly)}/hr</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{money(r.pay.total)}</div>
                <div className="text-[11px] text-muted-foreground">35% + 20% bonus</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-center">
              <Stat label="Commission" v={money(r.pay.commission)} />
              <Stat label="Upsell bonus" v={money(r.pay.upsellBonus)} />
              <Stat label="Guarantee" v={money(r.pay.guaranteeAdjustment)} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 surface-card p-4 text-xs text-muted-foreground">
        <div className="font-medium text-foreground mb-1">Pay structure</div>
        Sales rep 10% · Solo tech 35% · 2-man crew 50% pool · Upsell bonus 20% on additional revenue · Weekly minimum guarantee $15/hr.
      </div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="bg-secondary/50 rounded-lg py-2">
      <div className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</div>
      <div className="font-semibold mt-0.5">{v}</div>
    </div>
  );
}
