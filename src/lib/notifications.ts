import { toast } from "sonner";

const KEY = "lwc.sms.log.v1";

export type SmsRecord = {
  id: string;
  to: string;
  toName?: string;
  body: string;
  sentAt: number;
};

function read(): SmsRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list: SmsRecord[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
}

/** Fake SMS: logs to localStorage and shows a toast. No real text sent. */
export function sendSMS(opts: { to: string; toName?: string; body: string; silent?: boolean }) {
  const rec: SmsRecord = {
    id: `sms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    to: opts.to,
    toName: opts.toName,
    body: opts.body,
    sentAt: Date.now(),
  };
  const list = [rec, ...read()].slice(0, 100);
  write(list);
  if (!opts.silent) {
    toast(`📱 SMS sent to ${opts.toName || opts.to}`, { description: opts.body });
  }
  return rec;
}

export function recentSMS(limit = 25): SmsRecord[] {
  return read().slice(0, limit);
}
