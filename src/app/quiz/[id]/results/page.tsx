import React from 'react';
import QuizResults from '@/components/QuizResults';

interface QuizResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuizResultsPage({ params }: QuizResultsPageProps) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-gray-800 text-theme-primary py-8">
      <div className="max-w-4xl mx-auto px-4">
        <QuizResults quizId={id} />
      </div>
    </div>
  );
} 