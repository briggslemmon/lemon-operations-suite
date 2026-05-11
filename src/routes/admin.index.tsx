import { createFileRoute } from "@tanstack/react-router";
import { REVENUE_TREND, TECH_PERFORMANCE } from "@/lib/mock-data";
import { StatCard, SectionTitle, money } from "@/components/ui-bits";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { DollarSign, TrendingUp, Sparkles, Briefcase } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const weekRevenue = REVENUE_TREND.reduce((s, d) => s + d.revenue, 0);
  const weekUpsells = REVENUE_TREND.reduce((s, d) => s + d.upsells, 0);
  const jobs = TECH_PERFORMANCE.reduce((s, t) => s + t.jobs, 0);
  const avgTicket = weekRevenue / jobs;

  return (
    <div>
      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Command center</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          Business <span className="gold-gradient-text">overview</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <StatCard label="Revenue · 7d" value={money(weekRevenue)} hint="+18% vs last week" icon={<DollarSign className="size-4" />} accent />
        <StatCard label="Avg ticket" value={money(avgTicket)} hint={`${jobs} jobs`} icon={<TrendingUp className="size-4" />} />
        <StatCard label="Upsell revenue" value={money(weekUpsells)} hint={`${Math.round((weekUpsells / weekRevenue) * 100)}% of total`} icon={<Sparkles className="size-4" />} />
        <StatCard label="Rev / labor hr" value={money(124)} hint="Target: $110" icon={<Briefcase className="size-4" />} />
      </div>

      <SectionTitle title="Revenue trend" />
      <div className="surface-card p-3 pt-5">
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={REVENUE_TREND} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.82 0.16 92)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.82 0.16 92)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="d" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={11} width={40} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.22 0.008 90)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                formatter={(v: number) => [`$${v}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="oklch(0.82 0.16 92)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle title="Revenue by technician" />
      <div className="surface-card p-3 pt-5">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={TECH_PERFORMANCE} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="tech" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v) => v.split(" ")[0]} />
              <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={11} width={40} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.22 0.008 90)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number, k) => [`$${v}`, k === "revenue" ? "Revenue" : "Upsells"]}
              />
              <Bar dataKey="revenue" fill="oklch(0.82 0.16 92)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="upsells" fill="oklch(0.5 0.06 92)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle title="Profitability snapshot" />
      <div className="surface-card p-4 grid gap-2.5 text-sm">
        <Row k="Revenue" v={money(weekRevenue)} />
        <Row k="Commissions" v={`-${money(weekRevenue * 0.35)}`} />
        <Row k="Upsell bonuses" v={`-${money(weekUpsells * 0.2)}`} />
        <Row k="Drive + overhead (est.)" v={`-${money(1850)}`} />
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-medium">Estimated profit</span>
          <span className="text-lg font-semibold gold-gradient-text">
            {money(weekRevenue - weekRevenue * 0.35 - weekUpsells * 0.2 - 1850)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
