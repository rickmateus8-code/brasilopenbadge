import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  balance: number;
  displayName?: string;
  profilePhoto?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; email?: string; displayName?: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Credenciais inválidas");
    }
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: { username: string; password: string; email?: string; displayName?: string }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Erro ao criar conta");
    }
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" }).finally(() => {
      setUser(null);
    });
  }, []);

  const refresh = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const updateBalance = useCallback((newBalance: number) => {
    setUser(prev => prev ? { ...prev, balance: newBalance } : null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      refresh,
      updateBalance,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
