"use client";
import React from 'react';
import QuizTaking from '@/components/QuizTaking';

interface QuizPageProps {
  params: Promise<{
    id: string;
  }>;
}

function QuizPageClient({ id }: { id: string }) {
  return <QuizTaking quizId={id} />;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;
  return <QuizPageClient id={id} />;
} 