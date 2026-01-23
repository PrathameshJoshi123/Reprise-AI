import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

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

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            >
              <div className="text-2xl font-bold text-blue-600">RepriseAI</div>
              <div className="text-lg text-gray-600">Partner Portal</div>
            </div>
            {pageTitle && (
              <>
                <div className="text-gray-300">|</div>
                <div>
                  <div className="text-xl font-semibold text-gray-800">
                    {pageTitle}
                  </div>
                  {userName && (
                    <div className="text-sm text-gray-500">
                      Welcome, {userName}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {additionalContent}
            {showLogout && onLogout && (
              <Button variant="destructive" onClick={onLogout}>
                Logout
              </Button>
            )}
            {showLoginButtons && !showLogout && (
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
    </header>
  );
}
