"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import BackButton from '../../components/BackButton';

export default function FeedbackPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recipientEmail: 'ojochegbeng@gmail.com'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      setSubmitStatus('success');
      setFormData({ name: '', level: '', email: '', message: '' });
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error sending feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const levels = [
    '100 Level',
    '200 Level',
    '300 Level',
    '400 Level',
    '500 Level',
    '600 Level'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-black dark:to-gray-800 text-theme-primary flex items-center justify-center p-4 relative">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] dark:bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <BackButton href="/main" label="Back to Chat" />
      </div>
      
      <div className="w-full max-w-md bg-white/90 dark:bg-[#232625]/90 backdrop-blur-sm rounded-lg p-8 border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-2xl relative z-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-theme-primary">Send Feedback</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-theme-secondary">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg bg-gray-100 dark:bg-[#181A1B] border border-theme text-theme-primary px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-theme-secondary">
                Level
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg bg-gray-100 dark:bg-[#181A1B] border border-theme text-theme-primary px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              >
                <option value="">Select your level</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-theme-secondary">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="mt-1 block w-full rounded-lg bg-gray-100 dark:bg-[#181A1B] border border-theme text-theme-primary px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-medium transition-colors text-white ${isSubmitting
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>

          {submitStatus === 'success' && (
            <p className="text-green-500 text-center">Feedback sent successfully!</p>
          )}
          {submitStatus === 'error' && (
            <p className="text-red-500 text-center">Failed to send feedback. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  );
} 