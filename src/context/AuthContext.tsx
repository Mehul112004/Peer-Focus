import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ error?: string }>;
  signup: (
    username: string,
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "peer-focus-session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = (userData: User) => {
    setUser(userData);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    // Also keep backward-compatible localStorage keys
    localStorage.setItem("peer-focus-user-id", userData.id);
    localStorage.setItem("peer-focus-user-name", userData.display_name);
  };

  const signup = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      displayName: string,
    ): Promise<{ error?: string }> => {
      try {
        // Check if username or email already exists
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .or(`username.eq.${username},email.eq.${email}`)
          .limit(1);

        if (existing && existing.length > 0) {
          return { error: "Username or email already taken" };
        }

        const { data, error } = await supabase
          .from("users")
          .insert({
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            password,
            display_name: displayName.trim(),
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            return { error: "Username or email already taken" };
          }
          return { error: error.message };
        }

        const userData: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          display_name: data.display_name,
          created_at: data.created_at,
        };

        saveSession(userData);
        return {};
      } catch (err: unknown) {
        return {
          error: err instanceof Error ? err.message : "Something went wrong",
        };
      }
    },
    [],
  );

  const login = useCallback(
    async (
      identifier: string,
      password: string,
    ): Promise<{ error?: string }> => {
      try {
        const trimmed = identifier.toLowerCase().trim();

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .or(`username.eq.${trimmed},email.eq.${trimmed}`)
          .single();

        if (error || !data) {
          return { error: "User not found" };
        }

        if (data.password !== password) {
          return { error: "Incorrect password" };
        }

        const userData: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          display_name: data.display_name,
          created_at: data.created_at,
        };

        saveSession(userData);
        return {};
      } catch (err: unknown) {
        return {
          error: err instanceof Error ? err.message : "Something went wrong",
        };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("peer-focus-user-id");
    localStorage.removeItem("peer-focus-user-name");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
