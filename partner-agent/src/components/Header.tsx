import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  showLoginButtons?: boolean;
  pageTitle?: string;
  userName?: string;
  showLogout?: boolean;
  onLogout?: () => void;
  additionalContent?: React.ReactNode;
}

export default function Header({
  showLoginButtons = true,
  pageTitle,
  userName,
  showLogout = false,
  onLogout,
  additionalContent,
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate("/");
    }
  };

  // Determine if we should show logout based on auth state or prop
  const shouldShowLogout = showLogout || !!user;
  const shouldShowLoginButtons = showLoginButtons && !user;
  const displayName = userName || user?.name;

  return (
    <motion.header
      className="bg-white shadow-sm border-b"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
          <div className="flex items-center space-x-4">
            <motion.div
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl font-bold text-blue-600">CashNow</div>
              <div className="text-lg text-gray-600">Partner Portal</div>
            </motion.div>
            {pageTitle && (
              <>
                <div className="text-gray-300 hidden sm:block">|</div>
                <div>
                  <div className="text-xl font-semibold text-gray-800">
                    {pageTitle}
                  </div>
                  {displayName && (
                    <div className="text-sm text-gray-500">
                      Welcome, {displayName}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4 flex-wrap justify-center sm:justify-end">
            {additionalContent}
            {shouldShowLogout && (
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            )}
            {shouldShowLoginButtons && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/partner/login")}
                >
                  Partner Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/agent/login")}
                >
                  Agent Login
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
