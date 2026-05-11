import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "tech" | "admin";
export type SessionUser = { name: string; role: Role; avatar: string };

type RoleCtx = {
  role: Role | null;
  user: SessionUser | null;
  signIn: (role: Role, name: string, password: string, avatar: string) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
  setAvatar: (avatar: string) => void;
};

const Ctx = createContext<RoleCtx | null>(null);
const KEY = "lwc.session.v2";

// Demo passwords. In a real build these would be hashed server-side.
const OWNER_PASSWORD = "owner123";
const TECH_PASSWORD = "tech123";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const signIn: RoleCtx["signIn"] = (role, name, password, avatar) => {
    const expected = role === "admin" ? OWNER_PASSWORD : TECH_PASSWORD;
    if (!name.trim()) return { ok: false, error: "Enter your name." };
    if (password !== expected) return { ok: false, error: "Incorrect password." };
    const u: SessionUser = { name: name.trim(), role, avatar };
    setUser(u);
    localStorage.setItem(KEY, JSON.stringify(u));
    return { ok: true };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(KEY);
  };

  const setAvatar = (avatar: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, avatar };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ role: user?.role ?? null, user, signIn, signOut, setAvatar }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession must be inside RoleProvider");
  return c;
}

export const AVATARS = ["🧑‍🔧", "👨‍🔧", "👩‍🔧", "🧔", "👱", "👨‍💼", "👷", "🦸", "🧑‍💼", "🦊", "🐻", "🦁"];
