import { useEffect, useState } from "react";
import { JOBS, type Job } from "./mock-data";

const KEY = "lwc.jobs.v2";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function safeLoad(): Job[] {
  if (typeof window === "undefined") return JOBS;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Job[];
  } catch {}
  
  const today = new Date();
  const iso = (h: number, m = 0, dayOffset = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const pool: Job[] = [
    { id: "J-2001", customer: "Theo Marsh", address: "210 Pecan Grove, Austin TX", phone: "(512) 555-0211", scheduledAt: iso(9, 0, 2), estMinutes: 80, service: "Outside, 16 windows", status: "scheduled", baseQuote: 220, tech: "Unassigned" },
    { id: "J-2002", customer: "Nora Ellis", address: "47 Crescent Way, Austin TX", phone: "(512) 555-0233", scheduledAt: iso(13, 0, 2), estMinutes: 120, service: "Inside + Outside, 28 windows", status: "scheduled", baseQuote: 410, tech: "Unassigned" },
    { id: "J-2003", customer: "Owen Park", address: "905 Vista Ridge, Austin TX", phone: "(512) 555-0244", scheduledAt: iso(10, 30, 3), estMinutes: 60, service: "Outside only, 12 windows", status: "scheduled", baseQuote: 165, tech: "Unassigned" },
    { id: "J-2004", customer: "Maya Holt", address: "12 Sage Hollow, Austin TX", phone: "(512) 555-0255", scheduledAt: iso(8, 0, 4), estMinutes: 100, service: "Full clean, 22 windows", status: "scheduled", baseQuote: 320, tech: "Unassigned" },
  ];
  const seed = [...JOBS, ...pool];
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function save(jobs: Job[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(jobs));
  emit();
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>(JOBS);
  useEffect(() => {
    setJobs(safeLoad());
    const l = () => setJobs(safeLoad());
    listeners.add(l);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) l(); };
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
  }, []);
  return jobs;
}

export function addJob(job: Job) {
  save([...safeLoad(), job]);
}

export function claimJob(id: string, techName: string) {
  save(safeLoad().map((j) => (j.id === id ? { ...j, tech: techName } : j)));
}

export function releaseJob(id: string) {
  save(safeLoad().map((j) => (j.id === id ? { ...j, tech: "Unassigned" } : j)));
}

export function deleteJob(id: string) {
  save(safeLoad().filter((j) => j.id !== id));
}

export const isUnassigned = (j: Job) => !j.tech || j.tech === "Unassigned";
