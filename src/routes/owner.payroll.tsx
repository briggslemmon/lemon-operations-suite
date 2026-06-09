import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSession } from "@/lib/role";
import {
  useCompletedJobs,
  techShare,
  salesmanShare,
  markPaid,
  markSalesmanPaid,
  payForTech,
  payForSalesman,
} from "@/lib/completed";
import { money, money2, SectionTitle, StatCard } from "@/components/ui-bits";
import { sendSMS } from "@/lib/notifications";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/owner/payroll")({
  component: OwnerPayroll,
});

function OwnerPayroll() {
  const { listAccounts } = useSession();
  const jobs = useCompletedJobs();
  const accounts = listAccounts();
  const techs = accounts.filter((a) => a.role === "tech");

  // Collect every account that has appeared as a salesman.
  const salesmanNames = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach((j) => (j.salesmen ?? []).forEach((n) => s.add(n)));
    return [...s];
  }, [jobs]);

  const totals = useMemo(() => {
    let owedTech = 0,
      owedSales = 0,
      paidTech = 0,
      paidSales = 0;
    for (const j of jobs) {
      for (const t of j.technicians) {
        const s = techShare(j, t);
        if (!s) continue;
        if (j.paidTo[t]) paidTech += s.total;
        else owedTech += s.total;
      }
      for (const sm of j.salesmen ?? []) {
        const s = salesmanShare(j, sm);
        if (!s) continue;
        if (j.salesmanPaidTo?.[sm]) paidSales += s.total;
        else owedSales += s.total;
      }
    }
    return { owedTech, owedSales, paidTech, paidSales };
  }, [jobs]);

  const payTech = (jobId: string, name: string, phone: string, amount: number) => {
    markPaid(jobId, name, true);
    sendSMS({ to: phone, toName: name.split(" ")[0], body: `Lemmon: ${money(amount)} paid to you.`, silent: true });
    toast.success(`${money(amount)} paid to ${name}`);
  };
  const paySales = (jobId: string, name: string, phone: string, amount: number) => {
    markSalesmanPaid(jobId, name, true);
    sendSMS({ to: phone, toName: name.split(" ")[0], body: `Lemmon: ${money(amount)} paid to you (salesman commission).`, silent: true });
    toast.success(`${money(amount)} paid to ${name}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">What I owe</h1>
      <p className="text-sm text-muted-foreground mt-1">Outstanding pay to your technicians and salesmen.</p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <StatCard label="Owed · techs" value={money(totals.owedTech)} hint="Unpaid" icon={<Wallet className="size-4" />} accent />
        <StatCard label="Owed · sales" value={money(totals.owedSales)} hint="Unpaid" />
        <StatCard label="Paid · techs" value={money(totals.paidTech)} hint="All time" />
        <StatCard label="Paid · sales" value={money(totals.paidSales)} hint="All time" />
      </div>

      <SectionTitle title="Technicians" />
      {techs.map((t) => {
        const name = `${t.firstName} ${t.lastName}`.trim();
        const myJobs = jobs.filter((j) => j.technicians.includes(name));
        if (myJobs.length === 0) return null;
        const p = payForTech(jobs, name);
        return (
          <PersonBlock
            key={t.id}
            name={name}
            avatar={t.avatar}
            owed={p.owed}
            paid={p.paid}
            jobs={myJobs.map((j) => {
              const s = techShare(j, name)!;
              return {
                id: j.id,
                customer: j.customer,
                date: j.completedAt,
                amount: s.total,
                paid: !!j.paidTo[name],
                onPay: () => payTech(j.id, name, t.phone, s.total),
                onUndo: () => { markPaid(j.id, name, false); toast(`Marked unpaid`); },
              };
            })}
          />
        );
      })}

      <SectionTitle title="Salesmen" />
      {salesmanNames.length === 0 && (
        <div className="surface-card p-4 text-sm text-muted-foreground text-center">No salesmen logged on any jobs yet.</div>
      )}
      {salesmanNames.map((name) => {
        const acct = accounts.find((a) => `${a.firstName} ${a.lastName}`.trim() === name);
        const myJobs = jobs.filter((j) => (j.salesmen ?? []).includes(name));
        const p = payForSalesman(jobs, name);
        return (
          <PersonBlock
            key={`s-${name}`}
            name={name}
            avatar={acct?.avatar ?? "💼"}
            owed={p.owed}
            paid={p.paid}
            jobs={myJobs.map((j) => {
              const s = salesmanShare(j, name)!;
              return {
                id: j.id,
                customer: j.customer,
                date: j.completedAt,
                amount: s.total,
                paid: !!j.salesmanPaidTo?.[name],
                onPay: () => paySales(j.id, name, acct?.phone ?? "", s.total),
                onUndo: () => { markSalesmanPaid(j.id, name, false); toast(`Marked unpaid`); },
              };
            })}
          />
        );
      })}
    </div>
  );
}

function PersonBlock({
  name,
  avatar,
  owed,
  paid,
  jobs,
}: {
  name: string;
  avatar: string;
  owed: number;
  paid: number;
  jobs: { id: string; customer: string; date: string; amount: number; paid: boolean; onPay: () => void; onUndo: () => void }[];
}) {
  return (
    <div className="surface-card p-4 mt-3">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-secondary border border-border grid place-items-center overflow-hidden">
          {avatar?.startsWith("data:") ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span>{avatar}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{name}</div>
          <div className="text-[11px] text-muted-foreground">Owed {money(owed)} · Paid {money(paid)}</div>
        </div>
      </div>
      <div className="grid gap-2 mt-3">
        {jobs.map((j) => (
          <div key={j.id} className={`flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 ${j.paid ? "opacity-60" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{j.customer}</div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(j.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {j.paid && " · paid"}
              </div>
            </div>
            <div className="text-sm font-semibold">{money2(j.amount)}</div>
            {j.paid ? (
              <button onClick={j.onUndo} className="h-8 px-3 rounded-md border border-border text-xs text-muted-foreground">Undo</button>
            ) : (
              <button onClick={j.onPay} className="h-8 px-3 rounded-md bg-[color:var(--gold)] text-[oklch(0.16_0.01_90)] text-xs font-semibold">Pay</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
