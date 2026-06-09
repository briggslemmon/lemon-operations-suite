import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSession } from "@/lib/role";
import { addCompletedJob } from "@/lib/completed";
import { sendSMS } from "@/lib/notifications";
import { GoldButton, SectionTitle, money, money2 } from "@/components/ui-bits";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/intake")({
  component: IntakeForm,
});

const SALESMAN_RATE = 0.10;

function IntakeForm() {
  const nav = useNavigate();
  const { listAccounts } = useSession();
  const accounts = listAccounts();
  const techs = accounts.filter((a) => a.role === "tech");
  const salesPool = accounts; // any account can be a salesman

  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [completedAt, setCompletedAt] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [selectedSalesmen, setSelectedSalesmen] = useState<string[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [hoursWorked, setHoursWorked] = useState(2);
  const [baseRevenue, setBaseRevenue] = useState(300);
  const [upsellRevenue, setUpsellRevenue] = useState(0);
  const [tips, setTips] = useState(0);
  const [commissionRate, setCommissionRate] = useState(35);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  const toggleTech = (name: string) =>
    setSelectedTechs((c) => (c.includes(name) ? c.filter((n) => n !== name) : [...c, name]));
  const toggleSalesman = (name: string) =>
    setSelectedSalesmen((c) => (c.includes(name) ? c.filter((n) => n !== name) : [...c, name]));

  const preview = useMemo(() => {
    const nT = selectedTechs.length || 1;
    const nS = selectedSalesmen.length;
    const total = baseRevenue + upsellRevenue + tips;

    const perBase = baseRevenue / nT;
    const perUpsell = upsellRevenue / nT;
    const perTips = tips / nT;
    const perHours = hoursWorked / nT;
    const commission = perBase * (commissionRate / 100);
    const upsellBonus = perUpsell * 0.2;
    const techTotal = commission + upsellBonus + perTips;
    const techHourly = perHours > 0 ? (commission + upsellBonus) / perHours : 0;
    const techPayAll = techTotal * nT;

    const salesmanPool = (baseRevenue + upsellRevenue) * SALESMAN_RATE;
    const salesmanPay = nS > 0 ? salesmanPool : 0;
    const perSalesman = nS > 0 ? salesmanPool / nS : 0;

    const ownerCut = total - techPayAll - salesmanPay;

    return {
      total,
      perBase,
      perUpsell,
      perTips,
      perHours,
      commission,
      upsellBonus,
      techTotal,
      techHourly,
      techPayAll,
      salesmanPay,
      perSalesman,
      ownerCut,
    };
  }, [selectedTechs.length, selectedSalesmen.length, baseRevenue, upsellRevenue, tips, hoursWorked, commissionRate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!customer.trim()) return setErr("Customer name required.");
    if (!address.trim()) return setErr("Address required.");
    if (selectedTechs.length === 0) return setErr("Pick at least one technician.");
    if (hoursWorked <= 0) return setErr("Hours must be greater than 0.");

    const id = `C-${Date.now()}`;
    const paidTo: Record<string, boolean> = {};
    selectedTechs.forEach((t) => (paidTo[t] = false));
    const salesmanPaidTo: Record<string, boolean> = {};
    selectedSalesmen.forEach((s) => (salesmanPaidTo[s] = false));

    addCompletedJob({
      id,
      customer: customer.trim(),
      address: address.trim(),
      completedAt: new Date(completedAt).toISOString(),
      technicians: selectedTechs,
      salesmen: selectedSalesmen,
      hoursWorked,
      baseRevenue,
      upsellRevenue,
      tips,
      commissionRate: commissionRate / 100,
      notes: notes.trim() || undefined,
      paidTo,
      salesmanPaidTo,
    });

    [...selectedTechs, ...selectedSalesmen].forEach((name) => {
      const acct = accounts.find((a) => `${a.firstName} ${a.lastName}`.trim() === name);
      if (!acct) return;
      sendSMS({
        to: acct.phone,
        toName: acct.firstName,
        body: `Lemmon: You were credited for the ${customer.trim()} job.`,
        silent: true,
      });
    });

    toast.success("Job logged");
    nav({ to: "/owner" });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Log completed job</h1>
      <p className="text-sm text-muted-foreground mt-1">Pays out techs, salesmen, and tracks owner cut.</p>

      <form onSubmit={submit} className="grid gap-4 mt-5">
        <div className="surface-card p-5 grid gap-3">
          <Text label="Customer" value={customer} onChange={setCustomer} placeholder="e.g. Hannah Whitaker" />
          <Text label="Address" value={address} onChange={setAddress} placeholder="Street, City, State" />
          <Text label="Completed at" type="datetime-local" value={completedAt} onChange={setCompletedAt} />
        </div>

        <div className="surface-card p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            Salesmen on the job · flat 10%
          </div>
          {salesPool.length === 0 ? (
            <div className="text-sm text-muted-foreground">No accounts yet.</div>
          ) : (
            <div className="grid gap-2">
              {salesPool.map((t) => {
                const name = `${t.firstName} ${t.lastName}`.trim();
                const active = selectedSalesmen.includes(name);
                return (
                  <PersonPill
                    key={t.id}
                    name={name}
                    sub={`${t.role} · ${t.phone}`}
                    avatar={t.avatar}
                    active={active}
                    onClick={() => toggleSalesman(name)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="surface-card p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Technicians on the job</div>
          {techs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No techs yet.</div>
          ) : (
            <div className="grid gap-2">
              {techs.map((t) => {
                const name = `${t.firstName} ${t.lastName}`.trim();
                const active = selectedTechs.includes(name);
                return (
                  <PersonPill
                    key={t.id}
                    name={name}
                    sub={t.phone}
                    avatar={t.avatar}
                    active={active}
                    onClick={() => toggleTech(name)}
                  />
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

        <SectionTitle title="Total payout" />
        <div className="surface-card p-4 grid gap-2 text-sm">
          <Row k="Base revenue" v={money2(baseRevenue)} />
          <Row k="Upsell revenue" v={money2(upsellRevenue)} />
          <Row k="Tips" v={money2(tips)} />
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-semibold gold-gradient-text text-lg">{money2(preview.total)}</span>
          </div>
        </div>

        <SectionTitle title="Split" />
        <div className="grid gap-2.5">
          <div className="surface-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Technician · {commissionRate}%</div>
                <div className="text-sm font-medium mt-0.5">
                  {selectedTechs.length || 0} on job · {money2(preview.techTotal)} each
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{money2(preview.techPayAll)}</div>
                <div className="text-[11px] text-muted-foreground">{money2(preview.techHourly)}/hr avg</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-muted-foreground">
              <span>Commission {money(preview.commission)}</span>
              <span>Upsell bonus {money(preview.upsellBonus)}</span>
              <span>Tips {money(preview.perTips)}</span>
            </div>
          </div>

          <div className="surface-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Salesman · 10%</div>
                <div className="text-sm font-medium mt-0.5">
                  {selectedSalesmen.length || 0} on job · {money2(preview.perSalesman)} each
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{money2(preview.salesmanPay)}</div>
              </div>
            </div>
          </div>

          <div className="surface-card p-4 ring-1 ring-[color:var(--gold)]/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Owner</div>
                <div className="text-sm font-medium mt-0.5">Remaining after splits</div>
              </div>
              <div className="font-semibold gold-gradient-text text-lg">{money2(preview.ownerCut)}</div>
            </div>
          </div>
        </div>

        {err && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{err}</div>
        )}
        <GoldButton full size="lg" type="submit">Save job & update payroll</GoldButton>
      </form>
    </div>
  );
}

function PersonPill({
  name,
  sub,
  avatar,
  active,
  onClick,
}: {
  name: string;
  sub: string;
  avatar: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border px-3 py-2 flex items-center gap-3 transition ${
        active ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10" : "border-border bg-secondary/40 hover:bg-secondary/70"
      }`}
    >
      <div className="size-8 rounded-full bg-secondary grid place-items-center overflow-hidden">
        {avatar?.startsWith("data:") ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span>{avatar}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <div className={`size-4 rounded-full border ${active ? "bg-[color:var(--gold)] border-[color:var(--gold)]" : "border-border"}`} />
    </button>
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
