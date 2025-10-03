'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DID_YOU_KNOW_FACTS, DidYouKnowFact } from '@/lib/did-you-know-facts';

interface QuizLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isComplete?: boolean;
}

interface ProgressStage {
  id: string;
  title: string;
  description: string;
  duration: number;
  icon: string;
}

const PROGRESS_STAGES: ProgressStage[] = [
  {
    id: 'analyzing',
    title: 'Analyzing Course Content',
    description: 'AI is reviewing your course materials and identifying key concepts...',
    duration: 4000,
    icon: '🔍'
  },
  {
    id: 'generating',
    title: 'Generating Questions',
    description: 'Creating thoughtful questions that test your understanding...',
    duration: 5000,
    icon: '💡'
  },
  {
    id: 'optimizing',
    title: 'Optimizing Difficulty',
    description: 'Balancing question difficulty to match your learning level...',
    duration: 3500,
    icon: '⚖️'
  },
  {
    id: 'reviewing',
    title: 'Quality Review',
    description: 'Ensuring questions are clear, accurate, and educational...',
    duration: 3000,
    icon: '✅'
  },
  {
    id: 'finalizing',
    title: 'Finalizing Quiz',
    description: 'Adding finishing touches and preparing your personalized quiz...',
    duration: 3000,
    icon: '✨'
  }
];

export default function QuizLoadingModal({ isOpen, onClose, isComplete = false }: QuizLoadingModalProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentFact, setCurrentFact] = useState<DidYouKnowFact | null>(null);
  const [factIndex, setFactIndex] = useState(0);

  // Shuffle facts array
  const shuffledFacts = [...DID_YOU_KNOW_FACTS].sort(() => Math.random() - 0.5);

  useEffect(() => {
    if (!isOpen) return;

    // Set initial fact
    setCurrentFact(shuffledFacts[0]);
    setFactIndex(0);

    let stageIndex = 0;
    let stageProgress = 0;
    const totalStages = PROGRESS_STAGES.length;
    let stageStartTime = Date.now();
    
    const updateProgress = () => {
      const now = Date.now();
      const stageElapsed = now - stageStartTime;
      const currentStageData = PROGRESS_STAGES[stageIndex];
      
      // Calculate progress within current stage
      const stageProgressPercent = Math.min(stageElapsed / currentStageData.duration, 1);
      
      // Calculate overall progress - but don't go beyond 90% until isComplete is true
      const maxProgress = isComplete ? 100 : 90;
      
      // Calculate stage-based progress
      const stageProgress = (stageIndex + stageProgressPercent) / totalStages;
      let overallProgress = stageProgress * maxProgress;
      
      // Apply a slower curve to make it more gradual (but not too slow)
      overallProgress = Math.pow(overallProgress / maxProgress, 0.8) * maxProgress;
      
      setProgress(Math.min(overallProgress, maxProgress));

      // Move to next stage if current stage is complete
      if (stageElapsed >= currentStageData.duration && stageIndex < totalStages - 1) {
        stageIndex++;
        stageStartTime = now;
        setCurrentStage(stageIndex);
      }

      // Continue if not complete and not at max progress
      if (overallProgress < maxProgress) {
        requestAnimationFrame(updateProgress);
      }
    };

    // Start progress animation
    requestAnimationFrame(updateProgress);

    // Change fact every 6 seconds
    const factInterval = setInterval(() => {
      setFactIndex(prev => {
        const nextIndex = (prev + 1) % shuffledFacts.length;
        setCurrentFact(shuffledFacts[nextIndex]);
        return nextIndex;
      });
    }, 6000);

    return () => {
      clearInterval(factInterval);
    };
  }, [isOpen, shuffledFacts, isComplete]);

  // When quiz is complete, animate to 100%
  useEffect(() => {
    if (isComplete) {
      setProgress(100);
      setCurrentStage(PROGRESS_STAGES.length - 1);
    }
  }, [isComplete]);

  if (!isOpen) return null;

  const currentStageData = PROGRESS_STAGES[currentStage];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gradient-to-br from-white to-gray-50 dark:from-[#181A1B] dark:to-[#232625] rounded-2xl shadow-2xl border border-gray-200 dark:border-emerald-700/30 max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-emerald-700/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Creating Your Quiz</h2>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Progress Section */}
            <div className="space-y-4">
              {/* Current Stage */}
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{currentStageData.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{currentStageData.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{currentStageData.description}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700/40 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Stage Indicators */}
              <div className="flex space-x-2">
                {PROGRESS_STAGES.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      index <= currentStage
                        ? 'bg-emerald-500'
                        : index === currentStage + 1
                        ? 'bg-emerald-500/50'
                        : 'bg-gray-300 dark:bg-gray-700/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Did You Know Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700/30">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Did You Know?</h4>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentFact?.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-gray-800 dark:text-white text-sm leading-relaxed"
                  >
                    {currentFact?.fact}
                  </motion.p>
                </AnimatePresence>
                <div className="mt-4 flex justify-center">
                  <div className="flex space-x-1">
                    {shuffledFacts.slice(0, 5).map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          index === factIndex ? 'bg-blue-500 dark:bg-blue-400' : 'bg-blue-300 dark:bg-blue-400/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-emerald-700/20 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>AI is working hard to create the perfect quiz for you...</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}