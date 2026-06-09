import { useEffect, useState } from "react";

export type CompletedJob = {
  id: string;
  customer: string;
  address: string;
  completedAt: string; // ISO
  technicians: string[];
  salesmen?: string[];
  hoursWorked: number;
  baseRevenue: number;
  upsellRevenue: number;
  tips: number;
  commissionRate: number;
  notes?: string;
  paidTo: Record<string, boolean>;
  salesmanPaidTo?: Record<string, boolean>;
};

const KEY = "lwc.completed.v1";
const SALESMAN_RATE = 0.10;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): CompletedJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : seed();
  } catch {
    return [];
  }
}

function write(list: CompletedJob[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
  emit();
}

function seed(): CompletedJob[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const list: CompletedJob[] = [
    {
      id: "C-3001",
      customer: "Hannah Whitaker",
      address: "812 Linden Hill Dr, Austin TX",
      completedAt: new Date(now - 1 * day).toISOString(),
      technicians: ["Demo Tech"],
      salesmen: [],
      hoursWorked: 2.5,
      baseRevenue: 385,
      upsellRevenue: 40,
      tips: 25,
      commissionRate: 0.35,
      paidTo: { "Demo Tech": false },
      salesmanPaidTo: {},
    },
    {
      id: "C-3002",
      customer: "Ravi Patel",
      address: "29 Magnolia Ct, Austin TX",
      completedAt: new Date(now - 2 * day).toISOString(),
      technicians: ["Demo Tech"],
      salesmen: [],
      hoursWorked: 1.5,
      baseRevenue: 245,
      upsellRevenue: 0,
      tips: 20,
      commissionRate: 0.35,
      paidTo: { "Demo Tech": false },
      salesmanPaidTo: {},
    },
  ];
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function useCompletedJobs() {
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  useEffect(() => {
    setJobs(read());
    const l = () => setJobs(read());
    listeners.add(l);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) l(); };
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
  }, []);
  return jobs;
}

export function addCompletedJob(job: CompletedJob) {
  write([job, ...read()]);
}

export function markPaid(jobId: string, techName: string, paid = true) {
  const list = read().map((j) =>
    j.id === jobId ? { ...j, paidTo: { ...j.paidTo, [techName]: paid } } : j,
  );
  write(list);
}

export function markSalesmanPaid(jobId: string, name: string, paid = true) {
  const list = read().map((j) =>
    j.id === jobId ? { ...j, salesmanPaidTo: { ...(j.salesmanPaidTo ?? {}), [name]: paid } } : j,
  );
  write(list);
}

// ---- Date helpers ----
export function startOfWeek(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}
export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1);
}

// ---- Per-technician share ----
export function techShare(job: CompletedJob, techName: string) {
  if (!job.technicians.includes(techName)) return null;
  const n = job.technicians.length || 1;
  const hours = job.hoursWorked / n;
  const base = job.baseRevenue / n;
  const upsell = job.upsellRevenue / n;
  const tips = job.tips / n;
  const commission = base * job.commissionRate;
  const upsellBonus = upsell * 0.2;
  const total = commission + upsellBonus + tips;
  return { hours, base, upsell, tips, commission, upsellBonus, total };
}

// ---- Per-salesman share (flat 10% of base+upsell, split) ----
export function salesmanShare(job: CompletedJob, name: string) {
  const list = job.salesmen ?? [];
  if (!list.includes(name)) return null;
  const n = list.length || 1;
  const total = ((job.baseRevenue + job.upsellRevenue) * SALESMAN_RATE) / n;
  return { total, rate: SALESMAN_RATE };
}

export function totalSalesmanPay(job: CompletedJob) {
  return (job.salesmen?.length ?? 0) > 0
    ? (job.baseRevenue + job.upsellRevenue) * SALESMAN_RATE
    : 0;
}
export function totalTechPay(job: CompletedJob) {
  return job.technicians.reduce((sum, t) => sum + (techShare(job, t)?.total ?? 0), 0);
}
export function ownerCut(job: CompletedJob) {
  return job.baseRevenue + job.upsellRevenue + job.tips - totalTechPay(job) - totalSalesmanPay(job);
}

// ---- Aggregations for a technician ----
export function payForTech(jobs: CompletedJob[], techName: string, start?: Date, end?: Date) {
  const startMs = start?.getTime() ?? -Infinity;
  const endMs = end?.getTime() ?? Infinity;
  const inRange = jobs.filter((j) => {
    const t = new Date(j.completedAt).getTime();
    return t >= startMs && t <= endMs && j.technicians.includes(techName);
  });
  let hours = 0, base = 0, upsell = 0, tips = 0, commission = 0, upsellBonus = 0, owed = 0, paid = 0;
  for (const j of inRange) {
    const s = techShare(j, techName);
    if (!s) continue;
    hours += s.hours;
    base += s.base;
    upsell += s.upsell;
    tips += s.tips;
    commission += s.commission;
    upsellBonus += s.upsellBonus;
    if (j.paidTo[techName]) paid += s.total;
    else owed += s.total;
  }
  const subtotal = commission + upsellBonus;
  const total = subtotal + tips;
  const hourly = hours > 0 ? subtotal / hours : 0;
  return { jobs: inRange.length, hours, base, upsell, tips, commission, upsellBonus, total, hourly, owed, paid };
}

// ---- Aggregations for a salesman ----
export function payForSalesman(jobs: CompletedJob[], name: string, start?: Date, end?: Date) {
  const startMs = start?.getTime() ?? -Infinity;
  const endMs = end?.getTime() ?? Infinity;
  const inRange = jobs.filter((j) => {
    const t = new Date(j.completedAt).getTime();
    return t >= startMs && t <= endMs && (j.salesmen ?? []).includes(name);
  });
  let total = 0, owed = 0, paid = 0;
  for (const j of inRange) {
    const s = salesmanShare(j, name);
    if (!s) continue;
    total += s.total;
    if (j.salesmanPaidTo?.[name]) paid += s.total;
    else owed += s.total;
  }
  return { jobs: inRange.length, total, owed, paid };
}

// ---- Revenue across all jobs ----
export function revenueInRange(jobs: CompletedJob[], start?: Date, end?: Date) {
  const startMs = start?.getTime() ?? -Infinity;
  const endMs = end?.getTime() ?? Infinity;
  let base = 0, upsell = 0, tips = 0, count = 0;
  for (const j of jobs) {
    const t = new Date(j.completedAt).getTime();
    if (t < startMs || t > endMs) continue;
    base += j.baseRevenue;
    upsell += j.upsellRevenue;
    tips += j.tips;
    count += 1;
  }
  return { revenue: base + upsell, base, upsell, tips, count };
}

// ---- Top performers (techs) ----
export function topPerformers(jobs: CompletedJob[], start?: Date, end?: Date) {
  const startMs = start?.getTime() ?? -Infinity;
  const endMs = end?.getTime() ?? Infinity;
  const map = new Map<string, { tech: string; revenue: number; jobs: number; hours: number }>();
  for (const j of jobs) {
    const t = new Date(j.completedAt).getTime();
    if (t < startMs || t > endMs) continue;
    const n = j.technicians.length || 1;
    for (const tech of j.technicians) {
      const cur = map.get(tech) || { tech, revenue: 0, jobs: 0, hours: 0 };
      cur.revenue += (j.baseRevenue + j.upsellRevenue) / n;
      cur.jobs += 1;
      cur.hours += j.hoursWorked / n;
      map.set(tech, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

// ---- Top salesmen ----
export function topSalesmen(jobs: CompletedJob[], start?: Date, end?: Date) {
  const startMs = start?.getTime() ?? -Infinity;
  const endMs = end?.getTime() ?? Infinity;
  const map = new Map<string, { name: string; revenue: number; jobs: number; commission: number }>();
  for (const j of jobs) {
    const t = new Date(j.completedAt).getTime();
    if (t < startMs || t > endMs) continue;
    const list = j.salesmen ?? [];
    const n = list.length || 1;
    for (const s of list) {
      const cur = map.get(s) || { name: s, revenue: 0, jobs: 0, commission: 0 };
      cur.revenue += (j.baseRevenue + j.upsellRevenue) / n;
      cur.jobs += 1;
      cur.commission += ((j.baseRevenue + j.upsellRevenue) * SALESMAN_RATE) / n;
      map.set(s, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

// ---- Jobs/revenue grouped by day for charts ----
export function revenueByDay(jobs: CompletedJob[], days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: { date: Date; label: string; revenue: number; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({
      date: d,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: 0,
      count: 0,
    });
  }
  const startMs = out[0].date.getTime();
  const endMs = today.getTime() + 24 * 60 * 60 * 1000;
  for (const j of jobs) {
    const t = new Date(j.completedAt).getTime();
    if (t < startMs || t >= endMs) continue;
    const d = new Date(j.completedAt);
    d.setHours(0, 0, 0, 0);
    const idx = out.findIndex((b) => b.date.getTime() === d.getTime());
    if (idx >= 0) {
      out[idx].revenue += j.baseRevenue + j.upsellRevenue;
      out[idx].count += 1;
    }
  }
  return out;
}

export function revenueByMonth(jobs: CompletedJob[], months = 6) {
  const now = new Date();
  const out: { label: string; revenue: number; count: number; start: Date }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      revenue: 0,
      count: 0,
      start: d,
    });
  }
  for (const j of jobs) {
    const t = new Date(j.completedAt);
    const idx = out.findIndex(
      (b, i) =>
        t >= b.start &&
        (i === out.length - 1 || t < out[i + 1].start),
    );
    if (idx >= 0) {
      out[idx].revenue += j.baseRevenue + j.upsellRevenue;
      out[idx].count += 1;
    }
  }
  return out;
}
