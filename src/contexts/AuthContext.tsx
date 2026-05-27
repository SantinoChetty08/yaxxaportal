import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, PortalUserAccount } from "@/types";
import { authenticatePortalUser, getCurrentPortalSession, logoutPortalUser } from "@/services/api";

const STORAGE_KEY = "yaxxa-portal-session";
const USES_BACKEND_AUTH = import.meta.env.VITE_PORTAL_AUTH_MODE === "backend";

interface AuthContextValue {
  user: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const session = await getCurrentPortalSession();
      if (!active) return;

      if (session) {
        setUser(session);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else if (USES_BACKEND_AUTH) {
        window.localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      } else {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as AuthSession;
            setUser(parsed);
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        }
      }

      setIsLoading(false);
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      signIn: async (username: string, password: string) => {
        const session = await authenticatePortalUser({ username, password });
        setUser(session);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return session;
      },
      signOut: async () => {
        await logoutPortalUser();
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
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
