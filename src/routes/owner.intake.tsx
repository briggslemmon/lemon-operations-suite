import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSession } from "@/lib/role";
import { addCompletedJob } from "@/lib/completed";
import { sendSMS } from "@/lib/notifications";
import { GoldButton, SectionTitle, money } from "@/components/ui-bits";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/intake")({
  component: IntakeForm,
});

function IntakeForm() {
  const nav = useNavigate();
  const { listAccounts } = useSession();
  const techs = listAccounts().filter((a) => a.role === "tech");

  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [completedAt, setCompletedAt] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [hoursWorked, setHoursWorked] = useState(2);
  const [baseRevenue, setBaseRevenue] = useState(300);
  const [upsellRevenue, setUpsellRevenue] = useState(0);
  const [tips, setTips] = useState(0);
  const [commissionRate, setCommissionRate] = useState(35);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  const toggleTech = (name: string) => {
    setSelectedTechs((cur) => cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]);
  };

  const preview = useMemo(() => {
    const n = selectedTechs.length || 1;
    const perBase = baseRevenue / n;
    const perUpsell = upsellRevenue / n;
    const perTips = tips / n;
    const perHours = hoursWorked / n;
    const commission = perBase * (commissionRate / 100);
    const upsellBonus = perUpsell * 0.2;
    const total = commission + upsellBonus + perTips;
    return { perHours, perBase, perUpsell, perTips, commission, upsellBonus, total };
  }, [selectedTechs.length, baseRevenue, upsellRevenue, tips, hoursWorked, commissionRate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!customer.trim()) return setErr("Customer name required.");
    if (!address.trim()) return setErr("Address required.");
    if (selectedTechs.length === 0) return setErr("Pick at least one technician.");
    if (hoursWorked <= 0) return setErr("Hours must be greater than 0.");

    const id = `C-${Date.now()}`;
    const paidTo: Record<string, boolean> = {};
    selectedTechs.forEach((t) => { paidTo[t] = false; });

    addCompletedJob({
      id,
      customer: customer.trim(),
      address: address.trim(),
      completedAt: new Date(completedAt).toISOString(),
      technicians: selectedTechs,
      hoursWorked,
      baseRevenue,
      upsellRevenue,
      tips,
      commissionRate: commissionRate / 100,
      notes: notes.trim() || undefined,
      paidTo,
    });

    // Fake SMS to each technician
    selectedTechs.forEach((name) => {
      const acct = techs.find((a) => `${a.firstName} ${a.lastName}`.trim() === name);
      if (!acct) return;
      sendSMS({
        to: acct.phone,
        toName: acct.firstName,
        body: `Lemmon: You were credited for the ${customer.trim()} job. Pay added to your week.`,
        silent: true,
      });
    });

    toast.success("Job logged", { description: `Payroll updated for ${selectedTechs.length} tech${selectedTechs.length === 1 ? "" : "s"}.` });
    nav({ to: "/owner" });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Log completed job</h1>
      <p className="text-sm text-muted-foreground mt-1">All techs are paid out from this form.</p>

      <form onSubmit={submit} className="grid gap-4 mt-5">
        <div className="surface-card p-5 grid gap-3">
          <Text label="Customer" value={customer} onChange={setCustomer} placeholder="e.g. Hannah Whitaker" />
          <Text label="Address" value={address} onChange={setAddress} placeholder="Street, City, State" />
          <Text label="Completed at" type="datetime-local" value={completedAt} onChange={setCompletedAt} />
        </div>

        <div className="surface-card p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Technicians on the job</div>
          {techs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No techs yet. Have them create accounts.</div>
          ) : (
            <div className="grid gap-2">
              {techs.map((t) => {
                const name = `${t.firstName} ${t.lastName}`.trim();
                const active = selectedTechs.includes(name);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggleTech(name)}
                    className={`text-left rounded-lg border px-3 py-2 flex items-center gap-3 transition ${
                      active ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10" : "border-border bg-secondary/40 hover:bg-secondary/70"
                    }`}
                  >
                    <div className="size-8 rounded-full bg-secondary grid place-items-center overflow-hidden">
                      {t.avatar?.startsWith("data:")
                        ? <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                        : <span>{t.avatar}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.phone}</div>
                    </div>
                    <div className={`size-4 rounded-full border ${active ? "bg-[color:var(--gold)] border-[color:var(--gold)]" : "border-border"}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="surface-card p-5 grid gap-3">
          <Num label="Total hours worked" value={hoursWorked} onChange={setHoursWorked} step={0.25} />
          <Num label="Base revenue ($)" value={baseRevenue} onChange={setBaseRevenue} />
          <Num label="Upsell revenue ($)" value={upsellRevenue} onChange={setUpsellRevenue} />
          <Num label="Tips ($)" value={tips} onChange={setTips} />
          <Num label="Commission rate (%)" value={commissionRate} onChange={setCommissionRate} />
          <Text label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Any details" />
        </div>

        <SectionTitle title="Pay preview · per technician" />
        <div className="surface-card p-4 grid gap-2 text-sm">
          <Row k="Hours" v={`${preview.perHours.toFixed(2)} hr`} />
          <Row k="Base share" v={money(preview.perBase)} />
          <Row k="Commission" v={money(preview.commission)} />
          <Row k="Upsell bonus" v={money(preview.upsellBonus)} />
          <Row k="Tips" v={money(preview.perTips)} />
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-medium">Total per tech</span>
            <span className="font-semibold gold-gradient-text text-lg">{money(preview.total)}</span>
          </div>
        </div>

        {err && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{err}</div>}
        <GoldButton full size="lg" type="submit">Save job & update payroll</GoldButton>
      </form>
    </div>
  );
}

function Text({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 px-3 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] text-sm"
      />
    </label>
  );
}
function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-28 h-9 px-2 text-right rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] font-medium text-sm"
      />
    </label>
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
