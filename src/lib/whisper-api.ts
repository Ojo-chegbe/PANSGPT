/**
 * Whisper API integration for speech-to-text functionality
 * This module handles communication with the Hugging Face Space Whisper API
 */

const WHISPER_API_URL = process.env.NEXT_PUBLIC_WHISPER_API_URL || 'https://oedesignsng-whisper.hf.space';

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe audio using the Whisper API
 * @param audioBlob - Audio data as a Blob
 * @returns Transcribed text
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const startTime = Date.now();
  const audioSize = (audioBlob.size / 1024).toFixed(2);
  
  try {
    console.log(`📡 [Whisper API] Starting transcription...`);
    console.log(`📊 [Whisper API] Audio size: ${audioSize} KB`);
    console.log(`🌐 [Whisper API] Endpoint: ${WHISPER_API_URL}/transcribe-text`);
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    const fetchStart = Date.now();
    const response = await fetch(`${WHISPER_API_URL}/transcribe-text`, {
      method: 'POST',
      body: formData,
    });
    const fetchTime = ((Date.now() - fetchStart) / 1000).toFixed(2);
    console.log(`⏱️ [Whisper API] HTTP request: ${fetchTime}s`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Whisper API] HTTP error: ${response.status}`);
      console.error(`❌ [Whisper API] Error details: ${errorText}`);
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const parseStart = Date.now();
    const result = await response.json();
    const parseTime = ((Date.now() - parseStart) / 1000).toFixed(2);
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [Whisper API] Total time: ${totalTime}s (fetch: ${fetchTime}s, parse: ${parseTime}s)`);
    console.log(`📝 [Whisper API] Result preview: "${(result.text || '').substring(0, 50)}..."`);
    
    return result.text || '';
  } catch (error) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ [Whisper API] Error after ${totalTime}s:`, error);
    throw new Error('Failed to transcribe audio. Please try again.');
  }
}

/**
 * Transcribe audio with full metadata
 * @param audioBlob - Audio data as a Blob
 * @returns Full transcription result with metadata
 */
export async function transcribeAudioDetailed(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');

    const response = await fetch(`${WHISPER_API_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const result = await response.json();
    return {
      text: result.text || '',
      language: result.language,
      duration: result.duration,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio. Please try again.');
  }
}

/**
 * Check if the Whisper API is healthy
 * @returns Promise<boolean>
 */
export async function checkWhisperAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${WHISPER_API_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Whisper API health check failed:', error);
    return false;
  }
}
