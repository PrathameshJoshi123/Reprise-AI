import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Phone,
  User,
  Users,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const [fetchedUser, setFetchedUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  // token / fetched-user quick check used across the header
  const hasToken = Boolean(localStorage.getItem("accessToken"));
  const authPresent = isLoggedIn || hasToken || Boolean(fetchedUser);

  // Only show "My Orders" when the user is authenticated (via AuthContext)
  // or a valid token + fetched user indicates a customer role.
  const effectiveRole = user?.role || fetchedUser?.role;
  const isAuthenticated = isLoggedIn || (hasToken && Boolean(fetchedUser));
  const showMyOrders =
    isAuthenticated &&
    effectiveRole === "customer" &&
    !location.pathname.startsWith("/sell") &&
    !location.pathname.startsWith("/sell-phone");

  // Add scroll event listener properly with useEffect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // fetch current user from backend if token is present but AuthContext user is empty
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    if (isLoggedIn && user) return; // AuthContext already has user
    let mounted = true;
    // fetch detailed profile (includes role) so header can decide protected links
    api
      .get("/auth/me/details")
      .then((res) => {
        if (!mounted) return;
        setFetchedUser(res.data);
      })
      .catch((err) => {
        // if unauthorized, clear token so other logic handles redirect/login
        if (err?.response?.status === 401) {
          localStorage.removeItem("accessToken");
        }
      });
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, user]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("accessToken");
    setFetchedUser(null);
    navigate("/");
  };

  // user may have 'name' or backend returns 'full_name'
  const displayName =
    (user as any)?.full_name ||
    user?.name ||
    (fetchedUser && (fetchedUser.full_name || fetchedUser.email)) ||
    "";

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-background shadow-sm"
          : "bg-background/95 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Phone className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold text-primary">CashNow</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6 ml-10">
              {/* Sell Phone: only visible to customers.
								Unauthenticated users see a CTA that navigates to /login.
								Agents do not see this link. */}
              {authPresent ? (
                user?.role === "customer" ? (
                  <Link
                    to="/sell-phone"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Sell Phone
                  </Link>
                ) : null
              ) : (
                <Link
                  to="/sell-phone"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Sell Phone
                </Link>
              )}

              <Link
                to="/how-it-works"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                How It Works
              </Link>
              <Link
                to="/about-us"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Contact
              </Link>
              {showMyOrders && (
                <Link
                  to="/my-orders"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  My Orders
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Conditional rendering based on login/token presence */}
            {authPresent ? (
              <>
                {/* Show Dashboard link for agents */}
                {user?.role === "agent" && (
                  <Link to="/agent/dashboard" className="hidden md:block">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <LayoutDashboard size={18} />
                      Dashboard
                    </Button>
                  </Link>
                )}

                {/* User info badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {displayName || "User"}
                  </span>
                </div>

                {/* Logout button */}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <LogOut size={18} />
                  Logout
                </Button>
              </>
            ) : (
              <>
                {/* Login button */}
                <Button
                  variant="ghost"
                  className="hidden md:flex items-center text-sm font-medium hover:text-primary transition-colors"
                >
                  <Link
                    to="/login"
                    className="flex items-center cursor-pointer"
                  >
                    <User size={18} className="mr-1" />
                    Login
                  </Link>
                </Button>

                {/* Sell Now button (desktop): if not logged in, send to /login.
							Customers will navigate to actual /sell-phone route via nav link above.
							Agents won't see Sell Now as a separate CTA. */}
                {!isLoggedIn && (
                  <Link to="/sell-phone">
                    <Button className="bg-primary text-primary-foreground hover:brightness-95 hidden md:inline-flex">
                      Sell Now
                    </Button>
                  </Link>
                )}
              </>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="grid gap-6 py-6">
                  {/* Sell Phone in mobile: same visibility rules as desktop */}
                  {authPresent ? (
                    user?.role === "customer" ? (
                      <Link
                        to="/sell-phone"
                        className="text-base font-medium hover:text-blue-600 transition-colors"
                      >
                        Sell Phone
                      </Link>
                    ) : null
                  ) : (
                    <Link
                      to="/sell-phone"
                      className="text-base font-medium hover:text-blue-600 transition-colors"
                    >
                      Sell Phone
                    </Link>
                  )}

                  <Link
                    to="/how-it-works"
                    className="text-base font-medium hover:text-blue-600 transition-colors"
                  >
                    How It Works
                  </Link>
                  <Link
                    to="/about-us"
                    className="text-base font-medium hover:text-blue-600 transition-colors"
                  >
                    About Us
                  </Link>
                  <Link
                    to="/contact"
                    className="text-base font-medium hover:text-blue-600 transition-colors"
                  >
                    Contact
                  </Link>
                  {showMyOrders && (
                    <Link
                      to="/my-orders"
                      className="text-base font-medium hover:text-blue-600 transition-colors"
                    >
                      My Orders
                    </Link>
                  )}

                  <div className="border-t pt-6">
                    {isLoggedIn ? (
                      <div className="grid gap-3">
                        {/* User info */}
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <User size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {displayName || "User"}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {user?.role}
                            </p>
                          </div>
                        </div>

                        {/* Dashboard link for agents */}
                        {user?.role === "agent" && (
                          <Link to="/agent/dashboard">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <LayoutDashboard size={16} className="mr-2" />
                              Dashboard
                            </Button>
                          </Link>
                        )}

                        {/* Logout button */}
                        <Button
                          variant="outline"
                          onClick={handleLogout}
                          className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} className="mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold mb-3 text-gray-500">
                        Login
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
