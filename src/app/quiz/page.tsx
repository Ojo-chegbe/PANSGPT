"use client";
import React, { useState, useEffect } from 'react';
import QuizSelectionForm from '@/components/QuizSelectionForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import BackButton from '@/components/BackButton';
import { 
  SparklesIcon, 
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function QuizPage() {
  const [userSubscription, setUserSubscription] = useState<any>(null);

  useEffect(() => {
    fetch('/api/subscription/status')
      .then(res => res.json())
      .then(setUserSubscription);
  }, []);

  if (!userSubscription?.isActive && !userSubscription?.isTrial) {
    return (
      <div className="min-h-screen bg-gray-50 dark:text-white dark:[background-color:#0C120C] flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <div className="border rounded-2xl p-8 mb-8 bg-white dark:[background-color:#2D3A2D] border-red-200 dark:border-red-600/30">
            <XMarkIcon className="h-16 w-16 mx-auto mb-6 text-red-600 dark:text-[#dc2626]" />
            <h1 className="text-3xl font-bold mb-4 text-red-600 dark:text-[#dc2626]">Access Restricted</h1>
            <p className="text-lg mb-6 text-gray-600 dark:text-white/80">
              This feature is reserved for active members only.
            </p>
            <p className="mb-8 text-gray-600 dark:text-white/70">
              Don't miss out on smarter revision, AI-powered grading, and the edge your classmates already have.
            </p>
            <button
              onClick={() => window.location.href = '/plan'}
              className="px-8 py-4 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg bg-green-600 dark:bg-[#00A400] hover:bg-green-700 dark:hover:bg-[#008300]"
            >
              Unlock Full Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:text-white dark:[background-color:#0C120C]">
      {/* Header */}
      <div className="border-b bg-white dark:[background-color:#2D3A2D] border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton href="/main" label="Back to Chat" />
          </div>
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 rounded-2xl bg-green-600 dark:[background-color:#00A400]">
                <SparklesIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Quiz Platform</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-white/80">
                  Test your knowledge with AI-generated quizzes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <QuizSelectionForm />
      </div>
    </div>
  );
} 