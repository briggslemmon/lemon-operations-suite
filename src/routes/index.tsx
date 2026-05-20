import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession, AVATARS } from "@/lib/role";
import { useState, useEffect } from "react";
import { GoldButton } from "@/components/ui-bits";
import { Lock, User } from "lucide-react";

export const Route = createFileRoute("/")({
  component: SignIn,
});

function SignIn() {
  const { user, signIn } = useSession();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) nav({ to: "/tech" });
  }, [user, nav]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = signIn("tech", name, password, avatar);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    nav({ to: "/tech" });
  };

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
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue.</p>
        </div>

        <div className="surface-card p-5">
          <form onSubmit={submit} className="grid gap-3">
            <Field icon={<User className="size-4" />} placeholder="Your name" value={name} onChange={setName} />
            <Field icon={<Lock className="size-4" />} placeholder="Password" type="password" value={password} onChange={setPassword} />

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <GoldButton full size="lg" type="submit">
              Sign in
            </GoldButton>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Demo password · <span className="font-mono">tech123</span>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon, placeholder, value, onChange, type = "text",
}: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-9 pr-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] text-sm"
      />
    </div>
  );
}
