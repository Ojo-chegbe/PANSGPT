'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function UptimeAdminPage() {
  const { data: session } = useSession();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const startMonitoring = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/uptime/start', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsMonitoring(true);
        setMessage('✅ Uptime monitoring started successfully!');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/uptime/stop', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsMonitoring(false);
        setMessage('🛑 Uptime monitoring stopped successfully!');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        Please sign in to access uptime monitoring
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Uptime Monitoring
      </h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Gradio App Monitoring
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This tool keeps your Gradio embedding service alive by pinging it every 15 minutes.
            This prevents the service from going to sleep due to inactivity.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">Target Service:</h3>
            <p className="text-blue-700 font-mono text-sm">
              https://ojochegbeng-myembeddingmodel.hf.space
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">Current Status:</h3>
            <p className={`text-lg font-semibold ${isMonitoring ? 'text-green-600' : 'text-red-600'}`}>
              {isMonitoring ? '🟢 Monitoring Active' : '🔴 Monitoring Inactive'}
            </p>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={startMonitoring}
            disabled={loading || isMonitoring}
            className={`px-4 py-2 rounded-md font-medium ${
              isMonitoring || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? 'Starting...' : 'Start Monitoring'}
          </button>
          
          <button
            onClick={stopMonitoring}
            disabled={loading || !isMonitoring}
            className={`px-4 py-2 rounded-md font-medium ${
              !isMonitoring || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {loading ? 'Stopping...' : 'Stop Monitoring'}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('✅') || message.includes('🛑')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Alternative: Standalone Script</h3>
          <p className="text-gray-600 text-sm mb-2">
            You can also run the uptime monitoring as a standalone script:
          </p>
          <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
            node start-uptime-monitoring.js
          </code>
        </div>
      </div>
    </div>
  );
}
