"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    // Verify the email
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      })
      .catch((error) => {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0C120C] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-[#2D3A2D] rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying your email...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
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
          </>
        )}

        {status === "error" && (
          <>
            <XCircleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Link
                href="/signup"
                className="block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Sign Up Again
              </Link>
              <Link
                href="/login"
                className="block text-green-600 hover:text-green-700 font-semibold"
              >
                Go to Login
              </Link>
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

