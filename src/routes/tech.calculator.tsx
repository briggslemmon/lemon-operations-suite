import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { SectionTitle, money } from "@/components/ui-bits";

export const Route = createFileRoute("/tech/calculator")({
  component: Calc,
});

function Calc() {
  const [windows, setWindows] = useState(20);
  const [insideOutside, setIO] = useState(true);
  const [screens, setScreens] = useState(10);

  const { accurate, suggested, discount, minutes } = useMemo(() => {
    const baseAccurate = windows * 10 + screens * 1;
    const bump = baseAccurate > 250 ? 75 : 50;
    const baseSuggested = baseAccurate + bump;
    const multiplier = insideOutside ? 2 : 1;
    const accurate = baseAccurate * multiplier;
    const suggested = baseSuggested * multiplier;
    const discount = suggested - accurate;
    const minutes = windows * 4 * multiplier;
    return { accurate, suggested, discount, minutes };
  }, [windows, screens, insideOutside]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Quote calculator</h1>
      <p className="text-sm text-muted-foreground mt-1">Smart pricing · auto time estimates.</p>

      <div className="surface-card p-5 mt-5 grid gap-4">
        <NumField label="Windows" value={windows} onChange={setWindows} />
        <NumField label="Screens" value={screens} onChange={setScreens} />
        <Toggle label="Inside + Outside" checked={insideOutside} onChange={setIO} hint="Otherwise outside only" />
      </div>

      <SectionTitle title="Recommendation" />
      <div className="surface-card p-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-40 rounded-full bg-[color:var(--gold)]/15 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[color:var(--success)]/10 border border-[color:var(--success)]/30 rounded-xl p-4">
            <div className="uppercase tracking-wider text-[10px] text-[color:var(--success)]/80">Suggested</div>
            <div className="mt-2 text-2xl font-semibold text-[color:var(--success)]">{money(suggested)}</div>
          </div>
          <div className="bg-secondary/50 border border-border rounded-xl p-4">
            <div className="uppercase tracking-wider text-[10px] text-muted-foreground">Accurate</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{money(accurate)}</div>
          </div>
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <div className="uppercase tracking-wider text-[10px] text-destructive/80">Discount</div>
            <div className="mt-2 text-2xl font-semibold text-destructive">{money(discount)}</div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mt-4 text-center">Estimated time: ~{minutes} minutes</div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-24 h-9 px-2 text-right rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] font-medium"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 text-sm text-left"
    >
      <span>
        <span className="text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-[color:var(--gold)]" : "bg-secondary border border-border"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-all ${checked ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
