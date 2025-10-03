"use client";
import React, { useState, useEffect } from 'react';
import QuizTaking from '@/components/QuizTaking';

interface QuizPageProps {
  params: Promise<{
    id: string;
  }>;
}

function QuizPageClient({ id }: { id: string }) {
  const [userSubscription, setUserSubscription] = useState<any>(null);

  useEffect(() => {
    fetch('/api/subscription/status')
      .then(res => res.json())
      .then(setUserSubscription);
  }, []);

  if (!userSubscription?.isActive && !userSubscription?.isTrial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-black dark:via-gray-900 dark:to-gray-800 text-center px-4">
        <div className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">Sorry, this feature is reserved for active members only.</div>
        <div className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-xl">
          Don't miss out on smarter revision, AI-powered grading, and the edge your classmates already have.<br />
          <span className="inline-block mt-2 text-emerald-600 dark:text-emerald-400 text-xl">👉 Unlock full access now and stay ahead.</span>
        </div>
        <button
          onClick={() => window.location.href = '/plan'}
          className="mt-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold rounded-full shadow transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          View Plans
        </button>
      </div>
    );
  }

  return <QuizTaking quizId={id} />;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;
  return <QuizPageClient id={id} />;
} 