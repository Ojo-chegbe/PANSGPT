"use client";
import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { getDeviceId } from "../../lib/device-id";
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  AcademicCapIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [level, setLevel] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clientDeviceId, setClientDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const deviceId = getDeviceId();
    setClientDeviceId(deviceId);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    setError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validation
    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }
    if (!valid) return;

    // Ensure clientDeviceId is available
    let deviceId = clientDeviceId;
    if (!deviceId) {
      deviceId = getDeviceId();
      setClientDeviceId(deviceId);
    }

    setIsLoading(true);
    try {
      // Create user
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: fullName,
          level,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Show backend error if available, otherwise generic
        setError(data.error || data.message || "Something went wrong");
        setIsLoading(false);
        return;
      }

      // Sign in the user
      const result = await signIn("credentials", {
        email,
        password,
        clientDeviceId: deviceId,
        userAgent: navigator.userAgent,
        redirect: false,
      });

      console.log("SignIn result:", result);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Use window.location for a full page navigation
      window.location.href = "/main";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="bg-green-600 p-4 rounded-2xl">
                <UserIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Create Account</h1>
                <p className="mt-2 text-lg text-gray-300">
                  Join PANSGPT and start your AI-powered learning journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
                <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <UserIcon className="h-4 w-4" />
                  <span>Full Name *</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
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
                  className={`w-full bg-gray-700/50 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'}`}
                  placeholder="Enter your email"
                />
                {emailError && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <LockClosedIcon className="h-4 w-4" />
                  <span>Password *</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full bg-gray-700/50 border rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'}`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <LockClosedIcon className="h-4 w-4" />
                  <span>Confirm Password *</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full bg-gray-700/50 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${confirmPasswordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'}`}
                  placeholder="Confirm your password"
                />
                {confirmPasswordError && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
              </div>

              {/* Level */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="level" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>Academic Level *</span>
                </label>
                <select
                  id="level"
                  name="level"
                  required
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="" className="bg-gray-800">Select your academic level</option>
                  <option value="100" className="bg-gray-800">100 Level</option>
                  <option value="200" className="bg-gray-800">200 Level</option>
                  <option value="300" className="bg-gray-800">300 Level</option>
                  <option value="400" className="bg-gray-800">400 Level</option>
                  <option value="500" className="bg-gray-800">500 Level</option>
                  <option value="600" className="bg-gray-800">600 Level</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-700">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-green-400 hover:text-green-300 font-semibold transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 