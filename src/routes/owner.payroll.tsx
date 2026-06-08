import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/role";
import { useCompletedJobs, techShare, markPaid } from "@/lib/completed";
import { money, SectionTitle } from "@/components/ui-bits";
import { sendSMS } from "@/lib/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/payroll")({
  component: OwnerPayroll,
});

function OwnerPayroll() {
  const { listAccounts } = useSession();
  const jobs = useCompletedJobs();
  const techs = listAccounts().filter((a) => a.role === "tech");

  const pay = (jobId: string, name: string, phone: string, amount: number) => {
    markPaid(jobId, name, true);
    sendSMS({ to: phone, toName: name.split(" ")[0], body: `Lemmon: ${money(amount)} has been marked as paid to you.`, silent: true });
    toast.success(`${money(amount)} marked paid to ${name}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
      <p className="text-sm text-muted-foreground mt-1">Outstanding pay per technician per job.</p>

      {techs.map((t) => {
        const name = `${t.firstName} ${t.lastName}`.trim();
        const myJobs = jobs.filter((j) => j.technicians.includes(name));
        const unpaid = myJobs.filter((j) => !j.paidTo[name]);
        const paid = myJobs.filter((j) => j.paidTo[name]);
        return (
          <div key={t.id} className="mt-6">
            <SectionTitle title={name} />
            <div className="grid gap-2">
              {myJobs.length === 0 && (
                <div className="surface-card p-4 text-sm text-muted-foreground text-center">
                  No jobs logged for {t.firstName} yet.
                </div>
              )}
              {unpaid.map((j) => {
                const s = techShare(j, name)!;
                return (
                  <div key={j.id} className="surface-card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{j.customer}</div>
                      <div className="text-xs text-muted-foreground">{new Date(j.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {s.hours.toFixed(1)} hr</div>
                    </div>
                    <div className="text-sm font-semibold">{money(s.total)}</div>
                    <button
                      onClick={() => pay(j.id, name, t.phone, s.total)}
                      className="h-8 px-3 rounded-md bg-[color:var(--gold)] text-[oklch(0.16_0.01_90)] text-xs font-semibold"
                    >
                      Mark paid
                    </button>
                  </div>
                );
              })}
              {paid.map((j) => {
                const s = techShare(j, name)!;
                return (
                  <div key={j.id} className="surface-card p-3 flex items-center gap-3 opacity-60">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{j.customer}</div>
                      <div className="text-xs text-muted-foreground">{new Date(j.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · paid</div>
                    </div>
                    <div className="text-sm">{money(s.total)}</div>
                    <button
                      onClick={() => { markPaid(j.id, name, false); toast(`Marked unpaid`); }}
                      className="h-8 px-3 rounded-md border border-border text-xs text-muted-foreground"
                    >
                      Undo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
