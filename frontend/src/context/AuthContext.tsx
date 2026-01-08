import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "../lib/api"; // Adjust the import based on your project structure

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "agent" | "customer" | "admin";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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
    phone?: string,
    address?: string,
    latitude?: number | null,
    longitude?: number | null
  ) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000"
).replace(/\/$/, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load user & token from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const savedToken = localStorage.getItem("accessToken");
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
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
      const response = await api.post("/auth/login", {
        identifier,
        password,
      });
      const token = response.data.access_token;
      localStorage.setItem("accessToken", token);
      setToken(token);

      // Fetch user data after login
      const userResponse = await api.get("/auth/me");
      const mappedUser: User = {
        id: String(userResponse.data.id),
        name:
          userResponse.data.full_name ||
          name ||
          userResponse.data.email.split("@")[0],
        email: userResponse.data.email,
        phone: userResponse.data.phone,
        role: (userResponse.data.role as User["role"]) || "customer",
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
    phone?: string,
    address?: string,
    latitude?: number | null,
    longitude?: number | null
  ): Promise<boolean> => {
    try {
      const payload = {
        email,
        password,
        full_name: name,
        phone,
        role: role === "user" ? "customer" : role,
        address,
        latitude,
        longitude,
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
    setToken(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    console.log("User logged out");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoggedIn: !!user, login, signup, logout }}
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
