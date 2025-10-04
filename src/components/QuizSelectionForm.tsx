'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import QuizLoadingModal from './QuizLoadingModal';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  TagIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Add import for combobox
import { Combobox } from '@headlessui/react';

interface QuizFormData {
  courseCode: string;
  courseTitle: string;
  topic: string;
  level: string;
  numQuestions: number;
  questionType: 'MCQ' | 'TRUE_FALSE' | 'OBJECTIVE' | 'SHORT_ANSWER';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

interface Course {
  courseCode: string;
  courseTitle: string;
  level: string;
}

export default function QuizSelectionForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<QuizFormData>({
    courseCode: '',
    courseTitle: '',
    topic: '',
    level: '',
    numQuestions: 10,
    questionType: 'MCQ',
    difficulty: 'medium',
    timeLimit: undefined
  });
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  useEffect(() => {
    async function fetchUserLevel() {
      if (!formData.level && session?.user) {
        try {
          const res = await fetch('/api/user');
          if (res.ok) {
            const data = await res.json();
            setFormData(prev => ({ ...prev, level: data.user?.level || '' }));
          }
        } catch {}
      }
    }
    fetchUserLevel();
  }, [session]);

  useEffect(() => {
    async function fetchAvailableCourses() {
      try {
        const res = await fetch('/api/documents/courses');
        if (res.ok) {
          const data = await res.json();
          setAvailableCourses(data.courses || []);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    }
    fetchAvailableCourses();
  }, []);

  // Fetch topics for suggestions
  useEffect(() => {
    async function fetchTopics() {
      setIsLoadingTopics(true);
      try {
        // If a course is selected, fetch topics for that course only
        const url = formData.courseCode 
          ? `/api/documents/topics?courseCode=${encodeURIComponent(formData.courseCode)}`
          : '/api/documents/topics';
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setTopicOptions(data.topics || []);
        }
      } catch (err) {
        // Ignore errors for now
      } finally {
        setIsLoadingTopics(false);
      }
    }
    fetchTopics();
  }, [formData.courseCode]); // Re-fetch when course changes

  // Filter topics as user types
  useEffect(() => {
    if (!formData.topic) {
      setFilteredTopics(topicOptions);
    } else {
      setFilteredTopics(
        topicOptions.filter(t => t.toLowerCase().includes(formData.topic.toLowerCase()))
      );
    }
  }, [formData.topic, topicOptions]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleCourseSelect = (courseCode: string) => {
    const course = availableCourses.find(c => c.courseCode === courseCode);
    if (course) {
      setFormData(prev => ({
        ...prev,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        level: course.level,
        topic: '' // Clear topic when course changes
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError('Please sign in to create quizzes');
      return;
    }

    if (!formData.courseCode || !formData.courseTitle || !formData.level) {
      setError('Please select a course');
      return;
    }

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);

    setIsGenerating(true);
    setShowLoadingModal(true);
    setIsQuizComplete(false);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      if (data.message) {
        setInfo(data.message);
      }

      // Mark quiz as complete and show 100% progress
      setIsQuizComplete(true);
      
      // Wait a moment for the progress bar to reach 100%, then navigate
      setTimeout(() => {
        router.push(`/quiz/${data.quiz.id}`);
      }, 1000);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Quiz generation cancelled');
      } else {
        setError(err.message || 'Failed to generate quiz');
      }
      setShowLoadingModal(false);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleCloseLoadingModal = () => {
    setShowLoadingModal(false);
    setIsGenerating(false);
    setIsQuizComplete(false);
  };

  const handleCancelQuizGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
    setShowLoadingModal(false);
    setIsGenerating(false);
    setIsQuizComplete(false);
    setError('Quiz generation cancelled');
  };

  if (!session) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="bg-yellow-50 dark:bg-yellow-600/20 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-6 max-w-md mx-auto">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Authentication Required</h2>
            <p className="text-yellow-600 dark:text-yellow-300">Please sign in to create quizzes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-green-600 p-2 rounded-lg">
          <SparklesIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Quiz</h2>
          <p className="text-gray-600 dark:text-gray-300">Generate AI-powered quizzes from your course materials</p>
        </div>
      </div>
      
      {info && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-green-700 dark:text-green-300 font-medium">{info}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
          <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <label htmlFor="courseCode" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <BookOpenIcon className="h-4 w-4" />
              <span>Select Course *</span>
            </label>
            <select
              id="courseCode"
              name="courseCode"
              required
              value={formData.courseCode}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="" className="bg-white dark:bg-gray-800">Choose a course</option>
              {availableCourses.map((course) => (
                <option key={course.courseCode} value={course.courseCode} className="bg-white dark:bg-gray-800">
                  {course.courseCode} - {course.courseTitle} (Level {course.level})
                </option>
              ))}
            </select>
          </div>

          {/* Topic - Combobox */}
          <div className="space-y-2">
            <label htmlFor="topic" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <TagIcon className="h-4 w-4" />
              <span>Topic (Optional)</span>
            </label>
            <Combobox value={formData.topic} onChange={value => setFormData(prev => ({ ...prev, topic: value || "" }))}>
              <div className="relative">
                <Combobox.Input
                  className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  displayValue={(topic: string) => topic}
                  onChange={e => setFormData(prev => ({ ...prev, topic: e.target.value || "" }))}
                  placeholder="e.g., Drug Metabolism, Titration, etc."
                  id="topic"
                  name="topic"
                  autoComplete="off"
                />
                {isLoadingTopics ? (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : filteredTopics.length > 0 ? (
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                    {filteredTopics.map((topic) => (
                      <Combobox.Option
                        key={topic}
                        value={topic}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-3 pr-9 ${active ? 'bg-green-600 text-white' : 'text-gray-900 dark:text-gray-200'}`
                        }
                      >
                        {topic}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                ) : formData.courseCode && !isLoadingTopics ? (
                  <div className="absolute z-10 mt-1 w-full rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
                    No topics found for this course
                  </div>
                ) : null}
              </div>
            </Combobox>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formData.courseCode 
                ? `Topics available for ${formData.courseCode}. Leave blank for a general quiz on the course.`
                : 'Select a course first to see available topics. Leave blank for a general quiz on the course.'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Level */}
          <div className="space-y-2">
            <label htmlFor="level" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <AcademicCapIcon className="h-4 w-4" />
              <span>Level *</span>
            </label>
            <select
              id="level"
              name="level"
              required
              value={formData.level}
              onChange={handleInputChange}
              className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="" className="bg-white dark:bg-gray-800">Select level</option>
              <option value="100" className="bg-white dark:bg-gray-800">100</option>
              <option value="200" className="bg-white dark:bg-gray-800">200</option>
              <option value="300" className="bg-white dark:bg-gray-800">300</option>
              <option value="400" className="bg-white dark:bg-gray-800">400</option>
              <option value="500" className="bg-white dark:bg-gray-800">500</option>
              <option value="600" className="bg-white dark:bg-gray-800">600</option>
            </select>
          </div>

          {/* Number of Questions */}
          <div className="space-y-2">
            <label htmlFor="numQuestions" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <QuestionMarkCircleIcon className="h-4 w-4" />
              <span>Number of Questions *</span>
            </label>
            <select
              id="numQuestions"
              name="numQuestions"
              required
              value={formData.numQuestions}
              onChange={handleInputChange}
              className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value={5} className="bg-white dark:bg-gray-800">5 Questions</option>
              <option value={10} className="bg-white dark:bg-gray-800">10 Questions</option>
              <option value={15} className="bg-white dark:bg-gray-800">15 Questions</option>
              <option value={20} className="bg-white dark:bg-gray-800">20 Questions</option>
              <option value={30} className="bg-white dark:bg-gray-800">30 Questions</option>
            </select>
          </div>

          {/* Question Type */}
          <div className="space-y-2">
            <label htmlFor="questionType" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <ChartBarIcon className="h-4 w-4" />
              <span>Question Type *</span>
            </label>
            <select
              id="questionType"
              name="questionType"
              required
              value={formData.questionType}
              onChange={handleInputChange}
              className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="MCQ" className="bg-white dark:bg-gray-800">Multiple Choice Questions</option>
              <option value="TRUE_FALSE" className="bg-white dark:bg-gray-800">True/False</option>
              <option value="OBJECTIVE" className="bg-white dark:bg-gray-800">Objective Questions</option>
              <option value="SHORT_ANSWER" className="bg-white dark:bg-gray-800">Short Answer</option>
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label htmlFor="difficulty" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <ChartBarIcon className="h-4 w-4" />
              <span>Difficulty Level *</span>
            </label>
            <select
              id="difficulty"
              name="difficulty"
              required
              value={formData.difficulty}
              onChange={handleInputChange}
              className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="easy" className="bg-white dark:bg-gray-800">Easy</option>
              <option value="medium" className="bg-white dark:bg-gray-800">Medium</option>
              <option value="hard" className="bg-white dark:bg-gray-800">Hard</option>
            </select>
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <label htmlFor="timeLimit" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <ClockIcon className="h-4 w-4" />
              <span>Time Limit (Optional)</span>
            </label>
            <select
              id="timeLimit"
              name="timeLimit"
              value={formData.timeLimit || ''}
              onChange={handleInputChange}
              className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="" className="bg-white dark:bg-gray-800">No time limit</option>
              <option value={5} className="bg-white dark:bg-gray-800">5 minutes</option>
              <option value={10} className="bg-white dark:bg-gray-800">10 minutes</option>
              <option value={15} className="bg-white dark:bg-gray-800">15 minutes</option>
              <option value={20} className="bg-white dark:bg-gray-800">20 minutes</option>
              <option value={30} className="bg-white dark:bg-gray-800">30 minutes</option>
              <option value={45} className="bg-white dark:bg-gray-800">45 minutes</option>
              <option value={60} className="bg-white dark:bg-gray-800">1 hour</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Quiz...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                <span>Generate Quiz</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Modal */}
      <QuizLoadingModal 
        isOpen={showLoadingModal} 
        onClose={handleCloseLoadingModal}
        onCancel={handleCancelQuizGeneration}
        isComplete={isQuizComplete}
      />
    </div>
  );
} 