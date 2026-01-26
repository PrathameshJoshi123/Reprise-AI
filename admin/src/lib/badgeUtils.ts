/**
 * Badge color utilities for status badges
 * These use Tailwind classes that integrate with the theme system
 */

export const partnerStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  clarification_needed:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  suspended: "bg-muted text-muted-foreground",
};

export const orderStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  picked_up:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const getPartnerStatusColor = (status: string): string => {
  return partnerStatusColors[status] || "bg-muted text-muted-foreground";
};

export const getOrderStatusColor = (status: string): string => {
  return orderStatusColors[status] || "bg-muted text-muted-foreground";
};
