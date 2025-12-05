"use client";
import React, { useState } from "react";
import Link from "next/link";
import { 
  EnvelopeIcon, 
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    setError("");
    setEmailError(false);
    
    // Basic validation
    if (!email) {
      setEmailError(true);
      setError("Email is required.");
      setIsLoading(false);
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError(true);
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setError("");
      } else {
        setError(data.error || "Failed to send reset email.");
        setStatus("error");
        setEmailError(true);
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
              Enter your email and we'll send you a link to reset your password
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
                  Check Your Email!
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Please check your inbox and click the link to reset your password. The link will expire in 1 hour.
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-4">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="inline-block bg-green-600 dark:bg-[#00A400] hover:bg-green-700 dark:hover:bg-[#008300] text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Back to Login
                </Link>
                <button
                  onClick={() => {
                    setStatus(null);
                    setEmail("");
                    setError("");
                    setEmailError(false);
                  }}
                  className="inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-6 rounded-xl transition-colors"
                >
                  Try Another Email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
                  <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
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
                  onChange={e => {
                    setEmail(e.target.value);
                    setEmailError(false);
                    setError("");
                  }}
                  className={`w-full border rounded-xl px-4 py-3 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] focus:border-transparent transition-all duration-200 ${emailError ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-white/20'}`}
                  placeholder="Enter your email"
                />
                {emailError && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>Please enter a valid email address</span>
                  </div>
                )}
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
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-5 w-5" />
                      <span>Send Reset Link</span>
                    </>
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