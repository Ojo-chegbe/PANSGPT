"use client";
import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { getDeviceId } from "../../lib/device-id";
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clientDeviceId, setClientDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Use the robust device ID utility
    const deviceId = getDeviceId();
    setClientDeviceId(deviceId);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let hasError = false;
    setError("");
    setEmailError(false);
    setPasswordError(false);
    
    // Basic validation
    if (!email) {
      setEmailError(true);
      setError("Email is required.");
      hasError = true;
    }
    if (!password) {
      setPasswordError(true);
      setError("Password is required.");
      hasError = true;
    }
    if (hasError) return;

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        clientDeviceId,
        userAgent: navigator.userAgent,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("Maximum number of devices reached")) {
          setError("You have reached the maximum number of devices for this account. Please log out from another device before logging in.");
        } else {
          setError("Invalid email or password.");
          setEmailError(true);
          setPasswordError(true);
        }
        return;
      }

      // Successful login
      window.location.href = "/main";
    } catch (error) {
      setError("An error occurred during login. Please try again.");
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-white/80">
              Sign in to continue your AI-powered learning journey
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="backdrop-blur-sm border rounded-2xl p-8 bg-white dark:[background-color:#2D3A2D] border-gray-200 dark:border-white/10">
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
                onChange={e => setEmail(e.target.value)}
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

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <LockClosedIcon className="h-4 w-4" />
                <span>Password *</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 pr-12 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] focus:border-transparent transition-all duration-200 ${passwordError ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-white/20'}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>Please enter your password</span>
                </div>
              )}
              
              {/* Forgot Password Link */}
              <div className="text-right">
                <Link 
                  href="/forgot-password" 
                  className="text-sm font-medium text-green-600 dark:text-[#00A400] hover:text-green-700 dark:hover:text-[#008300] transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
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
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Signup Link */}
          <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-white/70">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="font-semibold text-green-600 dark:text-[#00A400] hover:text-green-700 dark:hover:text-[#008300] transition-colors duration-200"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 