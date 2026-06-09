import { type ReactNode } from "react";

export function BarChart({
  data,
  format = (v: number) => String(v),
  height = 140,
  accent,
}: {
  data: { label: string; value: number; sub?: string }[];
  format?: (v: number) => string;
  height?: number;
  accent?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 24);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
              <div className="text-[9px] font-medium text-muted-foreground truncate w-full text-center">
                {d.value > 0 ? format(d.value) : ""}
              </div>
              <div
                className={`w-full rounded-t-md transition-all ${
                  accent
                    ? "bg-gradient-to-t from-[oklch(0.74_0.17_88)] to-[oklch(0.9_0.14_94)]"
                    : "bg-gradient-to-t from-secondary to-secondary/40 border border-border"
                }`}
                style={{ height: Math.max(2, h) }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-[10px] text-muted-foreground text-center truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({
  data,
  height = 60,
  className = "",
}: {
  data: number[];
  height?: number;
  className?: string;
}) {
  if (data.length === 0) data = [0];
  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const w = 300;
  const h = height;
  const step = w / Math.max(1, data.length - 1);
  const pts = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `M0,${h} L${pts.replaceAll(" ", " L")} L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full ${className}`} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.16 92)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="oklch(0.85 0.16 92)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <polyline
        points={pts}
        fill="none"
        stroke="oklch(0.82 0.16 90)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Donut({
  segments,
  size = 140,
  label,
  sublabel,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  label?: ReactNode;
  sublabel?: ReactNode;
}) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  const r = (size - 20) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(0.27 0.01 90)" strokeWidth="14" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-lg font-semibold leading-none">{label}</div>
          {sublabel && <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}

export function Leaderboard({
  rows,
  format = (v: number) => String(v),
}: {
  rows: { label: string; value: number; sub?: string; avatar?: ReactNode }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="grid gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-7 grid place-items-center rounded-full bg-secondary text-[11px] font-bold shrink-0">
            {i + 1}
          </div>
          {r.avatar}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline gap-2">
              <div className="text-sm font-medium truncate">{r.label}</div>
              <div className="text-sm font-semibold whitespace-nowrap">{format(r.value)}</div>
            </div>
            <div className="mt-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[oklch(0.74_0.17_88)] to-[oklch(0.9_0.14_94)]"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
            {r.sub && <div className="text-[10px] text-muted-foreground mt-1">{r.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
