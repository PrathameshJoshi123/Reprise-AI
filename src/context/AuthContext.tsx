import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  pincode?: string;
  role: "user" | "agent" | "customer";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (data: any) => Promise<void>;
  loginWithEmail: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        // Clean up legacy
        localStorage.removeItem("temp_pincode");
        localStorage.removeItem("temp_phone");



        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = (sbUser: SupabaseUser): User => {
    return {
      id: sbUser.id,
      email: sbUser.email,
      name: sbUser.user_metadata?.full_name || sbUser.email?.split("@")[0],
      phone: sbUser.user_metadata?.phone || sbUser.phone,
      pincode: sbUser.user_metadata?.pincode,
      role: "customer", // Default role
    };
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/sell-phone`
      }
    });
    if (error) throw error;
  };

  const signupWithEmail = async ({ email, password, name, phone, pincode }: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone,
          pincode: pincode
        }
      }
    });
    if (error) throw error;
  };

  const loginWithEmail = async ({ email, password }: any) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const updateProfile = async ({ phone, pincode }: any) => {
    const updates: any = {};
    if (phone) updates.phone = phone;
    if (pincode) updates.pincode = pincode;

    const { error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) throw error;

    // Update local state immediately for UI responsiveness
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoggedIn: !!user,
        loginWithGoogle,
        signupWithEmail,
        loginWithEmail,
        updateProfile,
        logout,
        isLoading,
      }}
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