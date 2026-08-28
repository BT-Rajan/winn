import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest, getStoredRefreshToken, setSessionTokens } from "../lib/apiClient";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; fullName: string; role: "customer" | "builder" }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on load if a refresh token is already stored.
    async function restore() {
      const stored = getStoredRefreshToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const result = await apiRequest<AuthResponse>("/auth/refresh", {
          method: "POST",
          body: { refreshToken: stored },
        });
        setSessionTokens(result);
        const me = await apiRequest<{ user: AuthUser }>("/users/me");
        setUser(me.user);
      } catch {
        setSessionTokens(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email: string, password: string) {
    const result = await apiRequest<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });
    setSessionTokens(result);
    setUser(result.user);
  }

  async function register(input: { email: string; password: string; fullName: string; role: "customer" | "builder" }) {
    const result = await apiRequest<AuthResponse>("/auth/register", { method: "POST", body: input });
    setSessionTokens(result);
    setUser(result.user);
  }

  function logout() {
    const stored = getStoredRefreshToken();
    if (stored) {
      apiRequest("/auth/logout", { method: "POST", body: { refreshToken: stored } }).catch(() => undefined);
    }
    setSessionTokens(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
