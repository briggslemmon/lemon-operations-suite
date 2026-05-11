import { createFileRoute } from "@tanstack/react-router";
import { useJobs, claimJob, isUnassigned } from "@/lib/store";
import { useSession } from "@/lib/role";
import { Pill, money, GoldButton } from "@/components/ui-bits";
import { MapPin, Clock, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tech/available")({
  component: Available,
});

function Available() {
  const jobs = useJobs();
  const { user } = useSession();

  const open = jobs
    .filter(isUnassigned)
    .filter((j) => {
      const d = new Date(j.scheduledAt).getTime();
      const now = Date.now();
      return d >= now - 86400000 && d <= now + 7 * 86400000;
    })
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

  const claim = (id: string, customer: string) => {
    if (!user) return;
    claimJob(id, user.name);
    toast.success(`Claimed ${customer}`, { description: "Owner has been notified." });
  };

  const grouped = open.reduce<Record<string, typeof open>>((acc, j) => {
    const k = new Date(j.scheduledAt).toDateString();
    (acc[k] ||= []).push(j);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Available jobs</h1>
      <p className="text-sm text-muted-foreground mt-1">Pick what you want to work this week.</p>

      {open.length === 0 && (
        <div className="surface-card p-6 mt-5 text-center text-sm text-muted-foreground">
          No open jobs right now. Check back soon.
        </div>
      )}

      <div className="mt-5 grid gap-5">
        {Object.entries(grouped).map(([day, js]) => (
          <div key={day}>
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2 font-medium">
              {new Date(day).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </div>
            <div className="grid gap-2.5">
              {js.map((j) => (
                <div key={j.id} className="surface-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{j.customer}</div>
                    <Pill tone="gold">Open</Pill>
                  </div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                    <MapPin className="size-3" /> {j.address}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {new Date(j.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                    <span className="text-gold font-semibold">{money(j.baseQuote)}</span>
                  </div>
                  <div className="mt-3">
                    <GoldButton full onClick={() => claim(j.id, j.customer)}>
                      <Check className="size-4" /> Claim job
                    </GoldButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
