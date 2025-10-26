'use client';

import { useState, useRef, useCallback } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isLoading: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  getTranscribedText: () => Promise<string>;
  hasRecording: boolean;
  audioBlob: Blob | null;
}

/**
 * Custom hook for audio recording functionality
 * Handles microphone recording and audio blob creation
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const getTranscribedText = useCallback(async (): Promise<string> => {
    if (!audioBlob) {
      return '';
    }

    setIsLoading(true);
    try {
      // Convert webm to wav for better compatibility
      const convertedBlob = await convertToWav(audioBlob);
      
      // Import dynamically to avoid server-side issues
      const { transcribeAudio } = await import('../lib/whisper-api');
      const text = await transcribeAudio(convertedBlob);
      
      return text;
    } catch (error) {
      console.error('Error transcribing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [audioBlob]);

  return {
    isRecording,
    isLoading,
    startRecording,
    stopRecording,
    getTranscribedText,
    hasRecording: audioBlob !== null,
    audioBlob,
  };
}

/**
 * Convert WebM audio to WAV format
 * This is a simple conversion for better Whisper API compatibility
 */
async function convertToWav(webmBlob: Blob): Promise<Blob> {
  // For now, return the original blob
  // In production, you might want to use a library like ffmpeg.wasm
  // For the Whisper API, webm should work, but let's ensure we have the right format
  return webmBlob;
}
