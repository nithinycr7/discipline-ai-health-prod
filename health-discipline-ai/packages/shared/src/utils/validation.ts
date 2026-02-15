/**
 * Validate Indian phone number format
 * Accepts: +91XXXXXXXXXX or 91XXXXXXXXXX or XXXXXXXXXX (10 digits)
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '');
  const patterns = [
    /^\+91[6-9]\d{9}$/,  // +91XXXXXXXXXX
    /^91[6-9]\d{9}$/,    // 91XXXXXXXXXX
    /^[6-9]\d{9}$/,      // XXXXXXXXXX
  ];
  return patterns.some((pattern) => pattern.test(cleaned));
}

/**
 * Normalize Indian phone number to E.164 format (+91XXXXXXXXXX)
 */
export function normalizeIndianPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '');

  if (cleaned.startsWith('+91')) {
    return cleaned;
  }

  if (cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  throw new Error('Invalid phone number format');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}
