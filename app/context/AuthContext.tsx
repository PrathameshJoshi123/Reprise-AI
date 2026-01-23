/**
 * Authentication Context
 * Manages user authentication state, login/logout, and token management
 * Reference: SPEC Section - Authentication & Authorization
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { tokenManager } from '../lib/api';
import type { User, Partner, Agent, PartnerAuthResponse, AgentAuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  userType: 'partner' | 'agent' | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, type: 'partner' | 'agent') => Promise<void>;
  signup: (
    full_name: string,
    email: string,
    password: string,
    phone: string,
    company_name: string,
    business_address: string,
    gst_number: string,
    pan_number: string,
    serviceable_pincodes: string[]
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'partner' | 'agent' | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored token on mount
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const [token, storedType] = await Promise.all([
        tokenManager.getToken(),
        tokenManager.getUserType(),
      ]);

      if (token && storedType) {
        setUserType(storedType);
        await fetchUser(storedType);
      }
    } catch (error) {
      console.error('Failed to check stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (type: 'partner' | 'agent') => {
    try {
      const endpoint = type === 'partner' ? '/partner/me' : '/agent/me';
      const response = await api.get(endpoint);
      const data = response.data;
      
      // Normalize name field from backend (full_name) to name
      const name = data.full_name ?? data.fullName ?? data.name ?? data.email;
      setUser({ ...data, type, name });
      setUserType(type);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      await tokenManager.clearAuth();
      throw error;
    }
  };

  const login = async (email: string, password: string, type: 'partner' | 'agent') => {
    const endpoint = type === 'partner' ? '/partner/login' : '/agent/login';
    const response = await api.post(endpoint, { email, password });

    const token = response.data.access_token;
    await tokenManager.setToken(token);
    await tokenManager.setUserType(type);
    
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
    serviceable_pincodes: string[]
  ) => {
    const response = await api.post<PartnerAuthResponse>('/partner/signup', {
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

    const token = response.data.access_token;
    await tokenManager.setToken(token);
    await tokenManager.setUserType('partner');
    
    setUserType('partner');
    await fetchUser('partner');
  };

  const logout = async () => {
    await tokenManager.clearAuth();
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
      value={{
        user,
        userType,
        loading,
        isLoading: loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;

};

export default AuthProvider;

