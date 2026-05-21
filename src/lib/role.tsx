import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "tech";
export type Account = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string; // data URL or emoji
  password: string;
};
export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email: string;
  phone: string;
};

type SignUpInput = Omit<Account, "id">;

type RoleCtx = {
  role: Role | null;
  user: SessionUser | null;
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signUp: (data: SignUpInput) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
  setAvatar: (avatar: string) => void;
};

const Ctx = createContext<RoleCtx | null>(null);
const SESSION_KEY = "lwc.session.v3";
const ACCOUNTS_KEY = "lwc.accounts.v1";

const DEMO_ACCOUNT: Account = {
  id: "demo",
  firstName: "Demo",
  lastName: "Tech",
  email: "demo@demo.com",
  phone: "(555) 000-0000",
  avatar: "🧑‍🔧",
  password: "demo",
};

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const list: Account[] = raw ? JSON.parse(raw) : [];
    if (!list.find((a) => a.email.toLowerCase() === DEMO_ACCOUNT.email)) {
      list.push(DEMO_ACCOUNT);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [DEMO_ACCOUNT];
  }
}

function saveAccounts(list: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

function toSessionUser(a: Account): SessionUser {
  return {
    id: a.id,
    name: `${a.firstName} ${a.lastName}`.trim(),
    role: "tech",
    avatar: a.avatar,
    email: a.email,
    phone: a.phone,
  };
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      loadAccounts(); // seed demo
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const signIn: RoleCtx["signIn"] = (email, password) => {
    const e = email.trim().toLowerCase();
    if (!e) return { ok: false, error: "Enter your email." };
    const accounts = loadAccounts();
    const acct = accounts.find((a) => a.email.toLowerCase() === e);
    if (!acct) return { ok: false, error: "No account found with that email." };
    if (acct.password !== password) return { ok: false, error: "Incorrect password." };
    const u = toSessionUser(acct);
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    return { ok: true };
  };

  const signUp: RoleCtx["signUp"] = (data) => {
    if (!data.firstName.trim() || !data.lastName.trim()) return { ok: false, error: "Enter your full name." };
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return { ok: false, error: "Enter a valid email." };
    if (!data.phone.trim()) return { ok: false, error: "Enter your phone number." };
    if (!data.avatar) return { ok: false, error: "Upload a profile picture." };
    if (data.password.length < 4) return { ok: false, error: "Password must be at least 4 characters." };

    const accounts = loadAccounts();
    const email = data.email.trim().toLowerCase();
    if (accounts.find((a) => a.email.toLowerCase() === email)) {
      return { ok: false, error: "An account with that email already exists." };
    }
    const acct: Account = { ...data, email, id: `u_${Date.now()}` };
    accounts.push(acct);
    saveAccounts(accounts);
    const u = toSessionUser(acct);
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    return { ok: true };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const setAvatar = (avatar: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, avatar };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      const accounts = loadAccounts();
      const idx = accounts.findIndex((a) => a.id === prev.id);
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], avatar };
        saveAccounts(accounts);
      }
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ role: user?.role ?? null, user, signIn, signUp, signOut, setAvatar }}>
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
