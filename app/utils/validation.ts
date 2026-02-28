/**
 * Validation Utilities
 * Reference: SPEC Section - Validation Rules
 */

import api from "../lib/api";

// Constants for field length constraints
export const PAN_LENGTH = 10;
export const GST_LENGTH = 15;
export const PHONE_LENGTH = 10;
export const PINCODE_LENGTH = 6;

/**
 * Input Sanitization - Remove dangerous characters to prevent XSS
 */
export const sanitizeInput = (value: string): string => {
  return value.replace(/[<>"']/g, "");
};

/**
 * Format phone number - Remove +91 prefix and non-numeric characters
 */
export const formatPhoneNumber = (value: string): string => {
  let formatted = value;
  if (formatted.startsWith("+91")) {
    formatted = formatted.substring(3);
  }
  return formatted.replace(/[^0-9]/g, "");
};

/**
 * Format PAN/GST to uppercase
 */
export const formatUppercase = (value: string): string => {
  return value.toUpperCase();
};

// Validate email format with length constraints
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) return "Email is required";
  if (email.length > 255) return "Email must not exceed 255 characters";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

/**
 * Check if email already exists (async validation)
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response = await api.post("/partner/check-email", { email });
    return response.data.exists;
  } catch (error) {
    // If check fails, allow submission (backend will handle)
    return false;
  }
};

// Validate password with strong requirements
export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password must not exceed 128 characters";
  return null;
};

// Validate phone number (10-digit) with formatting
export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[0-9]{10}$/;
  if (!phone || !phone.trim()) return "Phone number is required";
  if (phone.length !== PHONE_LENGTH)
    return `Phone number must be exactly ${PHONE_LENGTH} digits`;
  if (!phoneRegex.test(phone)) return "Phone number must contain only digits";
  return null;
};

/**
 * Check if phone already exists (async validation)
 */
export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    const response = await api.post("/partner/check-phone", { phone });
    return response.data.exists;
  } catch (error) {
    // If check fails, allow submission (backend will handle)
    return false;
  }
};

// Validate full name with length constraints
export const validateFullName = (name: string): string | null => {
  if (!name || !name.trim()) return "Full name is required";
  if (name.length < 2) return "Full name must be at least 2 characters";
  if (name.length > 100) return "Full name must not exceed 100 characters";
  return null;
};

// Validate company name with length constraints
export const validateCompanyName = (name: string): string | null => {
  if (!name || !name.trim()) return "Company name is required";
  if (name.length < 2) return "Company name must be at least 2 characters";
  if (name.length > 200) return "Company name must not exceed 200 characters";
  return null;
};

// Validate business address with length constraints
export const validateBusinessAddress = (address: string): string | null => {
  if (!address || !address.trim()) return "Business address is required";
  if (address.length < 10)
    return "Business address must be at least 10 characters";
  if (address.length > 500)
    return "Business address must not exceed 500 characters";
  return null;
};

// Validate PAN number (exactly 10 characters, alphanumeric)
export const validatePAN = (pan: string): string | null => {
  const panRegex = /^[A-Z0-9]{10}$/;
  if (!pan || !pan.trim()) return "PAN number is required";
  if (pan.length !== PAN_LENGTH)
    return `PAN number must be exactly ${PAN_LENGTH} characters`;
  if (!panRegex.test(pan)) return "PAN must be alphanumeric uppercase";
  return null;
};

// Validate GST number (exactly 15 characters if provided)
export const validateGST = (gst: string): string | null => {
  if (!gst || !gst.trim()) return null; // Optional field
  const gstRegex = /^[A-Z0-9]{15}$/;
  if (gst.length !== GST_LENGTH)
    return `GST number must be exactly ${GST_LENGTH} characters if provided`;
  if (!gstRegex.test(gst)) return "GST must be alphanumeric uppercase";
  return null;
};

// Validate pincodes (comma-separated, at least one)
export const validatePincodes = (pincodes: string): string | null => {
  if (!pincodes || !pincodes.trim())
    return "At least one serviceable pincode is required";
  const pincodeArray = pincodes
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (pincodeArray.length === 0)
    return "Please enter at least one valid pincode";
  // Validate each pincode (6 digits)
  const pincodeRegex = /^[0-9]{6}$/;
  const invalidPincodes = pincodeArray.filter((p) => !pincodeRegex.test(p));
  if (invalidPincodes.length > 0) {
    return `Invalid pincodes (must be 6 digits): ${invalidPincodes.slice(0, 3).join(", ")}${invalidPincodes.length > 3 ? "..." : ""}`;
  }
  return null;
};

// Validate required field with length constraints
export const validateRequired = (
  value: string,
  fieldName: string,
  minLength = 1,
  maxLength = 255,
): string | null => {
  if (!value || value.trim() === "") return `${fieldName} is required`;
  if (value.length < minLength)
    return `${fieldName} must be at least ${minLength} characters`;
  if (value.length > maxLength)
    return `${fieldName} must not exceed ${maxLength} characters`;
  return null;
};

// Validate number greater than zero
export const validatePositiveNumber = (
  value: number,
  fieldName: string,
): string | null => {
  if (value <= 0) return `${fieldName} must be greater than 0`;
  return null;
};
