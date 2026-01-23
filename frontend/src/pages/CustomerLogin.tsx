import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, Mail, Lock, Smartphone } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function CustomerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [googleReady, setGoogleReady] = useState(false);
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();

  useEffect(() => {
    console.log("Loading Google script...");
    const id = "google-identity";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => {
        console.log("Google script loaded successfully");
        setGoogleReady(true);
      };
      s.onerror = () => {
        console.error("Failed to load Google Identity script");
        setGoogleReady(false);
      };
      document.head.appendChild(s);
    } else {
      console.log("Google script already present");
      setGoogleReady(Boolean((window as any).google?.accounts?.oauth2));
    }
  }, []);

  // PKCE helpers - REMOVE sha256 and code_verifier generation
  const base64UrlEncode = (arrayBuffer: ArrayBuffer) => {
    const bytes = new Uint8Array(arrayBuffer);
    let str = "";
    for (const charCode of bytes) str += String.fromCharCode(charCode);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  // remove generateCodeVerifier and sha256; only keep state generator
  const generateState = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64UrlEncode(array.buffer);
  };

  const onGoogleLogin = async () => {
    console.log("Google login clicked, googleReady:", googleReady);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log("VITE_GOOGLE_CLIENT_ID:", clientId);
    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID not set");
      return;
    }
    if (!(window as any).google?.accounts?.oauth2?.initCodeClient) {
      console.error("Google initCodeClient not available");
      return;
    }
    // generate state only (CSRF protection)
    const state = generateState();
    sessionStorage.setItem("google_oauth_state", state);

    // init Google's Code client and request code (popup) with state
    // @ts-ignore
    const client = (window as any).google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      state, // pass state through to callback
      callback: async (resp: any) => {
        console.log("Google callback received:", resp);
        // enforce state matches
        const receivedState = resp?.state;
        const storedState = sessionStorage.getItem("google_oauth_state");
        if (!receivedState || !storedState || receivedState !== storedState) {
          console.error("Invalid or missing OAuth state - possible CSRF");
          return;
        }
        const auth_code = resp?.code;
        if (!auth_code) {
          console.error("No auth_code in response");
          return;
        }
        try {
          // send only auth_code to backend; GIS popup flow manages PKCE internally
          const res = await api.post("/auth/google", { auth_code });
          console.log("Backend response:", res.data);
          const token = res.data?.access_token;
          if (token) {
            localStorage.setItem("accessToken", token);
            // handle post-login redirect if present
            const stateRedirect = (location.state as any)?.redirectTo;
            const savedRedirect = localStorage.getItem("postLoginRedirect");
            const target = stateRedirect || savedRedirect;
            if (target) {
              localStorage.removeItem("postLoginRedirect");
              navigate(target);
            } else {
              navigate("/");
            }
          }
        } catch (err) {
          console.error("Google login failed:", err);
        } finally {
          sessionStorage.removeItem("google_oauth_state");
        }
      },
    });
    client.requestCode();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="text-primary" size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Customer Portal</h1>
            <p className="text-gray-600">
              Sell your phone and track your orders
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Login to your customer account"
                  : "Sign up to start selling your phones"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email or Phone</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    placeholder="your@email.com or +91 98765 43210"
                    className="pl-10"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                className="w-full bg-primary text-primary-foreground hover:brightness-95"
                onClick={async () => {
                  try {
                    if (isLogin) {
                      const ok = await login(identifier, password, "customer");
                      if (ok) {
                        const stateRedirect = (location.state as any)
                          ?.redirectTo;
                        const savedRedirect =
                          localStorage.getItem("postLoginRedirect");
                        const target = stateRedirect || savedRedirect;
                        if (target) {
                          localStorage.removeItem("postLoginRedirect");
                          navigate(target);
                        } else {
                          navigate("/");
                        }
                      }
                    } else {
                      const signupEmail =
                        identifier && identifier.includes("@")
                          ? identifier
                          : `${identifier}@phone.local`;
                      const ok = await signup(
                        signupEmail,
                        password,
                        "customer",
                        fullName || signupEmail.split("@")[0],
                      );
                      if (ok) {
                        const stateRedirect = (location.state as any)
                          ?.redirectTo;
                        const savedRedirect =
                          localStorage.getItem("postLoginRedirect");
                        const target = stateRedirect || savedRedirect;
                        if (target) {
                          localStorage.removeItem("postLoginRedirect");
                          navigate(target);
                        } else {
                          navigate("/");
                        }
                      }
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                {isLogin ? "Login" : "Create Account"}
              </Button>

              <div className="text-center text-sm">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? "Sign up" : "Login"}
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={onGoogleLogin}>
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  OTP
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
