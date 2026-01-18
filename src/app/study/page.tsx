'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    BookOpenIcon,
    AcademicCapIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    DocumentTextIcon,
    ClockIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface Document {
    id: string;
    title: string;
    courseCode: string;
    courseTitle: string;
    professorName: string;
    topic: string | null;
    level: string | null;
    createdAt: string;
}

interface CourseGroup {
    courseCode: string;
    courseTitle: string;
    documentCount: number;
    topics: string[];
}

interface TimetableEntry {
    id: string;
    level: string;
    day: string;
    timeSlot: string;
    courseCode: string;
    courseTitle: string;
}

export default function StudyBrowserPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [step, setStep] = useState<'courses' | 'topics'>('courses');

    // Timetable popup state
    const [showTimetable, setShowTimetable] = useState(false);
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [timetableLoading, setTimetableLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState('Monday');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Get current day of week
    useEffect(() => {
        const today = new Date().getDay();
        const dayMap: { [key: number]: string } = {
            1: 'Monday',
            2: 'Tuesday',
            3: 'Wednesday',
            4: 'Thursday',
            5: 'Friday',
        };
        setSelectedDay(dayMap[today] || 'Monday');
    }, []);

    // Get user's first name
    const firstName = useMemo(() => {
        if (!session?.user?.name) return 'Student';
        return session.user.name.split(' ')[0];
    }, [session]);

    // Fetch timetable
    const fetchTimetable = async () => {
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

    // Fetch timetable when popup opens
    useEffect(() => {
        if (showTimetable && timetable.length === 0) {
            fetchTimetable();
        }
    }, [showTimetable]);

    // Fetch documents - only once when authenticated
    const hasFetched = React.useRef(false);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/login');
            return;
        }

        // Only fetch once
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchDocuments = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/documents');
                if (!response.ok) throw new Error('Failed to fetch documents');
                const data = await response.json();
                setDocuments(data.documents || []);
            } catch (err) {
                console.error('Error fetching documents:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, [session, status, router]);

    // Group documents by course
    const courseGroups = useMemo(() => {
        const groups: { [key: string]: CourseGroup } = {};

        documents.forEach(doc => {
            if (!groups[doc.courseCode]) {
                groups[doc.courseCode] = {
                    courseCode: doc.courseCode,
                    courseTitle: doc.courseTitle,
                    documentCount: 0,
                    topics: [],
                };
            }
            groups[doc.courseCode].documentCount++;
            if (doc.topic && !groups[doc.courseCode].topics.includes(doc.topic)) {
                groups[doc.courseCode].topics.push(doc.topic);
            }
        });

        return Object.values(groups);
    }, [documents]);

    // Get documents for selected course
    const courseDocuments = useMemo(() => {
        if (!selectedCourse) return [];
        return documents.filter(doc => doc.courseCode === selectedCourse);
    }, [documents, selectedCourse]);

    const handleCourseSelect = (courseCode: string) => {
        setSelectedCourse(courseCode);
        setStep('topics');
    };

    const handleBack = () => {
        setStep('courses');
        setSelectedCourse(null);
    };

    // Parse time for sorting
    const parseTime = (timeSlot: string): number => {
        const startTime = timeSlot.split(' - ')[0] || timeSlot;
        const timeMatch = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3].toUpperCase();
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        }
        const time24Match = startTime.match(/(\d{1,2}):(\d{2})/);
        if (time24Match) {
            return parseInt(time24Match[1], 10) * 60 + parseInt(time24Match[2], 10);
        }
        return 0;
    };

    // Filter and sort timetable entries for selected day
    const dayEntries = useMemo(() => {
        return timetable
            .filter(entry => entry.day === selectedDay)
            .sort((a, b) => parseTime(a.timeSlot) - parseTime(b.timeSlot));
    }, [timetable, selectedDay]);

    // Loading state
    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:[background-color:#0C120C] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-white/50">Loading your courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:[background-color:#0C120C]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white dark:[background-color:#0C120C] border-b border-gray-200 dark:border-white/10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => step === 'topics' ? handleBack() : router.push('/main')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-700 dark:text-white"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <BookOpenIcon className="h-5 w-5 text-green-600 dark:text-[#00A400]" />
                                    Study Mode
                                </h1>
                            </div>
                        </div>
                        {/* Timetable Button */}
                        <button
                            onClick={() => setShowTimetable(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-[#00A400] border border-green-200 dark:border-green-600/30"
                        >
                            <ClockIcon className="h-4 w-4" />
                            Timetable
                        </button>
                    </div>
                </div>
            </header>

            {/* Timetable Popup Modal */}
            {showTimetable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:[background-color:#2D3A2D] rounded-2xl max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ClockIcon className="h-5 w-5 text-green-600 dark:text-[#00A400]" />
                                Class Timetable
                            </h2>
                            <button
                                onClick={() => setShowTimetable(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-white/50" />
                            </button>
                        </div>

                        {/* Day Selector */}
                        <div className="p-4 border-b border-gray-200 dark:border-white/10">
                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-gray-50 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-white/50 transition-all"
                            >
                                {days.map(day => (
                                    <option key={day} value={day} className="bg-white dark:bg-[#2D3A2D] text-gray-900 dark:text-white">{day}</option>
                                ))}
                            </select>
                        </div>

                        {/* Timetable Content */}
                        <div className="p-4 overflow-y-auto max-h-[50vh]">
                            {timetableLoading ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-green-600 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-gray-500 dark:text-white/70 text-sm">Loading timetable...</p>
                                </div>
                            ) : dayEntries.length > 0 ? (
                                <div className="space-y-3">
                                    {dayEntries.map(entry => (
                                        <div
                                            key={entry.id}
                                            className="rounded-lg p-4 border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/10"
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">{entry.timeSlot}</div>
                                            <div className="text-sm text-gray-600 dark:text-white/80">
                                                {entry.courseCode} - {entry.courseTitle}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-white/60">
                                    No classes scheduled for {selectedDay}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 dark:border-white/10">
                            <button
                                onClick={() => setShowTimetable(false)}
                                className="w-full px-4 py-2 rounded-lg font-medium bg-green-600 dark:bg-[#00A400] text-white dark:text-[#0C120C] hover:bg-green-700 dark:hover:bg-[#008300] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-4xl mx-auto px-4 py-8">
                {step === 'courses' ? (
                    // STEP 1: Welcome + Course Selection
                    <div className="space-y-8">
                        {/* Welcome Section */}
                        <div className="text-center py-6">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Hello Pharm. {firstName}! 👋
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-white/70">
                                What course would you like to study today?
                            </p>
                        </div>

                        {/* Course Cards */}
                        {courseGroups.length === 0 ? (
                            <div className="text-center py-16">
                                <DocumentTextIcon className="h-16 w-16 text-gray-400 dark:text-white/30 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No courses available
                                </h2>
                                <p className="text-gray-500 dark:text-white/50">
                                    Documents for your level haven't been uploaded yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {courseGroups.map(course => (
                                    <button
                                        key={course.courseCode}
                                        onClick={() => handleCourseSelect(course.courseCode)}
                                        className="text-left p-6 bg-white dark:[background-color:#2D3A2D] border border-gray-200 dark:border-white/10 rounded-2xl hover:border-green-500/50 dark:hover:border-green-600/50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                                                <AcademicCapIcon className="h-6 w-6 text-green-600 dark:text-[#00A400]" />
                                            </div>
                                            <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-white/30 group-hover:text-green-500 dark:group-hover:text-[#00A400] transition-colors" />
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-[#00A400] transition-colors">
                                            {course.courseCode}
                                        </h3>
                                        <p className="text-gray-600 dark:text-white/70 mb-4 line-clamp-2">
                                            {course.courseTitle}
                                        </p>

                                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-white/50">
                                            <span className="flex items-center gap-1">
                                                <DocumentTextIcon className="h-4 w-4" />
                                                {course.documentCount} {course.documentCount === 1 ? 'topic' : 'topics'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // STEP 2: Topic Selection
                    <div className="space-y-6">
                        {/* Selected Course Header */}
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-600/20 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <AcademicCapIcon className="h-5 w-5 text-green-600 dark:text-[#00A400]" />
                                </div>
                                <span className="text-sm font-medium text-green-600 dark:text-[#00A400]">
                                    {selectedCourse}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {courseGroups.find(c => c.courseCode === selectedCourse)?.courseTitle}
                            </h2>
                        </div>

                        {/* Topic prompt */}
                        <div className="text-center py-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                Select a topic to study
                            </h3>
                            <p className="text-gray-500 dark:text-white/50">
                                Choose from {courseDocuments.length} available {courseDocuments.length === 1 ? 'topic' : 'topics'}
                            </p>
                        </div>

                        {/* Topic List */}
                        <div className="space-y-3">
                            {courseDocuments.map((doc, index) => (
                                <button
                                    key={doc.id}
                                    onClick={() => router.push(`/study/${doc.id}`)}
                                    className="w-full text-left p-5 bg-white dark:[background-color:#2D3A2D] border border-gray-200 dark:border-white/10 rounded-xl hover:border-green-500/50 dark:hover:border-green-600/50 hover:shadow-lg transition-all duration-200 group flex items-center gap-4"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-lg font-bold text-gray-400 dark:text-white/30 group-hover:bg-green-100 dark:group-hover:bg-green-900/20 group-hover:text-green-600 dark:group-hover:text-[#00A400] transition-colors">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-[#00A400] transition-colors truncate">
                                            {doc.title}
                                        </h4>
                                        {doc.topic && (
                                            <p className="text-sm text-gray-500 dark:text-white/50 truncate">
                                                {doc.topic}
                                            </p>
                                        )}
                                    </div>
                                    <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-white/30 group-hover:text-green-500 dark:group-hover:text-[#00A400] transition-colors flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
