import { type ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`surface-card p-4 ${
        accent ? "ring-1 ring-[color:var(--gold)]/30" : ""
      }`}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <div className="text-[11px] uppercase tracking-[0.14em] font-medium">{label}</div>
        {icon}
      </div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${accent ? "gold-gradient-text" : ""}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3 mt-6 first:mt-2">
      <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "gold" | "success" | "danger";
}) {
  const cls =
    tone === "gold"
      ? "bg-[color:var(--gold)]/10 text-gold border-[color:var(--gold)]/30"
      : tone === "success"
      ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/30"
      : tone === "danger"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-secondary text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium border ${cls}`}>
      {children}
    </span>
  );
}

export function GoldButton({
  children,
  onClick,
  type = "button",
  full,
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  full?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${full ? "w-full" : ""} ${
        size === "lg" ? "h-12 text-base" : "h-10 text-sm"
      } px-5 inline-flex items-center justify-center gap-2 rounded-xl font-semibold bg-gradient-to-b from-[oklch(0.9_0.14_94)] to-[oklch(0.74_0.17_88)] text-[oklch(0.16_0.01_90)] shadow-[var(--shadow-glow)] hover:brightness-105 active:brightness-95 transition`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${full ? "w-full" : ""} h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl font-medium text-sm border border-border bg-secondary/50 hover:bg-secondary text-foreground transition`}
    >
      {children}
    </button>
  );
}

export function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
export function money2(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
