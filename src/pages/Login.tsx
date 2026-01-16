import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { User, Phone, Mail, Lock, Eye, EyeOff, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [isOpen, setIsOpen] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { loginWithGoogle, signupWithEmail, loginWithEmail, updateProfile, isLoggedIn, user } = useAuth();

  // Use a separate state to handle the "Complete Profile" dialog (Dialog 2)
  const [showProfileComplete, setShowProfileComplete] = useState(false);

  // If user logs in but missing phone/pincode, we show the completion dialog
  // This effect watches auth state changes
  useEffect(() => {
    if (isLoggedIn && user) {
      if (!user.phone || !user.pincode) {
        setShowProfileComplete(true);
        setIsOpen(false); // Close main login modal
      } else {
        // Fully logged in and profile complete
        if (isOpen) {
          handleClose(); // Close if everything is good
        }
      }
    }
  }, [isLoggedIn, user]);

  const handleClose = () => {
    setIsOpen(false);
    navigate("/");
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      // Redirect happens automatically
    } catch (error: any) {
      setError(error.message || "Failed to login with Google");
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit Phone Number");
      return;
    }
    if (!pincode || pincode.length !== 6) {
      setError("Please enter a valid 6-digit Pincode");
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile({ phone, pincode });
      setShowProfileComplete(false);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setIsLoading(true);
      if (authMode === "signup") {
        // Validate inputs for signup
        if (!phone || phone.length < 10) {
          setError("Please enter a valid 10-digit Phone Number");
          setIsLoading(false);
          return;
        }
        if (!pincode || pincode.length !== 6) {
          setError("Please enter a valid 6-digit Pincode");
          setIsLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }
        await signupWithEmail({ email, password, name, phone, pincode });
        // After signup, check email usually required but for testing we assume success
        alert("Account created! Please check your email to confirm.");
      } else {
        // For normal login
        if (!phone || phone.length < 10) {
          setError("Please enter a valid 10-digit Phone Number");
          setIsLoading(false);
          return;
        }
        if (!pincode || pincode.length !== 6) {
          setError("Please enter a valid 6-digit Pincode");
          setIsLoading(false);
          return;
        }
        if (!email || !email.includes('@')) {
          setError("Please enter a valid email address");
          setIsLoading(false);
          return;
        }
        if (!password) {
          setError("Please enter your password");
          setIsLoading(false);
          return;
        }

        await loginWithEmail({ email, password });
        // Auto close happens via the useEffect watcher on `isLoggedIn`
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center py-12 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden border-0 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-0 h-full overflow-y-auto">
              {/* Left side - Image */}
              <div className="hidden md:block relative bg-gradient-to-br from-blue-600 to-indigo-700">
                <div className="absolute inset-0 bg-[url('/images/auth.jpg')] bg-cover bg-center opacity-20"></div>
                <div className="relative h-full flex items-center justify-center p-8">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <User size={40} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                      Welcome to CashNow
                    </h2>
                    <p className="text-lg text-blue-100">
                      Get the best price for your old phone with our hassle-free service
                    </p>

                    {/* Features */}
                    <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
                      <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          ✓
                        </div>
                        <span className="text-sm">Best market prices</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          ✓
                        </div>
                        <span className="text-sm">
                          Free doorstep pickup
                        </span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          ✓
                        </div>
                        <span className="text-sm">Instant payment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Form */}
              <div className="p-8 bg-white">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-bold text-center">
                    {authMode === "login" ? "Welcome Back!" : "Create Account"}
                  </DialogTitle>
                  <p className="text-center text-gray-500 mt-2">
                    {authMode === "login"
                      ? "Sign in to continue"
                      : "Join us today"}
                  </p>
                </DialogHeader>

                {/* Login/Signup Toggle */}
                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                    }}
                    className={`flex-1 pb-2 text-center font-medium transition-all border-b-2 ${authMode === "login"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-400 border-transparent hover:text-gray-600"
                      }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setError("");
                    }}
                    className={`flex-1 pb-2 text-center font-medium transition-all border-b-2 ${authMode === "signup"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-400 border-transparent hover:text-gray-600"
                      }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authMode === "signup" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-gray-700 font-medium"
                      >
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-gray-700 font-medium"
                    >
                      Phone Number {authMode === "signup" && "*"}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 Enter your Mobile"
                        className="pl-10 h-11"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field - Show for both Login and Signup now */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-700 font-medium"
                    >
                      Email {authMode === "signup" ? "(Optional)" : "*"}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10 h-11"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required={authMode === "login"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="pincode"
                      className="text-gray-700 font-medium"
                    >
                      Pincode {authMode === "signup" && "*"}
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="pincode"
                        type="text"
                        placeholder="Enter your 6-digit Pincode"
                        className="pl-10 h-11"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        minLength={6}
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-gray-700 font-medium"
                      >
                        Password {authMode === "signup" && "*"}
                      </Label>
                      {authMode === "login" && (
                        <Link
                          to="/forgot-password"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    {authMode === "signup" && (
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 h-11"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    )}
                    {authMode === "login" && (
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 text-base shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 mt-4"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Signing in...
                          </div>
                        ) : (
                          "LOGIN"
                        )}
                      </Button>
                    )}
                  </div>

                  {authMode === "signup" && (
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 rounded border-gray-300"
                        required
                      />
                      <label htmlFor="terms">
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-blue-600 hover:underline"
                        >
                          Terms and Conditions
                        </Link>{" "}
                        &{" "}
                        <Link
                          to="/privacy"
                          className="text-blue-600 hover:underline"
                        >
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                  )}

                  {authMode === "signup" && (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating account...
                        </div>
                      ) : (
                        "CREATE ACCOUNT"
                      )}
                    </Button>
                  )}
                </form>

                {/* Social Login */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button variant="outline" type="button" className="h-11" onClick={handleGoogleLogin}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                    <Button variant="outline" type="button" className="h-11">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
                          fill="#1877F2"
                        />
                      </svg>
                      Facebook
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Completion Modal */}
        <Dialog open={showProfileComplete} onOpenChange={setShowProfileComplete}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProfileUpdate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="complete-phone">Phone Number</Label>
                <Input
                  id="complete-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 Phone Number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complete-pincode">Pincode</Label>
                <Input
                  id="complete-pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="6-digit Pincode"
                  maxLength={6}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : "Save & Continue"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}