#!/usr/bin/env python3
"""
Test script for the Whisper Speech-to-Text API
Run this script to test your deployed API
"""

import requests
import json
import os
from pathlib import Path

# Configuration
API_BASE_URL = "https://your-space-name.hf.space"  # Replace with your actual Space URL
TEST_AUDIO_FILE = "test_audio.wav"  # You'll need to provide a test audio file

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_transcription():
    """Test the transcription endpoint"""
    print("🎤 Testing transcription...")
    
    # Check if test audio file exists
    if not os.path.exists(TEST_AUDIO_FILE):
        print(f"❌ Test audio file '{TEST_AUDIO_FILE}' not found")
        print("Please provide a test audio file (WAV, MP3, etc.)")
        return False
    
    try:
        with open(TEST_AUDIO_FILE, 'rb') as audio_file:
            files = {'file': audio_file}
            response = requests.post(f"{API_BASE_URL}/transcribe", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Transcription successful:")
            print(f"   Text: {data['text']}")
            print(f"   Language: {data['language']}")
            print(f"   Duration: {data['duration']}s")
            return True
        else:
            print(f"❌ Transcription failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Transcription error: {e}")
        return False

def test_simple_transcription():
    """Test the simple text-only transcription endpoint"""
    print("📝 Testing simple transcription...")
    
    if not os.path.exists(TEST_AUDIO_FILE):
        print(f"❌ Test audio file '{TEST_AUDIO_FILE}' not found")
        return False
    
    try:
        with open(TEST_AUDIO_FILE, 'rb') as audio_file:
            files = {'file': audio_file}
            response = requests.post(f"{API_BASE_URL}/transcribe-text", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Simple transcription successful:")
            print(f"   Text: {data['text']}")
            return True
        else:
            print(f"❌ Simple transcription failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Simple transcription error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Whisper API Tests")
    print(f"API URL: {API_BASE_URL}")
    print("-" * 50)
    
    # Update the API URL if needed
    if "your-space-name" in API_BASE_URL:
        print("⚠️  Please update the API_BASE_URL in this script with your actual Hugging Face Space URL")
        print("   Example: https://your-username-whisper-api.hf.space")
        return
    
    tests_passed = 0
    total_tests = 3
    
    # Run tests
    if test_health_check():
        tests_passed += 1
    
    if test_transcription():
        tests_passed += 1
    
    if test_simple_transcription():
        tests_passed += 1
    
    # Summary
    print("-" * 50)
    print(f"📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Your API is ready for integration.")
    else:
        print("⚠️  Some tests failed. Please check your deployment.")

if __name__ == "__main__":
    main()
