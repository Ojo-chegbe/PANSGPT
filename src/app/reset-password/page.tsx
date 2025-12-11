"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LockClosedIcon,
  CheckCircleIcon,
  XMarkIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get('email') || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError("");
    
    if (!email || !otp) {
      setError("Email and OTP are required.");
      setStatus("error");
      return;
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("OTP must be a 6-digit number.");
      setStatus("error");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      setStatus("error");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setStatus("error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Failed to reset password.");
        setStatus("error");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:text-white dark:[background-color:#0C120C]">
      {/* Header */}
      <div className="border-b bg-white dark:bg-transparent border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-white/80">
              Enter your email, OTP code, and new password
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="backdrop-blur-sm border rounded-2xl p-8 bg-white dark:[background-color:#2D3A2D] border-gray-200 dark:border-white/10">
          {status === "success" ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl p-6">
                <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Password Reset Successful!
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Your password has been reset successfully.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Redirecting to login page...
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block bg-green-600 dark:bg-[#00A400] hover:bg-green-700 dark:hover:bg-[#008300] text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 hover:scale-105"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
                  <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>Email Address *</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] focus:border-transparent transition-all duration-200 border-gray-300 dark:border-white/20"
                  placeholder="Enter your email"
                />
              </div>

              {/* OTP */}
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Verification Code (OTP) *
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  maxLength={6}
                  className="w-full border rounded-xl px-4 py-3 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] focus:border-transparent transition-all duration-200 border-gray-300 dark:border-white/20 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <LockClosedIcon className="h-4 w-4" />
                  <span>New Password *</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] focus:border-transparent transition-all duration-200 border-gray-300 dark:border-white/20"
                  placeholder="Enter new password"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <LockClosedIcon className="h-4 w-4" />
                  <span>Confirm Password *</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] focus:border-transparent transition-all duration-200 border-gray-300 dark:border-white/20"
                  placeholder="Confirm new password"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-green-600 dark:bg-[#00A400] hover:bg-green-700 dark:hover:bg-[#008300] text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          {status !== "success" && (
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-white/70">
                Remember your password?{' '}
                <Link 
                  href="/login" 
                  className="font-semibold text-green-600 dark:text-[#00A400] hover:text-green-700 dark:hover:text-[#008300] transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-[#0C120C] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-[#2D3A2D] rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <ResetPasswordPage />
    </Suspense>
  );
}
