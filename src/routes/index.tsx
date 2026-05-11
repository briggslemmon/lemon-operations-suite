import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/role";
import { useState, useEffect } from "react";
import { GoldButton, GhostButton } from "@/components/ui-bits";
import { Wrench, Crown } from "lucide-react";

export const Route = createFileRoute("/")({
  component: SignIn,
});

function SignIn() {
  const { user, signIn } = useSession();
  const nav = useNavigate();
  const [name, setName] = useState("Marcus Reed");

  useEffect(() => {
    if (user) nav({ to: user.role === "admin" ? "/admin" : "/tech" });
  }, [user, nav]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-[oklch(0.92_0.12_95)] to-[oklch(0.7_0.18_88)] grid place-items-center text-[oklch(0.16_0.01_90)] font-black text-2xl shadow-[var(--shadow-glow)]">
            L
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Lemmon <span className="gold-gradient-text">Operations</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Internal app for technicians & ownership.
          </p>
        </div>

        <div className="surface-card p-5">
          <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full h-11 px-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] text-sm"
          />

          <div className="mt-4 grid gap-2">
            <GoldButton
              full
              size="lg"
              onClick={() => {
                signIn("tech", name || "Technician");
                nav({ to: "/tech" });
              }}
            >
              <Wrench className="size-4" /> Sign in as Technician
            </GoldButton>
            <GhostButton
              full
              onClick={() => {
                signIn("admin", name || "Owner");
                nav({ to: "/admin" });
              }}
            >
              <Crown className="size-4" /> Sign in as Owner / Admin
            </GhostButton>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          v1 preview · role selection is for demo only
        </p>
      </div>
    </div>
  );
}
