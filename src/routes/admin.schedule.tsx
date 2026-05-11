import { createFileRoute } from "@tanstack/react-router";
import { TECHS } from "@/lib/mock-data";
import { useJobs, addJob, deleteJob, isUnassigned } from "@/lib/store";
import { Pill, GoldButton, money } from "@/components/ui-bits";
import { Clock, MapPin, Trash2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/admin/schedule")({
  component: Schedule,
});

function Schedule() {
  const jobs = useJobs();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [price, setPrice] = useState<number>(0);
  const [tech, setTech] = useState<string>("Unassigned");

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [],
  );

  const reset = () => {
    setCustomer("");
    setAddress("");
    setPrice(0);
    setTech("Unassigned");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !address || !price) return;
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    addJob({
      id: `J-${Date.now().toString().slice(-5)}`,
      customer,
      address,
      phone: "",
      scheduledAt: dt.toISOString(),
      estMinutes: 60,
      service: "Window cleaning",
      status: "scheduled",
      baseQuote: price,
      tech,
    });
    reset();
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Add jobs · assign or leave open for techs to claim.</p>
        </div>
        <GoldButton onClick={() => setOpen((o) => !o)}>
          <Plus className="size-4" /> {open ? "Close" : "New job"}
        </GoldButton>
      </div>

      {open && (
        <form onSubmit={submit} className="surface-card p-4 mt-4 grid gap-3">
          <Input label="Customer / Location name" value={customer} onChange={setCustomer} placeholder="e.g. Hannah Whitaker" />
          <Input label="Address" value={address} onChange={setAddress} placeholder="123 Main St, Austin TX" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={date} onChange={setDate} />
            <Input label="Time" type="time" value={time} onChange={setTime} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price"
              type="number"
              value={price ? String(price) : ""}
              onChange={(v) => setPrice(Number(v) || 0)}
              placeholder="0"
            />
            <label className="grid gap-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">Assign</span>
              <select
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                className="h-10 px-2 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] text-sm"
              >
                <option value="Unassigned">Open · let techs claim</option>
                {TECHS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <GoldButton type="submit" full>Add job</GoldButton>
        </form>
      )}

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
        {days.map((d, i) => {
          const dayJobs = jobs.filter((j) => new Date(j.scheduledAt).toDateString() === d.toDateString());
          return (
            <div key={i} className="snap-start shrink-0 w-72 surface-card p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-lg font-semibold">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <Pill tone="gold">{dayJobs.length} jobs</Pill>
              </div>

              <div className="grid gap-2">
                {dayJobs.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                    No jobs
                  </div>
                )}
                {dayJobs.map((j) => (
                  <div key={j.id} className="rounded-lg border border-border p-3 bg-background/40">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium">
                        {new Date(j.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>
                      <div className="text-xs text-gold font-semibold">{money(j.baseQuote)}</div>
                    </div>
                    <div className="text-sm font-medium mt-1 truncate">{j.customer}</div>
                    <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3" /> {j.address}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {isUnassigned(j) ? (
                          <span className="text-gold font-medium">Open</span>
                        ) : (
                          j.tech.split(" ")[0]
                        )}
                      </span>
                      <button
                        onClick={() => deleteJob(j.id)}
                        className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label="Remove"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">{label}</span>
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
