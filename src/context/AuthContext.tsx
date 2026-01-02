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
  role: "user" | "agent" | "customer";
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (
    email: string,
    password: string,
    role: "user" | "agent" | "customer",
    name?: string
  ) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    role: "user" | "agent" | "customer",
    name?: string
  ): Promise<boolean> => {
    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation (in real app, this would be an API call)
    // Accept any email/phone with password length >= 4 for demo
    if (email && password.length >= 4) {
      const newUser: User = {
        id: `${role}-${Date.now()}`,
        name: name || email.split("@")[0],
        email,
        role: role === "customer" ? "user" : role,
      };

      // Save to state
      setUser(newUser);

      // Save to localStorage for persistence
      localStorage.setItem("currentUser", JSON.stringify(newUser));

      console.log("User logged in:", newUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    console.log("User logged out");
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
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
