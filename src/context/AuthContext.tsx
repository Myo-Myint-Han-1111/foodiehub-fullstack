"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type UserRole = "CUSTOMER" | "SERVER" | "KITCHEN" | "COUNTER" | "ADMIN";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCachedUser(): User | null {
  try {
    const cached = localStorage.getItem("auth_user");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Invalid or unavailable localStorage
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Read localStorage cache + background validate via /api/auth/me
  useEffect(() => {
    // Instantly show cached user (client-only, avoids hydration mismatch)
    const cached = getCachedUser();
    if (cached) {
      setUser(cached);
      setIsLoading(false);
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        } else {
          // Session expired — clear cached user
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      } catch {
        // Network error — keep cached user for display, don't redirect
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      setUser(data.user);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "CUSTOMER") {
        router.push("/menu");
      } else if (data.user.role === "SERVER") {
        router.push("/server");
      } else if (data.user.role === "KITCHEN") {
        router.push("/kitchen");
      } else if (data.user.role === "COUNTER") {
        router.push("/counter");
      } else if (data.user.role === "ADMIN") {
        router.push("/admin");
      }
    } else {
      throw new Error(data.error || "Login failed");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue with client-side cleanup even if request fails
    }
    setUser(null);
    localStorage.removeItem("auth_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
