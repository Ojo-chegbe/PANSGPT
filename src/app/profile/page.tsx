'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { clearDeviceId } from '../../lib/device-id';

interface QuizAnalytics {
  averageScore: number;
  totalQuizzes: number;
  totalPoints: number;
  recentTrendAverage: number;
  coursePerformance?: Array<{
    courseTitle: string;
    averageScore: number;
    quizCount: number;
  }>;
}

interface TimetableEntry {
  id: string;
  level: string;
  day: string;
  timeSlot: string;
  courseCode: string;
  courseTitle: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    bio: '', 
    level: '', 
    image: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileRes, analyticsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/quiz/history?page=1&limit=1')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const userData = profileData.user || profileData;
          setUser(userData);
        setForm({
            name: userData.name || '',
            bio: userData.bio || '',
            level: userData.level || '',
            image: userData.image || '',
          });
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setQuizAnalytics(analyticsData.data?.analytics || null);
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (user?.level) {
      fetchTimetable();
    }
  }, [user?.level]);

  const fetchTimetable = async () => {
    if (!user?.level) return;
    
    setTimetableLoading(true);
    try {
      const res = await fetch('/api/timetable');
      if (res.ok) {
        const data = await res.json();
        setTimetable(data.timetables || []);
      }
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setTimetableLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to log out?')) {
      return;
    }

    setLoggingOut(true);
    try {
      // Clear device ID from localStorage
      clearDeviceId();
      
      // Sign out using NextAuth
      await signOut({ 
        redirect: true, 
        callbackUrl: '/' 
      });
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      name: user?.name || '',
      bio: user?.bio || '',
      level: user?.level || '',
      image: user?.image || '',
    });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setEditMode(false);
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };


  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:[background-color:#0C120C]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin border-green-600 dark:border-[#00A400]"></div>
          <p className="text-lg text-green-700 dark:text-[#4ade80]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const averageScore = quizAnalytics?.averageScore || 0;
  const totalQuizzes = quizAnalytics?.totalQuizzes || 0;
  const totalPoints = quizAnalytics?.totalPoints || 0;
  const recentTrend = quizAnalytics?.recentTrendAverage || 0;
  const topCourse = quizAnalytics?.coursePerformance && quizAnalytics.coursePerformance.length > 0
    ? quizAnalytics.coursePerformance.reduce((prev, current) => 
        ((prev?.averageScore || 0) > (current?.averageScore || 0)) ? prev : current
      )
    : null;

  return (
    <div className="min-h-screen pb-12 bg-gray-50 dark:[background-color:#0C120C]">
      {/* Success/Error Message */}
      {saveMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div
            className={`px-6 py-4 rounded-xl flex items-center gap-3 ${
              saveMessage.type === 'success' ? 'bg-green-600 dark:bg-green-600' : 'bg-red-600 dark:bg-red-600'
            }`}
          >
            <span className="text-gray-900 dark:text-white font-medium">{saveMessage.text}</span>
            <button
              onClick={() => setSaveMessage(null)}
              className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/main')}
            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 active:scale-95 bg-white dark:[background-color:#2D3A2D] text-green-600 dark:text-[#00A400]"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {/* User Profile Card */}
            <div 
              className="rounded-2xl p-6 sm:p-8 transition-all duration-300 bg-white dark:[background-color:#2D3A2D] border border-gray-200 dark:border-white/10"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      {editMode ? (
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className="w-full bg-gray-50 dark:bg-white/10 rounded-lg px-4 py-2 text-xl font-bold mb-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-white/50 transition-all border border-gray-300 dark:border-white/20"
                          placeholder="Full Name"
                          autoFocus
                        />
                      ) : (
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white break-words">
                          {user.name || 'User'}
                        </h2>
                      )}
                      <p className="text-sm sm:text-base mb-1 break-words text-gray-600 dark:text-white">
                        {user.email || ''}
                      </p>
                    </div>
                    {!editMode && (
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-[#00A400] border border-green-200 dark:border-green-600/30"
                      >
                        Edit Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
      </div>
      
            {/* Academic Details Card */}
            <div 
              className="rounded-2xl p-6 sm:p-8 transition-all duration-300 bg-white dark:[background-color:#2D3A2D] border border-green-200 dark:border-green-600/10"
            >
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Academic Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-white/10">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-white/80">
                    University
                  </label>
                    <div className="text-sm font-medium py-2 text-gray-900 dark:text-white">
                    University of Jos
                    </div>
                </div>
                <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-white/10">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-white/80">
                    Department
                  </label>
                    <div className="text-sm font-medium py-2 text-gray-900 dark:text-white">
                    Pharmacy
                    </div>
                </div>
                <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-white/10">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-white/80">
                    Faculty
                  </label>
                    <div className="text-sm font-medium py-2 text-gray-900 dark:text-white">
                    Pharmaceutical Sciences
                    </div>
                </div>
                <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-white/10 sm:border-b-0">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-white/80">
                    Current Level
                  </label>
                  {editMode ? (
                    <select
                      name="level"
                      value={form.level}
                      onChange={handleChange}
                      className="w-full bg-gray-50 dark:bg-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-white/50 transition-all border border-gray-300 dark:border-white/20"
                    >
                      <option value="100 Level" className="bg-white dark:bg-[#2D3A2D] text-gray-900 dark:text-white">100 Level</option>
                      <option value="200 Level" className="bg-white dark:bg-[#2D3A2D] text-gray-900 dark:text-white">200 Level</option>
                      <option value="300 Level" className="bg-white dark:bg-[#2D3A2D] text-gray-900 dark:text-white">300 Level</option>
                      <option value="400 Level" className="bg-white dark:bg-[#2D3A2D] text-gray-900 dark:text-white">400 Level</option>
                      <option value="500 Level" className="bg-white dark:bg-[#2D3A2D] text-gray-900 dark:text-white">500 Level</option>
                      <option value="600 Level" className="bg-white dark:bg-[#2D3A2D] text-gray-900 dark:text-white">600 Level</option>
                    </select>
                  ) : (
                    <div className="text-sm font-medium py-2 text-gray-900 dark:text-white">
                      {user.level || form.level || 'N/A'} Level
              </div>
            )}
                </div>
          </div>
              {editMode && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name.trim() || !form.level.trim()}
                    className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 bg-green-600 dark:bg-[#00A400] text-white dark:text-[#0C120C] hover:bg-green-700 dark:hover:bg-[#008300]"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 bg-transparent text-green-600 dark:text-[#00A400] border border-green-300 dark:border-green-600/50"
                  >
                    Cancel
                  </button>
                </div>
              )}
        </div>

            {/* Class Timetable Card */}
            <div 
              className="rounded-2xl p-6 sm:p-8 transition-all duration-300 bg-white dark:[background-color:#2D3A2D] border border-gray-200 dark:border-white/10"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Class Timetable</h3>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-50 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-white/50 transition-all"
              >
                {days.map(day => (
                    <option key={day} value={day} className="bg-white dark:bg-[#2D3A2D] text-gray-900 dark:text-white">{day}</option>
                ))}
              </select>
          </div>
          
          {timetableLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-green-600 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-900 dark:text-white/70 text-sm">Loading timetable...</p>
                </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const dayEntries = timetable.filter(entry => entry.day === selectedDay);
                return dayEntries.length > 0 ? (
                  dayEntries.map(entry => (
                        <div 
                          key={entry.id} 
                          className="rounded-lg p-4 border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/15 transition-all duration-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-white mb-1">{entry.timeSlot}</div>
                              <div className="text-sm text-gray-600 dark:text-white/80">
                            {entry.courseCode} - {entry.courseTitle}
                          </div>
                        </div>
                            <div className="text-xs text-gray-700 dark:text-white/60 bg-gray-200 dark:bg-white/10 px-3 py-1 rounded-full inline-block w-fit">
                          {entry.level} Level
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                      <div className="text-center py-8 text-gray-900 dark:text-white/60">
                    No classes scheduled for {selectedDay}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

            {/* Logout Card */}
            <div 
              className="rounded-2xl p-6 sm:p-8 transition-all duration-300 bg-white dark:[background-color:#2D3A2D] border border-gray-200 dark:border-white/10"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Account</h3>
                  <p className="text-base font-medium text-gray-900 dark:text-white/90">Free Access</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-red-600 dark:bg-red-600 text-white"
                >
                  {loggingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Performance Metrics */}
            <div className="flex flex-col gap-4">
              {/* Quizzes Taken */}
              <div 
                className="rounded-xl p-5 sm:p-6 flex items-center gap-5 transition-all duration-300 hover:scale-[1.02] cursor-default border border-gray-200 dark:border-white/20 bg-white dark:[background-color:#2D3A2D]"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-green-100 dark:bg-white/20">
                  <svg className="w-7 h-7 text-green-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-3xl sm:text-4xl font-bold mb-1 text-gray-900 dark:text-white">{totalQuizzes}</div>
                  <div className="text-sm font-medium text-gray-600 dark:text-white/80">Quizzes Taken</div>
                </div>
              </div>

              {/* Total Points */}
              <div 
                className="rounded-xl p-5 sm:p-6 flex items-center gap-5 transition-all duration-300 hover:scale-[1.02] cursor-default border border-gray-200 dark:border-white/20 bg-white dark:[background-color:#2D3A2D]"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-green-100 dark:bg-white/20">
                  <svg className="w-7 h-7 text-green-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-3xl sm:text-4xl font-bold mb-1 text-gray-900 dark:text-white">{totalPoints}</div>
                  <div className="text-sm font-medium text-gray-600 dark:text-white/80">Total Points</div>
                </div>
              </div>

              {/* Recent Trend */}
              <div 
                className="rounded-xl p-5 sm:p-6 flex items-center gap-5 transition-all duration-300 hover:scale-[1.02] cursor-default border border-gray-200 dark:border-white/20 bg-white dark:[background-color:#2D3A2D]"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-green-100 dark:bg-white/20">
                  <svg className="w-7 h-7 text-green-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-3xl sm:text-4xl font-bold mb-1 text-gray-900 dark:text-white">{recentTrend.toFixed(0)}%</div>
                  <div className="text-sm font-medium text-gray-600 dark:text-white/80">Recent Trend</div>
                </div>
              </div>
                        </div>

            {/* Average Score Card */}
            <div 
              className="rounded-2xl p-6 sm:p-8 transition-all duration-300 bg-white dark:[background-color:#2D3A2D] border border-gray-200 dark:border-white/10"
            >
              <h3 className="text-xl font-bold mb-6 text-center text-gray-900 dark:text-white">Average Score</h3>
              <div className="flex flex-col items-center">
                {/* Circular Progress Indicator */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-6">
                  <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 128 128">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      className="stroke-gray-200 dark:stroke-[#0C120C]"
                      strokeWidth="14"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      className="stroke-green-600 dark:stroke-[#00A400] transition-all duration-1000 ease-out"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - averageScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl font-bold mb-1 text-green-600 dark:text-[#00A400]">
                        {averageScore.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm sm:text-base text-center mb-6 font-medium text-gray-900 dark:text-white/90">
                  Overall Quiz Success Rate
                </div>
                <div className="text-center p-4 rounded-xl w-full bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/20">
                  <div className="text-xs sm:text-sm mb-2 font-medium uppercase tracking-wide text-gray-900 dark:text-white/70">
                    Top Performing Course
                  </div>
                  {topCourse && topCourse.courseTitle ? (
                    <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      {topCourse.courseTitle}
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-white/60">
                      No quiz data yet
            </div>
            )}
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 