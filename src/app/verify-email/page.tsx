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

  console.log('🔵 VerifyEmailContent component rendered');

  useEffect(() => {
    console.log('🔍 VerifyEmailContent useEffect running');
    
    // Try to get token from searchParams first, then fallback to window.location
    let token = searchParams.get("token");
    
    // If searchParams doesn't have it, try window.location (works better in some cases)
    if (!token && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get("token");
      console.log('🔍 Token from window.location:', token ? token.substring(0, 8) + '...' : 'NOT FOUND');
    }
    
    console.log('🔍 Token from searchParams:', searchParams.get("token") ? searchParams.get("token")!.substring(0, 8) + '...' : 'NOT FOUND');
    console.log('🔍 Final token value:', token ? token.substring(0, 8) + '...' : 'NOT FOUND');
    console.log('🔍 Full URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    
    if (!token) {
      console.error('❌ No verification token found in URL');
      setStatus("error");
      setMessage("No verification token provided. Please check your verification email and click the link again.");
      return;
    }

    // Verify the email
    console.log('✅ Starting verification with token:', token.substring(0, 8) + '...');
    const verifyUrl = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    console.log('📡 Calling API:', verifyUrl.substring(0, 50) + '...');
    
    fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })
      .then(async (res) => {
        console.log('📥 API Response received:', { ok: res.ok, status: res.status, statusText: res.statusText });
        
        let data;
        try {
          data = await res.json();
          console.log('📥 Verification response data:', data);
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON response:', jsonError);
          const text = await res.text();
          console.error('❌ Response text:', text);
          setStatus("error");
          setMessage("Invalid response from server. Please try again.");
          return;
        }
        
        if (res.ok && data.success) {
          console.log('✅ Verification successful!');
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          console.error('❌ Verification failed:', data);
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      })
      .catch((error) => {
        console.error("❌ Verification error (catch):", error);
        console.error("❌ Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setStatus("error");
        setMessage(`Network error: ${error.message}. Please check your connection and try again.`);
      });
  }, [searchParams, router]); // eslint-disable-line react-hooks/exhaustive-deps

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

