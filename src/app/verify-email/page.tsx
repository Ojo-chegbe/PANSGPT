"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    if (!email || !otp) {
      setMessage("Email and OTP are required.");
      setStatus("error");
      setIsLoading(false);
      return;
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setMessage("OTP must be a 6-digit number.");
      setStatus("error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
        setStatus("error");
        setMessage(data.error || "Verification failed. Please check your OTP and try again.");
      }
    } catch (error: any) {
        setStatus("error");
        setMessage(`Network error: ${error.message}. Please check your connection and try again.`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0C120C] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-[#2D3A2D] rounded-lg shadow-lg p-8">
        {status === "success" ? (
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Redirecting to login page...
            </p>
            <Link
              href="/login"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Verify Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center text-sm">
              Enter the 6-digit code sent to your email address
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && message && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                  <p className="text-red-700 dark:text-red-300 text-sm">{message}</p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>Email Address</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border rounded-lg px-4 py-3 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] focus:border-transparent transition-all border-gray-300 dark:border-white/20"
                  placeholder="your@email.com"
                />
              </div>

              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  required
                  maxLength={6}
                  className="w-full border rounded-lg px-4 py-3 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] focus:border-transparent transition-all border-gray-300 dark:border-white/20 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 dark:bg-[#00A400] hover:bg-green-700 dark:hover:bg-[#008300] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the code?{" "}
                <button
                  onClick={async () => {
                    if (!email) {
                      setMessage("Please enter your email first.");
                      setStatus("error");
                      return;
                    }
                    try {
                      const response = await fetch('/api/auth/resend-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setMessage("Verification code resent! Please check your email.");
                        setStatus("idle");
                      } else {
                        setMessage(data.error || "Failed to resend code.");
                        setStatus("error");
                      }
                    } catch (err) {
                      setMessage("Failed to resend code. Please try again.");
                      setStatus("error");
                    }
                  }}
                  className="text-green-600 dark:text-[#00A400] hover:underline font-semibold bg-transparent border-none cursor-pointer"
                >
                  Resend OTP
                </button>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <Link
                href="/login"
                  className="text-green-600 dark:text-[#00A400] hover:underline"
              >
                  Back to Login
              </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
