import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "agent" | "customer" | "admin";
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (
    identifier: string,
    password: string,
    role?: "user" | "agent" | "customer",
    name?: string
  ) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    role?: "user" | "agent" | "customer",
    name?: string,
    phone?: string
  ) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user & token from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const token = localStorage.getItem("accessToken");
    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("accessToken");
      }
    }
  }, []);

  async function fetchMe(token: string) {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  }

  const login = async (
    identifier: string,
    password: string,
    role?: "user" | "agent" | "customer",
    name?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (!res.ok) return false;
      const data = await res.json(); // { access_token, token_type }
      const token = data.access_token;
      localStorage.setItem("accessToken", token);

      const me = await fetchMe(token);
      const mappedUser: User = {
        id: String(me.id),
        name: me.full_name || name || me.email.split("@")[0],
        email: me.email,
        role: (me.role as User["role"]) || "customer",
      };
      localStorage.setItem("currentUser", JSON.stringify(mappedUser));
      setUser(mappedUser);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (
    email: string,
    password: string,
    role: "user" | "agent" | "customer" = "customer",
    name?: string,
    phone?: string
  ): Promise<boolean> => {
    try {
      const payload = {
        email,
        password,
        full_name: name,
        phone,
        role: role === "user" ? "customer" : role,
      };
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return false;
      // auto-login after signup
      return await login(phone || email, password, role, name);
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    console.log("User logged out");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, login, signup, logout }}
    >
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
