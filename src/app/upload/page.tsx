'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DocumentUploadForm from '../../components/DocumentUploadForm';
import PasswordAuth from '../../components/PasswordAuth';
import { logDocumentAccess } from '../../lib/document-utils';
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  FolderOpenIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function UploadPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <PasswordAuth
        onSuccess={handleAuthSuccess}
        title="Document Upload Access"
        description="Please enter the password to access the document upload page"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:text-white dark:[background-color:#0C120C]">
      {/* Header */}
      <div className="border-b bg-white dark:bg-transparent border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-gray-400 dark:bg-[#7D8B6F]">
                <DocumentArrowUpIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Document Upload</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-white/80">
                  Upload and manage your documents for AI processing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-12">
          <DocumentUploadForm />
          <ManageDocuments />
        </div>
      </div>
    </div>
  );
}

interface Document {
  id: string;
  title: string;
  fileName: string;
  courseCode: string;
  courseTitle: string;
  professorName: string;
  topic: string;
  level: string;
  createdAt: string;
  documentType: string;
}

interface GroupedDocuments {
  [level: string]: {
    [courseKey: string]: {
      courseCode: string;
      courseTitle: string;
      documents: Document[];
    };
  };
}

const LEVEL_ORDER = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'];

function ManageDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchDocuments() {
    setLoading(true);
    setError(null);
    try {
      // Use admin endpoint to get all documents
      const res = await fetch("/api/admin/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(document_id: string) {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const response = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      await fetchDocuments();
    } catch (err) {
      alert("Failed to delete document");
    }
  }

  const handleDocumentClick = async (documentId: string) => {
    await logDocumentAccess(documentId);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(doc =>
      doc.title?.toLowerCase().includes(query) ||
      doc.courseCode?.toLowerCase().includes(query) ||
      doc.courseTitle?.toLowerCase().includes(query) ||
      doc.professorName?.toLowerCase().includes(query) ||
      doc.topic?.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // Group documents by level and course
  const groupedDocuments = useMemo(() => {
    const grouped: GroupedDocuments = {};

    filteredDocuments.forEach(doc => {
      const level = doc.level || 'Unassigned';
      const courseKey = doc.courseCode || 'No Course';

      if (!grouped[level]) {
        grouped[level] = {};
      }

      if (!grouped[level][courseKey]) {
        grouped[level][courseKey] = {
          courseCode: doc.courseCode || 'No Course',
          courseTitle: doc.courseTitle || 'Untitled Course',
          documents: []
        };
      }

      grouped[level][courseKey].documents.push(doc);
    });

    return grouped;
  }, [filteredDocuments]);

  // Get sorted levels
  const sortedLevels = useMemo(() => {
    const levels = Object.keys(groupedDocuments);
    return levels.sort((a, b) => {
      const aIndex = LEVEL_ORDER.indexOf(a);
      const bIndex = LEVEL_ORDER.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [groupedDocuments]);

  // Count documents per level
  const levelCounts = useMemo(() => {
    const counts: { [level: string]: number } = {};
    sortedLevels.forEach(level => {
      counts[level] = Object.values(groupedDocuments[level]).reduce(
        (sum, course) => sum + course.documents.length, 0
      );
    });
    return counts;
  }, [sortedLevels, groupedDocuments]);

  const toggleLevel = (level: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  const toggleCourse = (courseKey: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseKey)) {
      newExpanded.delete(courseKey);
    } else {
      newExpanded.add(courseKey);
    }
    setExpandedCourses(newExpanded);
  };

  const expandAll = () => {
    setExpandedLevels(new Set(sortedLevels));
    const allCourses = new Set<string>();
    sortedLevels.forEach(level => {
      Object.keys(groupedDocuments[level]).forEach(course => {
        allCourses.add(`${level}-${course}`);
      });
    });
    setExpandedCourses(allCourses);
  };

  const collapseAll = () => {
    setExpandedLevels(new Set());
    setExpandedCourses(new Set());
  };

  return (
    <div className="backdrop-blur-sm border rounded-2xl p-8 bg-white dark:[background-color:#2D3A2D] border-gray-200 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-green-600 dark:[background-color:#00A400]">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Documents</h2>
            <p className="text-gray-600 dark:text-white/80">
              {documents.length} documents across {sortedLevels.length} levels
            </p>
          </div>
        </div>

        {/* Expand/Collapse buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-white/50" />
          <input
            type="text"
            placeholder="Search by title, course code, professor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-[#00A400]"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 dark:border-[#00A400]"></div>
            <p className="text-gray-600 dark:text-white/80">Loading documents...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
          <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}

      {!loading && sortedLevels.length > 0 ? (
        <div className="space-y-3">
          {sortedLevels.map(level => (
            <div key={level} className="border rounded-xl overflow-hidden bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/20">
              {/* Level Header */}
              <button
                onClick={() => toggleLevel(level)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {expandedLevels.has(level) ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-white/70" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-500 dark:text-white/70" />
                  )}
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <AcademicCapIcon className="h-5 w-5 text-green-600 dark:text-[#00A400]" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{level}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {levelCounts[level]} {levelCounts[level] === 1 ? 'document' : 'documents'}
                </span>
              </button>

              {/* Level Content */}
              {expandedLevels.has(level) && (
                <div className="border-t border-gray-200 dark:border-white/10">
                  {Object.entries(groupedDocuments[level]).map(([courseKey, courseData]) => {
                    const courseId = `${level}-${courseKey}`;
                    return (
                      <div key={courseKey} className="border-b last:border-b-0 border-gray-200 dark:border-white/10">
                        {/* Course Header */}
                        <button
                          onClick={() => toggleCourse(courseId)}
                          className="w-full flex items-center justify-between px-4 py-3 pl-10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {expandedCourses.has(courseId) ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-white/50" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-white/50" />
                            )}
                            <FolderOpenIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            <div className="text-left">
                              <span className="font-medium text-gray-900 dark:text-white">{courseData.courseCode}</span>
                              <span className="text-gray-500 dark:text-white/60 ml-2">- {courseData.courseTitle}</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-white/60">
                            {courseData.documents.length} {courseData.documents.length === 1 ? 'doc' : 'docs'}
                          </span>
                        </button>

                        {/* Documents List */}
                        {expandedCourses.has(courseId) && (
                          <div className="bg-white dark:bg-black/10 pl-16 pr-4 py-2">
                            {courseData.documents.map(doc => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                              >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-white/50 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <h4
                                      className="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-green-600 dark:hover:text-[#00A400]"
                                      onClick={() => handleDocumentClick(doc.id)}
                                    >
                                      {doc.title}
                                    </h4>
                                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-white/50">
                                      {doc.topic && <span>{doc.topic}</span>}
                                      {doc.professorName && <span>• {doc.professorName}</span>}
                                      <span>• {new Date(doc.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleDocumentClick(doc.id)}
                                    className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-[#00A400] hover:bg-green-200 dark:hover:bg-green-900/30"
                                    title="View"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12">
            <div className="rounded-xl p-8 border bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/20">
              <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-white/50" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white/70 mb-2">
                {searchQuery ? 'No documents found' : 'No documents yet'}
              </h3>
              <p className="text-gray-600 dark:text-white/60">
                {searchQuery ? 'Try a different search term' : 'Upload your first document to get started'}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}