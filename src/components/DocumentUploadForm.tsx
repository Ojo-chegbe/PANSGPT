'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  DocumentArrowUpIcon, 
  DocumentTextIcon, 
  AcademicCapIcon,
  BookOpenIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface UploadFormData {
  title: string;
  courseCode: string;
  courseTitle: string;
  professorName: string;
  topic: string;
  file: File | null;
  aiTrainingEnabled: boolean;
  level?: string;
}

export default function DocumentUploadForm() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    courseCode: '',
    courseTitle: '',
    professorName: '',
    topic: '',
    file: null,
    aiTrainingEnabled: true,
    level: ''
  });

  useEffect(() => {
    async function fetchLevel() {
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
    fetchLevel();
  }, [session]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith('.txt')) {
      setError('Please upload a TXT file');
      return;
    }
    setFormData(prev => ({ ...prev, file }));
    setError(null);
    
    // Check for duplicate filename
    if (file) {
      checkDuplicateFilename(file.name);
    }
  };

  const checkDuplicateFilename = async (filename: string) => {
    if (!filename || !session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/documents/check-duplicate?filename=${encodeURIComponent(filename)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setError(`A document with filename "${filename}" already exists. Please rename your file or delete the existing document first.`);
        }
      }
    } catch (error) {
      // Silently fail - this is just a helpful check
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError('Please sign in to upload documents');
      return;
    }

    if (!formData.file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // First upload the file to get the fileKey
      const fileData = new FormData();
      fileData.append('file', formData.file);
      // Add metadata to the form data
      fileData.append('title', formData.title);
      fileData.append('courseCode', formData.courseCode);
      fileData.append('courseTitle', formData.courseTitle);
      fileData.append('professorName', formData.professorName);
      fileData.append('topic', formData.topic);
      fileData.append('level', formData.level || '');
      
      const uploadResponse = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: fileData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        if (uploadResponse.status === 409) {
          // Duplicate filename error
          throw new Error(errorData.error);
        } else {
          throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`);
        }
      }

      const responseData = await uploadResponse.json();
      const { fileKey, documentId, chunks, message } = responseData;

      if (!fileKey) {
        throw new Error('File upload failed - no file key returned');
      }

      console.log('Upload successful:', {
        documentId,
        fileKey,
        chunks,
        message
      });

      // Document processing is already handled by the upload endpoint
      // No need to call process-document separately
      
      // Show success message
      alert(`Document uploaded successfully! ${chunks} chunks created. ${message}`);
      
      // Refresh the current page instead of navigation
      router.refresh();
      
      // Clear the form
      setFormData({
        title: '',
        courseCode: '',
        courseTitle: '',
        professorName: '',
        topic: '',
        file: null,
        aiTrainingEnabled: true,
        level: ''
      });

    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Please check your connection and try again');
      } else if (err.message.includes('timeout')) {
        setError('Upload timeout: The file is too large or server is slow. Please try again with a smaller file.');
      } else {
        setError(err.message || 'Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6 max-w-md mx-auto">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">Authentication Required</h2>
            <p className="text-yellow-300">Please sign in to upload documents</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-blue-600 p-2 rounded-lg">
          <DocumentArrowUpIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Document</h2>
          <p className="text-gray-300">Upload a document to be processed by our AI system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
            <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Document Title *</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter document title"
            />
          </div>

          {/* Course Code */}
          <div className="space-y-2">
            <label htmlFor="courseCode" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
              <BookOpenIcon className="h-4 w-4" />
              <span>Course Code *</span>
            </label>
            <input
              type="text"
              id="courseCode"
              name="courseCode"
              required
              value={formData.courseCode}
              onChange={handleInputChange}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., CHM 101"
            />
          </div>

          {/* Course Title */}
          <div className="space-y-2">
            <label htmlFor="courseTitle" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
              <BookOpenIcon className="h-4 w-4" />
              <span>Course Title *</span>
            </label>
            <input
              type="text"
              id="courseTitle"
              name="courseTitle"
              required
              value={formData.courseTitle}
              onChange={handleInputChange}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Introduction to Chemistry"
            />
          </div>

          {/* Professor Name */}
          <div className="space-y-2">
            <label htmlFor="professorName" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
              <UserIcon className="h-4 w-4" />
              <span>Professor Name *</span>
            </label>
            <input
              type="text"
              id="professorName"
              name="professorName"
              required
              value={formData.professorName}
              onChange={handleInputChange}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Prof. Odumosu"
            />
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <label htmlFor="topic" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
              <TagIcon className="h-4 w-4" />
              <span>Topic *</span>
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              required
              value={formData.topic}
              onChange={handleInputChange}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Titration"
            />
          </div>

          {/* Level */}
          <div className="space-y-2">
            <label htmlFor="level" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
              <AcademicCapIcon className="h-4 w-4" />
              <span>Level *</span>
            </label>
            <select
              id="level"
              name="level"
              required
              value={formData.level}
              onChange={handleInputChange}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="" className="bg-gray-800">Select level</option>
              <option value="100" className="bg-gray-800">100</option>
              <option value="200" className="bg-gray-800">200</option>
              <option value="300" className="bg-gray-800">300</option>
              <option value="400" className="bg-gray-800">400</option>
              <option value="500" className="bg-gray-800">500</option>
              <option value="600" className="bg-gray-800">600</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label htmlFor="file" className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
            <DocumentArrowUpIcon className="h-4 w-4" />
            <span>Document File *</span>
          </label>
          <p className="text-sm text-gray-400">Upload a TXT file</p>
          <div className="relative">
            <input
              type="file"
              id="file"
              name="file"
              required
              accept=".txt"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-300
                file:mr-4 file:py-3 file:px-4
                file:rounded-xl
                file:text-sm file:font-semibold
                file:bg-blue-600/20 file:text-blue-400
                file:border file:border-blue-500/30
                hover:file:bg-blue-600/30
                bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* AI Training Checkbox */}
        <div className="space-y-2">
          <label htmlFor="aiTrainingEnabled" className="flex items-center space-x-3 text-sm font-semibold text-gray-300">
            <input
              type="checkbox"
              id="aiTrainingEnabled"
              name="aiTrainingEnabled"
              checked={formData.aiTrainingEnabled}
              onChange={handleInputChange}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700/50"
            />
            <span>Enable AI Training (process document for chat)</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-700">
          <button
            type="submit"
            disabled={isUploading}
            className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 