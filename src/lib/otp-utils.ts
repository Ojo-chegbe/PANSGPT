/**
 * OTP (One-Time Password) utility functions
 */

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

/**
 * OTP expiration time (10 minutes)
 */
export function getOTPExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
}

