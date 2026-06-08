import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "tech" | "owner";
export type Account = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string; // data URL or emoji
  password: string;
  role: Role;
};
export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  avatar: string;
  email: string;
  phone: string;
};

type SignUpInput = Omit<Account, "id" | "role">;

type RoleCtx = {
  role: Role | null;
  user: SessionUser | null;
  hydrated: boolean;
  signIn: (username: string, password: string) => { ok: true; user: SessionUser } | { ok: false; error: string };
  signUp: (data: SignUpInput) => { ok: true; user: SessionUser } | { ok: false; error: string };
  signOut: () => void;
  setAvatar: (avatar: string) => void;
  listAccounts: () => Account[];
};

const Ctx = createContext<RoleCtx | null>(null);
const SESSION_KEY = "lwc.session.v4";
const ACCOUNTS_KEY = "lwc.accounts.v2";

const DEMO_TECH: Account = {
  id: "demo-tech",
  username: "demo",
  firstName: "Demo",
  lastName: "Tech",
  email: "demo@demo.com",
  phone: "(555) 000-0000",
  avatar: "🧑‍🔧",
  password: "demo",
  role: "tech",
};
const DEMO_OWNER: Account = {
  id: "demo-owner",
  username: "owner",
  firstName: "Demo",
  lastName: "Owner",
  email: "owner@demo.com",
  phone: "(555) 111-1111",
  avatar: "👑",
  password: "owner",
  role: "owner",
};

export function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const list: Account[] = raw ? JSON.parse(raw) : [];
    let changed = false;
    if (!list.find((a) => a.username === DEMO_TECH.username)) { list.push(DEMO_TECH); changed = true; }
    if (!list.find((a) => a.username === DEMO_OWNER.username)) { list.push(DEMO_OWNER); changed = true; }
    if (changed) localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [DEMO_TECH, DEMO_OWNER];
  }
}

function saveAccounts(list: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

function toSessionUser(a: Account): SessionUser {
  return {
    id: a.id,
    name: `${a.firstName} ${a.lastName}`.trim(),
    username: a.username,
    role: a.role,
    avatar: a.avatar,
    email: a.email,
    phone: a.phone,
  };
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      loadAccounts();
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const signIn: RoleCtx["signIn"] = (username, password) => {
    const u = username.trim().toLowerCase();
    if (!u) return { ok: false, error: "Enter your username." };
    const accounts = loadAccounts();
    const acct = accounts.find((a) => a.username.toLowerCase() === u);
    if (!acct) return { ok: false, error: "No account with that username." };
    if (acct.password !== password) return { ok: false, error: "Incorrect password." };
    const su = toSessionUser(acct);
    setUser(su);
    localStorage.setItem(SESSION_KEY, JSON.stringify(su));
    return { ok: true, user: su };
  };

  const signUp: RoleCtx["signUp"] = (data) => {
    if (!data.username.trim()) return { ok: false, error: "Choose a username." };
    if (!/^[a-zA-Z0-9_.]+$/.test(data.username)) return { ok: false, error: "Username: letters, numbers, _ or . only." };
    if (!data.firstName.trim() || !data.lastName.trim()) return { ok: false, error: "Enter your full name." };
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return { ok: false, error: "Enter a valid email." };
    if (!data.phone.trim()) return { ok: false, error: "Enter your phone number." };
    if (!data.avatar) return { ok: false, error: "Upload a profile picture." };
    if (data.password.length < 4) return { ok: false, error: "Password must be at least 4 characters." };

    const accounts = loadAccounts();
    const uname = data.username.trim().toLowerCase();
    if (accounts.find((a) => a.username.toLowerCase() === uname)) {
      return { ok: false, error: "Username already taken." };
    }
    // First non-demo account becomes owner; everyone else is a tech.
    const hasRealOwner = accounts.some((a) => a.role === "owner" && !a.id.startsWith("demo-"));
    const role: Role = hasRealOwner ? "tech" : "owner";
    const acct: Account = { ...data, username: uname, email: data.email.trim(), id: `u_${Date.now()}`, role };
    accounts.push(acct);
    saveAccounts(accounts);
    const su = toSessionUser(acct);
    setUser(su);
    localStorage.setItem(SESSION_KEY, JSON.stringify(su));
    return { ok: true, user: su };
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
    <Ctx.Provider value={{ role: user?.role ?? null, user, hydrated, signIn, signUp, signOut, setAvatar, listAccounts: loadAccounts }}>
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
