---
title: Whisper Speech-to-Text API
emoji: 🎤
colorFrom: blue
colorTo: purple
sdk: docker
sdk_version: "4.21.0"
app_file: app.py
pinned: false
---

# Whisper Speech-to-Text API

A Docker-based FastAPI application that provides speech-to-text functionality using OpenAI's Whisper model. This service can be deployed on Hugging Face Spaces and integrated into your quiz and chat applications.

## Features

- 🎤 **Speech-to-Text Conversion**: Convert audio files to text using OpenAI Whisper
- 🐳 **Docker Deployment**: Easy deployment on Hugging Face Spaces
- 🌐 **RESTful API**: Simple HTTP endpoints for integration
- 🔧 **Audio Preprocessing**: Automatic audio format conversion and optimization
- 📝 **Multiple Output Formats**: Get full transcription details or just text
- 🚀 **Fast Processing**: Optimized for quick response times

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health status

### Transcription
- `POST /transcribe` - Full transcription with metadata
- `POST /transcribe-text` - Simple text-only transcription

## Usage

### Basic Transcription
```bash
curl -X POST "http://your-space-url/transcribe" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.wav"
```

### Response Format
```json
{
  "text": "Transcribed text here",
  "language": "en",
  "duration": 30.5
}
```

## Integration with Your App

This API can be integrated into your existing components:

1. **Quiz Component**: Allow students to speak their answers
2. **Chat Interface**: Enable voice input for messages
3. **Mobile Experience**: Better accessibility on mobile devices

## Environment Variables

- `HF_HOME`: Cache directory for models (set automatically)
- `PYTHONUNBUFFERED`: Ensures proper logging (set automatically)

## Model Information

- **Model**: OpenAI Whisper Small
- **Languages**: 99+ languages supported
- **Tasks**: Transcription and translation
- **Device**: CPU optimized for Hugging Face Spaces
- **Model Size**: ~500MB (small model for better accuracy)

---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference