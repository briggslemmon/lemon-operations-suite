import { createFileRoute } from "@tanstack/react-router";
import { TECH_PERFORMANCE } from "@/lib/mock-data";
import { SectionTitle, money } from "@/components/ui-bits";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/technicians")({
  component: Technicians,
});

function Technicians() {
  const sorted = [...TECH_PERFORMANCE].sort((a, b) => b.revenue - a.revenue);
  const max = sorted[0].revenue;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
      <p className="text-sm text-muted-foreground mt-1">Performance, leaderboards & ratings.</p>

      <SectionTitle title="Leaderboard · this week" />
      <div className="grid gap-2.5">
        {sorted.map((t, i) => (
          <div key={t.tech} className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl grid place-items-center font-semibold ${i === 0 ? "bg-[color:var(--gold)] text-[oklch(0.16_0.01_90)]" : "bg-secondary text-foreground"}`}>
                {i === 0 ? <Trophy className="size-5" /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{t.tech}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{t.jobs} jobs</span>
                  <span>·</span>
                  <span>{money(t.hourly)}/hr</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{money(t.revenue)}</div>
                <div className="text-[11px] text-gold">+{money(t.upsells)} upsell</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[oklch(0.92_0.12_95)] to-[oklch(0.7_0.18_88)]"
                style={{ width: `${(t.revenue / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
