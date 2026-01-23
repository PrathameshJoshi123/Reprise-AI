/**
 * Validation Utilities
 * Reference: SPEC Section - Validation Rules
 */

// Validate email format
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

// Validate password
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
};

// Validate phone number (10-digit)
export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[0-9]{10}$/;
  if (!phone) return 'Phone number is required';
  if (!phoneRegex.test(phone)) return 'Phone must be 10 digits';
  return null;
};

// Validate PAN number (exactly 10 characters, alphanumeric)
export const validatePAN = (pan: string): string | null => {
  const panRegex = /^[A-Z0-9]{10}$/;
  if (!pan) return 'PAN is required';
  if (pan.length !== 10) return 'PAN must be exactly 10 characters';
  if (!panRegex.test(pan)) return 'PAN must be alphanumeric uppercase';
  return null;
};

// Validate GST number (exactly 15 characters if provided)
export const validateGST = (gst: string): string | null => {
  if (!gst) return null; // Optional field
  const gstRegex = /^[A-Z0-9]{15}$/;
  if (gst.length !== 15) return 'GST must be exactly 15 characters';
  if (!gstRegex.test(gst)) return 'GST must be alphanumeric uppercase';
  return null;
};

// Validate pincodes (comma-separated, at least one)
export const validatePincodes = (pincodes: string): string | null => {
  if (!pincodes) return 'At least one pincode is required';
  const pincodeArray = pincodes
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (pincodeArray.length === 0) return 'At least one pincode is required';
  // Validate each pincode (6 digits)
  const pincodeRegex = /^[0-9]{6}$/;
  const invalidPincodes = pincodeArray.filter((p) => !pincodeRegex.test(p));
  if (invalidPincodes.length > 0) {
    return `Invalid pincodes: ${invalidPincodes.join(', ')}`;
  }
  return null;
};

// Validate required field
export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return null;
};

// Validate number greater than zero
export const validatePositiveNumber = (value: number, fieldName: string): string | null => {
  if (value <= 0) return `${fieldName} must be greater than 0`;
  return null;
};
