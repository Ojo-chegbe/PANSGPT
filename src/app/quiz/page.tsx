"use client";
import React from 'react';
import QuizSelectionForm from '@/components/QuizSelectionForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import BackButton from '@/components/BackButton';

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:text-white dark:[background-color:#0C120C]">
      {/* Header */}
      <div className="border-b bg-white dark:bg-transparent border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Back Button */}
          <div className="mb-4">
            <BackButton href="/main" label="Back to Chat" />
          </div>
          <div className="flex justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Quiz Platform</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-white/80">
                Test your knowledge with AI-generated quizzes
              </p>
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