import { AlertCircle } from "lucide-react";

interface HoldNotificationBannerProps {
  reason?: string;
  liftDate?: string;
}

export const HoldNotificationBanner: React.FC<HoldNotificationBannerProps> = ({
  reason,
  liftDate,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full bg-red-50 border-l-4 border-red-600 rounded-lg p-4 mb-6 shadow-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-1">
            Account on Hold
          </h3>
          {reason && (
            <p className="text-sm text-red-800 mb-2">
              <span className="font-medium">Reason:</span> {reason}
            </p>
          )}
          <div className="text-sm text-red-700">
            <span className="font-medium">Lift Date:</span>{" "}
            {liftDate ? formatDate(liftDate) : "To be decided by admin"}
          </div>
        </div>
      </div>
    </div>
  );
};
