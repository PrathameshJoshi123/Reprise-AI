/**
 * Error handling utilities for consistent error classification and messages
 */

import { AxiosError } from "axios";
import { toast } from "sonner";

export type ErrorType =
  | "auth"
  | "network"
  | "timeout"
  | "validation"
  | "not_found"
  | "server"
  | "logical"
  | "state"
  | "unknown";

export interface ErrorInfo {
  type: ErrorType;
  statusCode?: number;
  message: string;
  userMessage: string;
  retryable: boolean;
}

/**
 * Classify error by type
 */
export const classifyError = (error: any): ErrorInfo => {
  // Network timeout
  if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
    return {
      type: "timeout",
      message: "Request timeout",
      userMessage:
        "Connection timeout. Please check your internet and try again.",
      retryable: true,
    };
  }

  // Network errors
  if (error.message === "Network Error" || !error.response) {
    return {
      type: "network",
      message: "Network error",
      userMessage: "Network error. Please check your connection.",
      retryable: true,
    };
  }

  const status = error.response?.status;
  const detail = error.response?.data?.detail;

  // Auth errors
  if (status === 401) {
    return {
      type: "auth",
      statusCode: 401,
      message: "Unauthorized",
      userMessage: "Your session has expired. Please log in again.",
      retryable: false,
    };
  }

  if (status === 403) {
    return {
      type: "auth",
      statusCode: 403,
      message: "Forbidden",
      userMessage:
        detail || "You do not have permission to perform this action.",
      retryable: false,
    };
  }

  // Validation errors
  if (status === 400) {
    return {
      type: "validation",
      statusCode: 400,
      message: "Validation error",
      userMessage: detail || "Invalid input. Please check your data.",
      retryable: false,
    };
  }

  // Not found
  if (status === 404) {
    return {
      type: "not_found",
      statusCode: 404,
      message: "Not found",
      userMessage: detail || "The requested resource was not found.",
      retryable: false,
    };
  }

  // Conflict
  if (status === 409) {
    return {
      type: "logical",
      statusCode: 409,
      message: "Conflict",
      userMessage: detail || "This action conflicts with current state.",
      retryable: false,
    };
  }

  // Server errors
  if (status && status >= 500) {
    return {
      type: "server",
      statusCode: status,
      message: "Server error",
      userMessage: "Server error. Please try again later.",
      retryable: true,
    };
  }

  // Unknown
  return {
    type: "unknown",
    statusCode: status,
    message: "Unknown error",
    userMessage: detail || "An unexpected error occurred. Please try again.",
    retryable: true,
  };
};

/**
 * Show error toast with context-specific messages
 */
export const showErrorToast = (
  error: any,
  context: string = "Operation",
  customMessage?: string,
) => {
  const errorInfo = classifyError(error);

  if (customMessage) {
    toast.error(customMessage, {
      duration: 4000,
    });
    return;
  }

  toast.error(errorInfo.userMessage, {
    duration: 4000,
  });
};

/**
 * Show error toast with retry action
 */
export const showErrorToastWithRetry = (
  error: any,
  onRetry: () => void,
  context: string = "Operation",
) => {
  const errorInfo = classifyError(error);

  if (!errorInfo.retryable) {
    toast.error(errorInfo.userMessage, {
      duration: 4000,
    });
    return;
  }

  toast.error(errorInfo.userMessage, {
    duration: 5000,
    action: {
      label: "Retry",
      onClick: onRetry,
    },
  });
};

/**
 * Show success toast
 */
export const showSuccessToast = (message: string, duration = 2000) => {
  toast.success(message, {
    duration,
  });
};

/**
 * Show warning toast
 */
export const showWarningToast = (message: string, duration = 3000) => {
  toast.warning(message, {
    duration,
  });
};

/**
 * Show info toast
 */
export const showInfoToast = (message: string, duration = 3000) => {
  toast.info(message, {
    duration,
  });
};

/**
 * Show loading toast (returns function to dismiss)
 */
export const showLoadingToast = (message: string) => {
  const id = toast.loading(message);
  return {
    dismiss: () => toast.dismiss(id),
    success: (msg: string) => toast.success(msg, { id, duration: 2000 }),
    error: (msg: string) => toast.error(msg, { id, duration: 4000 }),
  };
};
