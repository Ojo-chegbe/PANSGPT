"use client";
import React, { useState, useEffect } from 'react';
import QuizSelectionForm from '@/components/QuizSelectionForm';
import { ThemeToggle } from '@/components/ThemeToggle';
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-8">
            <XMarkIcon className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-red-400 mb-4">Access Restricted</h1>
            <p className="text-lg text-red-300 mb-6">
              This feature is reserved for active members only.
            </p>
            <p className="text-gray-300 mb-8">
              Don't miss out on smarter revision, AI-powered grading, and the edge your classmates already have.
            </p>
            <button
              onClick={() => window.location.href = '/plan'}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Unlock Full Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="bg-green-600 p-4 rounded-2xl">
                <SparklesIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Quiz Platform</h1>
                <p className="mt-2 text-lg text-gray-300">
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