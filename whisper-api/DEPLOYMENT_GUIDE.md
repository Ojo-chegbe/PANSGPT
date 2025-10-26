# Hugging Face Space Deployment Guide

## Step-by-Step Instructions

### 1. Create a New Hugging Face Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Fill in the details:
   - **Space name**: `whisper-speech-to-text-api` (or your preferred name)
   - **License**: Apache 2.0
   - **SDK**: Docker
   - **Hardware**: CPU Basic (free tier) or upgrade if needed
   - **Visibility**: Public or Private

### 2. Upload Files

Upload these files to your Space:
- `Dockerfile`
- `requirements.txt`
- `app.py`
- `README.md`
- `metadata.json`

### 3. Configure Space Settings

1. Go to your Space settings
2. Set the following:
   - **App port**: `7860`
   - **Python version**: `3.9`
   - **Docker SDK version**: `4.21.0`

### 4. Deploy

1. Click "Build" to start the deployment
2. Wait for the build to complete (5-10 minutes)
3. Your API will be available at: `https://your-username-whisper-speech-to-text-api.hf.space`

### 5. Test Your API

1. Update the `API_BASE_URL` in `test_api.py`
2. Add a test audio file (WAV, MP3, etc.)
3. Run the test script:
   ```bash
   python test_api.py
   ```

## API Endpoints

Once deployed, your API will have these endpoints:

- `GET /` - Basic health check
- `GET /health` - Detailed health status
- `POST /transcribe` - Full transcription with metadata
- `POST /transcribe-text` - Simple text-only transcription

## Integration with Your App

After deployment, you can integrate this API into your existing components:

### For Quiz Component (`QuizTaking.tsx`):
```javascript
const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob);
  
  const response = await fetch('https://your-space-url/transcribe-text', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.text;
};
```

### For Chat Component (`ChatBox.tsx`):
```javascript
const sendVoiceMessage = async (audioBlob) => {
  const transcribedText = await transcribeAudio(audioBlob);
  // Use transcribedText as the message content
  setInput(transcribedText);
  handleSubmit();
};
```

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all files are uploaded correctly
2. **Model Loading Error**: Ensure you have enough memory allocated
3. **Audio Processing Error**: Verify audio file format is supported
4. **CORS Issues**: The API is configured to allow all origins for development

### Performance Tips:

1. **Audio File Size**: Keep audio files under 25MB for best performance
2. **Audio Duration**: Shorter clips (under 30 seconds) process faster
3. **Audio Quality**: Clear audio with minimal background noise works best

## Next Steps

After successful deployment:
1. Test the API with various audio files
2. Note your Space URL for integration
3. Proceed to Phase 2: Frontend Integration
4. Add audio recording functionality to your components
