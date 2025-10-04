"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300 text-lg">Loading...</p>
      </div>
    </div>
  );
  
  if (!session) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-6xl mb-4">🔒</div>
        <p className="text-red-400 text-xl">Please sign in to access this page</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Class Timetable Management</h1>
          <p className="text-gray-400 text-lg">Manage and organize class schedules efficiently</p>
        </div>
        
        {/* Level Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select Academic Level
          </label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[200px]"
          >
            {levels.map(level => (
              <option key={level} value={level} className="bg-gray-800">{level} Level</option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-gray-800 border border-gray-700 shadow-2xl rounded-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <span className="text-white text-xl">
                {editingEntry ? '✏️' : '➕'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {editingEntry ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}
              </h2>
              <p className="text-gray-400">
                {editingEntry ? 'Update the selected timetable entry' : 'Create a new class schedule entry'}
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Academic Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {levels.map(level => (
                  <option key={level} value={level} className="bg-gray-700">{level} Level</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Day of Week</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {days.map(day => (
                  <option key={day} value={day} className="bg-gray-700">{day}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Time Slot</label>
              <input
                type="text"
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleChange}
                required
                placeholder="e.g., 8:00 AM - 9:00 AM"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Course Code</label>
              <input
                type="text"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleChange}
                required
                placeholder="e.g., CHM 101"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Course Title</label>
              <input
                type="text"
                name="courseTitle"
                value={formData.courseTitle}
                onChange={handleChange}
                required
                placeholder="e.g., Introduction to Chemistry"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <div className="flex flex-col gap-3 lg:col-span-1">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {editingEntry ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">{editingEntry ? '✏️' : '➕'}</span>
                    {editingEntry ? 'Update Entry' : 'Add Entry'}
                  </div>
                )}
              </button>
              {editingEntry && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">❌</span>
                    Cancel
                  </div>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg mb-6 flex items-center">
            <span className="text-red-400 mr-3">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Timetable Display */}
        <div className="bg-gray-800 border border-gray-700 shadow-2xl rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-xl">📅</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedLevel} Level Timetable</h2>
                <p className="text-gray-400">View and manage class schedules for {selectedLevel} level students</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {timetables.length} {timetables.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg">Loading timetable...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {days.map(day => {
                const dayEntries = timetables.filter(entry => entry.day === day);
                return (
                  <div key={day} className="bg-gray-700 border border-gray-600 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">
                          {day.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{day}</h3>
                      <div className="ml-auto text-sm text-gray-400">
                        {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'}
                      </div>
                    </div>
                    
                    {dayEntries.length > 0 ? (
                      <div className="grid gap-3">
                        {dayEntries.map(entry => (
                          <div key={entry.id} className="bg-gray-600 border border-gray-500 rounded-lg p-4 hover:bg-gray-500 transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <span className="text-blue-400 font-semibold text-lg mr-3">🕐</span>
                                  <span className="text-white font-medium text-lg">{entry.timeSlot}</span>
                                </div>
                                <div className="ml-8">
                                  <div className="text-gray-200 font-medium">
                                    {entry.courseCode}
                                  </div>
                                  <div className="text-gray-300 text-sm">
                                    {entry.courseTitle}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(entry)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                                >
                                  <span className="mr-1">✏️</span>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                                >
                                  <span className="mr-1">🗑️</span>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-3">📭</div>
                        <p className="text-gray-400 text-lg">No classes scheduled for {day}</p>
                        <p className="text-gray-500 text-sm">Add a new timetable entry to get started</p>
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