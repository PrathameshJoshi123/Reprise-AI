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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Phone,
  Mail,
  Lock,
  Smartphone,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initCodeClient: (config: any) => { requestCode: () => void };
        };
      };
    };
  }
}

export default function CustomerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [googleReady, setGoogleReady] = useState(false);
  const [identifier, setIdentifier] = useState(""); // email
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [loginPhoneIdentifier, setLoginPhoneIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeValid, setPincodeValid] = useState(false);
  const [serviceableInfo, setServiceableInfo] = useState<any>(null);
  const [showGooglePincodeModal, setShowGooglePincodeModal] = useState(false);
  const [showGoogleProfileModal, setShowGoogleProfileModal] = useState(false);
  const [googleProfilePhone, setGoogleProfilePhone] = useState("");
  const [googleProfileAddress, setGoogleProfileAddress] = useState("");
  const [googleProcessing, setGoogleProcessing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, loginWithToken } = useAuth();

  // Helper to normalize phone number
  const normalizePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return cleaned.slice(2);
    }
    return cleaned;
  };

  // Check email availability
  const checkEmailAvailability = async (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailable(null);
      return;
    }
    try {
      const response = await api.get(`/auth/check-email/${email}`);
      setEmailAvailable(response.data.available);
    } catch (error) {
      console.error("Email check failed:", error);
      setEmailAvailable(null);
    }
  };

  // Check phone availability
  const checkPhoneAvailability = async (phone: string) => {
    const normalized = normalizePhone(phone);
    if (normalized.length !== 10) {
      setPhoneAvailable(null);
      return;
    }
    try {
      const response = await api.get(`/auth/check-phone/${normalized}`);
      setPhoneAvailable(response.data.available);
    } catch (error) {
      console.error("Phone check failed:", error);
      setPhoneAvailable(null);
    }
  };

  useEffect(() => {
    const id = "google-identity";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => {
        setGoogleReady(true);
      };
      s.onerror = () => {
        console.error("Failed to load Google Identity script");
        setGoogleReady(false);
      };
      document.head.appendChild(s);
    }
  }, []);

  // Check pincode serviceability
  const checkPincode = async (pin: string) => {
    if (!pin || pin.length !== 6) {
      setPincodeError("");
      setPincodeValid(false);
      setServiceableInfo(null);
      return;
    }

    setPincodeChecking(true);
    setPincodeError("");

    try {
      const response = await api.get(`/auth/check-pincode/${pin}`);
      const data = response.data;

      setServiceableInfo(data);
      setPincodeValid(data.serviceable);

      if (!data.serviceable) {
        setPincodeError(
          "Sorry, we don't service this pincode yet. You can still signup, but order processing may be delayed.",
        );
      }
    } catch (error) {
      console.error("Pincode check failed:", error);
      setPincodeError("Unable to verify pincode. Please try again.");
      setPincodeValid(false);
    } finally {
      setPincodeChecking(false);
    }
  };

  // Debounced pincode check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pincode && pincode.length === 6 && !isLogin) {
        checkPincode(pincode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pincode, isLogin]);

  // Debounced email check
  useEffect(() => {
    if (!isLogin && identifier) {
      const timer = setTimeout(() => {
        checkEmailAvailability(identifier);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEmailAvailable(null);
    }
  }, [identifier, isLogin]);

  // Debounced phone check
  useEffect(() => {
    if (!isLogin && phone) {
      const timer = setTimeout(() => {
        checkPhoneAvailability(phone);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setPhoneAvailable(null);
    }
  }, [phone, isLogin]);

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
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID not set");
      return;
    }
    if (!window.google?.accounts?.oauth2?.initCodeClient) {
      console.error("Google initCodeClient not available");
      return;
    }
    // generate state only (CSRF protection)
    const state = generateState();
    sessionStorage.setItem("google_oauth_state", state);
    // helper to start google code client with optional pincode (used for signup flow)
    const startGoogleWithPincode = (pincodeForFlow?: string) => {
      setGoogleProcessing(true);
      // @ts-ignore
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: "openid email profile",
        ux_mode: "popup",
        state, // pass state through to callback
        callback: async (resp: any) => {
          // enforce state matches
          const receivedState = resp?.state;
          const storedState = sessionStorage.getItem("google_oauth_state");
          if (!receivedState || !storedState || receivedState !== storedState) {
            console.error("Invalid or missing OAuth state - possible CSRF");
            setGoogleProcessing(false);
            return;
          }
          const auth_code = resp?.code;
          if (!auth_code) {
            console.error("No auth_code in response");
            setGoogleProcessing(false);
            return;
          }
          try {
            // include pincode and signup flag when in signup flow
            const payload: any = { auth_code };
            if (!isLogin) {
              payload.signup = true;
              if (pincodeForFlow) payload.pincode = pincodeForFlow;
            }

            const res = await api.post("/auth/google", payload);
            const token = res.data?.access_token;
            const needs_profile = !!res.data?.needs_profile;

            if (token) {
              localStorage.setItem("accessToken", token);
              // initialize AuthContext with the token so currentUser is set (includes role)
              try {
                await loginWithToken(token);
              } catch (err) {
                console.error("loginWithToken failed:", err);
                toast.error("Authentication failed. Please try again.", {
                  description: "Could not initialize user session.",
                  duration: 5000,
                });
                setGoogleProcessing(false);
                return;
              }
            }

            if (needs_profile) {
              // show profile modal to capture phone/address
              setShowGoogleProfileModal(true);
            } else {
              // handle post-login redirect
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
            toast.error("Google authentication failed. Please try again.", {
              description: "Could not complete sign-in or token exchange.",
              duration: 5000,
            });
          } finally {
            sessionStorage.removeItem("google_oauth_state");
            setGoogleProcessing(false);
          }
        },
      });
      client.requestCode();
    };

    // If this is signup flow, show pincode modal for optional pincode collection
    // (pincode validation will be enforced at checkout time, not signup time)
    if (!isLogin) {
      if (!pincode || pincode.length !== 6) {
        // prompt for pincode using a modal
        setShowGooglePincodeModal(true);
        return;
      }
      // pincode is present — start oauth including pincode
      startGoogleWithPincode(pincode);
      return;
    }

    // Normal login flow (no signup)
    startGoogleWithPincode();
  };

  // submit profile collected after Google signup
  const submitGoogleProfile = async () => {
    if (!googleProfilePhone) {
      toast.warning("Please provide your phone number to continue.", {
        description: "Phone number is required to complete your profile.",
        duration: 5000,
      });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(normalizePhone(googleProfilePhone))) {
      toast.warning("Please enter a valid 10-digit phone number", {
        description: "Phone number must be 10 digits starting with 6-9.",
        duration: 5000,
      });
      return;
    }
    try {
      setGoogleProcessing(true);
      await api.patch("/auth/me", {
        phone: normalizePhone(googleProfilePhone),
        address: googleProfileAddress || undefined,
      });
      setShowGoogleProfileModal(false);
      const stateRedirect = (location.state as any)?.redirectTo;
      const savedRedirect = localStorage.getItem("postLoginRedirect");
      const target = stateRedirect || savedRedirect;
      if (target) {
        localStorage.removeItem("postLoginRedirect");
        navigate(target);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile. Please try again.", {
        description: "Could not update your profile information.",
        duration: 5000,
      });
    } finally {
      setGoogleProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] border border-gray-100">
          {/* Left Side - Hero Image */}
          <div className="hidden lg:flex flex-col items-center justify-center relative h-full min-h-[600px] bg-gray-50 p-12">
            <img
              src="/assets/client-photos/photo-1.jpeg"
              alt="Happy Customer"
              className="w-full max-w-lg h-auto rounded-2xl shadow-2xl object-contain"
            />
          </div>

          {/* Right Side - Form */}
          <div className="flex flex-col items-center justify-center h-full p-4 lg:p-12 bg-white">
            <div className="w-full max-w-md space-y-6">
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
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            placeholder="+91 98765 43210"
                            className="pl-10"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                        {phoneAvailable === false && (
                          <p className="text-sm text-red-600">
                            This phone number is already registered.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="pincode"
                            placeholder="560001"
                            maxLength={6}
                            className="pl-10"
                            value={pincode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setPincode(val);
                            }}
                            required
                          />
                        </div>
                        {pincodeChecking && (
                          <p className="text-sm text-blue-600">
                            Checking pincode...
                          </p>
                        )}
                        {pincodeValid && serviceableInfo && (
                          <Alert className="bg-green-50 border-green-200">
                            <AlertDescription className="text-green-800 text-sm">
                              ✓ Great! {serviceableInfo.partner_count}{" "}
                              partner(s) service your area
                            </AlertDescription>
                          </Alert>
                        )}
                        {pincodeError && (
                          <Alert className="bg-yellow-50 border-yellow-200">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800 text-sm">
                              {pincodeError}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          placeholder="123 Main Street, City"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="referral">
                          Referral Code (Optional)
                        </Label>
                        <Input
                          id="referral"
                          placeholder="6-digit code (e.g., 123456)"
                          maxLength={6}
                          value={referralCode}
                          onChange={(e) =>
                            setReferralCode(e.target.value.replace(/\D/g, ""))
                          }
                        />
                        <p className="text-xs text-gray-500">
                          Have a referral code? Enter it to earn bonus points!
                        </p>
                      </div>
                    </>
                  )}

                  {/* Login method toggle — only shown in login mode */}
                  {isLogin && (
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-1">
                      <button
                        type="button"
                        onClick={() => setLoginMethod("email")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                          loginMethod === "email"
                            ? "bg-primary text-primary-foreground"
                            : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Mail size={14} />
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMethod("phone")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                          loginMethod === "phone"
                            ? "bg-primary text-primary-foreground"
                            : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Phone size={14} />
                        Phone Number
                      </button>
                    </div>
                  )}

                  {/* Email input — always shown for signup, conditionally for login */}
                  {(!isLogin || loginMethod === "email") && (
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {isLogin ? "Email *" : "Email *"}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                        />
                      </div>
                      {emailAvailable === false && (
                        <p className="text-sm text-red-600">
                          This email is already registered.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Phone number input — only shown in login mode with phone method */}
                  {isLogin && loginMethod === "phone" && (
                    <div className="space-y-2">
                      <Label htmlFor="login-phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-phone"
                          placeholder="+91 98765 43210"
                          className="pl-10"
                          value={loginPhoneIdentifier}
                          onChange={(e) =>
                            setLoginPhoneIdentifier(e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:brightness-95"
                    disabled={(!isLogin && pincodeChecking) || formLoading}
                    onClick={async () => {
                      setFormLoading(true);
                      try {
                        if (isLogin) {
                          if (loginMethod === "email") {
                            if (
                              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
                            ) {
                              toast.warning(
                                "Please enter a valid email address to login.",
                                {
                                  description:
                                    "Email format is required for login.",
                                  duration: 5000,
                                },
                              );
                              return;
                            }
                          } else {
                            const normalizedLoginPhone =
                              normalizePhone(loginPhoneIdentifier);
                            if (!/^[6-9]\d{9}$/.test(normalizedLoginPhone)) {
                              toast.warning(
                                "Please enter a valid 10-digit phone number.",
                                {
                                  description:
                                    "Phone must be 10 digits starting with 6-9.",
                                  duration: 5000,
                                },
                              );
                              return;
                            }
                          }
                          const loginIdentifier =
                            loginMethod === "phone"
                              ? normalizePhone(loginPhoneIdentifier)
                              : identifier;
                          const ok = await login(
                            loginIdentifier,
                            password,
                            "customer",
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
                          } else {
                            // Login toast is already shown by AuthContext
                          }
                        } else {
                          // Validate required fields
                          if (
                            !fullName ||
                            !phone ||
                            !pincode ||
                            !address ||
                            !identifier ||
                            !password
                          ) {
                            toast.warning(
                              "Please fill in all required fields",
                              {
                                description:
                                  "All fields marked with * are required.",
                                duration: 5000,
                              },
                            );
                            return;
                          }

                          if (emailAvailable === false) {
                            toast.warning("Email already registered", {
                              description:
                                "Please use a different email address.",
                              duration: 5000,
                            });
                            return;
                          }

                          if (phoneAvailable === false) {
                            toast.warning("Phone number already registered", {
                              description:
                                "Please use a different phone number.",
                              duration: 5000,
                            });
                            return;
                          }

                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
                            toast.warning(
                              "Please enter a valid email address for signup.",
                              {
                                description:
                                  "Email format is required for account creation.",
                                duration: 5000,
                              },
                            );
                            return;
                          }

                          if (!/^[6-9]\d{9}$/.test(normalizePhone(phone))) {
                            toast.warning(
                              "Please enter a valid 10-digit phone number",
                              {
                                description:
                                  "Phone number must be 10 digits starting with 6-9.",
                                duration: 5000,
                              },
                            );
                            return;
                          }

                          if (referralCode && referralCode.length === 6) {
                            try {
                              const refResponse = await api.get(
                                `/auth/check-referral/${referralCode}`,
                              );
                              if (!refResponse.data.valid) {
                                toast.warning("Invalid referral code", {
                                  description: "Please check and try again.",
                                  duration: 5000,
                                });
                                return;
                              }
                            } catch (err) {
                              console.error("Referral check failed:", err);
                              toast.warning("Unable to verify referral code", {
                                description:
                                  "Please try again or leave it blank.",
                                duration: 5000,
                              });
                              return;
                            }
                          }

                          // ALLOW signup regardless of pincode serviceability
                          // Show warning but allow user to proceed with non-serviceable pincode
                          if (!pincodeValid && serviceableInfo) {
                            const proceed = window.confirm(
                              pincodeError ||
                                "This pincode is not currently serviced, but you can still sign up. Order processing may be delayed.",
                            );
                            if (!proceed) {
                              return;
                            }
                          }

                          const signupEmail = identifier;

                          const ok = await signup(
                            signupEmail,
                            password,
                            "customer",
                            fullName,
                            normalizePhone(phone),
                            address || undefined,
                            null,
                            null,
                            pincode,
                            referralCode || undefined,
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
                          } else {
                            // Signup toast is already shown by AuthContext
                          }
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error("An error occurred. Please try again.", {
                          description:
                            "Something went wrong during authentication.",
                          duration: 5000,
                        });
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                  >
                    {formLoading
                      ? "Processing..."
                      : pincodeChecking
                        ? "Checking..."
                        : isLogin
                          ? "Login"
                          : "Create Account"}
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

                  <div className="grid grid-cols-1 gap-4">
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
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Google pincode modal (simple) */}
      {showGooglePincodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowGooglePincodeModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Enter Pincode</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please enter your pincode. You can proceed even if we don't
              service your area yet.
            </p>
            <input
              className="w-full border px-3 py-2 mb-3"
              placeholder="560001"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            />
            {pincodeChecking && (
              <p className="text-sm text-blue-600 mb-3">Checking pincode...</p>
            )}
            {pincodeValid && serviceableInfo && (
              <Alert className="bg-green-50 border-green-200 mb-3">
                <AlertDescription className="text-green-800 text-sm">
                  ✓ Great! {serviceableInfo.partner_count} partner(s) service
                  your area
                </AlertDescription>
              </Alert>
            )}
            {pincodeError && (
              <Alert className="bg-yellow-50 border-yellow-200 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  {pincodeError}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowGooglePincodeModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (pincode.length !== 6) {
                    toast.warning("Please enter a valid 6-digit pincode", {
                      description: "Pincode must be exactly 6 digits.",
                      duration: 5000,
                    });
                    return;
                  }
                  await checkPincode(pincode);
                  setShowGooglePincodeModal(false);
                  // Allow proceeding with both serviceable and non-serviceable pincodes
                  // Validation will happen at checkout time
                  await new Promise((resolve) => setTimeout(resolve, 150));
                  onGoogleLogin();
                }}
              >
                Continue with Signup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Google profile modal */}
      {showGoogleProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowGoogleProfileModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">
              Complete your profile
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We need your phone number to complete your account.
            </p>
            <input
              className="w-full border px-3 py-2 mb-3"
              placeholder="Phone"
              value={googleProfilePhone}
              onChange={(e) => setGoogleProfilePhone(e.target.value)}
            />
            <input
              className="w-full border px-3 py-2 mb-3"
              placeholder="Address"
              value={googleProfileAddress}
              onChange={(e) => setGoogleProfileAddress(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowGoogleProfileModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitGoogleProfile} disabled={googleProcessing}>
                {googleProcessing ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
