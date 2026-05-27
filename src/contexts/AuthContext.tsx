import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, PortalUserAccount } from "@/types";
import { authenticatePortalUser } from "@/services/api";

const STORAGE_KEY = "yaxxa-portal-session";

interface AuthContextValue {
  user: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<AuthSession>;
  signOut: () => void;
  reconcilePortalUser: (account: PortalUserAccount | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      signIn: async (username: string, password: string) => {
        const session = await authenticatePortalUser({ username, password });
        setUser(session);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return session;
      },
      signOut: () => {
        setUser(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
      reconcilePortalUser: (account) => {
        setUser((current) => {
          if (!current || !account || current.id !== account.id || account.status !== "active") {
            if (!account || (current && current.id === account.id && account.status !== "active")) {
              window.localStorage.removeItem(STORAGE_KEY);
              return null;
            }
            return current;
          }

          const nextSession = {
            ...current,
            fullName: account.fullName,
            username: account.username,
            email: account.email,
            role: account.role,
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
          return nextSession;
        });
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
