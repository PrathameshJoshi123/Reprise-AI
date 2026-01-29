import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { AlertCircle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PartnerOnHoldModalProps {
  isOpen: boolean;
  reason?: string;
  liftDate?: string;
}

export default function PartnerOnHoldModal({
  isOpen,
  reason,
  liftDate,
}: PartnerOnHoldModalProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleClose = () => {
    logout();
    navigate("/");
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-white border-gray-200 shadow-2xl max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            Account Rejected
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 mb-1">Reason:</p>
              <p className="text-sm text-red-700">{reason}</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Please contact our support team if you believe this is a mistake
              or to discuss your account status.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={handleClose}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Go to Home
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
