'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { HandThumbUpIcon, HandThumbDownIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface FeedbackItem {
  id: string;
  rating: string;
  feedback: string | null;
  messageContent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    level: string | null;
  };
}

interface FeedbackSummary {
  thumbs_up: number;
  thumbs_down: number;
  popup_feedback: number;
  total: number;
}

export default function AdminFeedbackPage() {
  const { data: session } = useSession();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary>({
    thumbs_up: 0,
    thumbs_down: 0,
    popup_feedback: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all'); // all, thumbs_up, thumbs_down, popup_feedback
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  // Expand all messages by default when feedbacks are loaded
  useEffect(() => {
    if (feedbacks.length > 0 && expandedMessages.size === 0) {
      const allIds = new Set(feedbacks.map(f => f.id));
      setExpandedMessages(allIds);
    }
  }, [feedbacks]);

  useEffect(() => {
    if (session) {
      fetchFeedbacks();
    }
  }, [session, filter]);

  async function fetchFeedbacks() {
    setLoading(true);
    setError('');
    try {
      const ratingParam = filter === 'all' ? '' : filter;
      const res = await fetch(`/api/admin/feedback?rating=${ratingParam}`);
      if (!res.ok) throw new Error('Failed to fetch feedback');
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
      setSummary(data.summary || summary);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'thumbs_up':
        return <HandThumbUpIcon className="h-5 w-5 text-green-500" />;
      case 'thumbs_down':
        return <HandThumbDownIcon className="h-5 w-5 text-red-500" />;
      case 'popup_feedback':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'thumbs_up':
        return 'Thumbs Up';
      case 'thumbs_down':
        return 'Thumbs Down';
      case 'popup_feedback':
        return 'Popup Feedback';
      default:
        return rating;
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please sign in to access feedback data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">User Feedback Dashboard</h1>
              <p className="text-gray-300 mt-1">View and analyze user feedback on AI responses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Feedback</p>
                <p className="text-3xl font-bold text-white mt-2">{summary.total}</p>
              </div>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Thumbs Up</p>
                <p className="text-3xl font-bold text-green-500 mt-2">{summary.thumbs_up}</p>
              </div>
              <HandThumbUpIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Thumbs Down</p>
                <p className="text-3xl font-bold text-red-500 mt-2">{summary.thumbs_down}</p>
              </div>
              <HandThumbDownIcon className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Popup Feedback</p>
                <p className="text-3xl font-bold text-blue-500 mt-2">{summary.popup_feedback}</p>
              </div>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Type</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Feedback</option>
            <option value="thumbs_up">Thumbs Up</option>
            <option value="thumbs_down">Thumbs Down</option>
            <option value="popup_feedback">Popup Feedback</option>
          </select>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-4 text-gray-400">Loading feedback...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400">
            Error: {error}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <p className="text-gray-400 text-lg">No feedback found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getRatingIcon(item.rating)}
                    <div>
                      <p className="font-semibold text-white">{getRatingLabel(item.rating)}</p>
                      <p className="text-sm text-gray-400">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{item.user.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{item.user.email}</p>
                    {item.user.level && (
                      <p className="text-xs text-gray-500 mt-1">{item.user.level}</p>
                    )}
                  </div>
                </div>

                {item.feedback && (
                  <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-300 font-medium mb-1">User Feedback:</p>
                    <p className="text-white">{item.feedback}</p>
                  </div>
                )}

                 {item.messageContent && (
                   <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                     <div className="flex items-center justify-between mb-2">
                       <p className="text-sm text-gray-300 font-medium">
                         AI Message ({item.messageContent.length.toLocaleString()} characters):
                       </p>
                       {item.messageContent.length > 500 && (
                         <button
                           onClick={() => {
                             const newExpanded = new Set(expandedMessages);
                             if (newExpanded.has(item.id)) {
                               newExpanded.delete(item.id);
                             } else {
                               newExpanded.add(item.id);
                             }
                             setExpandedMessages(newExpanded);
                           }}
                           className="text-xs text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
                         >
                           {expandedMessages.has(item.id) ? '▼ Show Less' : '▶ Show Full Message'}
                         </button>
                       )}
                     </div>
                     <div 
                       className={`text-gray-300 text-sm whitespace-pre-wrap break-words ${
                         expandedMessages.has(item.id) || item.messageContent.length <= 500
                           ? ''
                           : 'line-clamp-4'
                       }`}
                       style={{
                         wordBreak: 'break-word',
                         overflowWrap: 'break-word',
                         maxWidth: '100%',
                         whiteSpace: expandedMessages.has(item.id) || item.messageContent.length <= 500 ? 'pre-wrap' : 'normal',
                       }}
                     >
                       {expandedMessages.has(item.id) || item.messageContent.length <= 500
                         ? item.messageContent
                         : `${item.messageContent.substring(0, 500)}...`}
                     </div>
                   </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

