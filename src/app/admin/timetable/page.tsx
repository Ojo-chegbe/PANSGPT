"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  BookOpenIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface TimetableEntry {
  id: string;
  level: string;
  day: string;
  timeSlot: string;
  courseCode: string;
  courseTitle: string;
}

export default function AdminTimetablePage() {
  const { data: session, status } = useSession();
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("100");
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formData, setFormData] = useState({
    level: "100",
    day: "Monday",
    timeSlot: "",
    courseCode: "",
    courseTitle: ""
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const levels = ["100", "200", "300", "400", "500", "600"];

  useEffect(() => {
    if (session) fetchTimetables();
  }, [session, selectedLevel]);

  async function fetchTimetables() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/timetable?level=${selectedLevel}`);
      if (!res.ok) throw new Error("Failed to fetch timetables");
      const data = await res.json();
      setTimetables(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const url = editingEntry 
        ? `/api/admin/timetable/${editingEntry.id}`
        : '/api/admin/timetable';
      
      const method = editingEntry ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Failed to save timetable entry");
      
      await fetchTimetables();
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      level: entry.level,
      day: entry.day,
      timeSlot: entry.timeSlot,
      courseCode: entry.courseCode,
      courseTitle: entry.courseTitle
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable entry?")) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/timetable/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete timetable entry");
      await fetchTimetables();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      level: selectedLevel,
      day: "Monday",
      timeSlot: "",
      courseCode: "",
      courseTitle: ""
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (status === "loading") return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-300 text-lg">Loading...</p>
      </div>
    </div>
  );
  
  if (!session) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8 max-w-md">
          <XMarkIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
          <p className="text-red-300">Please sign in to access this page</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Timetable Management</h1>
                <p className="text-gray-300 mt-1">Manage class schedules and course timings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-300">Level</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="ml-2 bg-transparent text-white font-semibold border-none outline-none"
                >
                  {levels.map(level => (
                    <option key={level} value={level} className="bg-gray-800">{level} Level</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Add/Edit Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-lg">
              {editingEntry ? <PencilIcon className="h-5 w-5 text-white" /> : <PlusIcon className="h-5 w-5 text-white" />}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {editingEntry ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Level Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>Level</span>
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {levels.map(level => (
                    <option key={level} value={level} className="bg-gray-800">{level} Level</option>
                  ))}
                </select>
              </div>

              {/* Day Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Day</span>
                </label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {days.map(day => (
                    <option key={day} value={day} className="bg-gray-800">{day}</option>
                  ))}
                </select>
              </div>

              {/* Time Slot Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <ClockIcon className="h-4 w-4" />
                  <span>Time Slot</span>
                </label>
                <input
                  type="text"
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 8:00 AM - 9:00 AM"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Course Code Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <BookOpenIcon className="h-4 w-4" />
                  <span>Course Code</span>
                </label>
                <input
                  type="text"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleChange}
                  required
                  placeholder="e.g., CHM 101"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Course Title Field */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
                  <BookOpenIcon className="h-4 w-4" />
                  <span>Course Title</span>
                </label>
                <input
                  type="text"
                  name="courseTitle"
                  value={formData.courseTitle}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Introduction to Chemistry"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
              {editingEntry && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                <span>{editingEntry ? 'Update Entry' : 'Add Entry'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
            <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Timetable Display */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedLevel} Level Timetable</h2>
                <p className="text-gray-300">View and manage class schedules</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {timetables.length} {timetables.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-300">Loading timetable...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {days.map(day => {
                const dayEntries = timetables.filter(entry => entry.day === day);
                return (
                  <div key={day} className="bg-gray-700/30 border border-gray-600 rounded-xl p-6 hover:bg-gray-700/40 transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                        <CalendarIcon className="h-5 w-5 text-blue-400" />
                        <span>{day}</span>
                      </h3>
                      <span className="text-sm text-gray-400 bg-gray-600 px-3 py-1 rounded-full">
                        {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'}
                      </span>
                    </div>
                    
                    {dayEntries.length > 0 ? (
                      <div className="grid gap-3">
                        {dayEntries.map(entry => (
                          <div key={entry.id} className="bg-gray-600/50 border border-gray-500 rounded-xl p-4 hover:bg-gray-600/70 transition-all duration-200 group">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="flex items-center space-x-2 text-blue-400 font-semibold">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{entry.timeSlot}</span>
                                  </div>
                                  <div className="w-px h-4 bg-gray-500"></div>
                                  <div className="flex items-center space-x-2 text-green-400 font-semibold">
                                    <BookOpenIcon className="h-4 w-4" />
                                    <span>{entry.courseCode}</span>
                                  </div>
                                </div>
                                <div className="text-gray-200 text-sm">
                                  {entry.courseTitle}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => handleEdit(entry)}
                                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200 text-sm font-medium"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="flex items-center space-x-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 text-sm font-medium"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="bg-gray-600/30 rounded-xl p-6 border border-gray-500/30">
                          <CalendarIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-400 font-medium">No classes scheduled for {day}</p>
                          <p className="text-gray-500 text-sm mt-1">Add a new timetable entry to get started</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 