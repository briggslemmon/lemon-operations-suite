import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { JOBS, UPSELL_MENU } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { Pill, GoldButton, GhostButton, money, money2, SectionTitle } from "@/components/ui-bits";
import {
  ArrowLeft, MapPin, Phone, KeyRound, Dog, Camera, Plus, Minus,
  CheckCircle2, Navigation, Clock,
} from "lucide-react";

export const Route = createFileRoute("/tech/jobs/$jobId")({
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = useParams({ from: "/tech/jobs/$jobId" });
  const job = JOBS.find((j) => j.id === jobId);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [tip, setTip] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [done, setDone] = useState(false);

  const upsellTotal = useMemo(
    () => UPSELL_MENU.reduce((s, u) => s + (qty[u.name] || 0) * u.price, 0),
    [qty],
  );
  const finalRevenue = (job?.baseQuote || 0) + upsellTotal - discount;
  const commission = finalRevenue * 0.35;
  const upsellBonus = upsellTotal * 0.2;

  if (!job) {
    return (
      <div className="text-center py-20">
        <p>Job not found.</p>
        <Link to="/tech/jobs" className="text-gold text-sm mt-3 inline-block">Back to jobs</Link>
      </div>
    );
  }

  const inc = (n: string, d: number) =>
    setQty((q) => ({ ...q, [n]: Math.max(0, (q[n] || 0) + d) }));

  return (
    <div className="pb-4">
      <Link to="/tech/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Jobs
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{job.customer}</h1>
          <div className="text-xs text-muted-foreground mt-1">{job.id} · {job.service}</div>
        </div>
        <Pill tone={done ? "success" : "gold"}>{done ? "Complete" : "Scheduled"}</Pill>
      </div>

      <div className="surface-card p-4 mt-4 grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <MapPin className="size-4 text-gold shrink-0" />
            <span className="truncate">{job.address}</span>
          </div>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
            target="_blank"
            className="text-xs text-gold inline-flex items-center gap-1 font-medium"
            rel="noreferrer"
          >
            <Navigation className="size-3" /> Navigate
          </a>
        </div>
        <a href={`tel:${job.phone}`} className="flex items-center gap-2 text-sm">
          <Phone className="size-4 text-gold" /> {job.phone}
        </a>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-gold" />
          {new Date(job.scheduledAt).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })} · est {job.estMinutes}m
        </div>
        {job.gateCode && (
          <div className="flex items-center gap-2 text-sm">
            <KeyRound className="size-4 text-gold" /> Gate code: <span className="font-mono">{job.gateCode}</span>
          </div>
        )}
        {job.pets && (
          <div className="flex items-center gap-2 text-sm">
            <Dog className="size-4 text-gold" /> {job.pets}
          </div>
        )}
        {job.notes && (
          <div className="text-sm text-muted-foreground border-t border-border pt-3">
            {job.notes}
          </div>
        )}
      </div>

      <SectionTitle title="Photos" />
      <div className="grid grid-cols-2 gap-2.5">
        {["Before", "After"].map((t) => (
          <button key={t} className="surface-card aspect-square flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:border-[color:var(--gold)]/40">
            <Camera className="size-6" />
            {t}
          </button>
        ))}
      </div>

      <SectionTitle title="Upsells" />
      <div className="surface-card divide-y divide-border">
        {UPSELL_MENU.map((u) => {
          const n = qty[u.name] || 0;
          return (
            <div key={u.name} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{money2(u.price)} {u.unit}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => inc(u.name, -1)} className="size-8 grid place-items-center rounded-lg border border-border bg-secondary/50 active:scale-95 transition">
                  <Minus className="size-4" />
                </button>
                <div className="w-8 text-center font-semibold tabular-nums">{n}</div>
                <button onClick={() => inc(u.name, 1)} className="size-8 grid place-items-center rounded-lg border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 text-gold active:scale-95 transition">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <SectionTitle title="Revenue" />
      <div className="surface-card p-4 grid gap-3">
        <Row label="Base quote" value={money2(job.baseQuote)} />
        <Row label="Upsells" value={money2(upsellTotal)} accent />
        <Field label="Discount" value={discount} onChange={setDiscount} />
        <Field label="Tip (paid to tech, not company)" value={tip} onChange={setTip} />
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-sm font-medium">Job total</span>
          <span className="text-lg font-semibold gold-gradient-text">{money2(finalRevenue)}</span>
        </div>
        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
          <span>Commission (35%): <span className="text-foreground font-medium">{money2(commission)}</span></span>
          <span>Upsell bonus (20%): <span className="text-foreground font-medium">{money2(upsellBonus)}</span></span>
        </div>
      </div>

      <div className="sticky bottom-24 mt-5 grid gap-2">
        {!done ? (
          <GoldButton size="lg" full onClick={() => setDone(true)}>
            <CheckCircle2 className="size-5" /> Mark complete
          </GoldButton>
        ) : (
          <GhostButton full onClick={() => setDone(false)}>
            Reopen job
          </GhostButton>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-gold font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">$</span>
        <input
          type="number"
          inputMode="decimal"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="w-24 h-9 px-2 text-right rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
        />
      </div>
    </label>
  );
}
