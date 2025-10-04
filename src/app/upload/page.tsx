'use client';

import React, { useState, useEffect } from 'react';
import DocumentUploadForm from '../../components/DocumentUploadForm';
import { logDocumentAccess } from '../../lib/document-utils';
import { 
  DocumentArrowUpIcon, 
  DocumentTextIcon, 
  TrashIcon, 
  EyeIcon,
  CalendarIcon,
  UserIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Metadata needs to be in a separate file for client components
// Create a separate layout.tsx or loading.tsx for metadata

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <DocumentArrowUpIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Document Upload</h1>
                <p className="mt-2 text-lg text-gray-300">
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

function ManageDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchDocuments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents");
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

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-green-600 p-2 rounded-lg">
          <DocumentTextIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Documents</h2>
          <p className="text-gray-300">View and manage your uploaded documents</p>
        </div>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-300">Loading documents...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
          <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 font-medium">{error}</p>
        </div>
      )}
      
      {documents.length > 0 ? (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.document_id} className="bg-gray-700/30 border border-gray-600 rounded-xl p-6 hover:bg-gray-700/40 transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg">
                      <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 
                        className="text-lg font-semibold text-white cursor-pointer hover:text-blue-400 transition-colors duration-200"
                        onClick={() => handleDocumentClick(doc.document_id)}
                      >
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {doc.file_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Uploaded: {new Date(doc.uploadedAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleDocumentClick(doc.document_id)}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(doc.document_id)}
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
        !loading && (
          <div className="text-center py-12">
            <div className="bg-gray-700/30 rounded-xl p-8 border border-gray-600/30">
              <DocumentTextIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No documents found</h3>
              <p className="text-gray-500">Upload your first document to get started</p>
            </div>
          </div>
        )
      )}
    </div>
  );
} 