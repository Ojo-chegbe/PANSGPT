'use client';

import { useState, useRef } from 'react';

interface MicrophoneButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Microphone button component for voice input
 * Handles recording and transcription
 */
export function MicrophoneButton({ onTranscript, disabled, className = '' }: MicrophoneButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      console.log('🎤 [MicrophoneButton] Starting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ [MicrophoneButton] Microphone access granted');
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`📊 [MicrophoneButton] Audio chunk: ${(event.data.size / 1024).toFixed(2)} KB`);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ [MicrophoneButton] Recording stopped');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioSize = (audioBlob.size / 1024).toFixed(2);
        console.log(`📦 [MicrophoneButton] Audio blob: ${audioSize} KB`);
        
        setIsLoading(true);
        console.log('🔄 [MicrophoneButton] Starting transcription...');
        
        const startTime = Date.now();
        
        try {
          const { transcribeAudio } = await import('../lib/whisper-api');
          console.log('📡 [MicrophoneButton] Sending to Whisper API...');
          const text = await transcribeAudio(audioBlob);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`✅ [MicrophoneButton] Transcription complete! (${duration}s)`);
          console.log(`📝 [MicrophoneButton] Text: "${text}"`);
          onTranscript(text);
        } catch (error) {
          console.error('❌ [MicrophoneButton] Transcription error:', error);
          alert('Failed to transcribe audio. Please try again.');
        } finally {
          setIsLoading(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
        console.log('🔇 [MicrophoneButton] Microphone released');
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('🎙️ [MicrophoneButton] Recording started...');
    } catch (error) {
      console.error('❌ [MicrophoneButton] Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`relative ${className} ${
        isRecording
          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
      } text-white p-3 md:p-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
      title={isRecording ? 'Stop recording' : isLoading ? 'Transcribing...' : 'Start voice recording'}
      aria-label={isRecording ? 'Stop recording' : isLoading ? 'Transcribing...' : 'Start voice recording'}
    >
      {isLoading ? (
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      )}
      {isRecording && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full"></span>
      )}
    </button>
  );
}
