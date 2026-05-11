import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "tech" | "admin";

type RoleCtx = {
  role: Role | null;
  user: { name: string; role: Role } | null;
  signIn: (role: Role, name: string) => void;
  signOut: () => void;
};

const Ctx = createContext<RoleCtx | null>(null);
const KEY = "lwc.session";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RoleCtx["user"]>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const signIn = (role: Role, name: string) => {
    const u = { name, role };
    setUser(u);
    localStorage.setItem(KEY, JSON.stringify(u));
  };
  const signOut = () => {
    setUser(null);
    localStorage.removeItem(KEY);
  };

  return (
    <Ctx.Provider value={{ role: user?.role ?? null, user, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession must be inside RoleProvider");
  return c;
}
