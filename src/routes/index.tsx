import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/role";
import { useState, useEffect, useRef } from "react";
import { GoldButton } from "@/components/ui-bits";
import { Lock, User, Mail, Phone, Camera, AtSign } from "lucide-react";

export const Route = createFileRoute("/")({
  component: SignInPage,
});

type Mode = "signin" | "signup";

function landingFor(role: "tech" | "owner") {
  return role === "owner" ? "/owner" : "/tech";
}

function SignInPage() {
  const { user, hydrated, signIn, signUp } = useSession();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");

  useEffect(() => {
    if (hydrated && user) nav({ to: landingFor(user.role) });
  }, [user, hydrated, nav]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-[oklch(0.92_0.12_95)] to-[oklch(0.7_0.18_88)] grid place-items-center text-[oklch(0.16_0.01_90)] font-black text-2xl shadow-[var(--shadow-glow)]">
            L
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Lemmon <span className="gold-gradient-text">Operations</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to continue." : "Create your account."}
          </p>
        </div>

        <div className="grid grid-cols-2 p-1 rounded-xl bg-secondary/40 border border-border mb-4 text-sm">
          <button
            onClick={() => setMode("signin")}
            className={`h-9 rounded-lg transition ${mode === "signin" ? "bg-background shadow font-medium" : "text-muted-foreground"}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`h-9 rounded-lg transition ${mode === "signup" ? "bg-background shadow font-medium" : "text-muted-foreground"}`}
          >
            Create account
          </button>
        </div>

        <div className="surface-card p-5">
          {mode === "signin"
            ? <SignInForm signIn={signIn} onDone={(u) => nav({ to: landingFor(u.role) })} />
            : <SignUpForm signUp={signUp} onDone={(u) => nav({ to: landingFor(u.role) })} />}
        </div>

        <div className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed">
          Tech demo · <span className="font-mono">demo</span> / <span className="font-mono">demo</span><br />
          Owner demo · <span className="font-mono">owner</span> / <span className="font-mono">owner</span>
        </div>
      </div>
    </div>
  );
}

function SignInForm({ signIn, onDone }: { signIn: ReturnType<typeof useSession>["signIn"]; onDone: (u: { role: "tech" | "owner" }) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = signIn(username, password);
    if (!res.ok) return setError(res.error);
    onDone(res.user);
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Field icon={<AtSign className="size-4" />} placeholder="Username" value={username} onChange={setUsername} autoCapitalize="none" />
      <Field icon={<Lock className="size-4" />} placeholder="Password" type="password" value={password} onChange={setPassword} />
      {error && <ErrorBox msg={error} />}
      <GoldButton full size="lg" type="submit">Sign in</GoldButton>
    </form>
  );
}

function SignUpForm({ signUp, onDone }: { signUp: ReturnType<typeof useSession>["signUp"]; onDone: (u: { role: "tech" | "owner" }) => void }) {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatarUrl] = useState<string>("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2_500_000) return setError("Image too large (max ~2.5MB).");
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = signUp({ username, firstName, lastName, email, phone, password, avatar });
    if (!res.ok) return setError(res.error);
    onDone(res.user);
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="size-16 rounded-2xl border border-border bg-secondary/60 grid place-items-center overflow-hidden shrink-0"
          aria-label="Upload profile picture"
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera className="size-5 text-muted-foreground" />
          )}
        </button>
        <div className="text-xs text-muted-foreground">
          {avatar ? "Looking good. Tap to change." : "Tap to upload your profile picture."}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      <Field icon={<AtSign className="size-4" />} placeholder="Username" value={username} onChange={setUsername} autoCapitalize="none" />
      <div className="grid grid-cols-2 gap-2">
        <Field icon={<User className="size-4" />} placeholder="First name" value={firstName} onChange={setFirstName} />
        <Field icon={<User className="size-4" />} placeholder="Last name" value={lastName} onChange={setLastName} />
      </div>
      <Field icon={<Mail className="size-4" />} placeholder="Email" type="email" value={email} onChange={setEmail} />
      <Field icon={<Phone className="size-4" />} placeholder="Phone number" type="tel" value={phone} onChange={setPhone} />
      <Field icon={<Lock className="size-4" />} placeholder="Password" type="password" value={password} onChange={setPassword} />

      {error && <ErrorBox msg={error} />}
      <GoldButton full size="lg" type="submit">Create account</GoldButton>
    </form>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
      {msg}
    </div>
  );
}

function Field({
  icon, placeholder, value, onChange, type = "text", autoCapitalize,
}: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type?: string; autoCapitalize?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        className="w-full h-11 pl-9 pr-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] text-sm"
      />
    </div>
  );
}
