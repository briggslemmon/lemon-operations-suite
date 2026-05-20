import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Wallet,
  Calculator,
  LogOut,
  Search,
  Timer,
} from "lucide-react";
import { useSession } from "@/lib/role";
import { useEffect, type ReactNode } from "react";

type NavItem = { to: string; label: string; icon: ReactNode };

const TECH_NAV: NavItem[] = [
  { to: "/tech", label: "Home", icon: <Home className="size-5" /> },
  { to: "/tech/available", label: "Available", icon: <Search className="size-5" /> },
  { to: "/tech/time", label: "Time", icon: <Timer className="size-5" /> },
  { to: "/tech/calculator", label: "Quote", icon: <Calculator className="size-5" /> },
  { to: "/tech/payroll", label: "Pay", icon: <Wallet className="size-5" /> },
];

export function AppShell({ requiredRole }: { requiredRole: "tech" | "admin" }) {
  const { user, signOut } = useSession();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!user) nav({ to: "/" });
    else if (user.role !== requiredRole) {
      nav({ to: "/tech" });
    }
  }, [user, requiredRole, nav]);

  if (!user || user.role !== requiredRole) return null;

  const items = TECH_NAV;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link to="/tech" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-[oklch(0.92_0.12_95)] to-[oklch(0.7_0.18_88)] flex items-center justify-center text-[oklch(0.16_0.01_90)] font-black text-sm shadow-[var(--shadow-glow)]">
              L
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-tight">Lemmon</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Window Cleaning
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-xs font-medium">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Technician
              </div>
            </div>
            <div className="size-9 rounded-full bg-secondary border border-border grid place-items-center text-lg" aria-hidden>
              {user.avatar || "🙂"}
            </div>
            <button
              onClick={() => {
                signOut();
                nav({ to: "/" });
              }}
              className="size-9 grid place-items-center rounded-lg border border-border hover:bg-accent transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-5 pb-28">
          {requiredRole === "tech" && <ClockBar />}
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-2 py-2 grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
          {items.map((it) => {
            const active = loc.pathname === it.to || (it.to !== "/tech" && it.to !== "/admin" && loc.pathname.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={active ? "text-gold" : ""}>{it.icon}</span>
                {it.label}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
