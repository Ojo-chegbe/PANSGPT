import os
import tempfile
import logging
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import whisper
import torch
import librosa
import soundfile as sf
import numpy as np
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Whisper Speech-to-Text API",
    description="A Docker-based Whisper API for speech-to-text conversion",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model = None

class TranscriptionRequest(BaseModel):
    language: Optional[str] = None
    task: str = "transcribe"  # "transcribe" or "translate"

class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration: float

def load_model():
    """Load the Whisper model"""
    global model
    try:
        logger.info("Loading Whisper base model for speed...")
        # Using base model - faster than small, good balance
        model = whisper.load_model("base", device="cpu")
        logger.info("Whisper base model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise e

def preprocess_audio(audio_file_path: str) -> str:
    """Preprocess audio file for Whisper - optimized for speed"""
    try:
        # Load audio with librosa - optimized for speed
        audio, sr = librosa.load(audio_file_path, sr=16000, mono=True)
        
        # Trim silence for faster processing
        audio, _ = librosa.effects.trim(audio, top_db=20)
        
        # Create temporary file for processed audio
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        
        # Save as WAV file
        sf.write(temp_file.name, audio, 16000)
        
        logger.info(f"Audio preprocessed: {len(audio)/sr:.2f}s duration")
        return temp_file.name
    except Exception as e:
        logger.error(f"Error preprocessing audio: {e}")
        raise HTTPException(status_code=400, detail=f"Audio preprocessing failed: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Whisper Speech-to-Text API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "torch_available": torch.cuda.is_available() if torch.cuda.is_available() else "CPU only"
    }

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = None,
    task: str = "transcribe"
):
    """
    Transcribe audio file to text using Whisper
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Preprocess audio
        processed_audio_path = preprocess_audio(temp_file_path)
        
        # Transcribe with Whisper - optimized for speed
        logger.info(f"Transcribing audio file: {file.filename}")
        
        # Optimize transcription parameters for faster processing
        result = model.transcribe(
            processed_audio_path,
            language=language,
            task=task,
            fp16=False,  # Use fp32 for CPU
            verbose=False,  # Disable verbose output for speed
            condition_on_previous_text=False,  # Faster processing
            temperature=0.0,  # Deterministic output
            best_of=1,  # Don't use beam search (faster)
            beam_size=1,  # Single beam (faster)
            compression_ratio_threshold=2.4,  # Faster processing
            no_speech_threshold=0.6  # Faster detection
        )
        
        # Clean up temporary files
        os.unlink(temp_file_path)
        os.unlink(processed_audio_path)
        
        # Extract duration from audio
        audio_duration = len(result["segments"]) * 30 if result["segments"] else 0  # Approximate
        
        return TranscriptionResponse(
            text=result["text"].strip(),
            language=result["language"],
            duration=audio_duration
        )
        
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        # Clean up files in case of error
        try:
            if 'temp_file_path' in locals():
                os.unlink(temp_file_path)
            if 'processed_audio_path' in locals():
                os.unlink(processed_audio_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/transcribe-text")
async def transcribe_text_only(file: UploadFile = File(...)):
    """
    Simple endpoint that returns only the transcribed text
    """
    try:
        result = await transcribe_audio(file)
        return {"text": result.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=7860,
        reload=False,
        workers=1
    )
