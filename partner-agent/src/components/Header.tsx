import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  X,
  CreditCard,
  ShoppingCart,
  Settings,
  Home,
} from "lucide-react";

interface HeaderProps {
  showLoginButtons?: boolean;
  pageTitle?: string;
  userName?: string;
  showLogout?: boolean;
  onLogout?: () => void;
  additionalContent?: React.ReactNode;
  showDashboardButton?: boolean;
  onBuyCredits?: () => void;
}

export default function Header({
  showLoginButtons = true,
  userName,
  showLogout = false,
  onLogout,
  showDashboardButton = false,
  onBuyCredits,
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate("/");
    }
  };

  const handleDashboardClick = () => {
    if (user?.type === "partner") {
      navigate("/partner/dashboard");
    } else if (user?.type === "agent") {
      navigate("/agent/dashboard");
    }
  };

  // Determine if we should show logout based on auth state or prop
  const shouldShowLogout = showLogout || !!user;
  const shouldShowLoginButtons = showLoginButtons && !user;
  const shouldShowDashboardButton = showDashboardButton && !!user;
  const displayName = userName || user?.name;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <motion.header
        className="bg-white shadow-sm border-b sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center py-4">
            {/* Left Section */}
            <div className="flex items-center space-x-6">
              <motion.div
                className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img src="/assets/logo.jpeg" alt="Logo" className="h-8 w-8" />
                <div className="text-2xl font-bold text-blue-600">CashNow</div>
                <div className="text-lg text-gray-600">
                  {user?.type === "agent" ? "Agent Portal" : "Partner Portal"}
                </div>
              </motion.div>
              <div className="text-gray-300">|</div>
              <div>
                <div className="text-xl font-semibold text-gray-800">
                  {user?.type === "agent"
                    ? "Agent Dashboard"
                    : "Partner Dashboard"}
                </div>
                {displayName && (
                  <div className="text-sm text-gray-500">
                    Welcome, {displayName}
                  </div>
                )}
              </div>
            </div>

            {/* Center/Right Section */}
            <div className="flex items-center space-x-4">
              {/* Shared Dashboard button for any logged-in user */}
              {shouldShowDashboardButton && user && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  onClick={handleDashboardClick}
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              )}

              {/* Show partner elements ONLY for partners when logged in */}
              {user && user.type === "partner" && (
                <>
                  {/* Credit Balance */}
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Credit Balance</div>
                    <div className="text-xl font-bold text-green-600">
                      ◇{user?.credit_balance || 0}
                    </div>
                  </div>

                  {/* Navigation Buttons (partner-only buttons follow) */}

                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    onClick={() => {
                      console.log(
                        "Buy Credits button clicked - calling onBuyCredits",
                      );
                      onBuyCredits?.();
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                    Buy Credits
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    onClick={() => navigate("/partner/marketplace")}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Marketplace
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    onClick={() => navigate("/partner/agents")}
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </Button>
                </>
              )}

              {/* Login Buttons - only show when not logged in */}
              {shouldShowLoginButtons && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/partner/login")}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Partner Login
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/agent/login")}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Agent Login
                  </Button>
                </div>
              )}

              {/* Logout Button */}
              {shouldShowLogout && (
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Logout
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex justify-between items-center py-3">
            {/* Left Section - Logo */}
            <motion.div
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img src="/assets/logo.jpeg" alt="Logo" className="h-6 w-6" />
              <div className="text-xl font-bold text-blue-600">CashNow</div>
              <div className="text-sm text-gray-600">
                {user?.type === "agent" ? "Agent Portal" : "Partner Portal"}
              </div>
            </motion.div>

            {/* Right Section - Credit Balance & Hamburger */}
            <div className="flex items-center space-x-3">
              {/* Credit Balance - only show for partners when logged in */}
              {user && user.type === "partner" && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Credit Balance</div>
                  <div className="text-lg font-bold text-green-600">
                    ◇{user?.credit_balance || 0}
                  </div>
                </div>
              )}

              {/* Hamburger Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white border-b shadow-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Dashboard Info */}
              <div className="border-b pb-3">
                <div className="text-lg font-semibold text-gray-800">
                  {user?.type === "agent"
                    ? "Agent Dashboard"
                    : "Partner Dashboard"}
                </div>
                {displayName && (
                  <div className="text-sm text-gray-500">
                    Welcome, {displayName}
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              {shouldShowDashboardButton && user && (
                <div className="space-y-2">
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2 justify-start"
                    onClick={() => {
                      handleDashboardClick();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Button>
                </div>
              )}

              {/* Partner-only navigation */}
              {user && user.type === "partner" && (
                <div className="space-y-2">
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2 justify-start"
                    onClick={() => {
                      navigate("/partner/marketplace");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Marketplace
                  </Button>

                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2 justify-start"
                    onClick={() => {
                      navigate("/partner/agents");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </Button>

                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2 justify-start"
                    onClick={() => {
                      console.log(
                        "Mobile Buy Credits button clicked - calling onBuyCredits",
                      );
                      onBuyCredits?.();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                    Buy Credits
                  </Button>
                </div>
              )}

              {/* Login Buttons - only show when not logged in */}
              {shouldShowLoginButtons && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      navigate("/partner/login");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Partner Login
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => {
                      navigate("/agent/login");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Agent Login
                  </Button>
                </div>
              )}

              {shouldShowLogout && (
                <Button
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
