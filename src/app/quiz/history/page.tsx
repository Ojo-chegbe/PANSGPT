"use client";
import React, { useState, useEffect } from 'react';
import QuizHistory from '@/components/QuizHistory';
import BackButton from '@/components/BackButton';
 
export default function QuizHistoryPage() {
  const [userSubscription, setUserSubscription] = useState<any>(null);

  useEffect(() => {
    fetch('/api/subscription/status')
      .then(res => res.json())
      .then(setUserSubscription);
  }, []);

  if (!userSubscription?.isActive && !userSubscription?.isTrial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gray-50 dark:[background-color:#0C120C]">
        <div className="rounded-lg p-8 border mb-6 bg-white dark:[background-color:#2D3A2D] border-red-200 dark:border-[rgba(220,38,38,0.3)]">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">Sorry, this feature is reserved for active members only.</div>
          <div className="text-lg md:text-xl text-gray-600 dark:text-white/70 mb-6 max-w-xl">
            Don't miss out on smarter revision, AI-powered grading, and the edge your classmates already have.<br />
            <span className="inline-block mt-2 text-xl text-green-600 dark:text-[#00A400]">👉 Unlock full access now and stay ahead.</span>
          </div>
          <button
            onClick={() => window.location.href = '/plan'}
            className="mt-2 px-8 py-3 text-white text-lg font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-[#00A400] bg-green-600 dark:bg-[#00A400] hover:bg-green-700 dark:hover:bg-[#00B400]"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-white py-8 bg-gray-50 dark:[background-color:#0C120C]">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton href="/quiz" label="Back to Quiz Creation" />
        </div>
        
        <QuizHistory />
      </div>
    </div>
  );
} 