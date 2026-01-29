import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";
import { handleApiError } from "../lib/errorHandler";

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  type: "partner" | "agent";
  credit_balance?: number;
  is_on_hold?: boolean;
  hold_reason?: string;
  hold_lift_date?: string;
}

interface HoldInfo {
  reason: string;
  liftDate?: string;
}

interface AuthContextType {
  user: User | null;
  userType: "partner" | "agent" | null;
  loading: boolean;
  holdInfo: HoldInfo | null;
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
  clearHoldInfo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"partner" | "agent" | null>(null);
  const [loading, setLoading] = useState(true);
  const [holdInfo, setHoldInfo] = useState<HoldInfo | null>(null);

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
      setHoldInfo(null);
    } catch (error: any) {
      console.error("Failed to fetch user:", error);
      // Check if error is 403 (account on hold)
      if (error.response?.status === 403) {
        const holdData = error.response?.data;
        setHoldInfo({
          reason: holdData?.detail || "Your account has been placed on hold",
          liftDate: holdData?.hold_lift_date,
        });
        // Keep token but mark user as on hold
        return;
      }
      // Handle other errors with toast
      handleApiError(error, "auth");
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      setHoldInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    type: "partner" | "agent",
  ) => {
    try {
      const endpoint = type === "partner" ? "/partner/login" : "/agent/login";
      const response = await api.post(
        endpoint,
        { email, password },
        {
          headers: { "x-skip-auth-redirect": "true" },
        },
      );

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("userType", type);
      setUserType(type);
      await fetchUser(type);
    } catch (error: any) {
      // Check if error is 403 (account on hold)
      if (error.response?.status === 403) {
        const holdData = error.response?.data;
        setHoldInfo({
          reason: holdData?.detail || "Your account has been placed on hold",
          liftDate: holdData?.hold_lift_date,
        });
        // Store the type so we know which portal tried to login
        setUserType(type);
        return;
      }
      // Handle other login errors with toast
      handleApiError(error, "auth");
      throw error;
    }
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
    try {
      const response = await api.post(
        "/partner/signup",
        {
          full_name,
          email,
          password,
          phone,
          company_name,
          business_address,
          gst_number: gst_number || null,
          pan_number,
          serviceable_pincodes,
        },
        {
          headers: { "x-skip-auth-redirect": "true" },
        },
      );

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("userType", "partner");
      setUserType("partner");
      await fetchUser("partner");
    } catch (error: any) {
      handleApiError(error, "auth");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    setUser(null);
    setUserType(null);
    setHoldInfo(null);
  };

  const clearHoldInfo = () => {
    setHoldInfo(null);
  };

  const refreshUser = async () => {
    if (userType) {
      await fetchUser(userType);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loading,
        holdInfo,
        login,
        signup,
        logout,
        refreshUser,
        clearHoldInfo,
      }}
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
