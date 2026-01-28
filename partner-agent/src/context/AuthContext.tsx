import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

interface User {
  id: number;
  email: string;
  name: string;
  type: "partner" | "agent";
  credit_balance?: number;
  is_on_hold?: boolean;
  hold_reason?: string;
  hold_lift_date?: string;
}

interface AuthContextType {
  user: User | null;
  userType: "partner" | "agent" | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    type: "partner" | "agent",
  ) => Promise<void>;
  signup: (
    full_name: string,
    email: string,
    password: string,
    phone: string,
    company_name: string,
    business_address: string,
    gst_number: string,
    pan_number: string,
    serviceable_pincodes: string[],
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"partner" | "agent" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("userType") as "partner" | "agent" | null;

    if (token && type) {
      setUserType(type);
      fetchUser(type);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (type: "partner" | "agent") => {
    try {
      const endpoint = type === "partner" ? "/partner/me" : "/agent/me";
      const response = await api.get(endpoint);
      // normalize name field from backend (`full_name`) to `name` used across frontend
      const data: any = response.data;
      const name = data.full_name ?? data.fullName ?? data.name ?? data.email;
      setUser({ ...data, type, name });
      setUserType(type);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    type: "partner" | "agent",
  ) => {
    const endpoint = type === "partner" ? "/partner/login" : "/agent/login";
    const response = await api.post(endpoint, { email, password });

    localStorage.setItem("token", response.data.access_token);
    localStorage.setItem("userType", type);
    setUserType(type);
    await fetchUser(type);
  };

  const signup = async (
    full_name: string,
    email: string,
    password: string,
    phone: string,
    company_name: string,
    business_address: string,
    gst_number: string,
    pan_number: string,
    serviceable_pincodes: string[],
  ) => {
    const response = await api.post("/partner/signup", {
      full_name,
      email,
      password,
      phone,
      company_name,
      business_address,
      gst_number: gst_number || null,
      pan_number,
      serviceable_pincodes,
    });

    localStorage.setItem("token", response.data.access_token);
    localStorage.setItem("userType", "partner");
    setUserType("partner");
    await fetchUser("partner");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    setUser(null);
    setUserType(null);
  };

  const refreshUser = async () => {
    if (userType) {
      await fetchUser(userType);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userType, loading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
